'use client';

import { Experience } from '@/types/database';

export interface ResumeResultsProps {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  skills?: string[] | null;
  experiences?: Experience[] | null;
  resumeSummary?: string | null;
}

export function ResumeResults({
  fullName,
  email,
  phone,
  skills = [],
  experiences = [],
  resumeSummary,
}: ResumeResultsProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fullName && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="text-sm font-medium">{fullName}</p>
            </div>
          )}
          {email && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
          )}
          {phone && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Phone</p>
              <p className="text-sm font-medium">{phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Experiences Section */}
      {experiences && experiences.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Work Experience
          </h2>
          <div className="space-y-4">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="border-l-2 border-primary/30 pl-4 py-2"
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-semibold text-base">
                      {exp.title || 'Position'}
                    </h3>
                    <p className="text-sm text-primary font-medium">
                      {exp.company || 'Company'}
                    </p>
                  </div>
                  {(exp.start_date || exp.end_date) && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {exp.start_date || 'Present'} - {exp.end_date || 'Present'}
                    </span>
                  )}
                </div>
                {exp.summary && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {exp.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Section */}
      {resumeSummary && (
        <div className="bg-muted/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Professional Summary
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {resumeSummary}
          </p>
        </div>
      )}
    </div>
  );
}
