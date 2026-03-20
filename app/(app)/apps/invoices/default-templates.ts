import { SettingsMap } from "@/models/settings"
import { User } from "@/prisma/client"
import { addDays, format } from "date-fns"
import { InvoiceFormData } from "./components/invoice-page"

export interface InvoiceTemplate {
  id?: string
  name: string
  formData: InvoiceFormData
}

export default function defaultTemplates(user: User, settings: SettingsMap): InvoiceTemplate[] {
  const defaultTemplate: InvoiceFormData = {
    title: "FATURA",
    businessLogo: user.businessLogo,
    invoiceNumber: "",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    currency: settings.default_currency || "EUR",
    companyDetails: `${user.businessName}\n${user.businessAddress || ""}`,
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
  }

  const ptReducedVatTemplate: InvoiceFormData = {
    title: "FATURA",
    businessLogo: user.businessLogo,
    invoiceNumber: "",
    date: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    currency: "EUR",
    companyDetails: `${user.businessName}\n${user.businessAddress || ""}`,
    companyDetailsLabel: "Emitente",
    billTo: "",
    billToLabel: "Cliente",
    items: [{ name: "", subtitle: "", showSubtitle: false, quantity: 1, unitPrice: 0, subtotal: 0 }],
    taxIncluded: true,
    additionalTaxes: [{ name: "IVA", rate: 6, amount: 0 }],
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
  }

  return [
    { name: "Predefinido (IVA 23%)", formData: defaultTemplate },
    { name: "IVA Reduzido (6%)", formData: ptReducedVatTemplate },
  ]
}
