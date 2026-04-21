"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, Link as LinkIcon, ExternalLink, Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { type NoteCardProps } from "@/shared/ui/types"
import { memo } from "react"

    // Извлекаем домен из ссылки
    const getDomain = (url?: string) => {
      if (!url) return null
      try {
        const parsed = new URL(url)
        return parsed.hostname.replace("www.", "")
      } catch {
        return null
      }
    }

export const NoteCard = memo(

  function NoteCard({
    id,
    title,
    summary,
    link,
    tags,
    readingTimeMin,
    date,
    folder,
    onTagClick,
    onDelete,
  }: NoteCardProps) {
    const router = useRouter()
  
    // Вызываем onDelete с пробросом события
    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.()
    }
    // Форматируем дату
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
      if (days === 0) return "Сегодня"
      if (days === 1) return "Вчера"
      if (days < 7) return `${days} дн. назад`
      
      return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
      })
    }
  

  
    const domain = getDomain(link)
    const summaryLines = summary.split("\\n").filter(Boolean).slice(0, 3)
  
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={() => router.push(`/note/${id}`)}
            className="h-full"
          >
            <Card 
              className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary h-full flex flex-col"
            >
              <CardHeader className="pb-3 flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold line-clamp-2 mb-1">
                      {title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-xs flex-wrap">
                      {domain && (
                        <span className="flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {domain}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(date)}
                      </span>
                      {readingTimeMin && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {readingTimeMin} мин
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
  
                  {/* Кнопка открытия ссылки */}
                  {link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(link, "_blank")
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
  
              <CardContent className="space-y-3 flex-grow">
                {/* Summary */}
                {summary && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {summaryLines.map((line, i) => (
                      <p key={i} className="line-clamp-2">{line}</p>
                    ))}
                  </div>
                )}
  
                {/* Теги */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    {tags.slice(0, 5).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTagClick?.(tag)
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 5 && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        +{tags.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </ContextMenuTrigger>
  
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => router.push(`/note/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Открыть
          </ContextMenuItem>
          {link && (
            <ContextMenuItem onClick={() => window.open(link, "_blank")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Открыть оригинал
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }
) 
