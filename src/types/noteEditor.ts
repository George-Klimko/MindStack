// types/note-editor.ts (или types/ui.ts)

export interface NoteDraft {
  title: string
  content: string
  tags: string[]
  link: string
  date: string
}

export interface NoteEditorProps {
  draft: NoteDraft | null
  onChange: (fields: Partial<NoteDraft>) => void
  onSave: () => void
}
