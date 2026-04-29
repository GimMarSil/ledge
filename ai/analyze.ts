"use server"

import { ActionState } from "@/lib/actions"
import { checkEntitlement } from "@/lib/buildflow/entitlement"
import { emitUsage } from "@/lib/buildflow/usage"
import { updateFile } from "@/models/files"
import { getLLMSettings, getSettings } from "@/models/settings"
import { getUserById } from "@/models/users"
import { AnalyzeAttachment } from "./attachments"
import { requestLLM } from "./providers/llmProvider"

export type AnalysisResult = {
  output: Record<string, string>
  tokensUsed: number
}

export async function analyzeTransaction(
  prompt: string,
  schema: Record<string, unknown>,
  attachments: AnalyzeAttachment[],
  fileId: string,
  userId: string
): Promise<ActionState<AnalysisResult>> {
  const settings = await getSettings(userId)
  const llmSettings = getLLMSettings(settings)

  // Gate the LLM call before we burn tokens. receipt-ocr is the metered
  // module that owns this action's quota and overage policy.
  const entitlement = await checkEntitlement(userId, "receipt-ocr")
  if (!entitlement.allowed) {
    return {
      success: false,
      error: entitlementErrorMessage(entitlement.reason, entitlement.limit),
    }
  }

  try {
    const response = await requestLLM(llmSettings, {
      prompt,
      schema,
      attachments,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    const result = response.output
    const tokensUsed = response.tokensUsed || 0

    // Defensive swap: LLMs frequently flip supplier and customer NIFs on
    // PT invoices because the customer NIF (the user's own company) is
    // printed in large text near the address block. If the extracted
    // supplier NIF equals the user's businessNif, we know it's wrong —
    // move it to customerNif and, if the customer slot held a different
    // value, promote that to the supplier slot.
    const user = await getUserById(userId)
    const businessNif = digitsOnly(user?.businessNif)
    if (businessNif) {
      const supplier = digitsOnly(result.nif)
      const customer = digitsOnly(result.customerNif)
      if (supplier && supplier === businessNif) {
        const promoted = customer && customer !== businessNif ? result.customerNif : ""
        result.customerNif = result.nif
        result.nif = promoted
      }
    }

    console.log("LLM response:", result)
    console.log("LLM tokens used:", tokensUsed)

    await updateFile(fileId, userId, { cachedParseResult: result })

    emitUsage({ userId, metric: "documents.processed", value: 1, metadata: { fileId } })
    if (tokensUsed > 0) {
      emitUsage({ userId, metric: "ai.tokens", value: tokensUsed, metadata: { fileId } })
    }
    if (attachments.length > 0) {
      emitUsage({ userId, metric: "ai.pages", value: attachments.length, metadata: { fileId } })
    }

    return {
      success: true,
      data: {
        output: result,
        tokensUsed: tokensUsed,
      },
    }
  } catch (error) {
    console.error("AI Analysis error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze invoice",
    }
  }
}

function digitsOnly(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.replace(/\D/g, "")
}

function entitlementErrorMessage(
  reason: string,
  limit: number | null
): string {
  switch (reason) {
    case "tenant_suspended":
      return "A subscrição da sua conta está suspensa. Contacte o suporte."
    case "not_subscribed":
      return "O seu plano actual não inclui processamento automático de documentos. Faça upgrade para continuar."
    case "disabled":
      return "Esta funcionalidade está desactivada na sua conta."
    case "quota_exceeded":
      return limit
        ? `Atingiu o limite mensal de ${limit} documentos do seu plano. Faça upgrade ou aguarde pelo próximo ciclo.`
        : "Atingiu o limite mensal do seu plano."
    default:
      return "Não autorizado a processar este documento."
  }
}
