# Requirements Quality Checklist: Jobpin MVP (Comprehensive - Pre-Implementation)

**Purpose**: Pre-implementation requirements quality validation - "Unit Tests for English" testing spec.md completeness, clarity, consistency, and measurability before task generation.

**Created**: 2026-01-09
**Audience**: Spec Author / Pre-Implementation Gate
**Focus**: Comprehensive (Security, API, User Flow, Data Model, Error Handling, NFR)
**Risk Emphasis**: Gating items marked with 🔒 for critical security/payment flows
**Source Spec**: `spec.md`
**Source Plan**: `plan.md`

---

## 🔒 Critical Security & Privacy Requirements (Gating)

- [ ] CHK001 - Are all secret key storage requirements explicitly defined with no ambiguity about where keys may reside, including requirements for preventing exposure in code/README/commits? [Completeness, Spec §3.1-F/E] 🔒 **GATING**
- [ ] CHK002 - Are webhook signature verification requirements specified with exact implementation details (Stripe official library, rejection behavior, logging) and allowlisted events (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)? [Clarity, Spec §3.1-F] 🔒 **GATING**
- [ ] CHK004 - Are data protection requirements defined for sensitive user information (PII in resume parsing results)? [Gap, Spec §3.1-E]
- [ ] CHK005 - Are RLS (Row Level Security) policy requirements specified for Supabase tables? [Gap, Spec §3.1-E]
- [ ] CHK006 - Are authentication requirements consistent across all protected routes (/dashboard, /onboarding) between middleware and spec requirements? [Consistency, Spec §4.1] 🔒 **GATING**
- [ ] CHK007 - Is there a lightweight risk note for webhook forgery with corresponding mitigation requirements? [Gap, Spec §4.6]

---

## Authentication & Authorization Requirements

- [ ] CHK008 - Are email verification code requirements explicitly defined (must be available, verification flow)? [Completeness, Spec §3.1-A]
- [ ] CHK009 - Are Google OAuth integration requirements specified (redirect behavior, error handling)? [Completeness, Spec §3.1-A]
- [ ] CHK010 - Are password policy requirements delegated to Clerk or explicitly defined? [Clarity, Spec §3.1-A]
- [ ] CHK011 - Are route protection requirements consistent between middleware behavior and spec requirements? [Consistency, Spec §4.1]
- [ ] CHK012 - Are session timeout requirements defined for authenticated users? [Gap, Spec §3.1-A]
- [ ] CHK013 - Are requirements specified for concurrent login handling (multiple devices/sessions)? [Gap, Exception Flow]

---

## Onboarding Flow Requirements

- [ ] CHK014 - Are field-level validation requirements defined for each Onboarding step (rolename, profile, work-type)? [Completeness, Spec §3.1-C]
- [ ] CHK015 - Are "disabled button" requirements quantified with specific state conditions? [Clarity, Spec §4.4]
- [ ] CHK016 - Are navigation requirements consistent between Onboarding completion and Dashboard editing flows? [Consistency, Spec §3.1-C/D]
- [ ] CHK017 - Are data persistence requirements defined for each Onboarding step (Next/Save triggers)? [Completeness, Spec §3.1-C]
- [ ] CHK018 - Are requirements specified for skipping optional steps (work-type)? [Clarity, Spec §3.1-C]
- [ ] CHK019 - Are rollback requirements defined if user abandons Onboarding mid-flow? [Gap, Recovery Flow]
- [ ] CHK020 - Are progress tracking requirements specified for partial completion states? [Gap, Spec §3.2]

---

## Resume Parsing & External API Requirements

- [ ] CHK021 - Are PDF file format requirements explicitly defined (accept .pdf only, max size)? [Completeness, Spec §3.1-E]
- [ ] CHK022 - Are timeout requirements (60 seconds) specified for both PDF parsing and LLM APIs? [Completeness, Spec §3.1-E]
- [ ] CHK023 - Are retry behavior requirements clearly defined (no auto-retry on timeout/5xx)? [Clarity, Spec §3.1-E/§4.5]
- [ ] CHK024 - Are error message requirements user-friendly and free of technical implementation details? [Clarity, Spec §4.5]
- [ ] CHK025 - Are LLM output validation requirements specified for JSON format and field presence? [Completeness, Spec §3.1-E]
- [ ] CHK026 - Are requirements defined for handling missing/empty fields in parsed results? [Edge Case, Spec §3.1-E]
- [ ] CHK027 - Are data overwrite requirements explicitly specified (one resume per user, no versioning)? [Clarity, Spec §3.1-E]
- [ ] CHK028 - Are requirements specified for malformed or corrupted PDF files? [Gap, Exception Flow]
- [ ] CHK029 - Are PDF parsing service fallback/switching requirements defined? [Gap, Recovery Flow]
- [ ] CHK030 - Are requirements specified for non-English resume content handling? [Gap, Edge Case]

