"use client"

import { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
  Link2,
} from "lucide-react"

interface TiptapToolbarProps {
  editor: Editor | null
}

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null

  const setLink = () => {
    const url = window.prompt("Введите ссылку:")
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 rounded-t-lg">
      <Button
        variant={editor.isActive("bold") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive("italic") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive("strike") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className="h-8 w-8 p-0"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-8 w-8 p-0"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive("codeBlock") ? "secondary" : "ghost"}
        size="sm"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className="h-8 w-8 p-0"
      >
        <Code className="h-4 w-4" />
      </Button>

      <Button
        variant={editor.isActive("link") ? "secondary" : "ghost"}
        size="sm"
        onClick={setLink}
        className="h-8 w-8 p-0"
      >
        <Link2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="h-8 w-8 p-0"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="h-8 w-8 p-0"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  )
}
