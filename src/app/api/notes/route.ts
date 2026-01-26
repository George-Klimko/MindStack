import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notes = await prisma.note.findMany({
    where: { folder: { userId: session.user.id } },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // ожидаем { folderId, title, content, tags, link }
  const note = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content || "",
      link: body.link || "",
      tags: body.tags || [],
      folderId: body.folderId,
    },
  })

  return NextResponse.json(note)
}
