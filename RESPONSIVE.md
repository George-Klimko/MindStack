# 📱 Адаптивная вёрстка в MindStack

## 🎯 Принципы адаптивности

### **Mobile First**
Сначала стили для мобильных, потом для десктопа:

```tsx
// ✅ Правильно
<div className="text-sm sm:text-base lg:text-lg" />

// ❌ Неправильно
<div className="text-lg sm:text-base md:text-sm" />
```

---

## 📐 Breakpoints (Tailwind CSS 4)

| Breakpoint | Мин. ширина | Устройства |
|------------|-------------|------------|
| `sm:` | 640px | Мобильные (landscape) |
| `md:` | 768px | Планшеты (portrait) |
| `lg:` | 1024px | Планшеты (landscape) |
| `xl:` | 1280px | Десктопы |
| `2xl:` | 1536px | Большие экраны |

---

## 🎨 Компоненты

### **1. Header**

#### **Мобильная версия (< 640px):**
```
┌─────────────────────────────┐
│ MindStack       [⚙] [👤]  │  ← h-14
├─────────────────────────────┤
│ [Вставь ссылку...]    [→] │  ← Узкий input
└─────────────────────────────┘
```

#### **Десктоп (≥ 640px):**
```
┌─────────────────────────────────────────────────┐
│           [Вставь ссылку...] [→]  [⚙] [Имя👤] │  ← h-16
├─────────────────────────────────────────────────┤
│      Обработано сегодня: 12                     │  ← Stats bar
└─────────────────────────────────────────────────┘
```

**Ключевые классы:**
```tsx
<header className="
  h-14 sm:h-16                    ← Высота
  px-3 sm:px-4 md:px-6           ← Отступы
">
  <div className="
    flex items-center gap-2       ← Mobile
    sm:gap-4                      ← Desktop
  ">
    <Button className="
      h-9 w-9                     ← Mobile
      sm:h-10 sm:w-10            ← Desktop
    ">
      <Settings className="
        h-4 w-4                   ← Mobile
        sm:h-5 sm:w-5            ← Desktop
      " />
    </Button>
  </div>
</header>
```

---

### **2. Главная страница (Лента)**

#### **Мобильная версия:**
```
┌──────────────────┐
│ Главная          │  ← text-2xl
│ 5 из 20 заметок  │
│ [Сброс]          │
├──────────────────┤
│ [🔍 Поиск...]    │  ← h-10
├──────────────────┤
│ 🏷️ Теги          │
│ [React] [Next] → │  ← Scroll
├──────────────────┤
│ 📁 Папки         │
│ [Все] [Inbox] →  │  ← Scroll
├──────────────────┤
│ Сегодня          │
│ ┌──────────────┐ │
│ │ Карточка     │ │  ← 1 колонка
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ Карточка     │ │
│ └──────────────┘ │
└──────────────────┘
```

#### **Планшет (≥ 640px):**
```
┌────────────────────────────────┐
│ Главная          [Сбросить]   │  ← text-3xl
│ 5 из 20 заметок                │
├────────────────────────────────┤
│ [🔍 Поиск...]                  │  ← h-11
├────────────────────────────────┤
│ 🏷️ Теги                        │
│ [React] [Next] [AI] [UX] →     │
├────────────────────────────────┤
│ 📁 Папки                       │
│ [Все] [Inbox] [Work] →         │
├────────────────────────────────┤
│ Сегодня                        │
│ ┌────────┐ ┌────────┐         │
│ │ Карта  │ │ Карта  │         │  ← 2 колонки
│ └────────┘ └────────┘         │
│ ┌────────┐ ┌────────┐         │
│ │ Карта  │ │ Карта  │         │
│ └────────┘ └────────┘         │
└────────────────────────────────┘
```

#### **Десктоп (≥ 1024px):**
```
┌──────────────────────────────────────────────────────┐
│ Главная                      [Сбросить фильтры]     │
│ 5 из 20 заметок                                      │
├──────────────────────────────────────────────────────┤
│ [🔍 Поиск...]                                        │
├──────────────────────────────────────────────────────┤
│ 🏷️ Теги                                              │
│ [React] [Next.js] [TypeScript] [AI] [UX] [Design] → │
├──────────────────────────────────────────────────────┤
│ 📁 Папки                                             │
│ [Все] [Inbox] [Work] [Personal] [Archive] →         │
├──────────────────────────────────────────────────────┤
│ Сегодня                                              │
│ ┌────────┐ ┌────────┐ ┌────────┐                   │
│ │ Карта  │ │ Карта  │ │ Карта  │                   │  ← 3 колонки
│ └────────┘ └────────┘ └────────┘                   │
│ ┌────────┐ ┌────────┐ ┌────────┐                   │
│ │ Карта  │ │ Карта  │ │ Карта  │                   │
│ └────────┘ └────────┘ └────────┘                   │
└──────────────────────────────────────────────────────┘
```

