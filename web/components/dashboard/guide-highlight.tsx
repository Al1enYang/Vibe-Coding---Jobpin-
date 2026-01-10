'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { markDashboardGuideSeen } from '@/lib/actions/dashboard-guide';

const LOCAL_STORAGE_KEY = 'has_seen_dashboard_tour';

export interface GuideStep {
  target: string;
  title: string;
  description: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    target: 'profile-completion',
    title: 'Profile Completion',
    description: 'View your profile completion progress',
  },
  {
    target: 'onboarding-progress',
    title: 'Onboarding Progress',
    description: 'Edit and complete your onboarding information',
  },
  {
    target: 'resume-summary',
    title: 'Resume Summary',
    description: 'View your resume summary and key highlights',
  },
  {
    target: 'subscription',
    title: 'Subscription',
    description: 'Manage your subscription plan',
  },
];

interface GuideHighlightProps {
  onComplete: () => void;
}

export function GuideHighlight({ onComplete }: GuideHighlightProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const highlightRef = useRef<HTMLDivElement>(null);

  // Get element by data-tour attribute
  const getTargetElement = useCallback((target: string): HTMLElement | null => {
    return document.querySelector(`[data-tour="${target}"]`);
  }, []);

  // Scroll element into view
  const scrollElementIntoView = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetTop = rect.top + scrollTop;

    // Scroll to position the top of the element near the top of viewport with some padding
    window.scrollTo({
      top: Math.max(0, targetTop - 100),
      behavior: 'smooth',
    });
  }, []);

  // Calculate highlight position and tooltip position
  const updateHighlightPosition = useCallback(() => {
    const step = GUIDE_STEPS[currentStep];
    const targetElement = getTargetElement(step.target);

    if (targetElement) {
      // First scroll the element into view
      scrollElementIntoView(targetElement);

      // Wait a bit for scroll to complete before calculating position
      setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        setHighlightRect(rect);

        // Calculate tooltip position
        // Step 2 (Resume Summary) shows tooltip on the right, others show below
        const isResumeSummaryStep = currentStep === 2; // resume-summary is index 2

        let tooltipTop: number;
        let tooltipLeft: number;

        if (isResumeSummaryStep) {
          // Position to the right of the highlighted element
          tooltipTop = rect.top;
          tooltipLeft = rect.right + 16;
        } else {
          // Position below the highlighted element
          tooltipTop = rect.bottom + 16;
          tooltipLeft = Math.max(16, Math.min(window.innerWidth - 320, rect.left));
        }

        setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
      }, 350);
    } else {
      console.warn(`[GuideHighlight] Element with data-tour="${step.target}" not found`);
      setHighlightRect(null);
      setTooltipPosition(null);
    }
  }, [currentStep, getTargetElement, scrollElementIntoView]);

  // Initialize guide
  useEffect(() => {
    // Check localStorage first
    const hasSeenLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (hasSeenLocal === 'true') {
      onComplete();
      return;
    }

    // Show guide after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsVisible(true);
      updateHighlightPosition();
    }, 500);

    return () => clearTimeout(timer);
  }, [onComplete, updateHighlightPosition]);

  // Update position on window resize
  useEffect(() => {
    if (!isVisible) return;

    const handleResize = () => {
      updateHighlightPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, updateHighlightPosition]);

  // Update position when step changes
  useEffect(() => {
    if (isVisible) {
      updateHighlightPosition();
    }
  }, [currentStep, isVisible, updateHighlightPosition]);

  // Handle completion
  const handleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);

    // Set localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, 'true');

    // Update Supabase (don't block UI on failure)
    try {
      await markDashboardGuideSeen({}, new FormData());
    } catch (error) {
      console.warn('[GuideHighlight] Failed to mark guide as seen in DB:', error);
    }

    onComplete();
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Handle close (click outside or close button)
  const handleClose = () => {
    handleComplete();
  };

  if (!isVisible || !highlightRect || !tooltipPosition) {
    return null;
  }

  const step = GUIDE_STEPS[currentStep];
  const isLastStep = currentStep === GUIDE_STEPS.length - 1;

  return (
    <>
      {/* Dark overlay with cutout */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Highlight border */}
      <div
        ref={highlightRef}
        className="fixed z-[60] pointer-events-none border-4 border-primary rounded-xl transition-all duration-300 ease-out"
        style={{
          top: `${highlightRect.top - 4}px`,
          left: `${highlightRect.left - 4}px`,
          width: `${highlightRect.width + 8}px`,
          height: `${highlightRect.height + 8}px`,
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Tooltip dialog */}
      <div
        className="fixed z-[70] w-80 bg-card border border-border rounded-xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground mb-2 pr-6">{step.title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5">{step.description}</p>

        {/* Footer with step indicator and button */}
        <div className="flex items-center justify-between">
          {/* Step indicator */}
          <div className="flex gap-1.5">
            {GUIDE_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index === currentStep
                    ? 'w-5 bg-primary'
                    : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={isCompleting}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? 'Loading...' : isLastStep ? 'Got it' : 'Next'}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press ESC or click outside to close
        </p>
      </div>

      {/* Click outside handler */}
      <div
        className="fixed inset-0 z-[55]"
        onClick={handleClose}
      />

      {/* ESC key listener */}
      <EventListener onEsc={handleClose} />
    </>
  );
}

// Helper component to attach event listeners
function EventListener({ onEsc }: { onEsc: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEsc();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEsc]);

  return null;
}
