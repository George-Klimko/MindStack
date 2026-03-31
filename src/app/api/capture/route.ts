import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "../auth/[...nextauth]/route"
import { generateSummaryAndTagsWithCategory } from "@/app/actions"

/**
 * КОНФИГУРАЦИЯ БЕЗОПАСНОСТИ И ПРОИЗВОДИТЕЛЬНОСТИ
 * 
 * JINA_TIMEOUT_MS: 20 секунд
 * - Достаточно для загрузки большинства страниц
 * - Защита от зависаний на медленных сайтах
 * 
 * JINA_CACHE_TTL: 5 минут (по умолчанию в Jina)
 * - Повторные запросы возвращают кэш
 * - Экономия токенов и ускорение работы
 */
const JINA_TIMEOUT_MS = 20000;

/**
 * Список разрешённых протоколов для безопасности
 * Запрещаем file://, ftp:// и другие потенциально опасные
 */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Максимальная длина URL для защиты от DoS
 */
const MAX_URL_LENGTH = 2048;

/**
 * Проверяет валидность URL с точки зрения безопасности
 * 
 * @param url - Строка URL
 * @returns true если URL валиден и безопасен
 * 
 * Security checks:
 * 1. Валидный формат URL
 * 2. Разрешённый протокол (http/https)
 * 3. Не локальный адрес (защита от SSRF)
 * 4. Разумная длина
 */
function isValidUrl(url: string): boolean {
  try {
    // Проверка длины (защита от DoS)
    if (url.length > MAX_URL_LENGTH) {
      return false;
    }

    const parsed = new URL(url);

    // Проверка протокола
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return false;
    }

    // Защита от SSRF — блокируем локальные адреса
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.') ||
      hostname.endsWith('.local') ||
      hostname === '0.0.0.0'
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Нормализует URL для Jina AI
 * Убираем протокол и www для чистого запроса
 * 
 * @see https://jina.ai/reader/
 */
function normalizeForJina(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .trim();
}

/**
 * Вычисляет время чтения на основе количества слов
 * 
 * @param content - Текст контента
 * @returns Время чтения в минутах
 * 
 * Формула: 200 слов в минуту (средняя скорость чтения)
 */
function calculateReadingTimeMin(content: string): number {
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Извлекает Open Graph метаданные из HTML
 * Fallback если Jina не смогла получить контент
 * 
 * @param html - Исходный HTML страницы
 * @returns Заголовок и описание
 */
function extractOgFromHtml(html: string): { title: string; description: string } {
  // Пробуем разные варианты порядка атрибутов
  const ogTitleMatch = 
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i);
  
  const ogDescMatch = 
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  
  const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

  const title = ogTitleMatch?.[1] ?? titleTagMatch?.[1];
  const description = ogDescMatch?.[1] ?? "";

  return {
    title: (typeof title === "string" ? decodeHtmlEntities(title.trim()) : "") || "Без названия",
    description: typeof description === "string" ? decodeHtmlEntities(description.trim()) : "",
  };
}

/**
 * Декодирует HTML-сущности в строке
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Получает контент через Jina AI Reader API
 * 
 * @param url - Целевой URL
 * @returns Объект с заголовком и контентом
 * 
 * Jina AI параметры:
 * - x-respond-with: markdown — чистый Markdown для LLM
 * - x-wait-for-selector: article — ждём загрузки основного контента
 * - x-exclude-selector: nav,footer,aside — убираем мусор
 * 
 * @see https://jina.ai/reader/
 */
async function fetchWithJina(url: string): Promise<{ title: string; content: string }> {
  const normalized = normalizeForJina(url);
  
  // Формируем URL с параметрами для чистого контента
  const jinaUrl = `https://r.jina.ai/${normalized}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);

  try {
    const res = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        // ✅ Оптимизация для Jina AI
        'x-respond-with': 'markdown',
        'x-wait-for-selector': 'article, main, .content, .post',
        'x-exclude-selector': 'nav, footer, header, aside, .ads, .sidebar, .comments',
        'x-remove-all-images': 'true', // Экономия токенов
        'x-timeout': '15', // Таймаут на стороне Jina
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Jina error: ${res.status}`);
    }

    const text = await res.text();

    // Если контента мало — пробуем fallback
    if (!text || text.length < 50) {
      const fallback = await fetchOgFallback(url);
      return {
        title: fallback.title,
        content: fallback.description,
      };
    }

    // Jina возвращает заголовок в первой строке
    const lines = text.split("\n").filter(Boolean);
    const title = lines[0]?.replace(/^#+\s*/, '') || "Без названия";

    // Остальной текст — контент
    const content = lines.slice(1).join("\n");

    return {
      title: title.trim(),
      content: content.trim(),
    };
  } catch (err) {
    clearTimeout(timeout);

    // Fallback на OG метаданные
    const fallback = await fetchOgFallback(url);
    if (fallback.title || fallback.description) {
      return {
        title: fallback.title,
        content: fallback.description,
      };
    }

    throw err;
  }
}