**Ключевые классы:**
```tsx
<div className="
  w-full
  p-3 sm:p-4 md:p-6 lg:p-8              ← Отступы
  max-w-[1600px] mx-auto                ← Макс. ширина
  space-y-4 sm:space-y-6                ← Отступы между секциями
">
  <h1 className="
    text-2xl sm:text-3xl                ← Размер шрифта
    font-bold
  ">
  
  <Input className="
    h-10 sm:h-11                        ← Высота
  "/>
  
  <div className="
    grid gap-3 sm:gap-4                 ← Отступы между карточками
    grid-cols-1                         ← Mobile: 1 колонка
    sm:grid-cols-2                      ← Tablet: 2 колонки
    lg:grid-cols-3                      ← Desktop: 3 колонки
  ">
```

---

### **3. Карточка заметки**

**Адаптивность внутри:**
```tsx
<Card className="
  hover:shadow-lg
  transition-all
  duration-200
">
  <CardHeader>
    <CardTitle className="
      text-lg                           ← Всегда один размер
      line-clamp-2                      ← Обрезать 2 строки
    ">
    <CardDescription className="
      text-xs flex-wrap                 ← Перенос тегов
    ">
  </CardHeader>
  
  <CardContent>
    <div className="
      flex flex-wrap gap-1.5            ← Гибкие теги
    ">
      {tags.slice(0, 5).map(tag => (
        <Badge className="
          text-xs                       ← Маленький текст
          px-3 py-1                     ← Фиксированные отступы
        ">
      ))}
    </div>
  </CardContent>
</Card>
```

---

## 🔧 Утилиты

### **1. Скрытие элементов**

```tsx
// Скрыть на мобильном
<span className="hidden sm:inline">Текст</span>

// Скрыть на десктопе
<span className="sm:hidden">Текст</span>

// Скрыть на планшете
<span className="md:hidden">Текст</span>
```

### **2. Flexbox/Grid**

```tsx
// Mobile: вертикально, Desktop: горизонтально
<div className="
  flex flex-col           ← Mobile
  sm:flex-row             ← Desktop
  gap-3 sm:gap-4          ← Разные отступы
">

// Mobile: 1 колонка, Desktop: 2 колонки
<div className="
  grid 
  grid-cols-1             ← Mobile
  sm:grid-cols-2          ← Desktop
">
```

### **3. Отступы (Spacing)**

```tsx
// Меньше на мобильном
<div className="
  p-3 sm:p-4 md:p-6       ← Padding
  m-2 sm:m-4              ← Margin
  gap-3 sm:gap-4          ← Gap
">
```

### **4. Размеры (Sizing)**

```tsx
// Меньше на мобильном
<div className="
  h-14 sm:h-16            ← Height
  w-full sm:w-auto        ← Width
  text-sm sm:text-base    ← Text size
">
```

---

## 📱 Навигация на мобильном

### **Sidebar на мобильном:**

```tsx
// В layout.tsx
<SidebarProvider>
  <AppSidebar />          ← Скрывается автоматически
  <SidebarTrigger />      ← Кнопка гамбургер
  <Header />
  <main>{children}</main>
</SidebarProvider>
```

**На мобильном:**
- Sidebar скрыт
- SidebarTrigger показывает гамбургер
- При клике — sidebar выезжает слева

---

## ✅ Чеклист адаптивности

- [ ] Header: h-14 на мобильном, h-16 на десктопе
- [ ] Input: h-10 на мобильном, h-11 на десктопе
- [ ] Кнопки: h-9 w-9 на мобильном, h-10 w-10 на десктопе
- [ ] Иконки: h-4 w-4 на мобильном, h-5 w-5 на десктопе
- [ ] Заголовки: text-2xl на мобильном, text-3xl на десктопе
- [ ] Текст: text-xs/sm на мобильном, text-sm/base на десктопе
- [ ] Отступы: p-3/sm:p-4/md:p-6
- [ ] Сетка: grid-cols-1/sm:grid-cols-2/lg:grid-cols-3
- [ ] Горизонтальный скролл для тегов/папок
- [ ] Кнопки на всю ширину на мобильном (w-full sm:w-auto)

---

## 🎯 Примеры кода

### **Адаптивная кнопка:**
```tsx
<Button
  size="sm"
  className="
    w-full sm:w-auto        ← На мобильном во всю ширину
    h-9 sm:h-10            ← Разная высота
  "
>
  <span className="hidden sm:inline">Полный текст</span>
  <span className="sm:hidden">Коротко</span>
</Button>
```

### **Адаптивная карточка:**
```tsx
<Card className="
  p-3 sm:p-4 md:p-6        ← Отступы
">
  <CardTitle className="
    text-lg sm:text-xl     ← Размер шрифта
  ">
</Card>
```

### **Адаптивная сетка:**
```tsx
<div className="
  grid
  grid-cols-1              ← 1 колонка (mobile)
  sm:grid-cols-2           ← 2 колонки (tablet)
  lg:grid-cols-3           ← 3 колонки (desktop)
  gap-3 sm:gap-4           ← Отступы
">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

---

## 📚 Ресурсы

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/breakpoints)
- [Mobile First Design](https://www.smashingmagazine.com/2018/11/understanding-mobile-first-design/)
