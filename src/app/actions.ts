'use server';

import { GoogleGenAI } from '@google/genai';

/**
 * КОНСТАНТЫ БЕЗОПАСНОСТИ И ОПТИМИЗАЦИИ
 * 
 * GEMINI_CONTENT_LIMIT: 30000 символов (~20-25K токенов)
 * - Достаточно для большинства статей
 * - Укладывается в бесплатный лимит Gemini 2.5 Flash (1M токенов)
 * - Оптимально для качества суммаризации
 * 
 * GEMINI_TIMEOUT_MS: 120 секунд
 * - Gemini может работать медленно на больших текстах
 * - Достаточно времени для генерации качественного summary
 */
const GEMINI_CONTENT_LIMIT = 30000;
const GEMINI_TIMEOUT_MS = 120000;

/**
 * Создаёт AI клиент один раз для всех запросов
 * Используем актуальную модель Gemini 2.5 Flash (не 2.0!)
 * 
 * @see https://ai.google.dev/gemini-api/docs/models/gemini#gemini-2.5-flash
 */
function createGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });
}

/**
 * Базовый вызов Gemini с обработкой ошибок и таймаутом
 * 
 * @param prompt - Промпт для AI
 * @returns Текст ответа от Gemini
 * @throws Error при таймауте или пустом ответе
 */
async function callGemini(prompt: string): Promise<string> {
  const client = createGeminiClient();

  const interaction = await client.interactions.create(
    {
      // ✅ Gemini 2.5 Flash — актуальная модель (Flash-Lite слишком простая для суммаризации)
      model: 'gemini-2.5-flash',
      input: prompt,
    },
    { timeout: GEMINI_TIMEOUT_MS }
  );

  const outputs = interaction.outputs;
  if (!outputs || outputs.length === 0) {
    throw new Error('Gemini вернул пустой outputs');
  }

  const lastOutput = outputs[outputs.length - 1];
  // Типизированная проверка наличия text
  if (!lastOutput || typeof lastOutput !== 'object' || !('text' in lastOutput) || typeof lastOutput.text !== 'string') {
    throw new Error('В outputs нет text');
  }

  return lastOutput.text;
}

/**
 * Публичный API для простых запросов к Gemini
 * Используется в UI для быстрых вопросов
 */
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

/**
 * Генерация summary, detailed контента и тегов для захваченной страницы
 * 
 * Использует двухэтапный подход:
 * 1. Извлечение ключевых идей (summary)
 * 2. Детальный пересказ с сохранением структуры
 * 3. Автоматическая генерация релевантных тегов
 * 4. Сокращение заголовка до 3-4 слов
 * 
 * @param content - Исходный текст страницы
 * @returns Объект с summary, detailed, tags и shortTitle
 * 
 * @example
 * const { summary, detailed, tags, shortTitle } = await generateSummaryAndTags(htmlContent, originalTitle)
 */
