"use client"


//sidebar
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { AddFolderDialog } from "@/components/modal/add-folder-dialog"
import { AddFolderDialogNote } from "../modal/add-notes-dialog"
import {
  Folder as FolderIcon,
  FileText,
  Plus,
  ChevronDown,
} from "lucide-react"

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



/* ---------------- SIDEBAR ---------------- */

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

  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  return (
      <>
    <Sidebar collapsible="offcanvas">
      {/* ---------- HEADER ---------- */}
      <SidebarHeader className="flex flex-row items-center justify-start ">


        <Button
          size="icon"
          variant="ghost"
          onClick={() => {setDialogOpen(true)}}
          title="Add folder"
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
                  <SidebarMenuItem>

                    {/* FOLDER BUTTON */}
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center transition-colors duration-200 hover:bg-sidebar-accent/80">
                        <FolderIcon className="transition-transform duration-200 group-hover/collapsible:scale-110" />
                        <span>{folder.title}</span>
                        <div className="flex-1"></div>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Add Note"
                          className="transition-transform duration-200 hover:scale-110"
                          onClick={(e => {
                            e.stopPropagation() // Чтобы не срабатывал Collapsible
                            setSelectedFolderId(folder.id)
                            setDialogOpenNotes(true)
                          })}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <ChevronDown
                          className="
                        ml-auto h-4 w-4
                        transition-transform
                        group-data-[state=open]/collapsible:rotate-180
                      "
                        />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    {/* NOTES */}
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {folder.notes.length === 0 && (
                          <SidebarMenuSubItem>
                            <span className="px-3 text-xs text-muted-foreground">
                              Empty
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
                              transition={{ duration: 0.18 }}
                            >
                              <SidebarMenuSubItem onClick={() => setActiveNote(note.id, folder.id)}>
                                <SidebarMenuSubButton
                                  className={activeNote?.noteId === note.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span>{note.title}</span>
                                </SidebarMenuSubButton>
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
