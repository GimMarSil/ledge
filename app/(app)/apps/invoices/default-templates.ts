import { SettingsMap } from "@/models/settings"
import { User } from "@/prisma/client"
import { addDays, format } from "date-fns"
import { InvoiceFormData } from "./components/invoice-page"

export interface InvoiceTemplate {
  id?: string
  name: string
  formData: InvoiceFormData
}

function baseTemplate(user: User, settings: SettingsMap): InvoiceFormData {
  const nifLine = user.businessNif ? `\nNIF: ${user.businessNif}` : ""
  return {
    title: "FATURA",
    businessLogo: user.businessLogo,
    invoiceNumber: "",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    currency: settings.default_currency || "EUR",
    companyDetails: `${user.businessName}\n${user.businessAddress || ""}${nifLine}`,
    companyDetailsLabel: "Emitente",
    billTo: "",
    billToLabel: "Cliente",
    items: [{ name: "", subtitle: "", showSubtitle: false, quantity: 1, unitPrice: 0, subtotal: 0 }],
    taxIncluded: true,
    additionalTaxes: [{ name: "IVA", rate: 23, amount: 0 }],
    additionalFees: [],
    notes: "",
    bankDetails: user.businessBankDetails || "",
    issueDateLabel: "Data de Emissão",
    dueDateLabel: "Data de Vencimento",
    itemLabel: "Artigo",
    quantityLabel: "Quantidade",
    unitPriceLabel: "Preço Unitário",
    subtotalLabel: "Subtotal",
    summarySubtotalLabel: "Subtotal:",
    summaryTotalLabel: "Total:",
    documentType: "FT",
    issuerNif: user.businessNif || "",
    customerNif: "",
  }
}

export default function defaultTemplates(user: User, settings: SettingsMap): InvoiceTemplate[] {
  const ft23 = baseTemplate(user, settings)

  const ft13: InvoiceFormData = {
    ...baseTemplate(user, settings),
    additionalTaxes: [{ name: "IVA", rate: 13, amount: 0 }],
  }

  const ft6: InvoiceFormData = {
    ...baseTemplate(user, settings),
    additionalTaxes: [{ name: "IVA", rate: 6, amount: 0 }],
  }

  const fr23: InvoiceFormData = {
    ...baseTemplate(user, settings),
    title: "FATURA-RECIBO",
    documentType: "FR",
    notes: "Documento com quitação. O pagamento foi efetuado na data de emissão.",
  }

  const nc: InvoiceFormData = {
    ...baseTemplate(user, settings),
    title: "NOTA DE CRÉDITO",
    documentType: "NC",
    additionalTaxes: [{ name: "IVA", rate: 23, amount: 0 }],
    notes: "Nota de crédito referente a fatura nº ___.",
  }

  const isento: InvoiceFormData = {
    ...baseTemplate(user, settings),
    title: "FATURA",
    additionalTaxes: [{ name: "IVA", rate: 0, amount: 0 }],
    exemptionReason: "IVA - regime de isenção (art. 53.º do CIVA)",
    notes: "IVA - regime de isenção (art. 53.º do CIVA)",
  }

  return [
    { name: "FT - Fatura (IVA 23%)", formData: ft23 },
    { name: "FT - Fatura (IVA 13%)", formData: ft13 },
    { name: "FT - Fatura (IVA 6%)", formData: ft6 },
    { name: "FR - Fatura-Recibo (IVA 23%)", formData: fr23 },
    { name: "NC - Nota de Crédito", formData: nc },
    { name: "FT - Isento (art. 53.º)", formData: isento },
  ]
}
