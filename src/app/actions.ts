'use server';

import { GoogleGenAI } from '@google/genai';

const GEMINI_CONTENT_LIMIT = 30000;

async function callGemini(prompt: string): Promise<string> {
  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const interaction = await client.interactions.create({
    model: 'gemini-3-flash-preview',
    input: prompt,
  });

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

export async function generateSummaryAndTags(
  content: string
): Promise<{ summary: string; tags: string[] }> {
  const truncated =
    content.length > GEMINI_CONTENT_LIMIT
      ? content.slice(0, GEMINI_CONTENT_LIMIT) + '...'
      : content;

  const prompt = `Проанализируй текст и верни JSON с двумя полями:
1. "summary" — краткая суть из 3-5 ключевых мыслей, каждый пункт с новой строки через "\\n"
2. "tags" — массив из 3-7 релевантных тегов на английском (например: #frontend, #react, #architecture)

Текст:
${truncated}

Ответь только валидным JSON, без markdown и пояснений.`;

  try {
    const response = await callGemini(prompt);
    const cleaned = response.replace(/```json?\s?|\s?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { summary?: string; tags?: string[] };

    return {
      summary:
        typeof parsed.summary === 'string'
          ? parsed.summary.trim()
          : '',
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t): t is string => typeof t === 'string').slice(0, 7)
        : [],
    };
  } catch (error) {
    console.error('generateSummaryAndTags Error:', error);
    return { summary: '', tags: [] };
  }
}
