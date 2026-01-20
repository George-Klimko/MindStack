// components/add-folder-dialog.tsx
"use client"

import { useState } from "react"
import { useNotesStore } from "@/store/notes.store"
import { AddFolderDialogProps } from "@/types/ui"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AddFolderDialog({
  open,
  onOpenChange,
}: AddFolderDialogProps) {
  const addFolder = useNotesStore((s) => s.addFolder)
  const [title, setTitle] = useState("")

  const submit = () => {
    if (!title.trim()) return

    addFolder(title.trim())
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
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Folder name"
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
