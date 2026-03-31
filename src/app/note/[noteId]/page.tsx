"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NoteEditor } from "@/components/layout/noteEditor"
import { useNotesStore } from "@/store/notes.store"
import { type Note } from "@/entities/note/types"

export default function NotePage() {
  const router = useRouter()
  const params = useParams()
  const noteId = params.noteId as string

  const [draft, setDraft] = useState<Note | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const folders = useNotesStore((s) => s.folders)
  const updateNote = useNotesStore((s) => s.updateNote)
  const setActiveNote = useNotesStore((s) => s.setActiveNote)

  // Находим заметку в сторе
  useEffect(() => {
    if (!noteId || folders.length === 0) return

    for (const folder of folders) {
      const note = folder.notes.find((n) => n.id === noteId)
      if (note) {
        setDraft(note)
        setActiveNote(note.id, folder.id)
        return
      }
    }
  }, [noteId, folders, setActiveNote])

  const handleChange = (fields: Partial<Note>) => {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, ...fields } as Note
    })
  }

  const handleSave = async () => {
    if (!draft) return
    
    setIsSaving(true)
    const folder = folders.find((f) => f.notes.some((n) => n.id === noteId))
    if (folder) {
      await updateNote(folder.id, noteId, draft)
    }
    setIsSaving(false)
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header с кнопкой назад */}
      <div className="border-b px-4 py-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>
        <span className="text-sm text-muted-foreground truncate flex-1">
          {draft.title}
        </span>
      </div>

      {/* Редактор */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor
          draft={draft}
          onChange={handleChange}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  )
}
