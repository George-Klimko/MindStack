  "use client"

  import React, { useState } from "react"
  import { 
    Calendar, 
    Tag as TagIcon, 
    Link as LinkIcon, 
    X, 
    ExternalLink,
    Check,
    Save
  } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import { Textarea } from "@/components/ui/textarea"
  import { Badge } from "@/components/ui/badge"
  import { Separator } from "@/components/ui/separator"
  import { NoteEditorProps } from "@/types/noteEditor"

  export function NoteEditor({ draft, onChange, onSave }: NoteEditorProps) {
    const [tagInput, setTagInput] = useState("")

    if (!draft) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50/50 dark:bg-transparent">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
            <TagIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-medium text-foreground">Заметка не выбрана</h2>
          <p className="text-sm text-muted-foreground max-w-[200px] mt-2">
            Выберите материал из списка слева, чтобы начать работу.
          </p>
        </div>
      )
    }

    const removeTag = (tagToRemove: string) => {
      onChange({
        tags: draft.tags.filter((t) => t !== tagToRemove),
      })
    }

    return (
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-background">
        {/* --- TOP ACTIONS BAR --- */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            {draft.date || "Сегодня"}
          </div>
            <Button onClick={onSave} size="sm" className="
                gap-2
                shadow-md
                hover:shadow-lg
                active:scale-95
                transition-all
                duration-150
                focus-visible:ring-2
                focus-visible:ring-primary
              ">
            <Save className="w-4 h-4" />
            Сохранить
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-8">
            
            {/* --- TITLE --- */}
            <textarea
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Заголовок заметки..."
              className="w-full text-4xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/30 focus:ring-0 p-0"
              rows={1}
            />

            {/* --- METADATA PANEL --- */}
            <div className="grid grid-cols-1 gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-border/50">
              
              {/* Link Row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-24 text-sm text-muted-foreground">
                  <LinkIcon className="w-4 h-4" />
                  <span>Источник</span>
                </div>
                <div className="flex-1 flex items-center gap-2 group">
                  <Input
                    value={draft.link}
                    onChange={(e) => onChange({ link: e.target.value })}
                    placeholder="Вставьте ссылку на материал..."
                    className="h-8 bg-transparent border-none focus-visible:ring-1 focus-visible:ring-ring px-2 transition-all"
                  />
                  {draft.link && (
                    <a href={draft.link} target="_blank" className="text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Tags Row */}
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 w-24 pt-1.5 text-sm text-muted-foreground">
                  <TagIcon className="w-4 h-4" />
                  <span>Теги</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {draft.tags.filter(t => t !== "").map((tag, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="pl-2 pr-1 py-1 gap-1 border-none bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                        <button 
                          onClick={() => removeTag(tag)}
                          className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
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
                    className="h-8 w-40 bg-transparent border-dashed border-border hover:border-primary transition-all focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="relative group">
              <Textarea
                value={draft.content}
                onChange={(e) => onChange({ content: e.target.value })}
                placeholder="Здесь будет ваш AI-саммари или личные мысли..."
                className="w-full min-h-[400px] text-lg leading-relaxed bg-transparent border-none focus-visible:ring-0 p-0 resize-none placeholder:text-muted-foreground/20"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
