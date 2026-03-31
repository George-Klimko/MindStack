/**
 * Типы для UI компонентов
 * @module shared/ui
 */

import { type Note, type NoteWithFolder } from "@/entities/note/types"

/** Пропсы для карточки заметки */
export interface NoteCardProps {
  id: string
  title: string
  summary: string
  content: string
  link?: string
  tags: string[]
  readingTimeMin?: number
  date: string
  folder: {
    id: string
    name: string
  }
  onTagClick?: (tag: string) => void
  onDelete?: () => void
}

/** Пропсы для редактора заметок */
export interface NoteEditorProps {
  draft: Note | null
  onChange: (fields: Partial<Note>) => void
  onSave: () => void
  isSaving: boolean
}

/** Пропсы для диалога создания папки */
export interface AddFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Пропсы для диалога создания заметки */
export interface AddNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string
}

/** Пропсы для страницы с лентой */
export interface NotesFeedProps {
  initialNotes?: NoteWithFolder[]
}

/** Пропсы для страницы заметки */
export interface NotePageProps {
  noteId: string
}