export async function generateSummaryAndTags(
  content: string,
  originalTitle?: string
): Promise<GenerateNoteResult & { shortTitle: string }> {
  // Обрезаем слишком длинные тексты (оптимизация токенов)
  const truncated =
    content.length > GEMINI_CONTENT_LIMIT
      ? content.slice(0, GEMINI_CONTENT_LIMIT) + '\n\n[... текст обрезан из-за длины ...]'
      : content;

  /**
   * УЛУЧШЕННЫЙ ПРОМПТ С ПРИМЕРАМИ И СТРУКТУРОЙ
   * 
   * Ключевые изменения:
   * 1. Явное требование СОЗДАТЬ summary (не пустой!)
   * 2. Требование сокращения title до 3-4 слов
   * 3. Запрет markdown символов в detailed
   * 4. Примеры формата для каждого поля
   */
  const prompt = `Ты — AI-ассистент для системы управления знаниями MindStack.
Твоя задача: проанализировать текст веб-страницы и создать структурированную заметку.

Верни ТОЛЬКО валидный JSON без markdown и пояснений с четырьмя полями:

1. shortTitle (строка): Краткий заголовок из 3-4 слов МАКСИМУМ
   - Придумай на основе содержания статьи
   - Примеры:
     * "React 19: Новые Хуки" (вместо "React 19 представляет новые возможности для разработчиков")
     * "Оптимизация SQL Запросов" (вместо "Как ускорить работу базы данных с помощью индексов")
     * "TypeScript Generics Гайд" (вместо "Полное руководство по дженерикам в TypeScript")
   - НЕ используй кавычки, двоеточия внутри, спецсимволы
   - Только слова через пробел

2. summary (строка): Краткая суть из 4-8 ключевых мыслей
   - КАЖДАЯ мысль с новой строки через символ переноса \\n
   - Начинай каждый пункт с • или -
   - Только факты, без воды и вступлений
   - Фокус на практической пользе
   - ПРИМЕР ФОРМАТА: "• React 19 вводит новые правила хуков\\n• setState нельзя вызывать в useEffect напрямую\\n• Автоматический batching улучшает производительность"
   - НЕ оставляй summary пустым! Это критично!

3. detailed (строка): Подробный структурированный пересказ БЕЗ markdown символов
   КРИТИЧНО ВАЖНО: Не используй НИКАКИХ символов форматирования!
   
   ❌ ЗАПРЕЩЕНО (никогда не используй):
   - # ## ### #### — заголовки
   - **жирный** или *курсив* — выделение
   - блоки кода и inline код
   - [[]]ссылки — wiki-links
   - [текст](url) — markdown links
   - #### Шаг 1: — нумерация с решеткой
   - --- или *** — разделители
   - > цитаты — цитирование
   - | таблица | — таблицы
   
   ✅ МОЖНО (используй только это):
   - Обычный текст с абзацами (просто пустые строки между ними)
   - Тире для списков: - первый пункт
   - Обычные цифры: 1. первый пункт
   - Дефисы и тире в тексте: что-то, кто-то
   
   Пример ПРАВИЛЬНОГО формата:
   "Введение
   
   AI агенты это просто цикл который берет твой ввод и продолжает с помощью LLM.
   
   Почему стоит попробовать Claude Code:
   - работает локально на компьютере
   - очень быстрый
   - есть все инструменты из коробки
   
   Заключение
   
   Прогресс не остановить."
   
   Другие требования:
   - Передай ключевые идеи, аргументы и выводы
   - Убери навигацию, меню, футер, рекламу, повторы
   - НЕ копируй текст дословно — перефразируй своими словами
   - Пиши на русском языке в стиле технической статьи
   - Сохраняй логику оригинала: проблема → решение → примеры
   - Объём: 1000-2000 слов (достаточно для понимания, но без воды)
   - Если текст содержит код — опиши его назначение словами, НЕ вставляй код

4. tags (массив строк): 5-10 релевантных тегов на английском
   - Конкретные технологии, концепции, темы
   - Пример: ["React", "Next.js", "Server Components", "Performance", "TypeScript"]
   - Избегай общих тегов вроде "web", "tech", "article"

Оригинальный заголовок статьи: ${originalTitle || 'Неизвестен'}

Текст для анализа:
${truncated}

ВАЖНО:

1. Ответь ТОЛЬКО валидным JSON. Никакого markdown, никаких пояснений.
2. summary НЕ ДОЛЖЕН быть пустым — это критично важно!
3. shortTitle должен быть 3-4 слова, не больше.
4. В detailed НЕ используй markdown символы.`;

  try {
    const response = await callGemini(prompt);
    
    // Очищаем ответ от возможных markdown-обёрток
    const cleaned = response.replace(/```json?\s?|\s?```/g, '').trim();
    
    // Парсим JSON с обработкой ошибок
    const parsed = JSON.parse(cleaned) as {
      summary?: string
      detailed?: string
      tags?: string[]
      shortTitle?: string
    };

    // Валидация и fallback
    let detailed = typeof parsed.detailed === 'string' ? parsed.detailed.trim() : '';
    
    // ✅ Очищаем detailed от markdown символов
    detailed = cleanMarkdownSymbols(detailed);
    
    // ✅ Если summary пустой — генерируем сами из первых предложений detailed
    let summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    if (!summary && detailed) {
      summary = generateFallbackSummary(detailed);
    }
    
    // ✅ Если shortTitle не задан — сокращаем оригинальный
    let shortTitle = typeof parsed.shortTitle === 'string' ? parsed.shortTitle.trim() : '';
    if (!shortTitle && originalTitle) {
      shortTitle = shortenTitle(originalTitle);
    } else if (!shortTitle) {
      shortTitle = 'Без названия';
    }

    return {
      summary,
      detailed: detailed || content.slice(0, 10000),
      // Фильтруем теги: только строки, максимум 10
      tags: Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
            .map(t => t.trim())
            .slice(0, 10)
        : [],
      shortTitle,
    };
  } catch (error) {
    console.error('generateSummaryAndTags Error:', error);
    
    // Fallback: возвращаем обрезанный контент без AI-обработки
    return {
      summary: '',
      detailed: content.slice(0, 10000),
      tags: [],
      shortTitle: originalTitle ? shortenTitle(originalTitle) : 'Без названия',
    };
  }
}

/**
 * Очищает текст от markdown символов для чистого отображения
 * Агрессивная очистка — удаляет ВСЕ markdown паттерны
 */
