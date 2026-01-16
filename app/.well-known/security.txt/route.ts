/**
 * Security.txt Endpoint
 * RFC 9116 compliant security contact information
 *
 * https://securitytxt.org/
 */

import { NextResponse } from "next/server";
import { generateSecurityTxt } from "@/lib/security/headers";

export async function GET() {
  const content = generateSecurityTxt();

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}
