// src/types/ui.ts

export interface AddFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

}

export interface AddFolderDialogPropsNote {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId: string 
}