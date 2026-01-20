'use client'

import { NoteEditor } from "@/components/layout/noteEditor";
import { useNotesStore } from "@/store/notes.store"
import { useState, useEffect } from "react"


export default function TestGemini() {
  const activeNoteObj = useNotesStore((s) => s.activeNote)
  const folders = useNotesStore((s) => s.folders)
  const updateNote = useNotesStore((s) => s.updateNote)

  
  const activeNote = folders
    .find(f => f.id === activeNoteObj?.folderId)
    ?.notes.find(n => n.id === activeNoteObj?.noteId) ?? null
  const [draft, setDraft] = useState(activeNote)

  useEffect(() => {
    setDraft(activeNote)
  }, [activeNoteObj?.noteId])

  const handleChange = (fields) => {
    setDraft(prev => ({ ...prev, ...fields }))
  }

  const handleSave = () => {
    if (draft && activeNoteObj) {
      updateNote(activeNoteObj.folderId, activeNoteObj.noteId, draft)
    }

  }
  return (
    <main className="p-10 max-w-2xl mx-auto">
        <NoteEditor
        draft={draft}
        onChange={handleChange}
        onSave={handleSave}
      />
    </main>
  );
}