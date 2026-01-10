export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Upload Your Resume",
      description: "Simply upload your PDF resume and our AI will analyze and extract your skills, experiences, and qualifications.",
    },
    {
      number: "02",
      title: "Get Started",
      description: "Complete your profile and start exploring opportunities tailored to your background and career goals.",
    },
  ];

  return (
    <section className="py-16 px-4 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-sm"
            >
              <div className="text-4xl font-bold text-blue-600 mb-4">{step.number}</div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-3">
                {step.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
