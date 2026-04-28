import config from "@/lib/config"
import { prisma } from "@/lib/db"

const APP_SLUG = "expenses"

export type UsageMetric =
  | "documents.processed"
  | "ai.tokens"
  | "ai.pages"
  | "saft.exports"
  | "iva.reports"

// Maps metrics to the catalog Module that owns the limit/overage policy
// in ControlHub (lib/catalog-data.ts). receipt-ocr has a 100/mo limit and
// €0.10/doc overage; tax-export is unlimited add-on.
const METRIC_TO_MODULE: Record<UsageMetric, string> = {
  "documents.processed": "receipt-ocr",
  "ai.tokens": "receipt-ocr",
  "ai.pages": "receipt-ocr",
  "saft.exports": "tax-export",
  "iva.reports": "tax-export",
}

type EmitArgs = {
  userId: string
  metric: UsageMetric
  value: number
  metadata?: Record<string, unknown>
}

/**
 * Fire-and-forget usage emitter to ControlHub. MUST NOT throw — usage tracking
 * is observability/billing, never a blocker for the user's primary action.
 *
 * Resolves the ControlHub tenantId from User.externalTenantId (set by the
 * provisioning callback). No-ops when BuildFlow mode is off or the API key
 * is unset (e.g. self-hosted / dev).
 */
export function emitUsage(args: EmitArgs): void {
  if (!config.buildflow.isEnabled) return
  if (!config.buildflow.apiKey) return

  // Detached promise — caller does not await.
  void sendUsage(args).catch((error) => {
    console.warn("[buildflow.usage] emit failed (non-fatal):", error)
  })
}

async function sendUsage({ userId, metric, value, metadata }: EmitArgs): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { externalTenantId: true },
  })

  const tenantId = user?.externalTenantId
  if (!tenantId) return // self-hosted or pre-provision user; nothing to bill

  const url = `${config.buildflow.controlHubUrl.replace(/\/$/, "")}/api/buildflow/usage`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BuildFlow-API-Key": config.buildflow.apiKey,
      "X-BuildFlow-App-Slug": APP_SLUG,
    },
    body: JSON.stringify({
      tenantId,
      moduleKey: METRIC_TO_MODULE[metric],
      metric,
      value,
      metadata,
    }),
    signal: AbortSignal.timeout(5_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`ControlHub ${response.status}: ${text.slice(0, 200)}`)
  }
}
