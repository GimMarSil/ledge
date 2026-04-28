import { z } from "zod"

export const transactionFormSchema = z
  .object({
    name: z.string().max(128).optional(),
    merchant: z.string().max(128).optional(),
    description: z.string().max(256).optional(),
    type: z.string().optional(),
    total: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === '') return null
        const num = parseFloat(val)
        if (isNaN(num)) {
          throw new z.ZodError([{ message: "Invalid total", path: ["total"], code: z.ZodIssueCode.custom }])
        }
        return Math.round(num * 100) // convert to cents
      }),
    currencyCode: z.string().max(5).optional(),
    convertedTotal: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === '') return null
        const num = parseFloat(val)
        if (isNaN(num)) {
          throw new z.ZodError([
            { message: "Invalid coverted total", path: ["convertedTotal"], code: z.ZodIssueCode.custom },
          ])
        }
        return Math.round(num * 100) // convert to cents
      }),
    convertedCurrencyCode: z.string().max(5).optional(),
    categoryCode: z.string().optional(),
    projectCode: z.string().optional(),
    issuedAt: z
      .union([
        z.date(),
        z
          .string()
          .refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
          })
          .transform((val) => new Date(val)),
      ])
      .optional(),
    text: z.string().optional(),
    note: z.string().optional(),
    // Portuguese fiscal fields. Without these listed explicitly, the
    // analyze form had no UI input bound to them so AI-extracted values
    // never reached the server even when the model returned them.
    nif: z.string().max(20).optional().nullable(),
    customerNif: z.string().max(20).optional().nullable(),
    documentType: z.string().max(8).optional().nullable(),
    documentNumber: z.string().max(64).optional().nullable(),
    atcud: z.string().max(64).optional().nullable(),
    subtotal: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (val == null || val === "" || val === "null") return null
        const num = parseFloat(val)
        return isNaN(num) ? null : Math.round(num * 100)
      }),
    vatAmount: z
      .string()
      .optional()
      .nullable()
      .transform((val) => {
        if (val == null || val === "" || val === "null") return null
        const num = parseFloat(val)
        return isNaN(num) ? null : Math.round(num * 100)
      }),
    items: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim() === '') return []
        try {
          return JSON.parse(val)
        } catch {
          throw new z.ZodError([{ message: "Invalid items JSON", path: ["items"], code: z.ZodIssueCode.custom }])
        }
      }),
    vat_breakdown: z.any().optional(),
  })
  .catchall(z.string())
