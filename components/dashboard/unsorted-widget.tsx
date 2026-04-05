"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { File } from "@/prisma/client"
import { Cake, FilePlus } from "lucide-react"
import Link from "next/link"

export default function DashboardUnsortedWidget({ files }: { files: File[] }) {
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-base">
          <Link href="/unsorted" className="hover:text-primary transition-colors">
            {files.length > 0 ? `${files.length} ficheiros por classificar` : "Sem ficheiros por classificar"} &rarr;
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {files.slice(0, 3).map((file) => (
            <Link
              href={`/unsorted/#${file.id}`}
              key={file.id}
              className="rounded-lg p-3 bg-muted/50 hover:bg-primary/5 hover:ring-1 hover:ring-primary/20 transition-all duration-200"
            >
              <div className="flex flex-row gap-3 items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <FilePlus className="w-4 h-4 text-primary" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{file.filename}</span>
                  <span className="truncate text-xs text-muted-foreground">{file.mimetype}</span>
                </div>
              </div>
            </Link>
          ))}
          {files.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 text-sm h-full min-h-[100px] text-muted-foreground/30">
              <Cake className="w-8 h-8" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
