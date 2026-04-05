import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Health check endpoint for BuildFlow platform monitoring.
 * Returns the app status and basic connectivity info.
 */
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: "ok",
      app: "despesas-fiscal",
      version: process.env.npm_package_version || "0.5.5",
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        app: "despesas-fiscal",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
