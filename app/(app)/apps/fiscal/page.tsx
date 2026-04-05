import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { FiscalDashboard } from "./components/fiscal-dashboard"
import { BusinessRegime, getUpcomingDeadlines, getOverdueDeadlines } from "@/lib/fiscal/calendar"
import { getUserById } from "@/models/users"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Painel Fiscal",
}

export default async function FiscalPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) redirect("/enter")

  const userId = session.user.id
  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01`)
  const endDate = new Date(`${currentYear}-12-31`)

  const [transactions, user] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        issuedAt: { gte: startDate, lte: endDate },
      },
      include: { category: true },
      orderBy: { issuedAt: "desc" },
    }),
    getUserById(userId),
  ])

  const regime = (user?.businessTaxRegime as BusinessRegime) || "trabalhador_independente"
  const now = new Date()
  const upcomingDeadlines = getUpcomingDeadlines(regime, currentYear, now, 15)
  const overdueDeadlines = getOverdueDeadlines(regime, currentYear, now)

  return (
    <div className="container mx-auto p-6 max-w-6xl animate-fade-up">
      <FiscalDashboard
        transactions={transactions as any}
        year={currentYear}
        regime={regime}
        upcomingDeadlines={upcomingDeadlines}
        overdueDeadlines={overdueDeadlines}
      />
    </div>
  )
}
