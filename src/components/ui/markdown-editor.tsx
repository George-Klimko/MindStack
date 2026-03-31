"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder = "Напишите что-нибудь..."
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Авто-высота textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [content])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col"
    >
      {/* Toggle Preview */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-xs text-muted-foreground">
          {isPreview ? "Preview" : "Markdown"}
        </span>
        <button
          onClick={() => setIsPreview(!isPreview)}
          className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition"
        >
          {isPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {isPreview ? (
        /* Preview Mode */
        <div className="flex-1 p-4 prose prose-stone dark:prose-invert max-w-none overflow-y-auto min-h-[500px] custom-scrollbar">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        /* Edit Mode */
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full min-h-[500px] p-4
            bg-transparent
            border-none
            outline-none
            resize-none
            font-mono text-sm
            leading-relaxed
            placeholder:text-muted-foreground/50
            custom-scrollbar
          `}
        />
      )}
    </motion.div>
  )
}
