// Demo-mode session cookie so middleware can protect routes without a backend.
export const DEMO_COOKIE = "edunexus_demo";

export function setDemoCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=${
    60 * 60 * 24 * 30
  }; SameSite=Lax`;
}

export function clearDemoCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
