//notes.store.ts

import { create } from "zustand"
import { nanoid } from "nanoid"
import { Folder, Note } from "@/types/notes"

type NotesState = {
  folders: Folder[]
  openFolders: Record<string, boolean>
  activeNote: { noteId: string, folderId: string } | null


  addFolder: (title: string) => void
  removeFolder: (folderId: string) => void

  addNote: (folderId: string, title: string) => void

  toggleFolder: (folderId: string) => void

  updateNote: (
    folderId: string,
    noteId: string,
    updatedFields: Partial<Note>
  ) => void

  setActiveNote: (noteId: string | null) => void
}

export const useNotesStore = create<NotesState>((set) => ({

  folders: [
    {
      id: "inbox",
      title: "Inbox",
      notes: []
    }
  ],
  openFolders: {},

  activeNote: null,

  addFolder: (title) => 
    set((state) => {
      const id = nanoid()

      return {
        folders: [
          ...state.folders,
          {
            id,
            title,
            notes: [],
          },
        ],

        openFolders: {
          ...state.openFolders,
          [id]: true,
        }
      }
    }),
  
  removeFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
      openFolders: Object.fromEntries(
        Object.entries(state.openFolders).filter(
          ([id]) => id !== folderId
        )
      ),
    })),

  addNote: (folderId, title) =>
    set((state) => ({
      folders: state.folders.map((folder) =>
        
        folder.id === folderId
          ? {
              ...folder,
              notes: [
                ...folder.notes,
                {
                  id: nanoid(),
                  title,
                  summary: "",
                  tags: [""],
                  date:"",
                  content: "",
                } satisfies Note,
              ],
            }
          : folder
      ),
    })),
  
  toggleFolder: (folderId) =>
    set((state) => ({
      openFolders: {
        ...state.openFolders,
        [folderId]: !state.openFolders[folderId],
      },
    })),

  updateNote: (folderId: string, noteId: string, updatedFields: Partial<Note>) =>
    set((state) => ({
      folders: state.folders.map((folder) => {
        if (folder.id === folderId) {
          return {
            ...folder,
            notes: folder.notes.map((note) => {
              if (note.id === noteId) {
                return { ...note, ...updatedFields }
              }
              return note
            }),
          }
        }
        return folder
      }),
    })),

  setActiveNote: (noteId, folderId) =>
    set(() => ({
      activeNote: { noteId, folderId }
    }))



}))
