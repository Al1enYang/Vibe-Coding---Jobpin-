import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/resume/parse
 *
 * Parses a PDF resume using external services:
 * 1. Receives PDF as base64 (from JSON body)
 * 2. Calls DMXAPI PDF parsing to extract text
 * 3. Calls LLM to structure the data into JSON
 * 4. Saves to Supabase resume_parsing_results table
 *
 * Request body (JSON):
 * - file: base64-encoded PDF string (with or without data URL prefix)
 *
 * Response:
 * - success: true/false
 * - data: parsed resume data (on success)
 * - error: error message (on failure)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      console.error('[parse] Unauthorized: no userId');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check Supabase admin client
    if (!supabaseAdmin) {
      console.error('[parse] SUPABASE_SERVICE_ROLE_KEY not set');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
        { status: 500 }
      );
    }

    // 3. Parse request body (JSON with base64 file)
    let fileBase64: string | null;
    try {
      const body = await req.json();
      fileBase64 = body.file as string | null;
      console.log('[parse] Request received, file data length:', fileBase64?.length);
    } catch {
      console.error('[parse] Failed to parse request body as JSON');
      return NextResponse.json(
        { success: false, error: 'Invalid request body: expected JSON' },
        { status: 400 }
      );
    }

    if (!fileBase64) {
      console.error('[parse] No file provided in request');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 4. Decode base64 and validate file size
    let pdfBuffer: Buffer;
    let base64Data: string;
    try {
      // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
      base64Data = fileBase64.split(',')[1] || fileBase64;
      pdfBuffer = Buffer.from(base64Data, 'base64');

      console.log('[parse] Decoded PDF buffer size:', pdfBuffer.length, 'bytes');

      if (pdfBuffer.length > MAX_FILE_SIZE) {
        console.error('[parse] File too large:', pdfBuffer.length);
        return NextResponse.json(
          { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 413 }
        );
      }

      if (pdfBuffer.length === 0) {
        console.error('[parse] Empty PDF buffer');
        return NextResponse.json(
          { success: false, error: 'Invalid file: empty or corrupted' },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error('[parse] Base64 decode error:', e);
      return NextResponse.json(
        { success: false, error: 'Invalid file encoding' },
        { status: 400 }
      );
    }

    // 5. Call DMXAPI PDF parsing service
    const dmxApiKey = process.env.DMXAPI_API_KEY;
    if (!dmxApiKey) {
      console.error('[parse] DMXAPI_API_KEY not set');
      return NextResponse.json(
        { success: false, error: 'PDF parsing service not configured: DMXAPI_API_KEY missing' },
        { status: 500 }
      );
    }

    console.log('[parse] Calling DMXAPI PDF parsing for user:', userId);

    let parsedText: string;
    try {
      // Call DMXAPI PDF parsing endpoint
      // Reference: example.py shows the correct API structure
      const pdfResponse = await fetch('https://www.dmxapi.cn/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dmxApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.DMXAPI_PDF_MODEL || 'hehe-tywd',
          input: base64Data,  // Note: field name is 'input', not 'file'
          pdf_pwd: '',
          page_start: 0,
          page_count: 1000,
          parse_mode: 'auto',
          dpi: 144,
          apply_document_tree: 1,
          table_flavor: 'html',
          get_image: 'none',
          markdown_details: 1,
          page_details: 1,
        }),
        // 60 second timeout for PDF parsing
        signal: AbortSignal.timeout(60000),
      });

      console.log('[parse] DMXAPI PDF response status:', pdfResponse.status);

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        console.error('[parse] DMXAPI PDF error:', pdfResponse.status, errorText);
        throw new Error(`PDF parsing failed (${pdfResponse.status}): ${errorText.slice(0, 200)}`);
      }

      const pdfData = await pdfResponse.json();
      console.log('[parse] DMXAPI PDF response keys:', Object.keys(pdfData));

      // DMXAPI v3 returns: { result: { markdown: "...", detail: [...], pages: [...] } }
      // The text content is in result.markdown field
      if (pdfData.result && pdfData.result.markdown) {
        parsedText = pdfData.result.markdown;
      } else if (pdfData.content) {
        parsedText = pdfData.content;
      } else if (pdfData.text) {
        parsedText = pdfData.text;
      } else {
        parsedText = '';
      }

      console.log('[parse] Extracted text length:', parsedText.length);
      if (parsedText.length > 0) {
        console.log('[parse] First 200 chars of extracted text:', parsedText.slice(0, 200));
      }

      if (!parsedText || parsedText.length < 50) {
        console.error('[parse] Insufficient text extracted, length:', parsedText?.length);
        console.error('[parse] Available fields in pdfData:', Object.keys(pdfData));
        console.error('[parse] Has result field?', !!pdfData.result);
        if (pdfData.result) {
          console.error('[parse] result.keys:', Object.keys(pdfData.result));
        }
        throw new Error('Unable to extract sufficient text from PDF');
      }

      console.log('[parse] PDF parsing successful, extracted text length:', parsedText.length);
    } catch (e) {
      console.error('[parse] PDF parsing error:', e);
      const message = e instanceof Error ? e.message : 'PDF parsing failed';
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }

    // 6. Call LLM to structure the parsed text
    console.log('[parse] Calling LLM to structure resume data for user:', userId);

    let structuredData: {
      full_name?: string | null;
      email?: string | null;
      phone?: string | null;
      skills?: string[] | null;
      experiences?: unknown[] | null;
      resume_summary?: string | null;
    };
    try {
      // Reference: llm_example.py shows the correct endpoint
      const llmResponse = await fetch('https://www.dmxapi.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dmxApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.DMXAPI_LLM_MODEL || 'gpt-5-mini',
          messages: [
            {
              role: 'system',
              content: `You are a resume parser. Extract structured information from resume text and return as JSON.
Return ONLY a valid JSON object with these fields:
- full_name: string or null
- email: string or null
- phone: string or null
- skills: array of strings (extract technical skills, tools, technologies)
- experiences: array of objects with company, title, start_date (YYYY-MM), end_date (YYYY-MM or null if current), summary
- resume_summary: string or null (a brief 2-3 sentence professional summary)

Rules:
- Missing fields should be null, not empty strings
- skills should be an array even if empty
- experiences should identify 1-3 most relevant positions
- dates in YYYY-MM format, use null for end_date if currently employed
- Return ONLY the JSON, no markdown formatting, no explanations`,
            },
            {
              role: 'user',
              content: `Parse this resume:\n\n${parsedText}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(60000),
      });

      console.log('[parse] LLM response status:', llmResponse.status);

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        console.error('[parse] LLM error:', llmResponse.status, errorText);
        throw new Error(`LLM processing failed (${llmResponse.status}): ${errorText.slice(0, 200)}`);
      }

      const llmData = await llmResponse.json();
      console.log('[parse] LLM response keys:', Object.keys(llmData));

      const content = llmData.choices?.[0]?.message?.content;

      if (!content) {
        console.error('[parse] Empty LLM response content');
        throw new Error('Empty LLM response');
      }

      // Parse the JSON response
      structuredData = JSON.parse(content);

      console.log('[parse] LLM structuring successful, extracted fields:', Object.keys(structuredData));
    } catch (e) {
      console.error('[parse] LLM processing error:', e);
      const message = e instanceof Error ? e.message : 'LLM processing failed';
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      );
    }

    // 7. Save to Supabase (upsert to replace any existing result)
    console.log('[parse] Saving to Supabase for user:', userId);

    const { data, error } = await supabaseAdmin
      .from('resume_parsing_results')
      .upsert(
        {
          clerk_user_id: userId,
          full_name: structuredData.full_name,
          email: structuredData.email,
          phone: structuredData.phone,
          skills: structuredData.skills || [],
          experiences: structuredData.experiences || [],
          resume_summary: structuredData.resume_summary,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_user_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[parse] Supabase upsert error:', error);
      return NextResponse.json(
        { success: false, error: `Failed to save results: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('[parse] Successfully saved resume parsing result, clerk_user_id:', data?.clerk_user_id);

    // 8. Return success response
    return NextResponse.json({
      success: true,
      data: {
        id: data.clerk_user_id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        skills: data.skills,
        experiences: data.experiences,
        resume_summary: data.resume_summary,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });

  } catch (e) {
    console.error('[parse] Unexpected error:', e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
