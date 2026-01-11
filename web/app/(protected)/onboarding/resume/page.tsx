'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResumeUpload, UploadStatus } from '@/components/onboarding/resume-upload';
import { ResumeResults } from '@/components/onboarding/resume-results';
import type { ResumeParsingResult } from '@/types/database';
import { completeOnboarding } from '@/lib/actions/resume';

function ResumePageContent() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ResumeParsingResult | null>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setFileName(file.name);
    setError(null);
    setUploadStatus('uploading');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        if (!base64) {
          setError('Failed to read file');
          setUploadStatus('error');
          return;
        }

        // Call the API
        setUploadStatus('parsing');

        try {
          const response = await fetch('/api/resume/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file: base64 }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to parse resume');
          }

          // Success - store the parsed data
          setParsedData(result.data);
          setUploadStatus('success');
          setError(null);
        } catch (e) {
          console.error('Parse error:', e);
          const message = e instanceof Error ? e.message : 'Failed to parse resume';
          setError(message);
          setUploadStatus('error');
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploadStatus('error');
      };

      reader.readAsDataURL(file);
    } catch (e) {
      console.error('File read error:', e);
      setError('Failed to process file');
      setUploadStatus('error');
    }
  };

  const handleRetry = () => {
    setUploadStatus('idle');
    setFileName(undefined);
    setError(null);
    setParsedData(null);
  };

  const handleStartContinue = async () => {
    if (uploadStatus !== 'success' || !parsedData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData for server action
      const formData = new FormData();

      // Call server action to set onboarding_completed = true and redirect
      const result = await completeOnboarding({}, formData);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, redirect happens in server action
    } catch (e) {
      console.error('Error completing onboarding:', e);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  // Start/Continue is only enabled when parsing is successful
  const isStartDisabled = uploadStatus !== 'success' || isSubmitting;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
            <span>Step 4 of 4</span>
            <span>Resume</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full transition-all duration-300" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {isEditMode ? 'Update your resume' : 'Upload your resume'}
          </h1>
          <p className="text-muted-foreground">
            We&apos;ll extract your skills, experience, and contact information
          </p>
        </div>

        {/* Upload Section - only show if not successful yet */}
        {uploadStatus !== 'success' && (
          <div className="mb-8">
            <ResumeUpload
              onFileSelect={handleFileSelect}
              status={uploadStatus}
              fileName={fileName}
            />
          </div>
        )}

        {/* Error Display */}
        {error && uploadStatus === 'error' && (
          <div className="mb-6">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-2">Upload Failed</p>
                  <p className="text-sm text-destructive/80 mb-3">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="text-sm font-medium text-destructive hover:text-destructive/80 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section - shown with actual parsed data when parsing is successful */}
        {uploadStatus === 'success' && parsedData && (
          <>
            <div className="mb-8">
              {/* Show upload was successful with option to re-upload */}
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        Resume parsed successfully
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {fileName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 underline"
                  >
                    Upload different file
                  </button>
                </div>
              </div>

              <ResumeResults
                fullName={parsedData.full_name}
                email={parsedData.email}
                phone={parsedData.phone}
                skills={parsedData.skills}
                experiences={parsedData.experiences}
                resumeSummary={parsedData.resume_summary}
              />
            </div>
          </>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleStartContinue}
            disabled={isStartDisabled}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResumePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <ResumePageContent />
    </Suspense>
  );
}
