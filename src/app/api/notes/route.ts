import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"

type CreateNoteBody = {
  folderId?: unknown
  title?: unknown
  content?: unknown
  link?: unknown
  tags?: unknown
}

const serializeNote = (note: {
  id: string
  title: string
  content: string
  link: string | null
  tags: string[]
  date: Date
}) => ({
  id: note.id,
  title: note.title,
  summary: "",
  content: note.content,
  link: note.link ?? undefined,
  tags: note.tags,
  date: note.date.toISOString(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const notes = await prisma.note.findMany({
    where: { folder: { userId } },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(notes.map(serializeNote))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await req.json()) as CreateNoteBody

  const folderId = typeof body.folderId === "string" ? body.folderId : ""
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const content = typeof body.content === "string" ? body.content : ""
  const link = typeof body.link === "string" ? body.link : null
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : []

  if (!folderId || !title) return NextResponse.json({ error: "Folder and title are required" }, { status: 400 })

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  })
  // ожидаем { folderId, title, content, tags, link }
  const note = await prisma.note.create({
    data: {
      title,
      content,
      link,
      tags,
      folderId,
    },
  })

  return NextResponse.json(serializeNote(note))
}

