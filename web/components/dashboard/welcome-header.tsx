'use client';

import { useUser, SignOutButton } from '@clerk/nextjs';

export function WelcomeHeader() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="mb-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Get display name - prioritize firstName + lastName, fallback to email username
  const getDisplayName = () => {
    if (user?.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    if (user?.emailAddresses?.[0]) {
      const email = user.emailAddresses[0].emailAddress;
      return email.split('@')[0];
    }
    return 'there';
  };

  const displayName = getDisplayName();

  return (
    <div className="mb-8 flex justify-between items-start">
      {/* Left: Welcome message */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {displayName}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s your profile overview
        </p>
      </div>

      {/* Right: Logout button */}
      <SignOutButton redirectUrl="/">
        <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
          Logout
        </button>
      </SignOutButton>
    </div>
  );
}
