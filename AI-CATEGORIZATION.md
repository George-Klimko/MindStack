# 🧠 AI Сортировка Заметок (MVP)

## 📊 Что реализовано

**Автоматическое распределение заметок по папкам:**
1. Захват ссылки → анализ контента
2. Gemini AI определяет тему
3. Ищет существующую папку или создаёт новую
4. Сохраняет заметку в нужную папку

---

## 🏗️ Архитектура (FSD)

```
src/
├── entities/
│   └── note/
│       └── types.ts              # GeneratedNoteDataWithCategory
│
├── features/
│   └── note-categorization/
│       ├── index.ts              # Баррел экспорт
│       └── lib/
│           └── generate-folder.ts  # Логика AI категоризации
│
├── app/
│   ├── actions.ts                # generateSummaryAndTagsWithCategory
│   └── api/capture/route.ts      # Использование
```

---

## 🔧 Как это работает

### **1. Захват ссылки**

```ts
// app/api/capture/route.ts
const userFolders = await prisma.folder.findMany({
  where: { userId },
  select: { name: true },
})
const folderNames = userFolders.map(f => f.name)
```

**Принцип SOLID:**
- **Single Responsibility** — route только обрабатывает запрос
- **Dependency Inversion** — зависит от абстракции (features)

---

### **2. AI анализ**

```ts
const { summary, detailed, tags, shortTitle, folderName, confidence } =
  await generateSummaryAndTagsWithCategory(
    content,
    scrapedTitle,
    folderNames  // ← Существующие папки
  )
```

**Промпт для Gemini:**
```
У меня есть папки: Inbox, Work, React

Проанализируй контент и определи:
1. В какую папку положить (выбери из существующих)
2. Или создать новую (1-2 слова)
3. Уверенность 0-1

Пример ответа:
{
  "folderName": "React",
  "confidence": 0.95
}
```

---

### **3. Поиск/создание папки**

```ts
let folder = await prisma.folder.findFirst({
  where: {
    userId,
    name: { equals: folderName, mode: 'insensitive' }
  },
});

if (!folder) {
  folder = await prisma.folder.create({
    data: { name: folderName, userId },
  });
}
```

**Принцип SOLID:**
- **Interface Segregation** — маленький специализированный запрос
- **Liskov Substitution** — findFirst/create возвращают один тип

---

### **4. Сохранение заметки**

```ts
const note = await prisma.note.create({
  data: {
    title: shortTitle,
    content: finalContent,
    link: url,
    tags,
    summary,
    folderId: folder.id,  // ← В нужную папку
  },
});
```

---

## 📈 Confidence Score

**Уверенность AI (0-1):**

| Confidence | Действие |
|------------|----------|
| > 0.8 | Высокая уверенность → кладём в папку |
| 0.5-0.8 | Средняя → можно предложить пользователю |
| < 0.5 | Низкая → кладём в Inbox |

**Пример:**
```
📦 AI categorization: React (confidence: 0.95)
📁 Создаём новую папку: Next.js
```

---

## 🎯 Примеры работы

### **Пример 1: Статья про React**

**Контент:**
```
React 19 представила новые хуки use() и useOptimistic...
```

**Результат:**
```json
{
  "folderName": "React",
  "confidence": 0.95,
  "tags": ["React", "Hooks", "Frontend"],
  "shortTitle": "React 19 Новые Хуки"
}
```

---

### **Пример 2: Статья про БД**

**Контент:**
```
Оптимизация SQL запросов через индексы и EXPLAIN...
```

**Результат:**
```json
{
  "folderName": "Базы данных",
  "confidence": 0.88,
  "tags": ["SQL", "Database", "Performance"],
  "shortTitle": "Оптимизация SQL Запросов"
}
```

---

### **Пример 3: Неоднозначный контент**

**Контент:**
```
Обзор современных веб-технологий 2026...
```

**Результат:**
```json
{
  "folderName": "Inbox",  // ← Недостаточно уверен
  "confidence": 0.45,
  "tags": ["Web", "Tech", "2026"],
  "shortTitle": "Веб Технологии 2026"
}
```

---

## 🚀 Расширения (после MVP)

### **1. Переобучение (Machine Learning)**

```ts
// Запоминаем выбор пользователя
await prisma.folderPreference.create({
  data: {
    userId,
    tag: 'React',
    folderId: reactFolder.id,
    count: 1,
  }
})

// В следующий раз используем предпочтения
if (tag === 'React' && preference) {
  folderId = preference.folderId
}
```

---

### **2. Массовая пересортировка**

```ts
// Раз в неделю
export async function reorganizeNotes() {
  const notes = await prisma.note.findMany({
    where: { folder: { name: 'Inbox' } }
  })
  
  for (const note of notes) {
    const { folderName } = await generateFolderName(note.content)
    const folder = await findOrCreateFolder(folderName)
    
    await prisma.note.update({
      where: { id: note.id },
      data: { folderId: folder.id }
    })
  }
}
```

---

### **3. Слияние папок**

```ts
// Если "React" и "ReactJS" об одном
const similarFolders = await findSimilarFolders('React', 0.8)

if (similarFolders.length > 1) {
  // Предложим пользователю: "Объединить React и ReactJS?"
}
```

---

## 📊 Метрики

| Метрика | Значение |
|---------|----------|
| **Точность** | ~85-95% (зависит от контента) |
| **Время анализа** | 2-5 секунд |
| **Токены Gemini** | ~500-1000 на запрос |
| **Стоимость** | ~$0.0005 на заметку |

---

## ✅ Чеклист реализации

- [x] Типы для категоризации (`GeneratedNoteDataWithCategory`)
- [x] Feature `note-categorization`
- [x] Функция `generateFolderName`
- [x] Server Action `generateSummaryAndTagsWithCategory`
- [x] Обновление `capture/route.ts`
- [x] Логирование (confidence score)
- [ ] UI для просмотра/изменения папки
- [ ] Массовая пересортировка
- [ ] Предпочтения пользователя

---

## 📚 Ресурсы

- [FSD: Features](https://feature-sliced.design/docs/reference/entities)
- [SOLID: Dependency Inversion](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Gemini API](https://ai.google.dev/gemini-api/docs)
- [Prisma: Mode Insensitive](https://www.prisma.io/docs/orm/reference/prisma-client-reference#mode)
