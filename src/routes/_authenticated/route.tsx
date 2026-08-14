import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Dummy Auth for Hackathon: Check if "agnivega_auth" is in localStorage
    const authStatus = typeof window !== "undefined" ? localStorage.getItem("agnivega_auth") : null;
    if (!authStatus) {
      throw redirect({ to: "/auth", search: { next: location.href } as never });
    }
    return { user: { id: "dummy-user-1", role: authStatus } };
  },
  component: () => <Outlet />,
});
