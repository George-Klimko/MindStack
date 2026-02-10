import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../../auth/[...nextauth]/route"


export async function PATCH(req: Request, {params}: {params: {noteId: string}}) {
    const session = getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const noteId = params.noteId
    const payload = await req.json()

    const existingNote  = await prisma.note.findFirst({
        where: {id: noteId, folder: {userId}},
    })

    if (!existingNote) return NextResponse.json({ error: "Note not found" }, { status: 404 })
    
    const data: {
        title?: string
        content?: string
        link?: string | null
        tags?: string[]
    } = {}

    if (typeof payload.title === "string") data.title = payload.title
    if (typeof payload.content === "string") data.content = payload.content
    if (typeof payload.link === "string") data.link = payload.link
    if (payload.link === null) data.link = null
    if (Array.isArray(payload.tags)) data.tags = payload.tags

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