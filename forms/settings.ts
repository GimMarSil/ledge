import { randomHexColor } from "@/lib/utils"
import { z } from "zod"

export const settingsFormSchema = z.object({
  default_currency: z.string().max(5).optional(),
  default_type: z.string().optional(),
  default_category: z.string().optional(),
  default_project: z.string().optional(),
  default_vat_region: z.enum(["mainland", "madeira", "azores"]).optional(),
  trash_retention_days: z.string().optional(),
  openai_api_key: z.string().optional(),
  openai_model_name: z.string().default('gpt-4o-mini'),
  google_api_key: z.string().optional(),
  google_model_name: z.string().default("gemini-2.5-flash"),
  mistral_api_key: z.string().optional(),
  mistral_model_name: z.string().default("mistral-medium-latest"),
  llm_providers: z.string().default('openai,google,mistral'),
  prompt_analyse_new_file: z.string().optional(),
  is_welcome_message_hidden: z.string().optional(),
})

export const currencyFormSchema = z.object({
  code: z.string().max(5),
  name: z.string().max(32),
})

export const projectFormSchema = z.object({
  name: z.string().max(128),
  llm_prompt: z.string().max(512).nullable().optional(),
  color: z.string().max(7).default(randomHexColor()).nullable().optional(),
  budget: z.coerce.number().int().nullable().optional(),
  budgetCurrency: z.string().max(5).default("EUR").nullable().optional(),
})

export const categoryFormSchema = z.object({
  name: z.string().max(128),
  llm_prompt: z.string().max(512).nullable().optional(),
  color: z.string().max(7).default(randomHexColor()).nullable().optional(),
})

export const treasuryAccountFormSchema = z.object({
  name: z.string().max(128),
  type: z.enum(["company", "personal"]).default("company"),
  holderName: z.string().max(128).nullable().optional(),
  iban: z.string().max(64).nullable().optional(),
  bankName: z.string().max(128).nullable().optional(),
  isActive: z.boolean().optional(),
})

export const fieldFormSchema = z.object({
  name: z.string().max(128),
  type: z.string().max(128).default("string"),
  llm_prompt: z.string().max(512).nullable().optional(),
  isVisibleInList: z.boolean().optional(),
  isVisibleInAnalysis: z.boolean().optional(),
  isRequired: z.boolean().optional(),
})
