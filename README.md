# KeksOwl blog

Personal bilingual blog (EN/RU) built with Next.js, TypeScript, SCSS, and MDX.

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

Create a folder in `content/blog/` with `en.mdx` and `ru.mdx`:

```
content/blog/my-post/
├── en.mdx
└── ru.mdx
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

---

# Блог KeksOwl

Личный двуязычный блог (EN/RU) на Next.js, TypeScript, SCSS и MDX.

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

Создать папку в `content/blog/` с файлами `en.mdx` и `ru.mdx`:

```
content/blog/my-post/
├── en.mdx
└── ru.mdx
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