---

## Stripe Subscription & Payment Requirements

- [ ] CHK031 - Are Test mode requirements explicitly stated with specific test card numbers? [Completeness, Spec §3.1-F]
- [ ] CHK032 - Are webhook event requirements defined for all three critical events (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)? [Completeness, Spec §3.1-F]
- [ ] CHK033 - Are Pending state requirements specified for webhook delays? [Completeness, Spec §4.6]
- [ ] CHK034 - Are subscription status display requirements consistent across Dashboard states? [Consistency, Spec §3.1-D]
- [ ] CHK035 - Are Customer Portal redirect requirements specified with allowed operations? [Completeness, Spec §3.1-F]
- [ ] CHK036 - Are requirements defined for payment failure handling and retry logic? [Gap, Exception Flow]
- [ ] CHK037 - Are requirements specified for subscription reactivation after cancellation? [Gap, Exception Flow]
- [ ] CHK038 - Are idempotency requirements defined for duplicate webhook events? [Gap, Spec §4.6]
- [ ] CHK039 - Are requirements specified for proration on plan changes? [Gap, Exception Flow]

---

## Dashboard & User Experience Requirements

- [ ] CHK040 - Are first-time user guide detection requirements clearly defined (localStorage priority, DB fallback)? [Clarity, Spec §3.1-C]
- [ ] CHK041 - Are guide completion tracking requirements specified (when to mark as seen)? [Gap, Spec §3.1-C]
- [ ] CHK042 - Are profile completion progress calculation requirements defined with specific weighting? [Clarity, Spec §3.1-D]
- [ ] CHK043 - Are module completion status display requirements consistent with actual Onboarding state? [Consistency, Spec §3.1-D]
- [ ] CHK044 - Are requirements specified for dashboard editing flow navigation (Save → Dashboard, not next step)? [Clarity, Spec §3.1-D]
- [ ] CHK045 - Are visual hierarchy requirements defined for competing UI elements (guide, subscription CTA, resume data)? [Gap, Clarity]
- [ ] CHK046 - Are mobile/responsive layout requirements defined for Dashboard components? [Gap, NFR]

---

## Error Handling & Exception Flow Requirements

- [ ] CHK047 - Are error message requirements consistent across all failure scenarios (resume parsing, subscription, authentication)? [Consistency, Spec §4]
- [ ] CHK048 - Are user retry requirements specified for all recoverable error states? [Completeness, Spec §4.5/§4.6]
- [ ] CHK049 - Are error logging requirements defined with specific data inclusions/exclusions (no sensitive data)? [Completeness, Spec §3.3]
- [ ] CHK050 - Are requirements specified for network failure during file upload? [Gap, Exception Flow]
- [ ] CHK051 - Are requirements defined for Supabase connection failures? [Gap, Exception Flow]
- [ ] CHK052 - Are rollback/recovery requirements specified for partial data corruption? [Gap, Recovery Flow]

---

## Data Model & Persistence Requirements

- [ ] CHK053 - Are all business field requirements mapped to specific database tables? [Completeness, Spec §3.2]
- [ ] CHK054 - Are field type requirements specified (string, boolean, array) for all data models? [Completeness, Spec §3.2]
- [ ] CHK055 - Are optional/required field requirements consistently defined between spec and data model? [Consistency, Spec §3.1/§3.2]
- [ ] CHK056 - Are foreign key relationship requirements defined (Clerk userId to Supabase records)? [Gap, Spec §3.2]
- [ ] CHK057 - Are index requirements specified for query performance? [Gap, NFR]
- [ ] CHK058 - Are data retention/cleanup requirements defined for deleted users? [Gap, Compliance]
- [ ] CHK059 - Are requirements specified for data migration between schema versions? [Gap, Recovery Flow]

---

## Non-Functional Requirements (NFR)

