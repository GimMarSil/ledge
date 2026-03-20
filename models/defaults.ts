import { prisma } from "@/lib/db"

export const DEFAULT_PROMPT_ANALYSE_NEW_FILE = `És um assistente de contabilidade e análise de faturas portuguesas. Extrai a seguinte informação da fatura fornecida:

{fields}

Tenta também extrair "items": todos os produtos ou itens separados da fatura. Para CADA item, extrai obrigatoriamente: name, description, total (valor com IVA), currencyCode, vat_rate (taxa de IVA em %), vat_amount (valor do IVA do item).

As categorias são:

{categories}

E os projetos são:

{projects}

REGRAS DE IVA PORTUGUÊS:
- Em Portugal existem 3 taxas de IVA: 6% (reduzida), 13% (intermédia) e 23% (normal)
- Regiões autónomas: Açores (4%, 9%, 18%) e Madeira (5%, 12%, 22%)
- ATENÇÃO: Uma fatura pode ter itens com taxas de IVA DIFERENTES (taxas mistas)
- Para cada item, identifica a taxa de IVA correta individualmente
- O campo "vat_breakdown" deve conter o desdobramento do IVA por taxa, como array JSON: [{"rate": 23, "base": 100.00, "vat": 23.00}, {"rate": 6, "base": 50.00, "vat": 3.00}]
- O campo "subtotal" é a base tributável total (soma de todas as bases, valor sem IVA)
- O campo "vat" é o valor total de IVA (soma de todos os montantes de IVA)
- O campo "total" é o valor total COM IVA

REGRAS IMPORTANTES:
- Não incluas qualquer outro texto na tua resposta!
- Se não encontrares algo, deixa em branco, NUNCA inventes informação
- Devolve apenas um objeto
- Extrai o NIF/NIPC (número de identificação fiscal) do fornecedor se disponível
- Se a fatura tiver tabela de resumo de IVA, usa esses valores para o vat_breakdown
- Verifica que: subtotal + vat = total (tolerância de 0.01€ por arredondamentos)`

export const DEFAULT_SETTINGS = [
  {
    code: "default_currency",
    name: "Moeda Predefinida",
    description: "Não altere esta definição se já tiver transações multi-moeda. Não serão recalculadas.",
    value: "EUR",
  },
  {
    code: "default_category",
    name: "Categoria Predefinida",
    description: "",
    value: "outros",
  },
  {
    code: "default_project",
    name: "Projeto Predefinido",
    description: "",
    value: "pessoal",
  },
  {
    code: "default_type",
    name: "Tipo Predefinido",
    description: "",
    value: "expense",
  },
  {
    code: "prompt_analyse_new_file",
    name: "Prompt para Análise de Transação",
    description: "Variáveis permitidas: {fields}, {categories}, {categories.code}, {projects}, {projects.code}",
    value: DEFAULT_PROMPT_ANALYSE_NEW_FILE,
  },
  {
    code: "is_welcome_message_hidden",
    name: "Não mostrar mensagem de boas-vindas no painel",
    description: "",
    value: "false",
  },
]

export const DEFAULT_CATEGORIES = [
  {
    code: "publicidade",
    name: "Publicidade",
    color: "#882727",
    llm_prompt: "publicidade, anúncios, promoções, marketing",
  },
  {
    code: "mercadorias",
    name: "Mercadorias e Brindes",
    color: "#882727",
    llm_prompt: "brindes, merchandising, artigos promocionais",
  },
  { code: "donativos", name: "Ofertas e Donativos", color: "#1e6359", llm_prompt: "donativos, ofertas, caridade" },
  { code: "equipamento", name: "Equipamento e Ferramentas", color: "#c69713", llm_prompt: "equipamento, ferramentas, máquinas" },
  { code: "eventos", name: "Eventos e Conferências", color: "#ff8b32", llm_prompt: "eventos, conferências, feiras" },
  { code: "alimentacao", name: "Alimentação e Bebidas", color: "#d40e70", llm_prompt: "alimentação, bebidas, refeições de negócios" },
  { code: "seguros", name: "Seguros", color: "#050942", llm_prompt: "seguros, saúde, vida" },
  { code: "fatura", name: "Fatura", color: "#064e85", llm_prompt: "fatura, conta, recibo" },
  { code: "comunicacoes", name: "Comunicações", color: "#0e7d86", llm_prompt: "telemóvel, internet, telefone, comunicações" },
  { code: "escritorio", name: "Material de Escritório", color: "#59b0b9", llm_prompt: "escritório, material, papelaria" },
  { code: "servicos_online", name: "Serviços Online", color: "#8753fb", llm_prompt: "serviços online, SaaS, subscrições" },
  { code: "rendas", name: "Rendas e Alugueres", color: "#050942", llm_prompt: "renda, aluguer, arrendamento" },
  {
    code: "formacao",
    name: "Formação e Educação",
    color: "#ee5d6c",
    llm_prompt: "formação, educação, desenvolvimento profissional",
  },
  { code: "salarios", name: "Salários", color: "#ce4993", llm_prompt: "salários, vencimentos, ordenados" },
  { code: "taxas", name: "Taxas e Impostos", color: "#6a0d83", llm_prompt: "taxas, impostos, multas, penalizações" },
  { code: "viagens", name: "Despesas de Viagem", color: "#fb9062", llm_prompt: "viagens, alojamento, deslocações" },
  { code: "servicos_publicos", name: "Serviços Públicos", color: "#af7e2e", llm_prompt: "eletricidade, água, gás, contas" },
  {
    code: "transportes",
    name: "Transportes",
    color: "#800000",
    llm_prompt: "transportes, combustível, aluguer de veículos, portagens",
  },
  { code: "software", name: "Software", color: "#2b5a1d", llm_prompt: "software, licenças" },
  { code: "outros", name: "Outros", color: "#121216", llm_prompt: "outros, diversos" },
]

