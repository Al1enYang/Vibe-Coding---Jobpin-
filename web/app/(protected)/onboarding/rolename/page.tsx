import { SignOutButton } from "@clerk/nextjs";

export default function RoleNamePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold">Onboarding: Role Name</h1>
        <p className="mt-4 text-muted-foreground">Role Name step - coming soon</p>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            Debug: Sign out to test authentication flow
          </p>
          <SignOutButton>
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
