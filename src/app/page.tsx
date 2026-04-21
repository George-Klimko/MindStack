"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, X } from "lucide-react"
import { useNotesStore } from "@/store/notes.store"
import { NoteCard } from "@/components/layout/note-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { type NoteWithFolder } from "@/entities/note/types"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)

  const [notes, setNotes] = useState<NoteWithFolder[]>([])
  const removeNote = useNotesStore((s) => s.removeNote)
  const loadFolders = useNotesStore((s) => s.loadFolders)
  const [allTags, setAllTags] = useState<string[]>([])
  const folders = useNotesStore((s) => s.folders)
  const isInitialized = useNotesStore((s) => s.isInitialized)

const loadFilteredNotes = useCallback(async () => {
  setIsLoading(true)
  
  const params = new URLSearchParams()
  if (searchQuery) params.set("search", searchQuery)
  if (selectedTag) params.set("tag", selectedTag)
  if (selectedFolder) params.set("folderId", selectedFolder)
  
  const res = await fetch(`/api/notes?${params}`)
  if (res.ok) {
    const data = await res.json()
    setNotes(data)
    
    // Загружаем теги только при первой загрузке
    if (allTags.length === 0) {
      const tagsRes = await fetch('/api/notes')  // Без фильтров для тегов
      if (tagsRes.ok) {
        const allNotesData = await tagsRes.json()
        setAllTags(Array.from(new Set(allNotesData.flatMap((n: NoteWithFolder) => n.tags))).sort())
      }
    }
  }
  
  setIsLoading(false)
}, [searchQuery, selectedTag, selectedFolder, allTags.length])


  // Загрузка данных при монтировании
  useEffect(() => {
    const initializeData = async () => {
      // Сначала загружаем папки если нужно
      if (!isInitialized) {
        await loadFolders()
      }
      
      // Затем загружаем заметки
      await loadFilteredNotes()
      setIsLoading(false)
    }
    
    initializeData()
  }, [isInitialized, loadFolders, loadFilteredNotes])

  const filteredNotes = notes 

  // Группировка по дате
  const groupedNotes = useMemo(() => {
    return filteredNotes.reduce((acc, note) => {
    const date = new Date(note.date)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
    let group: string
    if (days === 0) group = "Сегодня"
    else if (days === 1) group = "Вчера"
    else if (days < 7) group = "Эта неделя"
    else group = "Ранее"
  
    if (!acc[group]) acc[group] = []
    acc[group].push(note)
    return acc
  }, {} as Record<string, NoteWithFolder[]>)

  }, [filteredNotes]) 


  const handleDelete = useCallback((noteId: string, folderId: string) => {
    removeNote(folderId, noteId)
    setNotes(prev => prev.filter(n => n.id !== noteId))
  }, [removeNote])

  const handleTagClick = useCallback( (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag)
  }, [])

  const clearFilters = useCallback( () => {
    setSearchQuery("")
    setSelectedTag(null)
    setSelectedFolder(null)
  }, [])

  return ( 
    <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Главная</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {filteredNotes.length} Заметок
          </p>
        </div>

        {filteredNotes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="gap-2 w-full sm:w-auto"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Сбросить фильтры</span>
            <span className="sm:hidden">Сброс</span>
          </Button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по заметкам..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 sm:h-11"
        />
      </div>

      {/* Фильтры */}
      <div className="space-y-3 sm:space-y-4">
        {/* Теги — горизонтальный скролл */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Теги</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs sm:text-sm px-3 py-1"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Папки — горизонтальный скролл */}
        {folders.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Папки</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                <Badge
                  variant={!selectedFolder ? "default" : "outline"}
                  className="cursor-pointer transition-colors text-xs sm:text-sm px-3 py-1"
                  onClick={() => setSelectedFolder(null)}
                >
                  Все
                </Badge>
                {folders.map((folder) => (
                  <Badge
                    key={folder.id}
                    variant={selectedFolder === folder.id ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs sm:text-sm px-3 py-1"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    {folder.title}
                  </Badge>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Активные фильтры */}
      {(selectedTag || selectedFolder) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Фильтры:</span>
          {selectedTag && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              {selectedTag}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {selectedFolder && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => setSelectedFolder(null)}
            >
              {folders.find((f) => f.id === selectedFolder)?.title}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}

      {/* Лента заметок */}
      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">Загрузка...</p>
            </motion.div>
          ) : filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <p className="text-muted-foreground">
                {searchQuery || selectedTag || selectedFolder
                  ? "Ничего не найдено"
                  : "Пока нет заметок"}
              </p>
            </motion.div>
          ) : (

            Object.entries(groupedNotes).map(([group, groupNotes]) => (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                <h2 className="text-lg font-semibold sticky top-0 bg-background/80 backdrop-blur py-2 z-10">
                  {group}
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                  {groupNotes.map((note) => (
                    <div key={note.id} className="min-h-[280px]">
                      <NoteCard
                        key={note.id}
                        id={note.id}
                        title={note.title}
                        summary={note.summary || ""}
                        content={note.content}
                        link={note.link}
                        tags={note.tags}
                        readingTimeMin={note.readingTimeMin}
                        date={note.date}
                        folder={note.folder}
                        onDelete={() => handleDelete(note.id, note.folderId!)}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
