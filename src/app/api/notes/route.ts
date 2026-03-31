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
  summary?: unknown
  readingTimeMin?: unknown
}

type NoteWithFolder = {
  id: string
  title: string
  content: string
  link: string | null
  tags: string[]
  date: Date
  summary?: string | null
  readingTimeMin?: number | null
  folder: {
    id: string
    name: string
  }
}

const serializeNote = (note: NoteWithFolder) => ({
  id: note.id,
  title: note.title,
  summary: note.summary ?? "",
  content: note.content,
  link: note.link ?? undefined,
  tags: note.tags,
  readingTimeMin: note.readingTimeMin ?? undefined,
  date: note.date.toISOString(),
  folder: note.folder,
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Получаем query параметры для фильтрации
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") || ""
  const tag = searchParams.get("tag") || ""
  const folderId = searchParams.get("folderId") || ""

  // Базовый where для фильтрации по пользователю
  const where: any = {
    folder: { userId },
  }

  // Поиск по title, content, summary
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
    ]
  }

  // Фильтр по тегу
  if (tag) {
    where.tags = { has: tag }
  }

  // Фильтр по папке
  if (folderId) {
    where.folderId = folderId
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
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
  const summary = typeof body.summary === "string" ? body.summary : null
  const readingTimeMin =
    typeof body.readingTimeMin === "number" && body.readingTimeMin > 0 ? body.readingTimeMin : null

  if (!folderId || !title) return NextResponse.json({ error: "Folder and title are required" }, { status: 400 })

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    select: { id: true },
  })
  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 })

  const note = await prisma.note.create({
    data: {
      title,
      content,
      link,
      tags,
      summary,
      readingTimeMin,
      folderId: folder.id,
    },
    include: {
      folder: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return NextResponse.json(serializeNote(note))
}
