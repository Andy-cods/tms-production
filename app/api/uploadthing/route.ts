import { createRouteHandler } from "uploadthing/next";
import { uploadRouter } from "./core";

/**
 * Uploadthing Route Handler
 * Handles POST (upload) and GET (polling) requests
 * Next.js 15 App Router compatible
 */
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    // Optional: customize upload behavior
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/uploadthing`,
  },
});

