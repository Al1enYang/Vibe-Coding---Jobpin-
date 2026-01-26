import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="py-16 px-4 bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-12">
          Choose the plan that works best for you
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-col h-full">
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Free
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">Perfect for getting started</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">$0</span>
              <span className="text-zinc-600 dark:text-zinc-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Resume upload & parsing</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic profile setup</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>View parsed resume data</span>
              </li>
            </ul>
            <Link
              href="/sign-up"
              className="block w-full px-6 py-3 text-center border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg border-2 border-blue-600 relative shadow-lg flex flex-col h-full">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
              Popular
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Pro
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">For serious job seekers</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">$9</span>
              <span className="text-zinc-600 dark:text-zinc-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Everything in Free</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Unlimited resume updates</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority processing</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Advanced AI insights</span>
              </li>
              <li className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cancel anytime</span>
              </li>
            </ul>
            <Link
              href="/sign-up"
              className="block w-full px-6 py-3 text-center bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
