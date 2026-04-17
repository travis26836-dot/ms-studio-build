export interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

const demoUser: DemoUser = {
  id: 1,
  name: "Demo Creator",
  email: "demo@manus.studio",
  role: "admin",
};

export function useAuth() {
  return {
    user: demoUser,
    loading: false,
    isAuthenticated: true,
  };
}