- [ ] CHK060 - Are performance requirements quantified with specific metrics (<3s LCP, <2s API)? [Measurability, Spec §3.3]
- [ ] CHK061 - Are performance requirements defined for all critical user journeys (Onboarding, Dashboard load, Resume upload)? [Coverage, Spec §3.3]
- [ ] CHK062 - Are accessibility requirements specified for keyboard navigation and screen readers? [Gap, NFR]
- [ ] CHK063 - Are logging requirements comprehensive for all critical business events? [Completeness, Spec §3.3]
- [ ] CHK064 - Are log format requirements specified (userId, operation, status, error details)? [Clarity, Spec §3.3]
- [ ] CHK065 - Are monitoring/observability requirements defined beyond logging (alerts, dashboards)? [Gap, Spec §3.3]
- [ ] CHK066 - Are concurrency requirements specified for multiple simultaneous resume uploads? [Gap, NFR]
- [ ] CHK067 - Are browser compatibility requirements defined? [Gap, NFR]

---

## Integration & Dependency Requirements

- [ ] CHK068 - Are DMXAPI interface requirements specified (endpoints, auth, request/response formats)? [Gap, Spec §3.1-E]
- [ ] CHK069 - Are Clerk integration requirements explicitly defined with component usage? [Completeness, Spec §3.1-A]
- [ ] CHK070 - Are Supabase client requirements specified (singleton, connection pooling)? [Gap, Spec §3.1-E]
- [ ] CHK071 - Are requirements defined for external service unavailability (DMXAPI downtime)? [Coverage, Spec §4.5]
- [ ] CHK072 - Are API versioning requirements specified for external dependencies? [Gap, Dependency]
- [ ] CHK073 - Are requirements defined for dependency updates and breaking changes? [Gap, Dependency]

---

## Traceability & Ambiguity Checks

- [ ] CHK074 - Is a requirement ID system established (e.g., FR-001, NFR-001) for traceability? [Gap, Traceability]
- [ ] CHK075 - Are acceptance criteria defined for all functional requirements? [Completeness, Spec §5]
- [ ] CHK076 - Is the term "轻度模仿" (light imitation) quantified with specific design guidelines? [Ambiguity, Spec §1.2]
- [ ] CHK077 - Are deployment environment requirements specified (Vercel config, environment variables)? [Gap, Spec §3.1]
- [ ] CHK078 - Are rollback requirements defined for failed deployments? [Gap, Recovery Flow]
- [ ] CHK079 - Are assumptions about external API availability documented and validated? [Assumption, Spec §3.1-E]
- [ ] CHK080 - Are cost constraints/budgets specified for external services (DMXAPI, Supabase, Clerk, Stripe)? [Gap, Assumption]

---

## 🚫 Prohibited Implementation Testing (Anti-Examples)

**The following items MUST NOT appear in this requirements quality checklist:**
- ❌ "Verify landing page displays hero section"
- ❌ "Test that clicking Start begins Onboarding"
- ❌ "Confirm webhook endpoint returns 200"
- ❌ "Check that Resume upload shows progress bar"
- ❌ "Validate email format with regex"
- ❌ "Ensure password is hashed before storage"

**This checklist tests REQUIREMENTS QUALITY, not implementation correctness.**

---

## Summary Statistics

**Total Items**: 78 (CHK003 merged into CHK001)
**Gating Items**: 3 (🔒 marked - MUST PASS before implementation)
  - CHK001: Secret key storage & no exposure requirements
  - CHK002: Stripe webhook signature verification + allowlisted events
  - CHK006: Protected route consistency (middleware ↔ spec)
**Coverage Areas**: Security, Auth, Onboarding, Resume Parsing, Stripe, Dashboard, Error Handling, Data Model, NFR, Integrations, Traceability
**Quality Dimensions Tested**: Completeness, Clarity, Consistency, Measurability, Coverage, Edge Cases, Dependencies, Ambiguities

**Traceability**: ≥98% items include spec references or [Gap]/[Ambiguity]/[Assumption] markers

**MVP-Level Checks**: CHK004 (PII), CHK005 (RLS), CHK007 (lightweight risk note) - important but not blocking for Code Test

---

## Next Steps

1. ✅ Review and address all 🔒 **GATING** items - these must pass before task generation
2. ✅ Address [Gap] items to improve requirements completeness
3. ✅ Clarify [Ambiguity] and [Assumption] items
4. ✅ Run `/speckit.tasks` to generate implementation tasks after gating items pass
5. ✅ Re-run this checklist if spec.md changes significantly
