"use client"

import { useState, useCallback } from "react"
import { ArrowUpRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import { signIn, useSession } from "next-auth/react"
import { useNotesStore } from "@/store/notes.store"
import { type Note } from "@/entities/note/types"

export default function Header() {
  const { data: session, status } = useSession()
  const folders = useNotesStore((s) => s.folders)
  const addNoteFromCapture = useNotesStore((s) => s.addNoteFromCapture)
  const setActiveNote = useNotesStore((s) => s.setActiveNote)
  const loadNotes = useNotesStore((s) => s.loadNotes)
  const loadFolders = useNotesStore((s) => s.loadFolders)

  const [linkInput, setLinkInput] = useState("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCapture = useCallback(async () => {
    const url = linkInput.trim()
    if (!url || !session) return

    setIsCapturing(true)
    setError(null)
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Ошибка при захвате")
        return
      }

      const note = data as Note & { folderId: string }
      addNoteFromCapture(note, note.folderId)
      
      // 🔄 Перегружаем данные чтобы главная страница обновилась
      await loadNotes(true)  // force = true, игнорируем кэш
      await loadFolders(true)
      
      setLinkInput("")
      setActiveNote(note.id, note.folderId)
    } catch {
      setError("Ошибка при захвате")
    } finally {
      setIsCapturing(false)
    }
  }, [linkInput, session, addNoteFromCapture, setActiveNote])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCapture()
    }
  }

  return (
    <header
      className="
        sticky top-0 z-50
        w-full
        border-b
        bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60
      "
    >
      <div className="flex h-14 sm:h-16 items-center gap-2 px-3 sm:px-4 md:px-6">
        {/* Left — Mobile: Menu trigger (SidebarTrigger уже в layout) */}
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-sm font-semibold">MindStack</span>
        </div>

        {/* Center — capture input */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-2xl">
            <div className="flex items-center gap-2">
              <InputGroup className="flex-1">
                <InputGroupInput
                  type="url"
                  placeholder="Вставь ссылку..."
                  value={linkInput}
                  onChange={(e) => {
                    setLinkInput(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={!session || isCapturing}
                  className="h-9 sm:h-10 text-sm"
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCapture}
                    disabled={!session || !linkInput.trim() || isCapturing}
                    className="h-9 w-9 sm:h-10 sm:w-10"
                  >
                    {isCapturing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* AUTH — перенесено в Sidebar */}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="border-t bg-destructive/10 px-3 py-2 sm:px-4 md:px-6">
          <p className="text-xs sm:text-sm text-destructive">{error}</p>
        </div>
      )}
    </header>
  )
}
