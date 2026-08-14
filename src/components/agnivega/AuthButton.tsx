import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function useLocalUser() {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const authStatus = localStorage.getItem("agnivega_auth");
    setRole(authStatus);
    setReady(true);
  }, []);
  return { role, ready };
}

export function AuthButton() {
  const { role, ready } = useLocalUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!ready) return <div className="h-9 w-24" aria-hidden />;

  if (!role) {
    return (
      <Button size="sm" variant="secondary" onClick={() => navigate({ to: "/auth" })}>
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-xs text-muted-foreground sm:inline uppercase">Demo {role}</span>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await queryClient.cancelQueries();
          queryClient.clear();
          localStorage.removeItem("agnivega_auth");
          window.location.replace("/auth");
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
