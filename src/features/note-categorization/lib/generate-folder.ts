/**
 * Генерация названия папки на основе контента заметки
 * 
 * @module features/note-categorization
 */

import { GoogleGenAI } from '@google/genai'

const GEMINI_TIMEOUT_MS = 120000

/**
 * Создаёт AI клиент
 */
function createGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  })
}

/**
 * Вызов Gemini API
 */
async function callGemini(prompt: string): Promise<string> {
  const client = createGeminiClient()

  const interaction = await client.interactions.create(
    {
      model: 'gemini-2.5-flash',
      input: prompt,
    },
    { timeout: GEMINI_TIMEOUT_MS }
  )

  const outputs = interaction.outputs
  if (!outputs || outputs.length === 0) {
    throw new Error('Gemini вернул пустой response')
  }

  const lastOutput = outputs[outputs.length - 1]
  if (!lastOutput || typeof lastOutput !== 'object' || !('text' in lastOutput)) {
    throw new Error('В response нет text')
  }

  return lastOutput.text as string
}

/**
 * Анализирует контент и определяет подходящую папку
 * 
 * @param content - Текст заметки
 * @param existingFolders - Список существующих папок (опционально)
 * @returns Название папки и уверенность AI
 * 
 * @example
 * const { folderName, confidence } = await generateFolderName(content, ['Inbox', 'Work'])
 */
export async function generateFolderName(
  content: string,
  existingFolders?: string[]
): Promise<{ folderName: string; confidence: number }> {
  // Обрезаем слишком длинные тексты
  const truncated = content.length > 15000
    ? content.slice(0, 15000) + '...'
    : content

  /**
   * Промпт для определения папки
   * 
   * Принцип SOLID:
   * - Single Responsibility — только определение папки
   * - Interface Segregation — маленький специализированный промпт
   */
  const foldersContext = existingFolders && existingFolders.length > 0
    ? `Существующие папки: ${existingFolders.join(', ')}. Если контент подходит к одной из них — используй её.`
    : 'Создай новую папку (1-2 слова).'

  const prompt = `Ты — AI-ассистент для категоризации заметок.

Проанализируй контент и определи подходящую папку.

${foldersContext}

Требования к названию папки:
1. 1-2 слова (например: "React", "Базы данных", "Дизайн")
2. На русском или английском языке
3. Без спецсимволов и цифр

Верни ТОЛЬКО JSON:
{
  "folderName": "название",
  "confidence": 0.95  // уверенность от 0 до 1
}

Контент:
${truncated}
`

  try {
    const response = await callGemini(prompt)
    const cleaned = response.replace(/```json?\s?|\s?```/g, '').trim()
    const parsed = JSON.parse(cleaned) as {
      folderName?: string
      confidence?: number
    }

    // Валидация и fallback
    const folderName = parsed.folderName?.trim() || 'Inbox'
    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.7

    return { folderName, confidence }
  } catch (error) {
    console.error('generateFolderName Error:', error)
    
    // Fallback: используем первую существующую или Inbox
    return {
      folderName: existingFolders?.[0] || 'Inbox',
      confidence: 0.5,
    }
  }
}
