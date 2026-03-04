'use server';

import { GoogleGenAI } from '@google/genai';

const GEMINI_CONTENT_LIMIT = 6000;
const GEMINI_TIMEOUT_MS = 100000;

async function callGemini(prompt: string): Promise<string> {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const interaction = await client.interactions.create(
    {
      model: 'gemini-3-flash-preview',
      input: prompt,
    },
    { timeout: GEMINI_TIMEOUT_MS }
  );

  const outputs = interaction.outputs;
  if (!outputs || outputs.length === 0) {
    throw new Error('Gemini вернул пустой outputs');
  }

  const lastOutput = outputs[outputs.length - 1];
  if (!lastOutput?.text) {
    throw new Error('В outputs нет text');
  }

  return lastOutput.text;
}

export async function askGemini(prompt: string) {
  try {
    return await callGemini(prompt);
  } catch (error) {
    console.error('Gemini Error:', error);
    return 'Ошибка при запросе к ИИ';
  }
}

export type GenerateNoteResult = {
  summary: string
  detailed: string
  tags: string[]
}

export async function generateSummaryAndTags(
  content: string
): Promise<GenerateNoteResult> {
  const truncated =
    content.length > GEMINI_CONTENT_LIMIT
      ? content.slice(0, GEMINI_CONTENT_LIMIT) + '...'
      : content;

  const prompt = `Проанализируй текст страницы и верни JSON с тремя полями:

1. "summary" — краткая суть из 3-5 ключевых мыслей, каждый пункт с новой строки через "\\n"

2. "detailed" — подробный структурированный пересказ. Требования:
   - Передай ключевые идеи и детали
   - Убери навигацию, меню, футер и повторяющиеся элементы интерфейса
   - Не копируй текст дословно
   - Пиши на русском языке
   - Сделай логичную структуру с абзацами
   - Объём: до 3000 слов (уровень детализации — как статья)

3. "tags" — массив из 3-7 релевантных тегов на английском (например: frontend, react, architecture)

Текст:
${truncated}

Ответь только валидным JSON, без markdown и пояснений.`;

  try {
    const response = await callGemini(prompt);
    const cleaned = response.replace(/```json?\s?|\s?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as {
      summary?: string
      detailed?: string
      tags?: string[]
    };

    const detailed =
      typeof parsed.detailed === 'string' ? parsed.detailed.trim() : '';

    return {
      summary:
        typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      detailed: detailed || content.slice(0, 10000),
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 7)
        : [],
    };
  } catch (error) {
    console.error('generateSummaryAndTags Error:', error);
    return {
      summary: '',
      detailed: content.slice(0, 10000),
      tags: [],
    };
  }
}
