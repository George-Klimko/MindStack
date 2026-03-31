/**
 * Типы для store (Zustand)
 * @module app/store
 */

import { type Note, type Folder } from "@/entities/note/types"

/** Состояние store заметок */
export interface NotesState {
  // Данные
  folders: Folder[]
  openFolders: Record<string, boolean>
  activeNote: ActiveNote | null
  isLoading: boolean
  
  // Кэширование
  lastFetchTime: number | null
  isInitialized: boolean
  notesLastFetchTime: number | null

  // Actions: Загрузка
  loadFolders: (force?: boolean) => Promise<void>
  loadNotes: (force?: boolean) => Promise<void>
  
  // Actions: Папки
  addFolder: (title: string) => Promise<void>
  removeFolder: (folderId: string) => Promise<void>
  
  // Actions: Заметки
  addNote: (folderId: string, title: string) => Promise<void>
  addNoteFromCapture: (note: Note, folderId: string) => void
  removeNote: (folderId: string, noteId: string) => Promise<void>
  updateNote: (
    folderId: string,
    noteId: string,
    updatedFields: Partial<Note>
  ) => Promise<void>
  
  // Actions: Навигация
  toggleFolder: (folderId: string) => void
  setActiveNote: (noteId: string | null, folderId: string | null) => void
}

/** Активная заметка (для редактора) */
export interface ActiveNote {
  noteId: string
  folderId: string
}
