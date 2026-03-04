# MindStack — Проект Next.js для управления заметками

## Обзор проекта

**MindStack** — это веб-приложение для управления заметками, построенное на **Next.js 16** с использованием **React 19**, **TypeScript** и **Prisma** для работы с базой данных PostgreSQL. Приложение предоставляет интерфейс для создания, организации и редактирования заметок с поддержкой папок, тегов и автосохранения.

### Основные технологии

| Категория | Технология |
|-----------|------------|
| **Фреймворк** | Next.js 16.1.1 (App Router) |
| **Язык** | TypeScript 5 |
| **UI-библиотека** | React 19.2.3 |
| **Стилизация** | Tailwind CSS 4 + shadcn/ui (New York style) |
| **Анимации** | Framer Motion 12 |
| **База данных** | PostgreSQL + Prisma 7 |
| **Аутентификация** | NextAuth.js 4.24 |
| **State Management** | Zustand 5 |
| **Иконки** | Lucide React |
| **AI Integration** | Google Generative AI |

### Архитектура приложения

```
src/
├── app/                 # Next.js App Router страницы и API routes
│   ├── api/            # REST API endpoints
│   │   ├── auth/       # NextAuth конфигурация
│   │   ├── folders/    # CRUD операции для папок
│   │   ├── notes/      # CRUD операции для заметок
│   │   └── capture/    # API для захвата контента
│   ├── globals.css     # Глобальные стили Tailwind
│   ├── layout.tsx      # Корневой layout с SidebarProvider
│   ├── page.tsx        # Главная страница (редактор заметок)
│   └── providers.tsx   # SessionProvider для NextAuth
├── components/
│   ├── layout/         # Компоненты макета
│   │   ├── header.tsx  # Шапка приложения
│   │   ├── sidebar.tsx # Боковая панель с навигацией
│   │   └── noteEditor.tsx # Редактор заметок
│   ├── modal/          # Модальные окна
│   └── ui/             # UI компоненты shadcn/ui
├── hooks/              # Кастомные React хуки
│   └── use-mobile.ts   # Хук для определения мобильного устройства
├── lib/                # Утилиты и конфигурации
│   ├── prisma.ts       # Prisma клиент singleton
│   └── utils.ts        # cn() утилита для классов
├── store/              # Zustand stores
│   └── notes.store.ts  # Глобальное состояние заметок
└── types/              # TypeScript типы
    └── notes.ts        # Типы Note и Folder
```

### Модель данных (Prisma)

```
User
├── id: String (cuid)
├── name: String
├── email: String? (unique)
├── image: String?
├── emailVerified: DateTime?
├── createdAt: DateTime
├── accounts: Account[]
├── folders: Folder[]

Folder
├── id: String (cuid)
├── name: String
├── userId: String → User
└── notes: Note[]

Note
├── id: String (uuid)
├── title: String
├── content: String
├── link: String?
├── tags: String[]
├── summary: String?
├── readingTimeMin: Int?
├── date: DateTime
└── folderId: String → Folder
```

## Сборка и запуск

### Установка зависимостей

```bash
# Основной пакетный менеджер - pnpm
pnpm install
```

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mindstack"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
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

# Создание миграции
npx prisma migrate dev

# Применение миграций
npx prisma migrate deploy

# Открытие Prisma Studio
npx prisma studio
```

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

- **Компоненты**: PascalCase (`NoteEditor.tsx`, `Sidebar.tsx`)
- **Хуки**: kebab-case с префиксом `use-` (`use-mobile.ts`)
- **Stores**: kebab-case с суффиксом `.store.ts` (`notes.store.ts`)
- **API routes**: kebab-case по ресурсам (`folders/route.ts`)
- **Типы**: kebab-case (`notes.ts`)

### Компоненты

- Все компоненты в `src/components` используют **TSX**
- UI компоненты shadcn/ui расположены в `components/ui/`
- Layout компоненты в `components/layout/`
- Для условных классов используется утилита `cn()` из `@/lib/utils`

### State Management

- **Zustand** для глобального состояния (заметки, папки)
- Хранение состояния в `src/store/`
- Паттерн: `use<Feature>Store` для доступа к store

### API Routes

- RESTful структура в `src/app/api/`
- Аутентификация через NextAuth сессии
- Ответы в формате JSON с proper HTTP статусами

### Стилизация

- **Tailwind CSS 4** с CSS-переменными
- **shadcn/ui** New York style с stone как базовым цветом
- **Framer Motion** для анимаций переходов

### Git

- Игнорируемые файлы указаны в `.gitignore`
- Prisma артефакты (`.prisma/client`) не коммитятся
- `.env*` файлы игнорируются по умолчанию

## Лицензия

Apache License 2.0
