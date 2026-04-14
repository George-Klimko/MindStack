/**

 * @module entities/note
 */


export interface Note {
  id: string
  title: string
  content: string
  link?: string
  tags: string[]
  date: string
  summary?: string
  readingTimeMin?: number
  folderId?: string  
}


export interface Folder {
  id: string
  title: string
  notes: Note[]
}


export interface NoteWithFolder extends Note {
  folder: {
    id: string
    name: string
  }
}


export interface NoteInFolder extends Note {
  folderId: string
}


export interface NotePayload {
  title: string
  content?: string
  link?: string
  tags?: string[]
  summary?: string
  readingTimeMin?: number
}


export interface FolderPayload {
  title: string
}


export interface NotesFilter {
  search?: string
  tag?: string
  folderId?: string
}


export interface GeneratedNoteData {
  summary: string
  detailed: string
  tags: string[]
  shortTitle: string
}


export interface GeneratedNoteDataWithCategory extends GeneratedNoteData {
  folderName: string
  confidence?: number
}
