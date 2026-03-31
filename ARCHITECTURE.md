# Архитектура MindStack (FSD + SOLID)

## 📁 Структура проекта

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints (Features)
│   ├── note/[noteId]/            # Страница заметки (Pages)
│   ├── actions.ts                # Server Actions (Features)
│   ├── layout.tsx                # Корневой layout
│   ├── page.tsx                  # Главная страница (Pages)
│   └── providers.tsx             # Providers
│
├── entities/                     # Бизнес-сущности
│   ├── note/                     # Сущность "Заметка"
│   │   ├── types.ts              # Типы для заметок
│   │   └── index.ts              # Экспорты
│   └── index.ts                  # Баррел экспорты
│
├── components/                   # UI компоненты (Widgets)
│   ├── layout/                   # Layout компоненты
│   │   ├── header.tsx
│   │   ├── noteEditor.tsx
│   │   └── sidebar.tsx
│   ├── modal/                    # Модальные окна
│   └── ui/                       # Базовые UI компоненты
│
├── shared/                       # Общие утилиты
│   ├── ui/                       # UI типы
│   │   ├── types.ts
│   │   └── index.ts
│   └── index.ts
│
├── store/                        # Глобальное состояние (App)
│   ├── notes.store.ts
│   └── types.ts
│
├── lib/                          # Библиотеки и утилиты
│   ├── markdown.ts
│   ├── prisma.ts
│   └── utils.ts
│
└── hooks/                        # Кастомные хуки
    └── use-mobile.ts
```

---

## 🏗️ Принципы архитектуры

### **1. FSD (Feature-Sliced Design)**

Проект разделён на **слои** по принципу ответственности:

| Слой | Описание | Примеры |
|------|----------|---------|
| **app** | Инициализация приложения | `layout.tsx`, `page.tsx`, роуты |
| **pages** | Страницы приложения | `/`, `/note/[id]` |
| **widgets** | Комплексные блоки | `Sidebar`, `Header`, `NoteEditor` |
| **features** | Бизнес-логика | `capture`, `addNote`, `deleteNote` |
| **entities** | Бизнес-сущности | `Note`, `Folder` |
| **shared** | Переиспользуемый код | `ui/types`, `utils` |

**Правило зависимостей:**
```
app → pages → widgets → features → entities → shared
```

---

### **2. SOLID**

#### **S — Single Responsibility**
Каждый файл отвечает за **одну задачу**:

```ts
// ❌ ПЛОХО: Типы в компоненте
function NoteCard({ id, title }: { id: string; title: string }) {}

// ✅ ХОРОШО: Типы отдельно
// entities/note/types.ts
export interface NoteCardProps { id: string; title: string }

// components/layout/note-card.tsx
import { type NoteCardProps } from "@/shared/ui/types"
function NoteCard({ id, title }: NoteCardProps) {}
```

#### **O — Open/Closed**
Компоненты **открыты для расширения**, закрыты для изменений:

```ts
// ✅ Базовый интерфейс
export interface Note {
  id: string
  title: string
  content: string
}

// ✅ Расширение без изменений
export interface NoteWithFolder extends Note {
  folder: { id: string; name: string }
}
```

#### **L — Liskov Substitution**
Базовые типы заменяемы расширенными:

```ts
function renderNote(note: Note) {}
renderNote(noteWithFolder) // ✅ Работает
```

#### **I — Interface Segregation**
Маленькие специализированные интерфейсы:

```ts
// ❌ ПЛОХО: Огромный интерфейс
interface NoteActions {
  create: () => void
  update: () => void
  delete: () => void
  load: () => void
  search: () => void
}

// ✅ ХОРОШО: Разделённые
interface NoteCreate { create: () => void }
interface NoteUpdate { update: () => void }
interface NoteDelete { delete: () => void }
```

#### **D — Dependency Inversion**
Зависимость от абстракций:

```ts
// ✅ Зависимость от интерфейса
interface NoteRepository {
  findById(id: string): Promise<Note>
}

