import { BatchEditor } from "@/components/import/batch-editor"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getCategories } from "@/models/categories"
import { getProjects } from "@/models/projects"
import { getTreasuryAccounts } from "@/models/treasury-accounts"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Lote e-Fatura",
}

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>
}) {
  const { batchId } = await params
  const user = await getCurrentUser()
  const batch = await prisma.importBatch.findFirst({
    where: { id: batchId, userId: user.id },
  })
  if (!batch) notFound()

  const [transactions, categories, projects, treasuryAccounts] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, importBatchId: batchId, deletedAt: null },
      orderBy: { issuedAt: "desc" },
      include: { category: true, project: true, treasuryAccount: true },
    }),
    getCategories(user.id),
    getProjects(user.id),
    getTreasuryAccounts(user.id),
  ])

  return (
    <BatchEditor
      batch={{
        id: batch.id,
        filename: batch.filename,
        createdAt: batch.createdAt,
        importedCount: batch.importedCount,
        skippedCount: batch.skippedCount,
      }}
      transactions={transactions}
      categories={categories}
      projects={projects}
      treasuryAccounts={treasuryAccounts}
    />
  )
}
