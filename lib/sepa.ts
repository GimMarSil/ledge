/**
 * SEPA pain.001.001.03 (Customer Credit Transfer Initiation) builder.
 *
 * Outputs XML accepted by all major Portuguese banks for bulk credit
 * transfer upload (homebanking → "ficheiro de pagamentos"). Conscious
 * design choices:
 *
 * - We build the XML as plain string concatenation rather than via a
 *   DOM lib. The structure is small and well-known; pulling in xmlbuilder
 *   or fast-xml-parser would be ~100 KB for ~30 lines of work.
 * - Amounts are formatted with 2 decimal places using `.` as separator
 *   (SEPA spec requires this regardless of locale).
 * - All free-text fields are XML-escaped to keep the file valid even
 *   when merchants/notes contain `<`, `>`, `&` or quotes.
 * - We emit ChrgBr=SLEV (charges shared per SEPA scheme rules).
 *
 * Caller is responsible for ensuring the debtor (company) account has
 * an IBAN and the creditor (employee personal) account has an IBAN.
 */

export type SepaTransfer = {
  endToEndId: string // <= 35 chars, no spaces
  amountCents: number
  currency: string // ISO-4217, typically "EUR"
  creditorName: string
  creditorIban: string
  remittanceInfo: string // <= 140 chars
}

export type SepaInitParams = {
  messageId: string // <= 35 chars
  initiatingPartyName: string
  debtorName: string
  debtorIban: string
  requestedExecutionDate: string // YYYY-MM-DD
  transfers: SepaTransfer[]
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
}

function xmlEscape(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch] ?? ch)
}

function fmtAmount(cents: number): string {
  // SEPA: dot decimal, 2 fraction digits.
  return (cents / 100).toFixed(2)
}

function sanitizeId(input: string, maxLen = 35): string {
  // SEPA IDs allow [A-Za-z0-9-] basically; strip anything weird and clamp.
  return input.replace(/[^A-Za-z0-9-]/g, "").slice(0, maxLen) || "ID"
}

function clampText(input: string, maxLen: number): string {
  return input.length > maxLen ? input.slice(0, maxLen) : input
}

export function buildSepaPain001(params: SepaInitParams): string {
  const totalCents = params.transfers.reduce((sum, t) => sum + t.amountCents, 0)
  const ctrlSum = fmtAmount(totalCents)
  const nbTx = params.transfers.length
  const creDtTm = new Date().toISOString().split(".")[0] // strip ms
  const msgId = sanitizeId(params.messageId)
  const pmtInfId = sanitizeId(`${params.messageId}-1`)

  const txsXml = params.transfers
    .map((t) => {
      const e2e = sanitizeId(t.endToEndId)
      const amt = fmtAmount(t.amountCents)
      const ccy = xmlEscape(t.currency || "EUR")
      const name = xmlEscape(clampText(t.creditorName, 70))
      const iban = (t.creditorIban || "").replace(/\s+/g, "").toUpperCase()
      const info = xmlEscape(clampText(t.remittanceInfo, 140))
      return `      <CdtTrfTxInf>
        <PmtId><EndToEndId>${e2e}</EndToEndId></PmtId>
        <Amt><InstdAmt Ccy="${ccy}">${amt}</InstdAmt></Amt>
        <Cdtr><Nm>${name}</Nm></Cdtr>
        <CdtrAcct><Id><IBAN>${iban}</IBAN></Id></CdtrAcct>
        <RmtInf><Ustrd>${info}</Ustrd></RmtInf>
      </CdtTrfTxInf>`
    })
    .join("\n")

  const debtorIban = (params.debtorIban || "").replace(/\s+/g, "").toUpperCase()

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${nbTx}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <InitgPty><Nm>${xmlEscape(clampText(params.initiatingPartyName, 70))}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${pmtInfId}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <BtchBookg>true</BtchBookg>
      <NbOfTxs>${nbTx}</NbOfTxs>
      <CtrlSum>${ctrlSum}</CtrlSum>
      <PmtTpInf><SvcLvl><Cd>SEPA</Cd></SvcLvl></PmtTpInf>
      <ReqdExctnDt>${params.requestedExecutionDate}</ReqdExctnDt>
      <Dbtr><Nm>${xmlEscape(clampText(params.debtorName, 70))}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${debtorIban}</IBAN></Id></DbtrAcct>
      <ChrgBr>SLEV</ChrgBr>
${txsXml}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`
}
