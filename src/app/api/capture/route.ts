import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"
import { generateSummaryAndTags } from "@/app/actions"

const JINA_TIMEOUT_MS = 15000

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

function calculateReadingTimeMin(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

function extractOgFromHtml(html: string): { title: string; description: string } {
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i)
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i)
  const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)

  const title = ogTitleMatch?.[1] ?? titleTagMatch?.[1]
  const description = ogDescMatch?.[1] ?? ""

  return {
    title: (typeof title === "string" ? decodeHtmlEntities(title.trim()) : "") || "Без названия",
    description: typeof description === "string" ? decodeHtmlEntities(description.trim()) : "",
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

async function fetchWithJina(url: string): Promise<{ title: string; content: string }> {
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS)

  try {
    const res = await fetch(jinaUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Jina error: ${res.status}`)
    }

    const data = (await res.json()) as { title?: string; content?: string }
    const title = typeof data.title === "string" ? data.title.trim() || "Без названия" : "Без названия"
    const content = typeof data.content === "string" ? data.content : ""

    if (content.length >= 50) {
      return { title, content }
    }

    const fallback = await fetchOgFallback(url)
    return {
      title: fallback.title || title,
      content: content || fallback.description,
    }
  } catch (err) {
    clearTimeout(timeout)
    const fallback = await fetchOgFallback(url)
    if (fallback.title || fallback.description) {
      return {
        title: fallback.title,
        content: fallback.description,
      }
    }
    throw err
  }
}

async function fetchOgFallback(url: string): Promise<{ title: string; description: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MindStack/1.0)",
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const html = await res.text()
    return extractOgFromHtml(html)
  } catch {
    clearTimeout(timeout)
    return { title: "Без названия", description: "" }
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { url?: unknown }
  try {
    body = (await req.json()) as { url?: unknown }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const url = typeof body.url === "string" ? body.url.trim() : ""
  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ error: "Valid URL is required" }, { status: 400 })
  }

  try {
    const { title: scrapedTitle, content } = await fetchWithJina(url)
    console.log("CONTENT LENGTH:", content.length)

    const { summary, tags } =
      content.length > 30
        ? await generateSummaryAndTags(content)
        : { summary: "", tags: [] as string[] }

    const readingTimeMin = content.length > 0 ? calculateReadingTimeMin(content) : null

    let inbox = await prisma.folder.findFirst({
      where: { name: "Inbox", userId },
      select: { id: true },
    })

    if (!inbox) {
      inbox = await prisma.folder.create({
        data: { name: "Inbox", userId },
        select: { id: true },
      })
    }

    const note = await prisma.note.create({
      data: {
        title: scrapedTitle,
        content: content.slice(0, 100_000),
        link: url,
        tags,
        summary: summary || null,
        readingTimeMin,
        folderId: inbox.id,
      },
    })

    return NextResponse.json({
      id: note.id,
      title: note.title,
      summary: note.summary ?? "",
      content: note.content,
      link: note.link ?? undefined,
      tags: note.tags,
      readingTimeMin: note.readingTimeMin ?? undefined,
      date: note.date.toISOString(),
      folderId: inbox.id,
    })
  } catch (err) {
    console.error("Capture error:", err)
    const message = err instanceof Error ? err.message : "Capture failed"
    return NextResponse.json(
      { error: message.includes("fetch") || message.includes("Jina") ? "Не удалось загрузить страницу" : "Ошибка при обработке" },
      { status: 500 }
    )
  }
}
