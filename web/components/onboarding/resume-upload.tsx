'use client';

import { useRef, useState } from 'react';

export type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'success' | 'error';

export interface ResumeUploadProps {
  onFileSelect: (file: File) => void;
  status: UploadStatus;
  fileName?: string;
}

export function ResumeUpload({ onFileSelect, status, fileName }: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'parsing':
        return 'Parsing your resume...';
      case 'success':
        return 'Parse complete!';
      case 'error':
        return 'Upload failed. Please try again.';
      default:
        return fileName || 'Drop your resume here';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'error':
        return 'border-destructive bg-destructive/10';
      case 'uploading':
      case 'parsing':
        return 'border-primary bg-primary/5';
      default:
        return isDragging
          ? 'border-primary bg-primary/5'
          : 'border-dashed border-input hover:border-primary/50';
    }
  };

  const isDisabled = status === 'uploading' || status === 'parsing';

  return (
    <div
      className={`relative border-2 rounded-lg p-8 text-center transition-colors cursor-pointer ${getStatusColor()}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isDisabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />

      {/* Upload Icon */}
      <div className="mb-4">
        {status === 'idle' && (
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {(status === 'uploading' || status === 'parsing') && (
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        {status === 'success' && (
          <svg
            className="mx-auto h-12 w-12 text-green-600 dark:text-green-400"
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
        )}
        {status === 'error' && (
          <svg
            className="mx-auto h-12 w-12 text-destructive"
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
        )}
      </div>

      {/* Status Text */}
      <p className="text-sm font-medium mb-1">{getStatusText()}</p>
      {status === 'idle' && (
        <p className="text-xs text-muted-foreground">
          PDF format only, max 10MB
        </p>
      )}
      {fileName && status === 'idle' && (
        <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
      )}

      {/* Progress Bar for uploading/parsing */}
      {(status === 'uploading' || status === 'parsing') && (
        <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 animate-pulse"
            style={{ width: status === 'uploading' ? '40%' : '70%' }}
          />
        </div>
      )}
    </div>
  );
}
