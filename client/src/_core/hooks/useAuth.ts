import { useUser, useAuth as useClerkAuth } from "@clerk/react";

export function useAuth() {
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
