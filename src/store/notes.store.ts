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
  notes: [],
  
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
      if (!res.ok) throw new Error("Failed to fetch notes")

      const notes = (await res.json()) as (Note & { folder: { id: string; name: string } })[]
      
      set((state) => {

        const flatNotes = notes.map(note => ({
          ...note,
          folderId: note.folder.id 
        }))

      const updatedFolders = state.folders.map(folder => {

        const folderNotes = notes.filter(n => n.folder.id === folder.id)
        
        return {
          ...folder,
          notes: folderNotes 
        }
      })

      return {
        notes: flatNotes,
        folders: updatedFolders,
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
    // 1. Создаем временную заметку для мгновенного отображения (Optimistic UI)
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
      folderId, // Обязательно добавляем, чтобы она появилась в ленте
    }

    // 2. Сразу пушим в оба списка
    set((state) => ({
      folders: state.folders.map((folder) =>
        folder.id === folderId
          ? { ...folder, notes: [tempNote, ...folder.notes] }
          : folder
      ),
      notes: [tempNote, ...state.notes], // Добавляем в начало плоского списка
    }))

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, title: title.trim() }),
      })

      if (!res.ok) throw new Error("Failed to create note")

      const realNote = (await res.json()) as Note
      // Добавляем folderId к ответу сервера, если его там нет
      const finalNote = { ...realNote, folderId }

      // 3. Заменяем временную заметку на реальную (с настоящим ID из базы)
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                notes: folder.notes.map((n) => (n.id === tempNoteId ? finalNote : n)),
              }
            : folder
        ),
        notes: state.notes.map((n) => (n.id === tempNoteId ? finalNote : n)),
      }))
    } catch (error) {
      console.error("Error adding note:", error)
      // 4. Откат: если сервер не ответил, удаляем временную заметку отовсюду
      set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === folderId
            ? { ...folder, notes: folder.notes.filter((n) => n.id !== tempNoteId) }
            : folder
        ),
        notes: state.notes.filter((n) => n.id !== tempNoteId),
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

  const previousFolders = get().folders
  const previousNotes = get().notes


  set((state) => ({

    folders: state.folders.map((folder) =>
      folder.id === folderId
        ? { ...folder, notes: folder.notes.filter((n) => n.id !== noteId) }
        : folder
    ),

    notes: state.notes.filter((n) => n.id !== noteId),
    activeNote: state.activeNote?.noteId === noteId ? null : state.activeNote,
  }))

  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!res.ok) throw new Error()
  } catch {
    // Если сервер ответил ошибкой — возвращаем оба массива назад
    set({ folders: previousFolders, notes: previousNotes })
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
    const previousFolders = get().folders
    const previousNotes = get().notes

    // 1. Оптимистичное обновление в стейте
    set((state) => ({
      // Обновляем в плоском списке
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, ...updatedFields } : note
      ),
      // Обновляем внутри папок
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

    // 2. Отправка на сервер (логика остается прежней)
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
        credentials: "include",
      })

      if (!res.ok) throw new Error()
    } catch {
      // Откат при ошибке сети или сервера
      set({ folders: previousFolders, notes: previousNotes })
    }
  },

  setActiveNote: (noteId, folderId) =>
    set(() => ({
      activeNote: noteId && folderId ? { noteId, folderId } : null
    }))

}))
