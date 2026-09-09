import { isRepoError } from "./repo/errors";

/** Keep storage / database / network implementation details out of user-facing UI. */
export function friendlyError(error: unknown): string {
  // Categorized repository failures get precise, safe UI copy first.
  if (isRepoError(error)) {
    const raw = error.message.toLowerCase();
    switch (error.code) {
      case "not-found":
        return "We couldn’t find that item. It may have been deleted. Please refresh and try again.";
      case "auth":
        if (/invalid.*(credentials|login|email|password)/.test(raw))
          return "That email and password don’t match. Please check them and try again.";
        if (/already (exists|registered)/.test(raw))
          return "An account with this email already exists. Try logging in instead.";
        if (/email not confirmed/.test(raw))
          return "Please confirm your email before logging in. Check your inbox for the confirmation link.";
        if (/password.*(short|characters|weak)/.test(raw))
          return "Choose a stronger password with at least 8 characters.";
        return "Your session has expired. Please log in again.";
      case "forbidden":
        return "You don’t have access to that item. If it was yours, please log in again.";
      case "validation":
        if (/already (exists|registered)/.test(raw))
          return "An account with this email already exists. Try logging in instead.";
        if (/password.*(short|characters|weak)/.test(raw))
          return "Choose a stronger password with at least 8 characters.";
        if (/invalid.*email/.test(raw))
          return "That email address doesn’t look valid. Please check it and try again.";
        return "Some details couldn’t be saved. Please check them and try again.";
      case "network":
        return "We couldn’t connect. Check your internet connection and try again.";
      case "backend":
        break; // fall through to the generic safe message below
    }
    const message = error.message.toLowerCase();
    if (/quota|storage.*full/.test(message))
      return "This browser’s storage is full. Free up some space, then try again.";
    if (/rate|too many requests/.test(message))
      return "A few too many requests. Please wait a moment and try again.";
    return "We couldn’t finish that action. Your existing work is safe. Please try again.";
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (/invalid.*(credentials|email|password)/.test(message))
    return "That email and password don’t match. Please check them and try again.";
  if (/already (exists|registered)/.test(message))
    return "An account with this email already exists. Try logging in instead.";
  if (/email not confirmed/.test(message))
    return "Please confirm your email before logging in. Check your inbox for the confirmation link.";
  if (/not signed in|jwt expired|session/.test(message))
    return "Your session has expired. Please log in again.";
  if (/quota|storage.*full/.test(message))
    return "This browser’s storage is full. Free up some space, then try again.";
  if (/fetch|network|offline/.test(message))
    return "We couldn’t connect. Check your internet connection and try again.";
  if (/rate|too many requests/.test(message))
    return "A few too many requests. Please wait a moment and try again.";
  if (/password.*(short|characters|weak)/.test(message))
    return "Choose a stronger password with at least 8 characters.";
  return "We couldn’t finish that action. Your existing work is safe. Please try again.";
}
