"use client"

//sidebar
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AddFolderDialog } from "@/components/modal/add-folder-dialog"
import { AddFolderDialogNote } from "../modal/add-notes-dialog"
import Link from "next/link"
import { signIn, signOut, useSession } from "next-auth/react"
import {
  Folder as FolderIcon,
  FileText,
  Plus,
  ChevronDown,
  Trash2,
  Home,
  LogOut,
} from "lucide-react"

import { useRouter } from "next/navigation"  // ← ДОБАВИТЬ
import { useNotesStore } from "@/store/notes.store"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Separator } from "@/components/ui/separator"

/* ---------------- SIDEBAR ---------------- */

/**
 * Компонент профиля пользователя
 * Отображается в footer sidebar
 */
function UserProfile() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return session ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-auto py-2 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? ""} />
            <AvatarFallback className="text-xs">
              {session.user.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-sm font-medium truncate">
              {session.user.name || "Пользователь"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {session.user.email}
            </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => signOut()}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      onClick={() => signIn("google")}
      variant="outline"
      className="w-full gap-2"
    >
      <span>Войти через Google</span>
    </Button>
  )
}

export function AppSidebar() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogOpeNotes, setDialogOpenNotes] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const folders = useNotesStore((s) => s.folders)
  const openFolders = useNotesStore((s) => s.openFolders)
  const toggleFolder = useNotesStore((s) => s.toggleFolder)
  const setActiveNote = useNotesStore((s) => s.setActiveNote)
  const activeNote = useNotesStore((s) => s.activeNote)
  const loadFolders = useNotesStore((s) => s.loadFolders)
  const removeNote = useNotesStore((s) => s.removeNote)
  const removeFolder = useNotesStore((s) => s.removeFolder)
  const router = useRouter()
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  return (
    <>
      <Sidebar collapsible="offcanvas">
        {/* ---------- HEADER ---------- */}
        <SidebarHeader className="flex flex-row items-center justify-between px-2 gap-2">
          <Link href="/" className="flex-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-8"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm font-semibold">Главная</span>
            </Button>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDialogOpen(true)}
            title="Добавить папку"
            className="h-8 w-8 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </SidebarHeader>

        {/* ---------- CONTENT ---------- */}
        <SidebarContent>
          <SidebarMenu>
            <AnimatePresence initial={false}>
              {folders.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <Collapsible
                    open={openFolders[folder.id]}
                    onOpenChange={() => toggleFolder(folder.id)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem className="group/folder-item relative">
                      {/* FOLDER BUTTON с контекстным меню */}
                      <ContextMenu>
                        <ContextMenuTrigger asChild>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="flex items-center transition-colors duration-200 hover:bg-sidebar-accent/80">
                              <FolderIcon className="transition-transform duration-200 group-hover/collapsible:scale-110" />
                              <span className="flex-1 truncate">{folder.title}</span>
                              
                              {/* ADD NOTE BUTTON — внутри строки папки */}
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Добавить заметку"
                                className="h-7 w-7 hover:scale-105 hover:bg-sidebar-accent/50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedFolderId(folder.id)
                                  setDialogOpenNotes(true)
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              
                              <ChevronDown
                                className="
                                  ml-1 h-4 w-4
                                  transition-transform
                                  group-data-[state=open]/collapsible:rotate-180
                                "
                              />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem
                            onClick={() => removeFolder(folder.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить папку
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>

                      {/* NOTES */}
                      <CollapsibleContent>
                        <SidebarMenuSub className="border-l border-sidebar-border/50">
                          {folder.notes.length === 0 && (
                            <SidebarMenuSubItem>
                              <span className="px-3 py-1.5 text-xs text-muted-foreground italic">
                                Пусто
                              </span>
                            </SidebarMenuSubItem>
                          )}

                          <AnimatePresence initial={false}>
                            {folder.notes.map((note) => (
                              <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ duration: 0.15 }}
                              >
                                <SidebarMenuSubItem>
                                  <ContextMenu>
                                    <ContextMenuTrigger asChild>
                                      <SidebarMenuSubButton
                                        onClick={() => router.push(`/note/${note.id}`)}
                                        className={`
                                          cursor-pointer transition-colors
                                          ${activeNote?.noteId === note.id 
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                                            : "hover:bg-sidebar-accent/50"
                                          }
                                        `}
                                      >
                                        <FileText className="h-4 w-4 shrink-0" />
                                        <span className="truncate flex-1">{note.title}</span>
                                      </SidebarMenuSubButton>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent className="w-48">
                                      <ContextMenuItem
                                        onClick={() => removeNote(folder.id, note.id)}
                                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Удалить
                                      </ContextMenuItem>
                                    </ContextMenuContent>
                                  </ContextMenu>
                                </SidebarMenuSubItem>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </motion.div>
              ))}
            </AnimatePresence>
          </SidebarMenu>
        </SidebarContent>

        {/* ---------- FOOTER — Профиль пользователя ---------- */}
        <div className="border-t p-3">
          <UserProfile />
        </div>
      </Sidebar>

      <AddFolderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
      <AddFolderDialogNote
        open={dialogOpeNotes}
        onOpenChange={setDialogOpenNotes}
        folderId={selectedFolderId!}
      />
    </>
  )
}
