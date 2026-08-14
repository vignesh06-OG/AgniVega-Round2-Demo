import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_PASSWORD = "Agnivega@2026";

const DEMO_USERS = [
  { email: "admin@agnivega.demo", role: "admin", name: "Demo Admin" },
  { email: "farmer@agnivega.demo", role: "farmer", name: "Demo Farmer" },
  { email: "driver@agnivega.demo", role: "driver", name: "Demo Driver" },
  { email: "fleet@agnivega.demo", role: "fleet", name: "Demo Fleet Operator" },
] as const;

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ email: z.enum(DEMO_USERS.map((u) => u.email) as [string, ...string[]]) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const spec = DEMO_USERS.find((u) => u.email === data.email)!;
    return { email: spec.email, password: DEMO_PASSWORD, role: spec.role };
  });