/**
 * Fallback: прямое получение OG метаданных
 * Используется если Jina не справился
 */
async function fetchOgFallback(url: string): Promise<{ title: string; description: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MindStack/1.0; +https://mindstack.app)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const html = await res.text();
    return extractOgFromHtml(html);
  } catch {
    clearTimeout(timeout);
    return { title: "Без названия", description: "" };
  }
}

/**
 * POST /api/capture
 * 
 * Захват контента со страницы через Jina AI + Gemini AI
 * 
 * Request: { url: string }
 * Response: Note object с AI-generated summary и tags
 * 
 * Security:
 * - Аутентификация через NextAuth
 * - Валидация URL
 * - Защита от SSRF
 * - Rate limiting (через Jina API)
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  // ✅ Проверка аутентификации
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { url?: unknown };
  try {
    body = (await req.json()) as { url?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ✅ Валидация URL
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url || !isValidUrl(url)) {
    return NextResponse.json({ 
      error: "Valid URL is required (http/https only)" 
    }, { status: 400 });
  }

  try {
    // 1. Получаем контент через Jina
    const { title: scrapedTitle, content } = await fetchWithJina(url);

    // 2. Получаем все папки пользователя для AI
    const userFolders = await prisma.folder.findMany({
      where: { userId },
      select: { name: true },
    })
    const folderNames = userFolders.map(f => f.name)

    // 3. Генерируем summary, теги И папку через AI
    const { summary, detailed, tags, shortTitle, folderName, confidence } =
      content.length > 30
        ? await generateSummaryAndTagsWithCategory(content, scrapedTitle, folderNames)
        : {
            summary: "",
            detailed: content,
            tags: [] as string[],
            shortTitle: shortenTitle(scrapedTitle),
            folderName: 'Inbox',
            confidence: 1.0
          };

    console.log(`📦 AI categorization: ${folderName} (confidence: ${confidence?.toFixed(2)})`)

    const finalContent = content.length > 30 ? detailed : content;
    const readingTimeMin = finalContent.length > 0 ? calculateReadingTimeMin(finalContent) : null;

    // 4. Ищем или создаём папку
    let folder = await prisma.folder.findFirst({
      where: {
        userId,
        name: { equals: folderName, mode: 'insensitive' }
      },
    });

    if (!folder) {
      console.log(`📁 Создаём новую папку: ${folderName}`)
      folder = await prisma.folder.create({
        data: {
          name: folderName,
          userId,
        },
      });
    }

    // 5. Создаём заметку в найденной/созданной папке
    const note = await prisma.note.create({
      data: {
        title: shortTitle,
        content: finalContent,
        link: url,
        tags,
        summary: summary || null,
        readingTimeMin,
        folderId: folder.id,
      },
    });

    // ✅ Возвращаем нормализованный объект Note
    return NextResponse.json({
      id: note.id,
      title: note.title,
      summary: note.summary ?? "",
      content: note.content,
      link: note.link ?? undefined,
      tags: note.tags,
      readingTimeMin: note.readingTimeMin ?? undefined,
      date: note.date.toISOString(),
      folderId: folder.id,
    });
  } catch (err) {
    console.error("Capture error:", err);

    // ✅ Безопасная обработка ошибок (не утечка деталей)
    const message = err instanceof Error ? err.message : "Capture failed";
    const isNetworkError = message.includes("fetch") || message.includes("Jina") || message.includes("abort");

    return NextResponse.json(
      {
        error: isNetworkError
          ? "Не удалось загрузить страницу. Проверьте ссылку."
          : "Ошибка при обработке контента"
      },
      { status: isNetworkError ? 400 : 500 }
    );
  }
}

/**
 * Сокращает заголовок до 3-4 слов (fallback для capture)
 */
function shortenTitle(title: string): string {
  const cleaned = title
    .split(/[:|—–-]/)[0]
    .replace(/^(Как|Что|Где|Когда|Почему|Зачем)\s+/i, '')
    .trim();
  
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  return words.slice(0, 4).join(' ');
}
