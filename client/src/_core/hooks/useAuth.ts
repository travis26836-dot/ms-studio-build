import { useSafeClerkAuth, useSafeClerkUser } from "@/lib/safeClerk";

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function useAuth() {
  if (!HAS_CLERK) {
    return {
      user: null,
      loading: false,
      isAuthenticated: false,
    };
  }

  const { user, isLoaded } = useSafeClerkUser();
  const { isSignedIn } = useSafeClerkAuth();

  return {
    user: user
      ? {
          id: user.id,
          name:
            user.fullName ??
            user.username ??
            user.primaryEmailAddress?.emailAddress ??
            "",
          email: user.primaryEmailAddress?.emailAddress ?? "",
          role: "user" as const,
        }
      : null,
    loading: !isLoaded,
    isAuthenticated: !!isSignedIn,
  };
}
