# MindStack — Проект Next.js для управления заметками

## Обзор проекта

**MindStack** — это веб-приложение для управления заметками с AI-интеграцией, построенное на **Next.js 16** с использованием **React 19**, **TypeScript** и **Prisma** для работы с базой данных PostgreSQL. Приложение предоставляет интерфейс для создания, организации и редактирования заметок с поддержкой папок, тегов, автосохранения и захвата контента из веб-страниц с помощью Google Gemini AI.

### Основные технологии

| Категория | Технология | Версия |
|-----------|------------|--------|
| **Фреймворк** | Next.js | 16.1.1 |
| **Язык** | TypeScript | 5.x |
| **UI-библиотека** | React | 19.2.3 |
| **Стилизация** | Tailwind CSS + shadcn/ui | 4.x / New York |
| **Анимации** | Framer Motion | 12.x |
| **База данных** | PostgreSQL + Prisma | 7.x |
| **Аутентификация** | NextAuth.js | 4.24 |
| **State Management** | Zustand | 5.0.9 |
| **Иконки** | Lucide React | 0.562.0 |
| **Rich Text Editor** | Tiptap | 3.20.0 |
| **AI Integration** | Google Generative AI | 1.34.0 |
| **Пакетный менеджер** | pnpm | — |

### Архитектура приложения

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # REST API endpoints
│   │   ├── auth/[...nextauth]/   # NextAuth конфигурация (Google OAuth)
│   │   ├── capture/              # AI-захват контента (Gemini)
│   │   ├── folders/              # CRUD папок
│   │   └── notes/                # CRUD заметок
│   ├── actions.ts                # Server Actions для AI-функций
│   ├── globals.css               # Глобальные стили Tailwind + CSS-переменные
│   ├── layout.tsx                # Корневой layout с SidebarProvider
│   ├── page.tsx                  # Главная страница (редактор заметок)
│   └── providers.tsx             # SessionProvider для NextAuth
│
├── components/
│   ├── layout/                   # Компоненты макета
│   │   ├── header.tsx            # Шапка с input для захвата URL
│   │   ├── noteEditor.tsx        # Редактор заметок с Tiptap
│   │   └── sidebar.tsx           # Боковая панель с навигацией
│   ├── modal/                    # Модальные окна
│   │   ├── add-folder-dialog.tsx # Диалог создания папки
│   │   └── add-notes-dialog.tsx  # Диалог создания заметки
│   └── ui/                       # UI компоненты shadcn/ui + кастомные
│       ├── tiptap-editor.tsx     # Обёртка над Tiptap
│       ├── tiptap-toolbar.tsx    # Панель инструментов редактора
│       └── ...                   # Другие shadcn/ui компоненты
│
├── hooks/
│   └── use-mobile.ts             # Хук для определения мобильного устройства
│
├── lib/
│   ├── markdown.ts               # Утилиты конвертации HTML ↔ Markdown
│   ├── prisma.ts                 # Prisma клиент singleton
│   └── utils.ts                  # cn() утилита для классов
│
├── store/
│   └── notes.store.ts            # Zustand store для заметок и папок
│
└── types/
    ├── next-auth.d.ts            # Типизация NextAuth сессий
    ├── noteEditor.ts             # Типы для редактора
    ├── notes.ts                  # Типы Note и Folder
    └── ui.ts                     # UI типы
```

---

## Модель данных (Prisma)

### Схема базы данных

```prisma
User
├── id: String (cuid)
├── name: String
├── email: String? (unique)
├── image: String?
├── createdAt: DateTime
├── emailVerified: DateTime?
├── accounts: Account[]
└── folders: Folder[]

Account (NextAuth)
├── id: String (cuid)
├── userId: String → User
├── provider: String
├── providerAccountId: String
├── refresh_token: String?
├── access_token: String?
├── expires_at: Int?
├── token_type: String?
├── scope: String?
├── id_token: String?
└── session_state: String?

Folder
├── id: String (cuid)
├── name: String
├── userId: String → User
└── notes: Note[]

Note
├── id: String (uuid)
├── title: String
├── content: String (Markdown)
├── link: String?
├── tags: String[]
├── summary: String?
├── readingTimeMin: Int?
├── date: DateTime
└── folderId: String → Folder
```

---

## Сборка и запуск

### Установка зависимостей

```bash
# Основной пакетный менеджер - pnpm
pnpm install
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/mindstack"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (для аутентификации)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI (для захвата контента)
GEMINI_API_KEY="your-gemini-api-key"
NEXTAUTH_JWT_SECRET="your-jwt-secret"
```

### Команды разработки

```bash
# Запуск dev-сервера
pnpm dev

# Сборка проекта
pnpm build

# Запуск production-сервера
pnpm start

