# MindStack 🧠

> **Ваш персональный AI-ассистент для управления знаниями**

MindStack — это интеллектуальная система для сбора, организации и обработки информации. Сохраняйте статьи, видео и заметки в одном месте, а AI автоматически создаст краткое содержание, теги и структурирует ваши знания.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Apache%202.0-green)](LICENSE)

---

## 🌟 Возможности

### ✨ AI-захват контента
- **Автоматическое извлечение** — вставьте ссылку, AI скачает контент
- **Умное резюме** — 4-8 ключевых пунктов из любой статьи
- **Авто-тегирование** — релевантные теги без ручного ввода
- **Краткий заголовок** — 3-4 слова вместо длинных названий

### 📚 Организация знаний
- **Папки и теги** — гибкая система категоризации
- **Поиск** — по заголовкам, содержанию и AI-резюме
- **Фильтры** — по тегам, папкам, дате
- **Markdown редактор** — редактирование с предпросмотром

### 🎯 Быстрый доступ
- **Мгновенный поиск** — находите сохранённое за секунды
- **Группировка** — "Сегодня", "Вчера", "На этой неделе"
- **Контекстное меню** — быстрый доступ к действиям
- **Адаптивный дизайн** — работает на телефоне и десктопе

---

## 🚀 Быстрый старт

### Требования

- **Node.js** 20+ 
- **pnpm** 8+
- **PostgreSQL** 14+
- **Git**

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/George-Klimko/MindStack.git
cd MindStack

# Установка зависимостей
pnpm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env, добавив ваши ключи

# Генерация Prisma клиента
pnpm prisma generate

# Применение миграций
pnpm prisma migrate deploy

# Запуск dev-сервера
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000)

---

## 🔧 Настройка

### Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/mindstack"

# NextAuth (аутентификация)
NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (для входа)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Google Gemini AI (для обработки контента)
GEMINI_API_KEY="your-gemini-api-key"
```

### Получение API ключей

1. **Google OAuth**: [Google Cloud Console](https://console.cloud.google.com/)
   - Создайте проект
   - Включите Google+ API
   - Создайте OAuth 2.0 credentials
   - Добавьте `http://localhost:3000/api/auth/callback/google` в redirect URIs

2. **Gemini AI**: [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Создайте API ключ
   - Бесплатно: 60 запросов в минуту

---

## 📖 Использование

### 1. Вход в систему

Нажмите **"Войти через Google"** в правом верхнем углу.

### 2. Захват контента

Вставьте ссылку в поле в шапке сайта:
```
https://habr.com/ru/articles/987382/
```

AI автоматически:
- Скачает содержимое страницы
- Создаст краткое резюме (4-8 пунктов)
- Подберёт теги (5-10 штук)
- Сократит заголовок

### 3. Просмотр заметок

- **Главная** — лента всех заметок с группировкой по дате
- **Поиск** — фильтрация по тексту, тегам, папкам
- **Редактор** — клик по заметке для редактирования

### 4. Организация

- **Создать папку** — кнопка `+` в сайдбаре
- **Добавить заметку** — кнопка `+` у папки
- **Удалить** — ПКМ → "Удалить"

---

## 🏗️ Архитектура

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # REST API endpoints
│   ├── note/[id]/         # Страница редактора
│   └── page.tsx           # Главная (лента)
│
├── entities/              # Бизнес-сущности (FSD)
│   └── note/types.ts      # Типы Note, Folder
│
├── features/              # Бизнес-фичи (FSD)
│   └── note-categorization/
│
├── components/            # React компоненты
│   ├── layout/           # Sidebar, Header
│   ├── features/         # NoteCard
│   └── ui/               # shadcn/ui
│
├── store/                 # Zustand (глобальное состояние)
│   └── notes.store.ts
│
└── lib/                   # Утилиты
    ├── prisma.ts         # Prisma клиент
    └── markdown.ts       # Markdown конвертация
```

---

## 🛠️ Технологический стек

| Категория | Технология | Версия |
|-----------|------------|--------|
| **Фреймворк** | Next.js 16 | App Router |
| **Язык** | TypeScript | 5.x |
| **UI** | React 19 + Tailwind CSS 4 | — |
| **Компоненты** | shadcn/ui | New York |
| **Анимации** | Framer Motion | 12.x |
| **База данных** | PostgreSQL + Prisma | 7.x |
| **Аутентификация** | NextAuth.js | 4.24 |
| **State** | Zustand | 5.x |
| **AI** | Google Gemini | 1.34 |
| **Editor** | Tiptap + Markdown | 3.20 |

---

## 📦 API Endpoints

### Заметки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/notes` | Получить все заметки |
| `POST` | `/api/notes` | Создать заметку |
| `PATCH` | `/api/notes/:id` | Обновить заметку |
| `DELETE` | `/api/notes/:id` | Удалить заметку |

### Папки

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `GET` | `/api/folders` | Получить все папки |
| `POST` | `/api/folders` | Создать папку |
| `DELETE` | `/api/folders?id=` | Удалить папку |

### Захват контента

| Метод | Endpoint | Описание |
|-------|----------|----------|
| `POST` | `/api/capture` | Захватить URL через AI |

---

## 🧪 Разработка

```bash
# Запуск dev-сервера
pnpm dev

# Сборка проекта
pnpm build

# Запуск production
pnpm start

# Линтинг
pnpm lint

# Тесты (в разработке)
pnpm test
```

---

## 🗺️ Roadmap

### Ближайшие планы

- [ ] Экспорт в Notion/Obsidian
- [ ] YouTube транскрипты
- [ ] Связи между заметками
- [ ] Публичные подборки
- [ ] Еженедельный дайджест
- [ ] Мобильное приложение

### Долгосрочные цели

- [ ] Совместная работа (команды)
- [ ] API для разработчиков
- [ ] Расширения для браузера
- [ ] Интеграция с Pocket/Instapaper

---

## 🤝 Вклад в проект

Приветствуются PR,Issues и предложения!

### Как внести вклад

1. Форкните репозиторий
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Закоммитьте изменения (`git commit -m 'Add amazing feature'`)
4. Запушьте (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Правила кода

- Используйте TypeScript
- Следуйте FSD архитектуре
- Пишите тесты для новых фич
- Документируйте сложные решения

---

## 📄 Лицензия

Apache License 2.0 — см. [LICENSE](LICENSE)

---

## 🙏 Благодарности

- [shadcn/ui](https://ui.shadcn.com/) — UI компоненты
- [Tiptap](https://tiptap.dev/) — Rich text редактор
- [Prisma](https://www.prisma.io/) — ORM
- [Next.js](https://nextjs.org/) — Фреймворк
- [Gemini AI](https://ai.google.dev/) — AI обработка

---

## 📬 Контакты

- **GitHub**: [@George-Klimko](https://github.com/George-Klimko)
- **Проект**: [MindStack](https://github.com/George-Klimko/MindStack)

---

<div align="center">

**MindStack** — Превращаем информацию в знания 🧠

Made with ❤️ using Next.js + TypeScript

</div>
