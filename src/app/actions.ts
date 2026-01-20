'use server';

import { GoogleGenAI } from '@google/genai';

export async function askGemini(prompt: string) {
  try {
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
  } catch (error) {
    console.error('Gemini Error:', error);
    return 'Ошибка при запросе к ИИ';
  }
}
