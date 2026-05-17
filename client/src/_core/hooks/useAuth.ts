import { useUser, useAuth as useClerkAuth } from "@clerk/react";

const HAS_CLERK = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

export function useAuth() {
  if (!HAS_CLERK) {
    return {
      user: null,
      loading: false,
      isAuthenticated: false,
    };
  }

  const { user, isLoaded } = useUser();
  const { isSignedIn } = useClerkAuth();

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
