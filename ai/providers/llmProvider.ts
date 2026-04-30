import { ChatOpenAI } from "@langchain/openai"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatMistralAI } from "@langchain/mistralai"
import { BaseMessage, HumanMessage } from "@langchain/core/messages"
import appConfig from "@/lib/config"

export type LLMProvider = "openai" | "google" | "mistral" | "azure"

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
}

export interface LLMSettings {
  providers: LLMConfig[]
}

export interface LLMRequest {
  prompt: string
  schema?: Record<string, unknown>
  attachments?: { contentType: string; base64: string }[]
}

export interface LLMResponse {
  output: Record<string, string>
  tokensUsed?: number
  provider: LLMProvider
  error?: string
}

async function requestLLMUnified(config: LLMConfig, req: LLMRequest): Promise<LLMResponse> {
  try {
    const temperature = 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let model: any
    if (config.provider === "azure") {
      // Azure OpenAI deployment — operator-owned mode.
      // NOTE: we use ChatOpenAI directly (not AzureChatOpenAI) because in
      // @langchain/openai@0.6.1 the ChatOpenAI proxy creates inner
      // ChatOpenAIResponses/ChatOpenAICompletions instances that do NOT
      // inherit the Azure overrides — every call ends up hitting
      // api.openai.com instead of the Azure endpoint. We work around it by
      // pointing the underlying OpenAI client at the Azure deployment URL
      // directly and swapping `Authorization: Bearer` for `api-key`.
      const azure = appConfig.ai.azure
      const deployment = azure.deployment || config.model
      const azureBaseURL = `${(azure.endpoint || "").replace(/\/$/, "")}/openai/deployments/${deployment}`
      // Reasoning models (o1, o3, o4, …) reject temperature ≠ 1 — omit it.
      const isReasoning = /^o\d/i.test(deployment)
      model = new ChatOpenAI({
        apiKey: config.apiKey,
        model: deployment,
        ...(isReasoning ? {} : { temperature }),
        configuration: {
          baseURL: azureBaseURL,
          defaultQuery: { "api-version": azure.apiVersion },
          defaultHeaders: {
            "api-key": config.apiKey,
            // null deletes the auto-added `Authorization: Bearer …` header
            // (the Azure endpoint rejects Bearer auth on api-key resources)
            Authorization: null as unknown as string,
          },
        },
      })
    } else if (config.provider === "openai") {
      model = new ChatOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "google") {
      model = new ChatGoogleGenerativeAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else if (config.provider === "mistral") {
      model = new ChatMistralAI({
        apiKey: config.apiKey,
        model: config.model,
        temperature: temperature,
      })
    } else {
      return {
        output: {},
        provider: config.provider,
        error: "Unknown provider",
      }
    }

    const structuredModel = model.withStructuredOutput(req.schema, { name: "transaction" })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message_content: any[] = [{ type: "text", text: req.prompt }]
    if (req.attachments && req.attachments.length > 0) {
      const images = req.attachments.map((att) => ({
        type: "image_url",
        image_url: {
          url: `data:${att.contentType};base64,${att.base64}`,
        },
      }))
      message_content.push(...images)
    }
    const messages: BaseMessage[] = [new HumanMessage({ content: message_content })]

    const response = await structuredModel.invoke(messages)

    return {
      output: response,
      provider: config.provider,
    }
  } catch (error: unknown) {
    return {
      output: {},
      provider: config.provider,
      error: error instanceof Error ? error.message : `${config.provider} request failed`,
    }
  }
}

export async function requestLLM(settings: LLMSettings, req: LLMRequest): Promise<LLMResponse> {
  // Track per-provider failures so the caller (and the UI) gets the
  // actual reason instead of a useless "All LLM providers failed". The
  // generic message hides config drift, expired keys, rate limits, image
  // upload errors, etc. — surface them.
  const failures: string[] = []
  let attempted = 0
  for (const config of settings.providers) {
    if (!config.apiKey || !config.model) {
      console.info("Skipping provider:", config.provider, "— missing apiKey or model")
      failures.push(`${config.provider}: not configured (missing ${!config.apiKey ? "apiKey" : "model"})`)
      continue
    }
    attempted++
    console.info("Use provider:", config.provider)

    const response = await requestLLMUnified(config, req)

    if (!response.error) {
      return response
    } else {
      console.error(`Provider ${config.provider} failed:`, response.error)
      failures.push(`${config.provider}: ${response.error}`)
    }
  }

  return {
    output: {},
    provider: settings.providers[0]?.provider || "openai",
    error: attempted === 0
      ? `Nenhum provider de IA configurado. Detalhes: ${failures.join(" | ") || "lista vazia"}`
      : `IA falhou — ${failures.join(" | ")}`,
  }
}
