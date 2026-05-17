import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth as useLocalAuth } from "@/_core/hooks/useAuth";
import NotFound from "@/pages/NotFound";
import {
  ClerkProvider,
  RedirectToSignIn,
  SignIn,
  SignUp,
  useClerk,
} from "@clerk/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import EditorPage from "./pages/EditorPage";
import ApiDocs from "./pages/ApiDocs";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import { useEffect } from "react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const HAS_CLERK = Boolean(PUBLISHABLE_KEY);

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated, loading } = useLocalAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    if (!HAS_CLERK) {
      return <RedirectToSignIn />;
    }
    return <RedirectToSignIn />;
  }
  return <Component />;
}

function LogoutPage() {
  const { signOut } = useClerk();
  useEffect(() => {
    signOut({ redirectUrl: "/sign-in" });
  }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sign-in">
        {() => (
          <div className="flex min-h-screen items-center justify-center">
            {HAS_CLERK ? (
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            ) : (
              <p className="text-sm text-muted-foreground">Authentication is not configured for local dev.</p>
            )}
          </div>
        )}
      </Route>
      <Route path="/sign-in/:rest*">
        {() => (
          <div className="flex min-h-screen items-center justify-center">
            {HAS_CLERK ? (
              <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
            ) : (
              <p className="text-sm text-muted-foreground">Authentication is not configured for local dev.</p>
            )}
          </div>
        )}
      </Route>
      <Route path="/sign-up">
        {() => (
          <div className="flex min-h-screen items-center justify-center">
            {HAS_CLERK ? (
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
            ) : (
              <p className="text-sm text-muted-foreground">Authentication is not configured for local dev.</p>
            )}
          </div>
        )}
      </Route>
      <Route path="/sign-up/:rest*">
        {() => (
          <div className="flex min-h-screen items-center justify-center">
            {HAS_CLERK ? (
              <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
            ) : (
              <p className="text-sm text-muted-foreground">Authentication is not configured for local dev.</p>
            )}
          </div>
        )}
      </Route>
      <Route path="/editor">
        {() => <ProtectedRoute component={EditorPage} />}
      </Route>
      <Route path="/api-docs" component={ApiDocs} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
      <Route path="/logout" component={LogoutPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const appTree = (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Router />
        <SpeedInsights />
      </TooltipProvider>
    </ThemeProvider>
  );

  return (
    <ErrorBoundary>
      {HAS_CLERK ? (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>{appTree}</ClerkProvider>
      ) : (
        appTree
      )}
    </ErrorBoundary>
  );
}

export default App;
