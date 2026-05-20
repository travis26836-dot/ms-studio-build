import {
  useAuth as useClerkAuth,
  useClerk,
  useUser,
} from "@clerk/react";

const fallbackAuth = {
  isLoaded: true,
  isSignedIn: false,
  userId: null,
  sessionId: null,
  sessionClaims: null,
  actor: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
  has: () => false,
  getToken: async () => null,
  signOut: async () => undefined,
} as ReturnType<typeof useClerkAuth>;

const fallbackUser = {
  isLoaded: true,
  isSignedIn: false,
  user: null,
} as ReturnType<typeof useUser>;

const fallbackClerk = {
  signOut: async () => undefined,
} as ReturnType<typeof useClerk>;

export function useSafeClerkAuth() {
  try {
    return useClerkAuth();
  } catch {
    return fallbackAuth;
  }
}

export function useSafeClerkUser() {
  try {
    return useUser();
  } catch {
    return fallbackUser;
  }
}

export function useSafeClerk() {
  try {
    return useClerk();
  } catch {
    return fallbackClerk;
  }
}
