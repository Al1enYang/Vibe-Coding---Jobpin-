import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">Jobpin</span>
          </Link>

          {/* Right side - Auth buttons */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
