'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveWorkType, getWorkType } from '@/lib/actions/work-type';

type WorkType = 'part-time' | 'full-time' | 'internship';

function WorkTypeContent() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';

  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing work types on mount
  useEffect(() => {
    const loadWorkTypes = async () => {
      try {
        const data = await getWorkType();
        if (data?.work_types) {
          setWorkTypes(data.work_types as WorkType[]);
        }
      } catch (e) {
        console.error('Error loading work types:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkTypes();
  }, []);

  const handleCheckboxChange = (workType: WorkType) => {
    setWorkTypes((prev) =>
      prev.includes(workType)
        ? prev.filter((t) => t !== workType)
        : [...prev, workType]
    );
    if (error) setError(null);
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    workTypes.forEach((type) => formData.append('work_types', type));
    formData.append('redirect_destination', isEditMode ? 'dashboard' : 'resume');

    try {
      const result = await saveWorkType({}, formData);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, redirect happens in server action
    } catch (e) {
      console.error('Error submitting work type:', e);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    // Empty array for skip
    formData.append('redirect_destination', isEditMode ? 'dashboard' : 'resume');

    try {
      const result = await saveWorkType({}, formData);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, redirect happens in server action
    } catch (e) {
      console.error('Error skipping work type:', e);
      setError('An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
            <span>Step 3 of 4</span>
            <span>Work Type</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-3/4 transition-all duration-300" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {isEditMode ? 'Edit your work preferences' : 'What type of work are you looking for?'}
          </h1>
          <p className="text-muted-foreground">
            Select all that apply (optional)
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 mb-8">
          {(['part-time', 'full-time', 'internship'] as WorkType[]).map((type) => (
            <label
              key={type}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                workTypes.includes(type)
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <input
                type="checkbox"
                checked={workTypes.includes(type)}
                onChange={() => handleCheckboxChange(type)}
                disabled={isSubmitting}
                className="w-5 h-5 rounded border-input"
              />
              <span className="ml-3 font-medium capitalize">{type}</span>
            </label>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-6">
            <p className="text-sm text-destructive font-medium mb-1">Error:</p>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className={isEditMode ? "flex justify-center pt-4" : "flex justify-between pt-4"}>
          {!isEditMode && (
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-3 border border-input rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            >
              {isSubmitting ? 'Skipping...' : 'Skip'}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Save' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkTypePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <WorkTypeContent />
    </Suspense>
  );
}
