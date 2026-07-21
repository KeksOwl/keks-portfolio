# KeksOwl portfolio

Personal bilingual site (EN/RU) — home, CV and blog — built with Next.js, TypeScript, SCSS, and MDX.

## Stack

- **Next.js 16** — App Router, static export
- **TypeScript**
- **SCSS** — modules, global variables via `additionalData`
- **MDX** — blog posts with frontmatter
- **Lucide** — icons

## Local setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
pnpm build
```

Static output goes to `out/` — ready for GitHub Pages or any static hosting.

## Adding a blog post

Create a folder in `content/blog/` with `en.mdx` (required) and `ru.mdx` (optional):

```
content/blog/my-post/
├── en.mdx   # required — the page is generated from the English version
└── ru.mdx   # optional — without it the Russian locale falls back to English
```

Each file starts with frontmatter:

```mdx
---
title: "Post Title"
description: "Short description."
date: "2026-01-01"
---

Content here...
```

Finally, add the post URL to `public/sitemap.xml`:

```xml
<url>
  <loc>https://keksowl.com/blog/my-post</loc>
</url>
```

---

# Портфолио KeksOwl

Личный двуязычный сайт (EN/RU) — главная, резюме и блог — на Next.js, TypeScript, SCSS и MDX.

## Стек

- **Next.js 16** — App Router, статический экспорт
- **TypeScript**
- **SCSS** — модули, глобальные переменные через `additionalData`
- **MDX** — посты блога с frontmatter
- **Lucide** — иконки

## Локальный запуск

```bash
pnpm install
pnpm dev
```

Открыть [http://localhost:3000](http://localhost:3000).

## Сборка

```bash
pnpm build
```

Статика генерируется в `out/` — готова для GitHub Pages или любого статического хостинга.

## Добавление поста

Создать папку в `content/blog/` с файлом `en.mdx` (обязателен) и `ru.mdx` (опционален):

```
content/blog/my-post/
├── en.mdx   # обязателен — страница генерируется по английской версии
└── ru.mdx   # опционален — без него русская локаль откатывается на английский
```

Каждый файл начинается с frontmatter:

```mdx
---
title: "Заголовок поста"
description: "Краткое описание."
date: "2026-01-01"
---

Контент тут...
```

В конце добавить URL поста в `public/sitemap.xml`:

```xml
<url>
  <loc>https://keksowl.com/blog/my-post</loc>
</url>
```
