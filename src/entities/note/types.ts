/**
 * Базовые типы для заметок
 * @module entities/note
 */

/** Основная модель заметки */
export interface Note {
  id: string
  title: string
  content: string
  link?: string
  tags: string[]
  date: string
  summary?: string
  readingTimeMin?: number
  folderId?: string  // Для заметок в store
}

/** Модель папки с заметками */
export interface Folder {
  id: string
  title: string
  notes: Note[]
}

/** Заметка с информацией о папке (для API) */
export interface NoteWithFolder extends Note {
  folder: {
    id: string
    name: string
  }
}

/** Заметка внутри папки (для store) */
export interface NoteInFolder extends Note {
  folderId: string
}

/** Данные для создания/обновления заметки */
export interface NotePayload {
  title: string
  content?: string
  link?: string
  tags?: string[]
  summary?: string
  readingTimeMin?: number
}

/** Данные для создания папки */
export interface FolderPayload {
  title: string
}

/** Параметры для фильтрации заметок */
export interface NotesFilter {
  search?: string
  tag?: string
  folderId?: string
}

/** Результат генерации AI */
export interface GeneratedNoteData {
  summary: string
  detailed: string
  tags: string[]
  shortTitle: string
}

/** Результат генерации AI с категоризацией */
export interface GeneratedNoteDataWithCategory extends GeneratedNoteData {
  folderName: string
  confidence?: number
}
