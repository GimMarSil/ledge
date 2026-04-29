import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/auth"
import { getCategories } from "@/models/categories"
import { getCurrencies } from "@/models/currencies"
import { getProjects } from "@/models/projects"
import { getSettings } from "@/models/settings"
import { getTreasuryAccounts } from "@/models/treasury-accounts"
import TransactionCreateForm from "./create"

export async function NewTransactionDialog({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const categories = await getCategories(user.id)
  const currencies = await getCurrencies(user.id)
  const settings = await getSettings(user.id)
  const projects = await getProjects(user.id)
  const treasuryAccounts = await getTreasuryAccounts(user.id)

  return (
    <Dialog>
      {/* asChild merges trigger props onto the caller's child. The caller is
          responsible for passing a styled element (e.g. <Button>). Wrapping
          another <Button> here caused button-inside-button hydration errors. */}
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Nova Transação</DialogTitle>
          <DialogDescription>Criar uma nova transação</DialogDescription>
        </DialogHeader>

        <TransactionCreateForm
          categories={categories}
          currencies={currencies}
          settings={settings}
          projects={projects}
          treasuryAccounts={treasuryAccounts}
        />
      </DialogContent>
    </Dialog>
  )
}
