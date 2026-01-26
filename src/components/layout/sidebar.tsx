"use client"


//sidebar
import { useState } from "react"
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
  const updateNote = useNotesStore((s) => s.updateNote)
  const setActiveNote = useNotesStore((s) => s.setActiveNote)

  return (
      <>
    <Sidebar collapsible="offcanvas">
      {/* ---------- HEADER ---------- */}
      <SidebarHeader className="flex flex-row items-center justify-start ">


        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {setDialogOpen(true)}}
          title="Add folder"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </SidebarHeader>

      {/* ---------- CONTENT ---------- */}
      <SidebarContent>
        <SidebarMenu>

          {folders.map((folder) => (
            <Collapsible
              key={folder.id}
              open={openFolders[folder.id]}
              onOpenChange={() => toggleFolder(folder.id)}
              className="group/collapsible"
            >
              <SidebarMenuItem>

                {/* FOLDER BUTTON */}
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="flex items-center">
                    <FolderIcon />
                    <span>{folder.title}</span>
                    <div className="flex-1"></div>
                    <Button
                        size="icon"
                        variant="ghost"
                        title="Add Note"
                        onClick={(e => {
                          e.stopPropagation(); // Чтобы не срабатывал Collapsible
                          setSelectedFolderId(folder.id);
                          setDialogOpenNotes(true);
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
                      <SidebarMenuSubItem >
                        <span className="px-3 text-xs text-muted-foreground">
                          Empty
                        </span>
                      </SidebarMenuSubItem>
                    )}

                    {folder.notes.map((note) => (
                      <SidebarMenuSubItem  onClick={() => setActiveNote(note.id, folder.id)} key={note.id}>
                        <SidebarMenuSubButton>
                          <FileText className="h-4 w-4" />
                          <span>{note.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>

              </SidebarMenuItem>
            </Collapsible>
          ))}

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
