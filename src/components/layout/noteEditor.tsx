"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Tag as TagIcon,
  Link as LinkIcon,
  X,
  ExternalLink,
  Save,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { NoteEditorProps } from "@/types/noteEditor"

export function NoteEditor({ draft, onChange, onSave }: NoteEditorProps) {
  const [tagInput, setTagInput] = useState("")

  /* ================= EMPTY STATE ================= */
  if (!draft) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 dark:bg-transparent"
      >
        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <TagIcon className="w-8 h-8 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-medium">Заметка не выбрана</h2>
        <p className="text-sm text-muted-foreground max-w-[220px] mt-2">
          Выберите материал из списка слева, чтобы начать работу.
        </p>
      </motion.div>
    )
  }

  const removeTag = (tag: string) => {
    onChange({
      tags: draft.tags.filter((t) => t !== tag),
    })
  }

  /* ================= MAIN EDITOR ================= */
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={draft.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="max-w-4xl mx-auto w-full flex flex-col h-full bg-background"
      >
        {/* ---------- TOP BAR ---------- */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            {draft.date || "Сегодня"}
          </div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onSave}
              size="sm"
              className="gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Сохранить
            </Button>
          </motion.div>
        </div>

        {/* ---------- CONTENT ---------- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-8">

            {/* ----- TITLE ----- */}
            <motion.textarea
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Заголовок заметки..."
              rows={1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="
                w-full text-4xl font-bold bg-transparent border-none outline-none
                resize-none placeholder:text-muted-foreground/30 p-0
              "
            />

            {/* ----- META PANEL ----- */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="grid gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border"
            >
              {/* Link */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-24 text-sm text-muted-foreground">
                  <LinkIcon className="w-4 h-4" />
                  Источник
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={draft.link ?? ""}
                    onChange={(e) => onChange({ link: e.target.value })}
                    placeholder="Ссылка..."
                    className="h-8 bg-transparent border-none px-2"
                  />
                  {draft.link && (
                    <a
                      href={draft.link}
                      target="_blank"
                      className="text-muted-foreground hover:text-primary transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Tags */}
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 w-24 pt-1.5 text-sm text-muted-foreground">
                  <TagIcon className="w-4 h-4" />
                  Теги
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {draft.tags.filter(Boolean).map((tag) => (
                        <motion.div
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Badge
                            variant="secondary"
                            className="pl-2 pr-1 py-1 gap-1 bg-primary/10 text-primary"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="hover:bg-primary/20 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Input
                    placeholder="Добавить тег..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        onChange({ tags: [...draft.tags, tagInput.trim()] })
                        setTagInput("")
                      }
                    }}
                    className="h-8 w-40 bg-transparent border-dashed"
                  />
                </div>
              </div>
            </motion.div>

            {/* ----- CONTENT ----- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Textarea
                value={draft.content}
                onChange={(e) => onChange({ content: e.target.value })}
                placeholder="Текст заметки..."
                className="
                  w-full min-h-[400px] text-lg leading-relaxed bg-transparent
                  border-none resize-none placeholder:text-muted-foreground/20
                "
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
