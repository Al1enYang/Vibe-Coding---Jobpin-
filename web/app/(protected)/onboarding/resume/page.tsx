'use client';

import { useState } from 'react';
import { ResumeUpload, UploadStatus } from '@/components/onboarding/resume-upload';
import { ResumeResults } from '@/components/onboarding/resume-results';
import { Experience } from '@/types/database';
import { completeOnboarding } from '@/lib/actions/resume';

// Mock data for display (T038 requirement)
const MOCK_RESUME_DATA = {
  fullName: 'John Developer',
  email: 'john.developer@example.com',
  phone: '+1 (555) 123-4567',
  skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS'],
  experiences: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      start_date: '2021-01',
      end_date: '2023-12',
      summary: 'Led development of microservices architecture serving 1M+ daily users.',
    },
    {
      company: 'StartupXYZ',
      title: 'Software Engineer',
      start_date: '2018-06',
      end_date: '2020-12',
      summary: 'Built full-stack web applications using React and Node.js.',
    },
  ] as Experience[],
  resumeSummary:
    'Passionate software engineer with 5+ years of experience building scalable web applications. Specialized in frontend development with React and TypeScript, with strong backend skills in Node.js. Experienced in cloud technologies and agile methodologies.',
};

export default function ResumePage() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setFileName(file.name);
    setError(null);

    // Simulate upload and parsing process
    setUploadStatus('uploading');
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setUploadStatus('parsing');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setUploadStatus('success');
  };

  const handleStartContinue = async () => {
    if (uploadStatus !== 'success') return;

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
          <h1 className="text-2xl font-bold mb-2">Upload your resume</h1>
          <p className="text-muted-foreground">
            We&apos;ll extract your skills, experience, and contact information
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <ResumeUpload
            onFileSelect={handleFileSelect}
            status={uploadStatus}
            fileName={fileName}
          />
        </div>

        {/* Results Section - shown with mock data when parsing is successful */}
        {uploadStatus === 'success' && (
          <div className="mb-8">
            <ResumeResults {...MOCK_RESUME_DATA} />
          </div>
        )}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
            <p className="text-sm text-destructive font-medium mb-1">Error:</p>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleStartContinue}
            disabled={isStartDisabled}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Saving...' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}
