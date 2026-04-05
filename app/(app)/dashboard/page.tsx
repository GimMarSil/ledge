import { CompletenessWidget } from "@/components/dashboard/completeness-widget"
import { CostCenterComparison } from "@/components/dashboard/cost-center-comparison"
import DashboardDropZoneWidget from "@/components/dashboard/drop-zone-widget"
import { InsightsWidget } from "@/components/dashboard/insights-widget"
import { StatsWidget } from "@/components/dashboard/stats-widget"
import DashboardUnsortedWidget from "@/components/dashboard/unsorted-widget"
import { WelcomeWidget } from "@/components/dashboard/welcome-widget"
import { getCurrentUser } from "@/lib/auth"
import config from "@/lib/config"
import { getUnsortedFiles } from "@/models/files"
import { getSettings } from "@/models/settings"
import { getCostCenterComparison } from "@/models/stats"
import { TransactionFilters } from "@/models/transactions"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Painel",
  description: config.app.description,
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<TransactionFilters> }) {
  const filters = await searchParams
  const user = await getCurrentUser()
  const [unsortedFiles, settings, comparison] = await Promise.all([
    getUnsortedFiles(user.id),
    getSettings(user.id),
    getCostCenterComparison(user.id, filters, "EUR"),
  ])

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-7xl self-center animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardDropZoneWidget />
        </div>
        <div className="lg:col-span-1">
          <DashboardUnsortedWidget files={unsortedFiles} />
        </div>
      </div>

      {settings.is_welcome_message_hidden !== "true" && <WelcomeWidget />}

      <CompletenessWidget filters={filters} />

      <InsightsWidget filters={filters} />

      <StatsWidget filters={filters} />

      <CostCenterComparison data={comparison} defaultCurrency={settings.default_currency || "EUR"} />
    </div>
  )
}
