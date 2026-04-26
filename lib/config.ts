import { z } from "zod"

const isServer = typeof window === "undefined"

const envSchema = z.object({
  BASE_URL: z.string().url().default("http://localhost:7331"),
  PORT: z.string().default("7331"),
  SELF_HOSTED_MODE: z.enum(["true", "false"]).default("true"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL_NAME: z.string().default("gpt-4o-mini"),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL_NAME: z.string().default("gemini-2.5-flash"),
  MISTRAL_API_KEY: z.string().optional(),
  MISTRAL_MODEL_NAME: z.string().default("mistral-medium-latest"),
  BETTER_AUTH_SECRET: isServer
    ? z.string().min(32, "BETTER_AUTH_SECRET deve ter pelo menos 32 caracteres. Gere um com: openssl rand -base64 48")
    : z.string().default("client-side-not-available"),
  DISABLE_SIGNUP: z.enum(["true", "false"]).default("false"),
  RESEND_API_KEY: z.string().default("please-set-your-resend-api-key-here"),
  RESEND_FROM_EMAIL: z.string().default("Despesas <user@localhost>"),
  RESEND_AUDIENCE_ID: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  // BuildFlow
  BUILDFLOW_MODULE: z.enum(["true", "false"]).default("false"),
  BUILDFLOW_API_KEY: z.string().default(""),
  CONTROLHUB_URL: z.string().url().default("https://controlhub.buildflow.pt"),
  // AT (Autoridade Tributária)
  AT_SIGNING_PRIVATE_KEY: z.string().default(""),
  AT_CERTIFICATE_NUMBER: z.string().default("0"),
  // Support / Legal (per-deployment overrides; defaults to BuildFlow generic)
  SUPPORT_EMAIL: z.string().email().default("info@buildflow.pt"),
  LEGAL_ENTITY_NAME: z.string().default("BuildFlow"),
  LEGAL_DOMAIN: z.string().default("buildflow.pt"),
})

const env = envSchema.parse(process.env)

const isBuildFlow = env.BUILDFLOW_MODULE === "true"

const config = {
  app: {
    title: isBuildFlow ? "Despesas & Fiscal" : "Ledge",
    description: isBuildFlow
      ? "Gestão completa de despesas, recibos e exportação fiscal"
      : "Gestão inteligente de despesas",
    logo: isBuildFlow ? "/logo/buildflow-expenses.svg" : "/logo/logo.svg",
    version: process.env.npm_package_version || "0.0.1",
    baseURL: env.BASE_URL || `http://localhost:${env.PORT || "7331"}`,
    // Support email — overridable per-tenant via SUPPORT_EMAIL env var.
    // Default falls back to BuildFlow general support; never hardcode a
    // specific customer's email here (legal/RGPD risk: contact channel
    // for data subject rights must belong to the data controller).
    supportEmail: env.SUPPORT_EMAIL || "info@buildflow.pt",
    legalEntity: env.LEGAL_ENTITY_NAME || "BuildFlow",
    legalDomain: env.LEGAL_DOMAIN || "buildflow.pt",
  },
  upload: {
    acceptedMimeTypes: "image/*,.pdf,.doc,.docx,.xls,.xlsx",
    images: {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 90,
    },
    pdfs: {
      maxPages: 10,
      dpi: 150,
      quality: 90,
      maxWidth: 1500,
      maxHeight: 1500,
    },
  },
  selfHosted: {
    isEnabled: env.SELF_HOSTED_MODE === "true",
    redirectUrl: "/self-hosted/redirect",
    welcomeUrl: "/self-hosted",
  },
  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModelName: env.OPENAI_MODEL_NAME,
    googleApiKey: env.GOOGLE_API_KEY,
    googleModelName: env.GOOGLE_MODEL_NAME,
    mistralApiKey: env.MISTRAL_API_KEY,
    mistralModelName: env.MISTRAL_MODEL_NAME,
  },
  auth: {
    secret: env.BETTER_AUTH_SECRET,
    loginUrl: "/enter",
    disableSignup: env.DISABLE_SIGNUP === "true" || env.SELF_HOSTED_MODE === "true",
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    paymentSuccessUrl: `${env.BASE_URL}/cloud/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    paymentCancelUrl: `${env.BASE_URL}/cloud`,
  },
  email: {
    apiKey: env.RESEND_API_KEY,
    from: env.RESEND_FROM_EMAIL,
    audienceId: env.RESEND_AUDIENCE_ID,
  },
  buildflow: {
    isEnabled: isBuildFlow,
    apiKey: env.BUILDFLOW_API_KEY,
    controlHubUrl: env.CONTROLHUB_URL,
  },
  fiscal: {
    signingPrivateKey: env.AT_SIGNING_PRIVATE_KEY,
    certificateNumber: env.AT_CERTIFICATE_NUMBER,
  },
} as const

export default config
