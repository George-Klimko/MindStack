'use client'

import { NoteEditor } from "@/components/layout/noteEditor"
import { useNotesStore } from "@/store/notes.store"
import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"

export default function TestGemini() {
  const activeNoteObj = useNotesStore((s) => s.activeNote)
  const folders = useNotesStore((s) => s.folders)
  const updateNote = useNotesStore((s) => s.updateNote)

  const activeNote = folders
    .find(f => f.id === activeNoteObj?.folderId)
    ?.notes.find(n => n.id === activeNoteObj?.noteId) ?? null

  const [draft, setDraft] = useState(activeNote)
  const draftRef = useRef(draft)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  // сохраняем при закрытии вкладки
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!activeNoteObj || !draftRef.current) return
      updateNote(activeNoteObj.folderId, activeNoteObj.noteId, draftRef.current)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // переключение заметок с сохранением старой
  useEffect(() => {
    setDraft(activeNote)
    return () => {
      if (!activeNoteObj || !draftRef.current) return
      updateNote(activeNoteObj.folderId, activeNoteObj.noteId, draftRef.current)
    }
  }, [activeNoteObj?.noteId])

  // автосохранение с debounce
  useEffect(() => {
    if (!draft || !activeNoteObj) return

    const hasChanges =
      draft.title !== activeNote?.title ||
      draft.content !== activeNote?.content ||
      draft.link !== activeNote?.link

    if (!hasChanges) return

    setIsSaving(true)
    const timer = setTimeout(() => {
      updateNote(activeNoteObj.folderId, activeNoteObj.noteId, draft)
      setIsSaving(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [draft])

  const handleChange = (fields: Partial<typeof draft>) => {
    setDraft(prev => ({ ...prev, ...fields }))
  }

  const handleSave = () => {
    if (draft && activeNoteObj) {
      updateNote(activeNoteObj.folderId, activeNoteObj.noteId, draft)
    }
  }

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {draft ? (
          <motion.div
            key={draft.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <NoteEditor
              draft={draft}
              onChange={handleChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 dark:bg-transparent">
              <h2 className="text-xl font-medium text-foreground">Выберите заметку</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
