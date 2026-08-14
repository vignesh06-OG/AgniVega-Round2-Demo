import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Emblem } from "@/components/agnivega/Emblem";
import { DEMO_ACCOUNTS, setDemoMode } from "@/lib/demo/demo-mode";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function safeRedirect(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/farmer";
  return value;
}

function AuthPage() {
  const navigate = useNavigate();
  const [next, setNext] = useState("/farmer");

  useEffect(() => {
    setNext(safeRedirect(new URLSearchParams(window.location.search).get("next")));
    const authStatus = localStorage.getItem("agnivega_auth");
    if (authStatus) {
      window.location.replace(next);
    }
  }, [next]);

  async function demoLogin(account: (typeof DEMO_ACCOUNTS)[number]) {
    try {
      localStorage.setItem("agnivega_auth", account.role);
      setDemoMode(true);
      const target = account.role === "admin" ? "/admin" : `/${account.role}`;
      window.location.replace(target);
      toast.success(`Logged in as ${account.label}`);
    } catch (error) {
      toast.error("Demo sign-in failed");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Emblem className="mx-auto h-14 w-14" />
          <CardTitle className="mt-3 text-2xl">Smart Krishi-Yatra AI</CardTitle>
          <CardDescription>Team Agnivega — agri-logistics operating system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-accent bg-accent/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Independent Prototype Mode
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              One tap signs you in locally (no database required).
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <Button
                  key={account.email}
                  size="sm"
                  variant={account.role === "admin" ? "default" : "outline"}
                  onClick={() => demoLogin(account)}
                >
                  {account.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
