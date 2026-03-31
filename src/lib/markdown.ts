/**
 * Утилиты для конвертации между HTML и Markdown
 * Используется для совместимости Tiptap (HTML) с хранением в Markdown
 */

/**
 * Простая конвертация HTML в Markdown
 * Поддерживает базовые элементы: заголовки, списки, ссылки, код, жирный/курсив
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return ""

  let md = html

  // Code blocks
  md = md.replace(
    /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    "```$1```"
  )
  md = md.replace(/<code[^>]*>([^<]*)<\/code>/gi, "`$1`")

  // Headings
  md = md.replace(/<h1[^>]*>([^<]*)<\/h1>/gi, "# $1")
  md = md.replace(/<h2[^>]*>([^<]*)<\/h2>/gi, "## $1")
  md = md.replace(/<h3[^>]*>([^<]*)<\/h3>/gi, "### $1")

  // Bold и Italic
  md = md.replace(/<strong[^>]*>([^<]*)<\/strong>/gi, "**$1**")
  md = md.replace(/<b[^>]*>([^<]*)<\/b>/gi, "**$1**")
  md = md.replace(/<em[^>]*>([^<]*)<\/em>/gi, "*$1*")
  md = md.replace(/<i[^>]*>([^<]*)<\/i>/gi, "*$1*")

  // Links
  md = md.replace(
    /<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi,
    "[$2]($1)"
  )

  // Lists
  md = md.replace(/<li[^>]*>([^<]*)<\/li>/gi, "- $1")
  md = md.replace(/<\/?ul[^>]*>/gi, "")
  md = md.replace(/<\/?ol[^>]*>/gi, "")

  // Blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, "> $1")

  // Line breaks
  md = md.replace(/<br[^>]*>/gi, "\n")
  md = md.replace(/<\/p[^>]*>/gi, "\n\n")
  md = md.replace(/<p[^>]*>/gi, "")

  // Strip remaining HTML tags
  md = md.replace(/<[^>]+>/g, "")

  // Cleanup
  md = md.replace(/\n\s*\n/g, "\n\n")
  md = md.trim()

  return md
}

/**
 * Простая конвертация Markdown в HTML
 * Для базовой совместимости при загрузке Markdown контента
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ""

  let html = markdown

  // Code blocks
  html = html.replace(
    /```([\s\S]*?)```/g,
    "<pre><code>$1</code></pre>"
  )
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>")

  // Headings
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>")
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>")
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>")

  // Bold и Italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Lists
  html = html.replace(/^- (.*$)/gim, "<li>$1</li>")
  html = html.replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")

  // Line breaks
  html = html.replace(/\n/g, "<br>")

  return html
}
