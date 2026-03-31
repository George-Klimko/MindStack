"use client"

import React, { useRef, useEffect } from "react"
import { motion } from "framer-motion"

export interface PlainTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function PlainTextEditor({
  content,
  onChange,
  placeholder = "Напишите что-нибудь..."
}: PlainTextEditorProps) {
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
      className="w-full"
    >
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
        style={{
          fieldSizing: 'content' as const,
        }}
      />
    </motion.div>
  )
}
