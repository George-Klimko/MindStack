// types/note-editor.ts

export interface NoteDraft {
  title: string
  content: string
  tags: string[]
  link: string
  date: string
  summary?: string
  readingTimeMin?: number
}

export interface NoteEditorProps {
  draft: NoteDraft | null
  onChange: (fields: Partial<NoteDraft>) => void
  onSave: () => void
  isSaving: boolean | null
}
