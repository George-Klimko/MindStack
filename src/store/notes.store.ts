//notes.store.ts

import { create } from "zustand"
import { Folder, Note } from "@/types/notes"

type NotesState = {
  folders: Folder[]
  openFolders: Record<string, boolean>
  activeNote: { noteId: string, folderId: string } | null
  isLoading: boolean

  loadFolders: () => Promise<void>
  addFolder: (title: string) => Promise<void>
  removeFolder: (folderId: string) => void

  addNote: (folderId: string, title: string) => Promise<void>
  addNoteFromCapture: (note: Note, folderId: string) => void

  toggleFolder: (folderId: string) => void

  updateNote: (
    folderId: string,
    noteId: string,
    updatedFields: Partial<Note>
  ) => Promise<void>

  setActiveNote: (noteId: string | null, folderId: string | null) => void
}

type NotePayload = Pick<Note, "title" | "content" | "link" | "tags" | "summary" | "readingTimeMin">

export const useNotesStore = create<NotesState>((set) => ({

  folders: [],
  openFolders: {},

  activeNote: null,
  isLoading: false,

  loadFolders: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch("/api/folders")
      if (!res.ok) return

      const folders = (await res.json()) as Folder[]
      set({
        folders,
        openFolders: Object.fromEntries(folders.map((folder) => [folder.id, true])),
        isLoading: false,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  addFolder: async (title) => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) return

    const folder = (await res.json()) as Folder
    set((state) => ({
      folders: [...state.folders, folder],
      openFolders: {
        ...state.openFolders,
        [folder.id]: true,
      },
    }))
  },
  
  removeFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
      openFolders: Object.fromEntries(
        Object.entries(state.openFolders).filter(
          ([id]) => id !== folderId
        )
      ),
    })),

  addNote: async (folderId, title) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId, title }),
    })
    if (!res.ok) return

    const note = (await res.json()) as Note
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              notes: [note, ...folder.notes],
            }
          : folder
      ),
    }))
  },

  addNoteFromCapture: (note, folderId) => {
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, notes: [note, ...folder.notes] }
          : folder
      ),
    }))
  },

  toggleFolder: (folderId) =>
    set((state) => ({
      openFolders: {
        ...state.openFolders,
        [folderId]: !state.openFolders[folderId],
      },
    })),

  updateNote: async (folderId: string, noteId: string, updatedFields: Partial<Note>) => {
    const previousFolders = useNotesStore.getState().folders

    set((state) => ({
      folders: state.folders.map((folder) => {
        if (folder.id !== folderId) return folder

        return {
          ...folder,
          notes: folder.notes.map((note) =>
            note.id === noteId ? { ...note, ...updatedFields } : note
          ),
        }
      }),
    }))

    const payload: Partial<NotePayload> = {}
    if (updatedFields.title !== undefined) payload.title = updatedFields.title
    if (updatedFields.content !== undefined) payload.content = updatedFields.content
    if (updatedFields.link !== undefined) payload.link = updatedFields.link
    if (updatedFields.tags !== undefined) payload.tags = updatedFields.tags
    if (updatedFields.summary !== undefined) payload.summary = updatedFields.summary
    if (updatedFields.readingTimeMin !== undefined) payload.readingTimeMin = updatedFields.readingTimeMin

    if (Object.keys(payload).length > 0) {
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
        })

        if (!res.ok) {
          set({ folders: previousFolders })
        }
      } catch {
        set({ folders: previousFolders })
      }
    }
  },

  setActiveNote: (noteId, folderId) =>
    set(() => ({
      activeNote: noteId && folderId ? { noteId, folderId } : null
    }))

}))