class PrismaRepository implements NoteRepository {}
class MockRepository implements NoteRepository {}
```

---

## 📝 Правила именования

### **Файлы**

| Тип | Формат | Пример |
|-----|--------|--------|
| Компоненты | `PascalCase.tsx` | `NoteCard.tsx` |
| Типы | `kebab-case.ts` | `note.types.ts` |
| Хуки | `use-*.ts` | `use-notes.ts` |
| Store | `*.store.ts` | `notes.store.ts` |

### **Интерфейсы и Типы**

```ts
// ✅ Интерфейсы с большой буквы
export interface Note { ... }
export type NotePayload = { ... }

// ✅ Суффиксы для ясности
export interface NoteCardProps { ... }  // Пропсы компонента
export interface NoteState { ... }      // Состояние
export interface NoteActions { ... }    // Действия
```

---

## 🔄 Поток данных

```
User Action (UI)
    ↓
Component (widgets/)
    ↓
Store (app/store/)
    ↓
API (app/api/)
    ↓
Database (Prisma)
    ↓
Response → Store → Component
```

**Пример:**

```tsx
// 1. Клик в компоненте
<Button onClick={() => removeNote(id)} />

// 2. Store action
removeNote: async (folderId, noteId) => {
  // Оптимистичное обновление
  set(...remove from state)
  
  // API запрос
  await fetch(`/api/notes/${noteId}`, { method: "DELETE" })
}

// 3. API Route
export async function DELETE(req, { params }) {
  await prisma.note.delete({ where: { id: noteId } })
}
```

---

## 📦 Импорт и экспорт

### **Баррел файлы (index.ts)**

```ts
// entities/index.ts
export * from "./note/types"

// Использование
import { type Note } from "@/entities"
```

### **Абсолютные пути**

```ts
// ✅ Правильно
import { NoteCard } from "@/components/layout/note-card"
import { type Note } from "@/entities/note/types"
import { cn } from "@/lib/utils"

// ❌ Неправильно
import { NoteCard } from "../../../components/layout/note-card"
```

---

## 🎯 Где писать новый код

| Что добавить | Куда писать |
|-------------|-------------|
| **Новая сущность** | `src/entities/<name>/types.ts` |
| **UI компонент** | `src/components/<type>/<name>.tsx` |
| **API endpoint** | `src/app/api/<name>/route.ts` |
| **Страница** | `src/app/<route>/page.tsx` |
| **Store** | `src/store/<name>.store.ts` |
| **Хук** | `src/hooks/use-<name>.ts` |
| **Утилита** | `src/lib/<name>.ts` |
| **Типы для UI** | `src/shared/ui/types.ts` |

---

## 🚀 Best Practices

### **1. Типизация**

```ts
// ✅ Всегда типизируй пропсы
interface NoteCardProps {
  id: string
  onDelete: () => void
}

// ✅ Используй type для union
type NoteStatus = "draft" | "published" | "archived"

// ✅ Используй interface для объектов
interface Note {
  id: string
  title: string
}
```

### **2. Компоненты**

```tsx
// ✅ Маленькие компоненты
function NoteCard({ note }: NoteCardProps) {
  return (
    <Card>
      <NoteHeader note={note} />
      <NoteContent note={note} />
      <NoteFooter note={note} />
    </Card>
  )
}

// ✅ Выноси логику в хуки
function useNotes() {
  const [notes, setNotes] = useState([])
  return { notes, setNotes }
}
```

### **3. Обработка ошибок**

```ts
try {
  await api.deleteNote(id)
} catch (error) {
  // ❌ Не игнорируй ошибки
  // ✅ Логируй и показывай пользователю
  console.error("Failed to delete note:", error)
  toast.error("Не удалось удалить заметку")
}
```

---

## 📚 Дополнительные ресурсы

- [FSD Specification](https://feature-sliced.design/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
