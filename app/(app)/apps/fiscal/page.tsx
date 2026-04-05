import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { FiscalDashboard } from "./components/fiscal-dashboard"

export default async function FiscalPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect("/enter")

  const userId = session.user.id
  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01`)
  const endDate = new Date(`${currentYear}-12-31`)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      issuedAt: { gte: startDate, lte: endDate },
    },
    include: { category: true },
    orderBy: { issuedAt: "desc" },
  })

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Painel Fiscal</h1>
        <p className="text-muted-foreground mt-1">
          Resumo IVA e dados fiscais para {currentYear}
        </p>
      </div>
      <FiscalDashboard transactions={transactions as any} year={currentYear} />
    </div>
  )
}
