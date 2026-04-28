import config from "@/lib/config"
import { prisma } from "@/lib/db"

const APP_SLUG = "expenses"

export type EntitlementReason =
  | "ok"
  | "tenant_suspended"
  | "not_subscribed"
  | "disabled"
  | "quota_exceeded"
  | "self_hosted" // BuildFlow off — local install, no enforcement
  | "unprovisioned" // user has no externalTenantId yet
  | "controlhub_unreachable" // fail-open after network error

export type EntitlementCheck = {
  allowed: boolean
  reason: EntitlementReason
  limit: number | null
  usage: number
  overagePolicy?: "block" | "allow_and_charge" | "allow_and_alert"
}

const CACHE_TTL_MS = 30_000
const cache = new Map<string, { at: number; result: EntitlementCheck }>()

function cacheKey(tenantId: string, moduleKey: string) {
  return `${tenantId}:${moduleKey}`
}

/**
 * Check whether a tenant is allowed to perform a metered action right now.
 *
 * Returns `allowed: true` for self-hosted installs, unprovisioned users, and
 * when ControlHub is unreachable — the policy is fail-open so a network blip
 * never blocks a legitimate paying customer. Hard denies only happen when
 * ControlHub explicitly says no.
 *
 * Results are cached for 30s per (tenant, module) to keep latency negligible
 * on hot paths (e.g. file uploads). Bust the cache via `invalidateEntitlement`
 * after a successful action that pushed usage close to the limit.
 */
export async function checkEntitlement(
  userId: string,
  moduleKey: string
): Promise<EntitlementCheck> {
  if (!config.buildflow.isEnabled || !config.buildflow.apiKey) {
    return { allowed: true, reason: "self_hosted", limit: null, usage: 0 }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { externalTenantId: true },
  })
  const tenantId = user?.externalTenantId
  if (!tenantId) {
    return { allowed: true, reason: "unprovisioned", limit: null, usage: 0 }
  }

  const key = cacheKey(tenantId, moduleKey)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.result
  }

  try {
    const url = new URL("/api/buildflow/entitlement", config.buildflow.controlHubUrl)
    url.searchParams.set("tenantId", tenantId)
    url.searchParams.set("moduleKey", moduleKey)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-BuildFlow-API-Key": config.buildflow.apiKey,
        "X-BuildFlow-App-Slug": APP_SLUG,
      },
      signal: AbortSignal.timeout(5_000),
    })

    if (!response.ok) {
      console.warn(`[buildflow.entitlement] ${response.status} from ControlHub`)
      const failOpen: EntitlementCheck = {
        allowed: true,
        reason: "controlhub_unreachable",
        limit: null,
        usage: 0,
      }
      cache.set(key, { at: Date.now(), result: failOpen })
      return failOpen
    }

    const body = (await response.json()) as {
      allowed: boolean
      reason: EntitlementReason
      limit: number | null
      usage: number
      overagePolicy?: EntitlementCheck["overagePolicy"]
    }
    const result: EntitlementCheck = {
      allowed: body.allowed,
      reason: body.reason,
      limit: body.limit,
      usage: body.usage,
      overagePolicy: body.overagePolicy,
    }
    cache.set(key, { at: Date.now(), result })
    return result
  } catch (error) {
    console.warn("[buildflow.entitlement] check failed (fail-open):", error)
    return { allowed: true, reason: "controlhub_unreachable", limit: null, usage: 0 }
  }
}

export function invalidateEntitlement(tenantId: string, moduleKey: string): void {
  cache.delete(cacheKey(tenantId, moduleKey))
}

/** Test-only: clear the whole cache. Not exported to production code paths. */
export function _resetEntitlementCacheForTests(): void {
  cache.clear()
}
