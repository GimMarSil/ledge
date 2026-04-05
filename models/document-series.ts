import { prisma } from "@/lib/db"
import { DocumentSeries } from "@/prisma/client"
import { cache } from "react"

export const getDocumentSeries = cache(async (userId: string): Promise<DocumentSeries[]> => {
  return await prisma.documentSeries.findMany({
    where: { userId },
    orderBy: [{ documentType: "asc" }, { year: "desc" }],
  })
})

export const getActiveSeriesForType = cache(
  async (userId: string, documentType: string, year: number): Promise<DocumentSeries | null> => {
    return await prisma.documentSeries.findFirst({
      where: { userId, documentType, year, isActive: true },
    })
  }
)

export async function getOrCreateSeries(
  userId: string,
  documentType: string,
  year: number,
  series: string = "A"
): Promise<DocumentSeries> {
  return await prisma.documentSeries.upsert({
    where: {
      userId_documentType_series_year: {
        userId,
        documentType,
        series,
        year,
      },
    },
    update: {},
    create: {
      userId,
      documentType,
      series,
      year,
      lastNumber: 0,
      isActive: true,
    },
  })
}

export async function getNextNumber(
  userId: string,
  documentType: string,
  year: number,
  series: string = "A"
): Promise<{ series: DocumentSeries; number: number }> {
  // Incremento atómico via Prisma transaction
  const updated = await prisma.$transaction(async (tx) => {
    const docSeries = await tx.documentSeries.upsert({
      where: {
        userId_documentType_series_year: {
          userId,
          documentType,
          series,
          year,
        },
      },
      update: {},
      create: {
        userId,
        documentType,
        series,
        year,
        lastNumber: 0,
        isActive: true,
      },
    })

    const updatedSeries = await tx.documentSeries.update({
      where: { id: docSeries.id },
      data: { lastNumber: docSeries.lastNumber + 1 },
    })

    return updatedSeries
  })

  return { series: updated, number: updated.lastNumber }
}

export function formatDocumentNumber(documentType: string, series: string, number: number): string {
  return `${documentType} ${series}/${number}`
}

export async function updateSeriesValidationCode(
  seriesId: string,
  atValidationCode: string
): Promise<DocumentSeries> {
  return await prisma.documentSeries.update({
    where: { id: seriesId },
    data: { atValidationCode },
  })
}