# Линтинг кода
pnpm lint
```

### Работа с Prisma

```bash
# Генерация Prisma клиента
npx prisma generate

# Создание новой миграции
npx prisma migrate dev --name <migration_name>

# Применение миграций в production
npx prisma migrate deploy

# Открытие Prisma Studio
npx prisma studio
```

---

## Конвенции разработки

### TypeScript

- **Строгий режим** включён в `tsconfig.json`
- **Path aliases**: `@/*` → `./src/*`
- **Модульная система**: ESNext с bundler resolution
- **JSX**: react-jsx (Next.js App Router)

### Структура импортов

```typescript
// Внешние зависимости
import React from "react"
import { useState } from "react"

// Библиотеки
import { create } from "zustand"
import { motion } from "framer-motion"

// Внутренние модули (с alias)
import { cn } from "@/lib/utils"
import { NoteEditor } from "@/components/layout/noteEditor"
import { useNotesStore } from "@/store/notes.store"
import { Folder, Note } from "@/types/notes"
```

### Именование файлов

| Тип | Формат | Пример |
|-----|--------|--------|
| **Компоненты** | PascalCase | `NoteEditor.tsx`, `Sidebar.tsx` |
| **Хуки** | kebab-case с префиксом `use-` | `use-mobile.ts` |
| **Stores** | kebab-case с суффиксом `.store.ts` | `notes.store.ts` |
| **API routes** | kebab-case по ресурсам | `folders/route.ts` |
| **Типы** | kebab-case | `notes.ts`, `noteEditor.ts` |
| **Server Actions** | kebab-case | `actions.ts` |

### Компоненты

- Все компоненты в `src/components` используют **TSX**
- UI компоненты shadcn/ui расположены в `components/ui/`
- Layout компоненты в `components/layout/`
- Для условных классов используется утилита `cn()` из `@/lib/utils`
- **React 19 правила**:
  - Не вызывать `setState` внутри `useEffect` напрямую
  - Не обращаться к `ref.current` во время рендера
  - Не использовать impure функции (например, `Math.random()`) во время рендера

### State Management

- **Zustand** для глобального состояния (заметки, папки)
- Хранение состояния в `src/store/`
- Паттерн: `use<Feature>Store` для доступа к store
- Оптимистичные обновления с откатом при ошибке

### API Routes

- RESTful структура в `src/app/api/`
- Аутентификация через NextAuth сессии
- Ответы в формате JSON с proper HTTP статусами
- Валидация входных данных обязательна
- Обработка ошибок через try-catch

### Стилизация

- **Tailwind CSS 4** с CSS-переменными
- **shadcn/ui** New York style с `stone` как базовым цветом
- **Framer Motion** для анимаций переходов
- Поддержка тёмной темы через CSS-переменные

### Git

- Игнорируемые файлы указаны в `.gitignore`
- Prisma артефакты (`generated/prisma`) не коммитятся
- `.env*` файлы игнорируются по умолчанию
- Next.js артефакты (`.next/`, `out/`) игнорируются

---

## Известные проблемы и технические долги

### Критические (React 19)

1. **`src/app/page.tsx`** — Нарушение правил React 19:
   - `setState` внутри `useEffect` (строки 37, 58)
   - Missing dependencies в `useEffect` (строки 33, 42, 65)
   
2. **`src/components/layout/noteEditor.tsx`** — Доступ к `ref.current` во время рендера (строка 231)

3. **`src/components/ui/sidebar.tsx`** — Вызов impure функции `Math.random()` во время рендера (строка 611)

### Архитектурные

- Отсутствие валидации данных в API (рекомендуется Zod)
- Нет rate limiting для API endpoints
- Примитивная конвертация Markdown ↔ HTML (потеря данных)
- Прямой доступ к Zustand store вне компонентов

### Безопасность

- Нет sanitization для HTML контента (XSS риск)
- Отсутствие CSRF защиты для мутаций
- API ключи в `.env` без шифрования

---

## API Endpoints

### Аутентификация

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler (Google OAuth) |

### Папки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/folders` | Получить все папки пользователя с заметками |
| POST | `/api/folders` | Создать новую папку |

### Заметки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/notes` | Получить все заметки пользователя |
| POST | `/api/notes` | Создать новую заметку |
| PATCH | `/api/notes/[noteId]` | Обновить заметку |

### Захват контента

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/capture` | Захватить контент со страницы через Gemini AI |

---

## Server Actions

### `src/app/actions.ts`

| Функция | Описание |
|---------|----------|
| `askGemini(prompt: string)` | Запрос к Gemini AI |
| `generateSummaryAndTags(content: string)` | Генерация summary, detailed контента и тегов для захваченной страницы |

---

## Лицензия

Apache License 2.0
