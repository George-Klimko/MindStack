// components/add-note-dialog.tsx
"use client"

import { useState } from "react"
import { useNotesStore } from "@/store/notes.store"
import { AddFolderDialogPropsNote } from "@/types/ui"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { stringify } from "querystring"

export function AddFolderDialogNote({
  open,
  onOpenChange,
  folderId
}: AddFolderDialogPropsNote) {
  const addNote = useNotesStore((s) => s.addNote)
  const [title, setTitle] = useState("")

  const submit = () => {
    if (!title.trim()) return

    addNote(folderId ,title.trim())
    setTitle("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (val) setTitle("")
      onOpenChange(val)
      }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Note</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Note name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <Button onClick={submit}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
