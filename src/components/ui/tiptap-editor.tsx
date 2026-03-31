"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import CodeBlock from "@tiptap/extension-code-block"
import Typography from "@tiptap/extension-typography"
import { useEffect, forwardRef, useImperativeHandle } from "react"

export interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export interface TiptapEditorRef {
  editor: Editor | null
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  function TiptapEditor({ content, onChange, placeholder = "Напишите что-нибудь..." }, ref) {
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          codeBlock: false,
        }),
        CodeBlock.configure({
          HTMLAttributes: {
            class: "rounded-lg bg-slate-900 text-slate-100 p-4 my-4 font-mono text-sm",
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline hover:text-primary/80",
          },
        }),
        Typography,
      ],
      content,
      editorProps: {
        attributes: {
          class:
            "prose prose-stone dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4",
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
      },
    })

    useImperativeHandle(ref, () => ({ editor }), [editor])

    // Обновление контента при изменении draft извне
    useEffect(() => {
      if (!editor || content === editor.getHTML()) return
      editor.commands.setContent(content, { emitUpdate: true })
    }, [content, editor])

    return <EditorContent editor={editor} />
  }
)
