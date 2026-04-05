"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDownload } from "@/hooks/use-download"
import { FileText } from "lucide-react"
import { useState } from "react"

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

const periods = [
  { value: "annual", label: "Anual (Janeiro a Dezembro)" },
  { value: "q1", label: "1.º Trimestre (Jan-Mar)" },
  { value: "q2", label: "2.º Trimestre (Abr-Jun)" },
  { value: "q3", label: "3.º Trimestre (Jul-Set)" },
  { value: "q4", label: "4.�� Trimestre (Out-Dez)" },
  { value: "m01", label: "Janeiro" },
  { value: "m02", label: "Fevereiro" },
  { value: "m03", label: "Março" },
  { value: "m04", label: "Abril" },
  { value: "m05", label: "Maio" },
  { value: "m06", label: "Junho" },
  { value: "m07", label: "Julho" },
  { value: "m08", label: "Agosto" },
  { value: "m09", label: "Setembro" },
  { value: "m10", label: "Outubro" },
  { value: "m11", label: "Novembro" },
  { value: "m12", label: "Dezembro" },
]

function getPeriodDates(year: number, period: string): { startDate: string; endDate: string } {
  if (period === "annual") return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
  if (period === "q1") return { startDate: `${year}-01-01`, endDate: `${year}-03-31` }
  if (period === "q2") return { startDate: `${year}-04-01`, endDate: `${year}-06-30` }
  if (period === "q3") return { startDate: `${year}-07-01`, endDate: `${year}-09-30` }
  if (period === "q4") return { startDate: `${year}-10-01`, endDate: `${year}-12-31` }

  const month = parseInt(period.replace("m", ""))
  const lastDay = new Date(year, month, 0).getDate()
  const mm = String(month).padStart(2, "0")
  return { startDate: `${year}-${mm}-01`, endDate: `${year}-${mm}-${lastDay}` }
}

export function SAFTExportDialog({ children }: { children?: React.ReactNode }) {
  const [year, setYear] = useState(String(currentYear))
  const [period, setPeriod] = useState("annual")
  const { download, isDownloading } = useDownload({ onError: () => {} })

  const handleExport = async () => {
    const { startDate, endDate } = getPeriodDates(parseInt(year), period)
    const url = `/export/saft?year=${year}&startDate=${startDate}&endDate=${endDate}`
    await download(url, `SAF-T_${year}.xml`)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Exportar SAF-T (PT)
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Exportar SAF-T (PT)</DialogTitle>
          <DialogDescription>
            Gerar ficheiro SAF-T conforme Portaria 321-A/2007 para submissão à Autoridade Tributária
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Ano Fiscal</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <strong>Nota:</strong> Apenas transações com tipo de documento fiscal (FT, FR, NC, ND, RC) serão incluídas
            no ficheiro SAF-T. Certifique-se de que os dados fiscais estão preenchidos.
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleExport} disabled={isDownloading}>
            {isDownloading ? "A gerar SAF-T..." : "Transferir SAF-T XML"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
