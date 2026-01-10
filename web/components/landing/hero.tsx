import Link from "next/link";

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 max-w-3xl">
        Transform Your Resume Into Opportunities
      </h1>
      <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-2xl">
        Upload your resume and let AI help you showcase your skills and experiences to potential employers.
      </p>
      <Link
        href="/sign-up"
        className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
      >
        Get Started
      </Link>
    </section>
  );
}
