//notes

export type Note = {
  id: string
  title: string
  date: string
  summary?: string
  content: string
  tags: string[]
  link?: string
  readingTimeMin?: number
}

export type Folder = {
  id: string
  title: string
  notes: Note[]
}