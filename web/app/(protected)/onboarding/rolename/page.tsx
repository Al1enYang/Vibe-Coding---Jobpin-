'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveRoleName, getRoleName } from '@/lib/actions/rolename';

export default function RoleNamePage() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';

  const [roleName, setRoleName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isValid = roleName.trim().length > 0;
  const isNextDisabled = !isValid || isSubmitting;

  // Load existing role name on mount
  useEffect(() => {
    const loadRoleName = async () => {
      try {
        const data = await getRoleName();
        if (data?.role_name) {
          setRoleName(data.role_name);
        }
      } catch (e) {
        console.error('Error loading role name:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadRoleName();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoleName(e.target.value);
    setIsDirty(true);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isNextDisabled) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('role_name', roleName);

    // In edit mode, redirect back to dashboard
    if (isEditMode) {
      formData.append('redirect_destination', 'dashboard');
    }

    try {
      const result = await saveRoleName({}, formData);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, redirect happens in server action
    } catch (e) {
      console.error('Error submitting role name:', e);
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
            <span>Step 1 of 4</span>
            <span>Role Name</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-1/4 transition-all duration-300" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {isEditMode ? 'Edit your role name' : 'What is your role name?'}
          </h1>
          <p className="text-muted-foreground">
            Enter the role name you want to use on your profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="role_name" className="block text-sm font-medium mb-2">
              Role Name <span className="text-destructive">*</span>
            </label>
            <input
              id="role_name"
              name="role_name"
              type="text"
              value={roleName}
              onChange={handleInputChange}
              placeholder="e.g. Software Engineer, Product Manager"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm"
              disabled={isSubmitting}
              autoFocus
            />
            {isDirty && !isValid && (
              <p className="text-sm text-destructive mt-1">
                Role name is required
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-1">Error:</p>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={isEditMode ? "flex justify-center pt-4" : "flex justify-between pt-4"}>
            {!isEditMode && (
              <div className="text-sm text-muted-foreground">
                You can always change this later
              </div>
            )}
            <button
              type="submit"
              disabled={isNextDisabled}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
