//notes.store.ts

import { create } from "zustand"
import { type Note, type Folder } from "@/entities/note/types"
import { type NotesState } from "@/app/store/types"

/**
 * Время жизни кэша в миллисекундах
 * 5 минут = 5 * 60 * 1000
 */
const CACHE_TTL_MS = 5 * 60 * 1000

export const useNotesStore = create<NotesState>((set, get) => ({

  folders: [],
  openFolders: {},
  activeNote: null,
  isLoading: false,
  
  // Кэширование
  lastFetchTime: null,
  isInitialized: false,
  notesLastFetchTime: null,

  /**
   * Загрузка заметок с кэшированием
   */
  loadNotes: async (force = false) => {
    const state = get()
    const now = Date.now()
    
    // Проверяем кэш
    if (!force && state.notesLastFetchTime) {
      const cacheAge = now - state.notesLastFetchTime
      if (cacheAge < CACHE_TTL_MS) {
        console.log(` Using cached notes (age: ${Math.floor(cacheAge / 1000)}s)`)
        return
      }
    }

    set({ isLoading: true })
    
    try {
      const res = await fetch("/api/notes")
      if (!res.ok) return

      const notes = (await res.json()) as (Note & { folder: { id: string; name: string } })[]
      
      // Распределяем заметки по папкам
      set((state) => {
        const newFolders = [...state.folders]
        
        notes.forEach((note) => {
          const folderIndex = newFolders.findIndex((f) => f.id === note.folder.id)
          if (folderIndex !== -1) {
            // Проверяем нет ли уже такой заметки
            const noteExists = newFolders[folderIndex].notes.some((n) => n.id === note.id)
            if (!noteExists) {
              newFolders[folderIndex] = {
                ...newFolders[folderIndex],
                notes: [note, ...newFolders[folderIndex].notes],
              }
            }
          }
        })
        
        return {
          folders: newFolders,
          notesLastFetchTime: now,
          isLoading: false,
        }
      })
      
      console.log(`Loaded ${notes.length} notes`)
    } catch (error) {
      console.error('Error loading notes:', error)
      set({ isLoading: false })
    }
  },

  /**
   * Загрузка папок с кэшированием
   * @param force - принудительная загрузка (игнорировать кэш)
   */
  loadFolders: async (force = false) => {
    const state = get()
    const now = Date.now()
    
    // Проверяем кэш
    if (!force && state.isInitialized && state.lastFetchTime) {
      const cacheAge = now - state.lastFetchTime
      if (cacheAge < CACHE_TTL_MS) {
        // Кэш ещё валиден (меньше 5 минут)
        console.log(` Using cached folders (age: ${Math.floor(cacheAge / 1000)}s)`)
        return
      }
    }
    
    // Проверяем не загружается ли уже
    if (state.isLoading) {
      console.log(' Already loading...')
      return
    }

    set({ isLoading: true })
    
    try {
      const res = await fetch("/api/folders")
      if (!res.ok) {
        console.error('Failed to fetch folders:', res.status)
        return
      }

      const folders = (await res.json()) as Folder[]
      
      set({
        folders,
        openFolders: Object.fromEntries(folders.map((folder) => [folder.id, true])),
        lastFetchTime: now,
        isInitialized: true,
        isLoading: false,
      })
      
      console.log(` Loaded ${folders.length} folders`)
    } catch (error) {
      console.error('Error loading folders:', error)
      set({ isLoading: false })
    } finally {
      set({ isLoading: false })
    }
  },

  addFolder: async (title) => {
    // Оптимистичное создание папки
    const tempFolderId = `temp-${Date.now()}`
    const tempFolder: Folder = {
      id: tempFolderId,
      title: title.trim(),
      notes: [],
    }

    // Сразу добавляем в стейт
    set((state) => ({
      folders: [...state.folders, tempFolder],
      openFolders: {
        ...state.openFolders,
        [tempFolderId]: true,
      },
    }))

    // Отправляем на сервер
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!res.ok) {
        // Откат при ошибке
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== tempFolderId),
          openFolders: Object.fromEntries(
            Object.entries(state.openFolders).filter(
              ([id]) => id !== tempFolderId
            )
          ),
        }))
        return
      }

      const folder = (await res.json()) as Folder

      // Заменяем временную папку на реальную с сервера
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === tempFolderId ? folder : f
        ),
        openFolders: {
          ...state.openFolders,
          [folder.id]: true,
        },
      }))
    } catch {
      // Откат при ошибке сети
      set((state) => ({
        folders: state.folders.filter((f) => f.id !== tempFolderId),
        openFolders: Object.fromEntries(
          Object.entries(state.openFolders).filter(
            ([id]) => id !== tempFolderId
          )
        ),
      }))
    }
  },
  
  removeFolder: async (folderId) => {
    // Сохраняем предыдущее состояние для отката
    const previousFolders = useNotesStore.getState().folders

    // Оптимистичное удаление — сразу удаляем из стейта
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
      openFolders: Object.fromEntries(
        Object.entries(state.openFolders).filter(
          ([id]) => id !== folderId
        )
      ),
      // Сбрасываем activeNote если удалили активную папку
      activeNote: state.activeNote?.folderId === folderId ? null : state.activeNote,
    }))

    // Отправляем запрос на сервер
    try {
      const res = await fetch(`/api/folders?folderId=${folderId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        // Откат при ошибке
        set({ folders: previousFolders })
      }
    } catch {
      // Откат при ошибке сети
      set({ folders: previousFolders })
    }
  },

  addNote: async (folderId, title) => {
    // Оптимистичное создание заметки
    const tempNoteId = `temp-${Date.now()}`
    const tempNote: Note = {
      id: tempNoteId,
      title: title.trim(),
      content: "",
      tags: [],
      date: new Date().toISOString(),
      link: "",
      summary: "",
      readingTimeMin: 0,
    }

    // Сразу добавляем в стейт
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              notes: [tempNote, ...folder.notes],
            }
          : folder
      ),
    }))

    // Отправляем на сервер
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, title: title.trim() }),
      })

      if (!res.ok) {
        // Откат при ошибке
        set((state) => ({
          folders: state.folders.map((folder) =>
            folder.id === folderId
              ? {
                  ...folder,
                  notes: folder.notes.filter((n) => n.id !== tempNoteId),
                }
              : folder
          ),
        }))
        return
      }

      const note = (await res.json()) as Note

      // Заменяем временную заметку на реальную с сервера
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                notes: folder.notes.map((n) =>
                  n.id === tempNoteId ? note : n
                ),
              }
            : folder
        ),
      }))
    } catch {
      // Откат при ошибке сети
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                notes: folder.notes.filter((n) => n.id !== tempNoteId),
              }
            : folder
        ),
      }))
    }
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

  removeNote: async (folderId, noteId) => {
    // Сохраняем предыдущее состояние для отката
    const previousFolders = useNotesStore.getState().folders

    // Оптимистичное удаление — сразу удаляем из стейта
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              notes: folder.notes.filter((n) => n.id !== noteId),
            }
          : folder
      ),
      // Сбрасываем activeNote если удалили активную заметку
      activeNote: state.activeNote?.noteId === noteId ? null : state.activeNote,
    }))

    // Отправляем запрос на сервер
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        // Откат при ошибке
        set({ folders: previousFolders })
      }
    } catch {
      // Откат при ошибке сети
      set({ folders: previousFolders })
    }
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

    const payload: Partial<Note> = {}
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
