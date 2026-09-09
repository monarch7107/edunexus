import type { Profile } from "./types";

/**
 * Onboarding completion (Step 9 / RC4).
 *
 * A profile is onboarded only when ALL required fields are present and
 * non-blank after trimming: full name, course, and branch. Semester/year
 * and goals are optional. A legacy/partial `full_name` alone must never
 * satisfy completion.
 */
export function isOnboarded(
  profile: Pick<Profile, "full_name" | "course" | "branch"> | null | undefined,
): boolean {
  if (!profile) return false;
  return Boolean(
    profile.full_name?.trim() &&
      profile.course?.trim() &&
      profile.branch?.trim(),
  );
}

export interface OnboardingErrors {
  fullName?: string;
  course?: string;
  branch?: string;
}

/** Validate required onboarding fields. Returns field errors (empty = valid). */
export function validateOnboarding(input: {
  full_name: string;
  course: string;
  branch: string;
}): OnboardingErrors {
  const errors: OnboardingErrors = {};
  if (!input.full_name?.trim()) errors.fullName = "Tell us what to call you.";
  if (!input.course?.trim()) errors.course = "Add your course, such as B.Tech.";
  if (!input.branch?.trim())
    errors.branch = "Add your branch or field of study.";
  return errors;
}
