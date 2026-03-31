import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"

type NoteInFolder = {
  id: string
  title: string
  content: string
  link: string | null
  tags: string[]
  date: Date
  summary?: string | null
  readingTimeMin?: number | null
}

const serializeFolder = (folder: {
  id: string
  name: string
  notes: NoteInFolder[]
}) => ({
  id: folder.id,
  title: folder.name,
  notes: folder.notes.map((note) => ({
    id: note.id,
    title: note.title,
    summary: note.summary ?? "",
    content: note.content,
    link: note.link ?? undefined,
    tags: note.tags,
    readingTimeMin: note.readingTimeMin ?? undefined,
    date: note.date.toISOString(),
  })),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let folders = await prisma.folder.findMany({
    where: { userId },
    include: { notes: { orderBy: { date: "desc" } } },
    orderBy: { name: "asc" },
  })

  if (folders.length === 0) {
    const inbox = await prisma.folder.create({
      data: {
        name: "Inbox",
        userId,
      },
      include: { notes: { orderBy: { date: "desc" } } },
    })
    folders = [inbox]
  }

  return NextResponse.json(folders.map(serializeFolder))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const title = typeof body.title === "string" ? body.title.trim() : ""

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const folder = await prisma.folder.create({
    data: {
      name: title,
      userId,
    },
    include: { notes: { orderBy: { date: "desc" } } },
  })

  return NextResponse.json(serializeFolder(folder))
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get("folderId")

  if (!folderId) {
    return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
  }

  // Проверяем что папка принадлежит пользователю
  const existingFolder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
  })

  if (!existingFolder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 })
  }

  // Нельзя удалить Inbox
  if (existingFolder.name === "Inbox") {
    return NextResponse.json({ error: "Cannot delete Inbox folder" }, { status: 403 })
  }

  // Удаляем папку (заметки удалятся каскадом)
  await prisma.folder.delete({
    where: { id: folderId },
  })

  return NextResponse.json({
    success: true,
    message: "Folder deleted",
  })
}
