import type { ReactNode } from "react";

import { useMyRoles } from "@/lib/krishi/useRole";

/** Renders children only for signed-in platform admins. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useMyRoles();
  if (!isAdmin) return null;
  return <>{children}</>;
}
