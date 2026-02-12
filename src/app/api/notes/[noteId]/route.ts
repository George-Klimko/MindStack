import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function PATCH(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { noteId } = await params; 
  const payload = (await req.json()) as {
    title?: unknown
    content?: unknown
    link?: unknown
    tags?: unknown
  }

  const existingNote = await prisma.note.findFirst({
    where: { id: noteId, folder: { userId } },
  })

  if (!existingNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 })
  }

  const data: {
    title?: string
    content?: string
    link?: string | null
    tags?: string[]
  } = {}

  if (typeof payload.title === "string") data.title = payload.title.trim()
  if (typeof payload.content === "string") data.content = payload.content
  if (typeof payload.link === "string") data.link = payload.link
  if (payload.link === null) data.link = null
  if (Array.isArray(payload.tags)) {
    data.tags = payload.tags.filter((tag): tag is string => typeof tag === "string")
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const note = await prisma.note.update({
    where: { id: noteId },
    data,
  })

  return NextResponse.json({
    id: note.id,
    title: note.title,
    summary: "",
    content: note.content,
    link: note.link ?? undefined,
    tags: note.tags,
    date: note.date.toISOString(),
  })
}
