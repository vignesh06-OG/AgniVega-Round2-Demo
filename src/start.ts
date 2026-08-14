import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

// Profiling: time every server request/function and record slow ones. Also the
// single funnel for server-side error monitoring.
const profilingMiddleware = createMiddleware().server(async ({ next }) => {
  const { recordEvent } = await import("./lib/telemetry/store.server");
  const started = Date.now();
  try {
    const result = await next();
    recordEvent({
      kind: "route",
      name: "server-request",
      durationMs: Date.now() - started,
      ok: true,
      source: "server",
    });
    return result;
  } catch (error) {
    recordEvent({
      kind: "error",
      name: (error as Error)?.message?.slice(0, 120) ?? "Server error",
      durationMs: Date.now() - started,
      ok: false,
      source: "server",
      detail: (error as Error)?.stack?.slice(0, 2000),
    });
    throw error;
  }
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    const { captureToSentry } = await import("./lib/monitoring/sentry.server");
    void captureToSentry({
      message: (error as Error)?.message ?? "Unhandled server error",
      stack: (error as Error)?.stack,
      type: (error as Error)?.name,
      source: "server",
    });
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [],
  requestMiddleware: [errorMiddleware, profilingMiddleware, csrfMiddleware],
}));
