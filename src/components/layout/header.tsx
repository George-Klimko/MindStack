"use client"

import { useState, useCallback } from "react"
import { ArrowUpRight, Settings, Plus, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { signIn, signOut, useSession } from "next-auth/react"
import { useNotesStore } from "@/store/notes.store"
import { Note } from "@/types/notes"

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export default function Header() {
  const { data: session, status } = useSession()
  const folders = useNotesStore((s) => s.folders)
  const addNoteFromCapture = useNotesStore((s) => s.addNoteFromCapture)
  const setActiveNote = useNotesStore((s) => s.setActiveNote)

  const [linkInput, setLinkInput] = useState("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const notesCreatedToday = folders.reduce((acc, folder) => {
    return acc + folder.notes.filter((n) => isToday(n.date)).length
  }, 0)

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
        w-full h-16
        flex items-center
        border-b
        bg-background/70 backdrop-blur
        px-3 sm:px-4 lg:px-6
      "
    >
      {/* Center — capture input */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2
          hidden sm:flex sm:items-center sm:gap-3
          w-full max-w-md lg:max-w-xl
          px-2
        "
      >
        <div className="flex-1 flex flex-col gap-0.5">
          <InputGroup>
            <InputGroupInput
              type="url"
              placeholder="Paste a link to capture knowledge…"
              value={linkInput}
              onChange={(e) => {
                setLinkInput(e.target.value)
                setError(null)
              }}
              onKeyDown={handleKeyDown}
              disabled={!session || isCapturing}
            />
            <InputGroupAddon align="inline-end">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCapture}
                disabled={!session || !linkInput.trim() || isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </Button>
            </InputGroupAddon>
          </InputGroup>
          {error && (
            <span className="text-xs text-destructive px-2">{error}</span>
          )}
        </div>
        {session && (
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            Обработано сегодня: {notesCreatedToday}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Mobile add */}
        <Button size="icon" variant="ghost" className="sm:hidden">
          <Plus className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button size="icon" variant="ghost">
          <Settings className="h-5 w-5" />
        </Button>

        {/* AUTH */}
        {status === "loading" ? null : session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? ""} />
                  <AvatarFallback>
                    {session.user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <span className="hidden md:block text-sm">
             
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            onClick={() => signIn("google")}
            variant="outline"
          >
            Войти через Google
          </Button>
        )}
      </div>
    </header>
  )
}