function cleanMarkdownSymbols(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // ✅ Удаляем заголовки всех уровней (# ## ### #### ##### ######)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  
  // ✅ Удаляем wiki-links [[]] и markdown links []()
  cleaned = cleaned.replace(/\[\[(.*?)\]\]/g, '$1');
  cleaned = cleaned.replace(/\[(.*?)\]\([^)]*\)/g, '$1');
  
  // ✅ Удаляем жирный и курсив (** ** * *)
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');
  
  // ✅ Удаляем код (` ``` ```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    // Оставляем только содержимое блока кода как обычный текст
    return match.replace(/```/g, '').trim();
  });
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // ✅ Удаляем списки (- * + •)
  cleaned = cleaned.replace(/^\s*[-*+•]\s+/gm, '  ');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '  ');
  
  // ✅ Удаляем цитаты (>)
  cleaned = cleaned.replace(/^\s*>\s*/gm, '');
  
  // ✅ Удаляем горизонтальные линии (--- *** ___)
  cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  
  // ✅ Удаляем таблицы (|)
  cleaned = cleaned.replace(/^\s*\|.*\|\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*[-:]+\s*\|\s*[-:]+\s*$/gm, '');
  
  // ✅ Удаляем изображения (![alt](url))
  cleaned = cleaned.replace(/!\[(.*?)\]\([^)]*\)/g, '$1');
  
  // ✅ Нормализуем множественные переносы строк
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // ✅ Удаляем leading/trailing пробелы в строках
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  return cleaned.trim();
}

/**
 * Генерирует fallback summary из первых предложений
 * Если AI не вернул summary, создаём его сами
 */
function generateFallbackSummary(text: string): string {
  // Берём первые 5-7 предложений
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keyPoints = sentences.slice(0, 6).map(s => `• ${s.trim()}`);
  return keyPoints.join('\\n');
}

/**
 * Сокращает заголовок до 3-4 слов
 */
function shortenTitle(title: string): string {
  // Удаляем всё после двоеточия, тире, вертикальной черты
  const cleaned = title
    .split(/[:|—–-]/)[0]
    .replace(/^(Как|Что|Где|Когда|Почему|Зачем)\s+/i, '') // Удаляем вопросительные слова
    .trim();

  // Берём первые 3-4 слова
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  return words.slice(0, 4).join(' ');
}

// ==================== АВТО-КАТЕГОРИЗАЦИЯ ====================

/**
 * Тип для результата генерации с авто-категоризацией
 */
export type GeneratedNoteDataWithCategory = {
  summary: string
  detailed: string
  tags: string[]
  shortTitle: string
  folderName: string
  confidence: number
}

/**
 * Генерация summary, тегов И авто-категоризация по папкам
 * Используется при захвате контента через /api/capture
 */
export async function generateSummaryAndTagsWithCategory(
  content: string,
  originalTitle: string,
  folderNames: string[]
): Promise<GeneratedNoteDataWithCategory> {
  const truncated =
    content.length > GEMINI_CONTENT_LIMIT
      ? content.slice(0, GEMINI_CONTENT_LIMIT) + '\n\n[... текст обрезан ...]'
      : content;

  const foldersList = folderNames.length > 0
    ? folderNames.map((f, i) => `${i + 1}. ${f}`).join('\n')
    : '(нет папок — предложи название для новой)'

  const prompt = [
    'Ты — AI-ассистент для системы управления знаниями MindStack.',
    'Проанализируй текст и создай заметку с авто-категоризацией.',
    '',
    'СУЩЕСТВУЮЩИЕ ПАПКИ:',
    foldersList,
    '',
    'Верни JSON с полями:',
    '1. shortTitle — 3-4 слова, без спецсимволов',
    '2. summary — 4-8 пунктов через \\n, начинай с •',
    '3. detailed — пересказ БЕЗ markdown (# * ** ` []), 1000-2000 слов',
    '4. tags — 5-10 тегов на английском',
    '5. folderName — выбери из списка ИЛИ предложи новую',
    '6. confidence — число 0.0-1.0 (уверенность)',
    '',
    'Заголовок: ' + originalTitle,
    '',
    'Текст:',
    truncated,
    '',
    'ВАЖНО: Только JSON, summary не пустой, confidence число!',
  ].join('\n');

  try {
    const response = await callGemini(prompt);
    const cleaned = response.replace(/```json?\s?|\s?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    let detailed = typeof parsed.detailed === 'string' ? parsed.detailed.trim() : '';
    detailed = cleanMarkdownSymbols(detailed);

    let summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    if (!summary && detailed) {
      summary = generateFallbackSummary(detailed);
    }

    let shortTitle = typeof parsed.shortTitle === 'string' ? parsed.shortTitle.trim() : '';
    if (!shortTitle) {
      shortTitle = shortenTitle(originalTitle);
    }

    const folderName = typeof parsed.folderName === 'string' && parsed.folderName.trim().length > 0
      ? parsed.folderName.trim()
      : 'Inbox';

    const rawConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;
    const confidence = Math.max(0, Math.min(1, rawConfidence));

    const rawTags = parsed.tags;
    const tags = Array.isArray(rawTags)
      ? rawTags
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim())
          .slice(0, 10)
      : [];

    return { summary, detailed, tags, shortTitle, folderName, confidence };
  } catch (error) {
    console.error('generateSummaryAndTagsWithCategory Error:', error);
    return {
      summary: '',
      detailed: content.slice(0, 10000),
      tags: extractTagsFromContent(content),
      shortTitle: shortenTitle(originalTitle),
      folderName: 'Inbox',
      confidence: 0.0,
    };
  }
}

/**
 * Извлекает теги из контента на основе частоты слов (fallback)
 */
function extractTagsFromContent(content: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'что', 'как', 'где', 'когда', 'этом',
    'этот', 'этой', 'этого', 'такой', 'уже', 'его', 'нее', 'них', 'они',
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\sа-яё]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const frequency: Record<string, number> = {};
  words.forEach((w) => {
    frequency[w] = (frequency[w] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}