export const DEFAULT_PROJECTS = [{ code: "pessoal", name: "Pessoal", llm_prompt: "pessoal", color: "#1e202b" }]

export const DEFAULT_CURRENCIES = [
  { code: "USD", name: "$" },
  { code: "EUR", name: "€" },
  { code: "GBP", name: "£" },
  { code: "INR", name: "₹" },
  { code: "AUD", name: "$" },
  { code: "CAD", name: "$" },
  { code: "SGD", name: "$" },
  { code: "CHF", name: "Fr" },
  { code: "MYR", name: "RM" },
  { code: "JPY", name: "¥" },
  { code: "CNY", name: "¥" },
  { code: "NZD", name: "$" },
  { code: "THB", name: "฿" },
  { code: "HUF", name: "Ft" },
  { code: "AED", name: "د.إ" },
  { code: "HKD", name: "$" },
  { code: "MXN", name: "$" },
  { code: "ZAR", name: "R" },
  { code: "PHP", name: "₱" },
  { code: "SEK", name: "kr" },
  { code: "IDR", name: "Rp" },
  { code: "BRL", name: "R$" },
  { code: "SAR", name: "﷼" },
  { code: "TRY", name: "₺" },
  { code: "KES", name: "KSh" },
  { code: "KRW", name: "₩" },
  { code: "EGP", name: "£" },
  { code: "IQD", name: "ع.د" },
  { code: "NOK", name: "kr" },
  { code: "KWD", name: "د.ك" },
  { code: "RUB", name: "₽" },
  { code: "DKK", name: "kr" },
  { code: "PKR", name: "₨" },
  { code: "ILS", name: "₪" },
  { code: "PLN", name: "zł" },
  { code: "QAR", name: "﷼" },
  { code: "OMR", name: "﷼" },
  { code: "COP", name: "$" },
  { code: "CLP", name: "$" },
  { code: "TWD", name: "NT$" },
  { code: "ARS", name: "$" },
  { code: "CZK", name: "Kč" },
  { code: "VND", name: "₫" },
  { code: "MAD", name: "د.م." },
  { code: "JOD", name: "د.ا" },
  { code: "BHD", name: ".د.ب" },
  { code: "XOF", name: "CFA" },
  { code: "LKR", name: "₨" },
  { code: "UAH", name: "₴" },
  { code: "NGN", name: "₦" },
  { code: "TND", name: "د.ت" },
  { code: "UGX", name: "USh" },
  { code: "RON", name: "lei" },
  { code: "BDT", name: "৳" },
  { code: "PEN", name: "S/" },
  { code: "GEL", name: "₾" },
  { code: "XAF", name: "FCFA" },
  { code: "FJD", name: "$" },
  { code: "VEF", name: "Bs" },
  { code: "VES", name: "Bs.S" },
  { code: "BYN", name: "Br" },
  { code: "UZS", name: "лв" },
  { code: "BGN", name: "лв" },
  { code: "DZD", name: "د.ج" },
  { code: "IRR", name: "﷼" },
  { code: "DOP", name: "RD$" },
  { code: "ISK", name: "kr" },
  { code: "CRC", name: "₡" },
  { code: "SYP", name: "£" },
  { code: "JMD", name: "J$" },
  { code: "LYD", name: "ل.د" },
  { code: "GHS", name: "₵" },
  { code: "MUR", name: "₨" },
  { code: "AOA", name: "Kz" },
  { code: "UYU", name: "$U" },
  { code: "AFN", name: "؋" },
  { code: "LBP", name: "ل.ل" },
  { code: "XPF", name: "₣" },
  { code: "TTD", name: "TT$" },
  { code: "TZS", name: "TSh" },
  { code: "ALL", name: "Lek" },
  { code: "XCD", name: "$" },
  { code: "GTQ", name: "Q" },
  { code: "NPR", name: "₨" },
  { code: "BOB", name: "Bs." },
  { code: "ZWD", name: "Z$" },
  { code: "BBD", name: "$" },
  { code: "CUC", name: "$" },
  { code: "LAK", name: "₭" },
  { code: "BND", name: "$" },
  { code: "BWP", name: "P" },
  { code: "HNL", name: "L" },
  { code: "PYG", name: "₲" },
  { code: "ETB", name: "Br" },
  { code: "NAD", name: "$" },
  { code: "PGK", name: "K" },
  { code: "SDG", name: "ج.س." },
  { code: "MOP", name: "MOP$" },
  { code: "BMD", name: "$" },
  { code: "NIO", name: "C$" },
  { code: "BAM", name: "KM" },
  { code: "KZT", name: "₸" },
  { code: "PAB", name: "B/." },
  { code: "GYD", name: "$" },
  { code: "YER", name: "﷼" },
  { code: "MGA", name: "Ar" },
  { code: "KYD", name: "$" },
  { code: "MZN", name: "MT" },
  { code: "RSD", name: "дин." },
  { code: "SCR", name: "₨" },
  { code: "AMD", name: "֏" },
  { code: "AZN", name: "₼" },
  { code: "SBD", name: "$" },
  { code: "SLL", name: "Le" },
  { code: "TOP", name: "T$" },
  { code: "BZD", name: "BZ$" },
  { code: "GMD", name: "D" },
  { code: "MWK", name: "MK" },
  { code: "BIF", name: "FBu" },
  { code: "HTG", name: "G" },
  { code: "SOS", name: "S" },
  { code: "GNF", name: "FG" },
  { code: "MNT", name: "₮" },
  { code: "MVR", name: "Rf" },
  { code: "CDF", name: "FC" },
  { code: "STN", name: "Db" },
  { code: "TJS", name: "ЅМ" },
  { code: "KPW", name: "₩" },
  { code: "KGS", name: "лв" },
  { code: "LRD", name: "$" },
  { code: "LSL", name: "L" },
  { code: "MMK", name: "K" },
  { code: "GIP", name: "£" },
  { code: "MDL", name: "L" },
  { code: "CUP", name: "₱" },
  { code: "KHR", name: "៛" },
  { code: "MKD", name: "ден" },
  { code: "VUV", name: "VT" },
  { code: "ANG", name: "ƒ" },
  { code: "MRU", name: "UM" },
  { code: "SZL", name: "L" },
  { code: "CVE", name: "$" },
  { code: "SRD", name: "$" },
  { code: "SVC", name: "$" },
  { code: "BSD", name: "$" },
  { code: "RWF", name: "R₣" },
  { code: "AWG", name: "ƒ" },
  { code: "BTN", name: "Nu." },
  { code: "DJF", name: "Fdj" },
  { code: "KMF", name: "CF" },
  { code: "ERN", name: "Nfk" },
  { code: "FKP", name: "£" },
  { code: "SHP", name: "£" },
  { code: "WST", name: "WS$" },
  { code: "JEP", name: "£" },
  { code: "TMT", name: "m" },
  { code: "GGP", name: "£" },
  { code: "IMP", name: "£" },
  { code: "TVD", name: "$" },
  { code: "ZMW", name: "ZK" },
  { code: "ADA", name: "Crypto" },
  { code: "BCH", name: "Crypto" },
  { code: "BTC", name: "Crypto" },
  { code: "CLF", name: "UF" },
  { code: "CNH", name: "¥" },
  { code: "DOGE", name: "Crypto" },
  { code: "DOT", name: "Crypto" },
  { code: "ETH", name: "Crypto" },
  { code: "LINK", name: "Crypto" },
  { code: "LTC", name: "Crypto" },
  { code: "LUNA", name: "Crypto" },
  { code: "SLE", name: "Le" },
  { code: "UNI", name: "Crypto" },
  { code: "XBT", name: "Crypto" },
  { code: "XLM", name: "Crypto" },
  { code: "XRP", name: "Crypto" },
  { code: "ZWL", name: "$" },
]

