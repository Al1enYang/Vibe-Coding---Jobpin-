'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveProfile, getProfile } from '@/lib/actions/profile';

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === '1';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const isNextDisabled = !isValid || isSubmitting;

  // Load existing profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setCountry(data.country || '');
          setCity(data.city || '');
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (
    field: 'firstName' | 'lastName' | 'country' | 'city',
    value: string
  ) => {
    if (field === 'firstName') setFirstName(value);
    if (field === 'lastName') setLastName(value);
    if (field === 'country') setCountry(value);
    if (field === 'city') setCity(value);
    setIsDirty(true);
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isNextDisabled) return;

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    if (country.trim()) formData.append('country', country);
    if (city.trim()) formData.append('city', city);

    // In edit mode, redirect back to dashboard
    if (isEditMode) {
      formData.append('redirect_destination', 'dashboard');
    }

    try {
      const result = await saveProfile({}, formData);

      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If successful, redirect happens in server action
    } catch (e) {
      console.error('Error submitting profile:', e);
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
            <span>Step 2 of 4</span>
            <span>Profile</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/4 transition-all duration-300" />
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {isEditMode ? 'Edit your profile' : 'Tell us about yourself'}
          </h1>
          <p className="text-muted-foreground">
            Enter your name and location to personalize your profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-2">
              First Name <span className="text-destructive">*</span>
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              value={firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="e.g. John"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-2">
              Last Name <span className="text-destructive">*</span>
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              value={lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="e.g. Doe"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium mb-2">
              Country <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="country"
              name="country"
              type="text"
              value={country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              placeholder="e.g. United States"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-2">
              City <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="e.g. San Francisco"
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm"
              disabled={isSubmitting}
            />
          </div>

          {/* Validation Error (for required fields) */}
          {isDirty && !isValid && (
            <p className="text-sm text-destructive">
              First name and last name are required
            </p>
          )}

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
                Country and city are optional
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

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
