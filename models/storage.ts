"use server"

import { prisma } from "@/lib/db"
import {
  fileExists,
  getDirectorySize,
  getUserPreviewsDirectory,
  getUserUploadsDirectory,
  safePathJoin,
} from "@/lib/files"
import { getUserById, updateUser } from "@/models/users"
import { unlink } from "fs/promises"
import path from "path"

/**
 * Walk the user's File rows, detect any whose row exists but is not
 * referenced by any (non-deleted) Transaction.files JSON array, and
 * delete them — both the DB row and the file on disk.
 *
 * Also drops cached preview webp files that have no matching File row.
 *
 * Recalculates User.storageUsed at the end so the plan card on the
 * profile reflects the freed space immediately.
 */
export async function reclaimStorage(userId: string): Promise<{ purgedFiles: number; freedBytes: number }> {
  const user = await getUserById(userId)
  if (!user) return { purgedFiles: 0, freedBytes: 0 }

  const files = await prisma.file.findMany({ where: { userId } })

  // Pull every file id referenced by *any* live transaction in one go.
  // This is faster than asking per file and works whether the row's
  // `files` array contains zero, one or many ids.
  const live = await prisma.transaction.findMany({
    where: { userId, deletedAt: null },
    select: { files: true },
  })
  const referenced = new Set<string>()
  for (const tx of live) {
    if (Array.isArray(tx.files)) {
      for (const id of tx.files as string[]) referenced.add(id)
    }
  }

  let purgedFiles = 0
  for (const file of files) {
    if (referenced.has(file.id)) continue
    // Try to delete the on-disk file. Best-effort — if it's already
    // gone we still want to drop the row so storage stays consistent.
    try {
      const userDir = getUserUploadsDirectory(user)
      const fullPath = safePathJoin(userDir, file.path)
      if (await fileExists(fullPath)) {
        await unlink(fullPath)
      }
    } catch {
      // ignore filesystem errors; the DB delete below is what counts
    }
    // Same for the cached webp previews (one per page).
    try {
      const previews = getUserPreviewsDirectory(user)
      for (let i = 1; i <= 20; i++) {
        const p = safePathJoin(previews, `${path.basename(file.path, path.extname(file.path))}.${i}.webp`)
        if (await fileExists(p)) await unlink(p)
        else break
      }
    } catch {
      // best-effort
    }
    await prisma.file.delete({ where: { id: file.id } })
    purgedFiles++
  }

  const before = user.storageUsed
  const used = await getDirectorySize(getUserUploadsDirectory(user)).catch(() => 0)
  await updateUser(userId, { storageUsed: used })
  return { purgedFiles, freedBytes: Math.max(0, before - used) }
}