export const DEFAULT_FIELDS = [
  {
    code: "name",
    name: "Nome",
    type: "string",
    llm_prompt: "nome legível, resumo do que foi comprado ou pago na fatura",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "description",
    name: "Descrição",
    type: "string",
    llm_prompt: "descrição da transação",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "merchant",
    name: "Fornecedor",
    type: "string",
    llm_prompt: "nome do fornecedor/comerciante, usar a ortografia e língua originais",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "issuedAt",
    name: "Data de Emissão",
    type: "string",
    llm_prompt: "data de emissão (formato YYYY-MM-DD)",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "projectCode",
    name: "Projeto",
    type: "string",
    llm_prompt: "código do projeto, um de: {projects.code}",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "categoryCode",
    name: "Categoria",
    type: "string",
    llm_prompt: "código da categoria, um de: {categories.code}",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "files",
    name: "Ficheiros",
    type: "string",
    llm_prompt: "",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "total",
    name: "Total",
    type: "number",
    llm_prompt: "valor total da transação",
    isVisibleInList: true,
    isVisibleInAnalysis: true,
    isRequired: true,
    isExtra: false,
  },
  {
    code: "currencyCode",
    name: "Moeda",
    type: "string",
    llm_prompt: "código da moeda, código ISO 4217 de três letras como USD, EUR, incluindo códigos crypto como BTC, ETH, etc",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "convertedTotal",
    name: "Total Convertido",
    type: "number",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "convertedCurrencyCode",
    name: "Moeda de Conversão",
    type: "string",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "type",
    name: "Tipo",
    type: "string",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "note",
    name: "Nota",
    type: "string",
    llm_prompt: "",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
  {
    code: "nif",
    name: "NIF do Fornecedor",
    type: "string",
    llm_prompt: "NIF ou NIPC (número de identificação fiscal) do fornecedor, formato português com 9 dígitos",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "subtotal",
    name: "Subtotal (Base Tributável)",
    type: "number",
    llm_prompt: "base tributável total (valor sem IVA, soma de todas as bases de incidência)",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "vat",
    name: "Total IVA",
    type: "number",
    llm_prompt: "valor total do IVA na moeda da fatura (soma de todos os montantes de IVA de todas as taxas)",
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "vat_rate",
    name: "Taxa de IVA",
    type: "number",
    llm_prompt: "taxa de IVA predominante em percentagem. Se houver taxas mistas (ex: 6% e 23% na mesma fatura), indica a taxa mais alta. Em Portugal Continental: 6%, 13% ou 23%. Açores: 4%, 9%, 18%. Madeira: 5%, 12%, 22%",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "vat_breakdown",
    name: "Desdobramento IVA",
    type: "string",
    llm_prompt: 'desdobramento do IVA por taxa como array JSON. Exemplo: [{"rate":23,"base":100.00,"vat":23.00},{"rate":6,"base":50.00,"vat":3.00}]. Cada objeto tem: rate (taxa %), base (base tributável), vat (valor IVA). Se a fatura tiver resumo de IVA, usa esses valores. Se não, calcula a partir dos itens',
    isVisibleInList: false,
    isVisibleInAnalysis: true,
    isRequired: false,
    isExtra: true,
  },
  {
    code: "text",
    name: "Texto Extraído",
    type: "string",
    llm_prompt: "extrair todo o texto reconhecido da fatura",
    isVisibleInList: false,
    isVisibleInAnalysis: false,
    isRequired: false,
    isExtra: false,
  },
]

export async function createUserDefaults(userId: string) {
  // Default projects
  for (const project of DEFAULT_PROJECTS) {
    await prisma.project.upsert({
      where: { userId_code: { code: project.code, userId } },
      update: { name: project.name, color: project.color, llm_prompt: project.llm_prompt },
      create: { ...project, userId },
    })
  }

  // Default categories
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_code: { code: category.code, userId } },
      update: { name: category.name, color: category.color, llm_prompt: category.llm_prompt },
      create: { ...category, userId },
    })
  }

  // Default currencies
  for (const currency of DEFAULT_CURRENCIES) {
    await prisma.currency.upsert({
      where: { userId_code: { code: currency.code, userId } },
      update: { name: currency.name },
      create: { ...currency, userId },
    })
  }

  // Default fields
  for (const field of DEFAULT_FIELDS) {
    await prisma.field.upsert({
      where: { userId_code: { code: field.code, userId } },
      update: {
        name: field.name,
        type: field.type,
        llm_prompt: field.llm_prompt,
        isVisibleInList: field.isVisibleInList,
        isVisibleInAnalysis: field.isVisibleInAnalysis,
        isRequired: field.isRequired,
        isExtra: field.isExtra,
      },
      create: { ...field, userId },
    })
  }

  // Default settings
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.setting.upsert({
      where: { userId_code: { code: setting.code, userId } },
      update: { name: setting.name, description: setting.description, value: setting.value },
      create: { ...setting, userId },
    })
  }
}

export async function isDatabaseEmpty(userId: string) {
  const fieldsCount = await prisma.field.count({ where: { userId } })
  return fieldsCount === 0
}
