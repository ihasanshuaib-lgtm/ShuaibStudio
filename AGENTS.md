# AGENTS.md — ShuaibStudio Project Guide

> This file is the single source of truth for this project. **Every time a change is requested, read this file first, make the change, then update this file to keep it accurate.**

---

## 1. Project Overview

**ShuaibStudio (شعيب استوديو)** is a single-page Arabic (RTL) photography booking website for a photography studio in Bahrain. Clients browse photography categories, view a gallery of past work, pick a package, add extra services, see a live price summary (with optional discount codes), then send the booking request via WhatsApp or email.

- **Language:** Arabic, right-to-left (`dir="rtl"`)
- **Currency:** Bahraini Dinar (BD), formatted to up to 3 decimals
- **Type:** Static website (HTML + CSS + vanilla JavaScript). No build step, no framework, no backend.
- **Entry point:** `index.html`

---

## 2. Tech Stack & Constraints

- **Pure static HTML/CSS/JS** — everything lives in one file: `index.html`.
- No package manager, no bundler, no dependencies. Open directly in a browser.
- Fonts loaded from Google Fonts: **Aref Ruqaa** (headings) and **Tajawal** (body).
- Must work by simply opening `index.html` (file://) or serving statically.
- Gallery images are loaded from the local `photos/` folder at runtime (client-side).

---

## 3. File & Folder Structure

```
ShuaibStudio/
├── AGENTS.md          # This documentation file (keep updated)
├── index.html         # The entire site: markup, styles, and scripts
├── hero.jpg           # Hero/studio image asset
├── photos/            # Gallery images for تصوير الأعراس (weddings)
│   ├── 0.jpeg
│   ├── 8.jpeg
│   ├── DSC02717.jpg
│   ├── DSC02746.jpg
│   ├── DSC02752.jpg
│   ├── gallery1.jpg
│   ├── gallery2.jpg
│   ├── gallery3.jpg
│   ├── gallery5.jpg
│   └── WhatsApp Image 2026-09-05 at 15.28.24.jpeg
├── prodacts_pic/      # Gallery images for تصوير منتجات وأطعمة (realestate)  — empty for now
├── Event_pic/         # Gallery images for تصوير إيفنت (event)              — empty for now
├── Editing_pic/       # Gallery images for مونتاج / تعديل (montage)         — empty for now
└── party_pic/         # Gallery images for حفل تخرج (graduation)            — empty for now
```

**One photo folder per category** — each category's gallery only shows photos from its own folder:

| Category key | Category (AR)        | Photo folder   |
|--------------|----------------------|----------------|
| `weddings`   | تصوير الأعراس        | `photos/`      |
| `realestate` | تصوير منتجات وأطعمة  | `prodacts_pic/`|
| `event`      | تصوير إيفنت          | `Event_pic/`   |
| `montage`    | مونتاج / تعديل       | `Editing_pic/` |
| `graduation` | حفل تخرج             | `party_pic/`   |

> Each photo folder contains a `.gitkeep` so the empty folders are still tracked by git (and stay available on GitHub Pages).
> `.DS_Store` files are macOS junk and are intentionally excluded from git commits.

---

## 4. index.html — Internal Structure

The file is organized in this order:

1. `<head>` — meta, title, Google Fonts, and the full `<style>` block.
2. `<body>` — the RTL page layout with these sections:
   - Top bar (studio logo + light/dark theme toggle)
   - Header (title + subtitle)
   - **Section ١** — "نوع التصوير" (category pills, `#categoriesList`)
   - **Gallery** — "من أعمالنا" (`#gallerySection`, `#gallerySlideshow`, `#galleryTitle`, `#galleryHint`)
   - **Section ٢** — "بيانات العميل" (client info form, `#infoCard`)
   - **Section ٣** — "اختر الباقة" (packages, `#packagesList`)
   - **Section ٤** — "خدمات إضافية" (extra services, `#servicesList`)
   - **Section ٥** — "ملخص الحجز" (booking summary card)
3. `<script>` — all application logic (see below).

### Theming (CSS variables)

Defined on `:root` (dark default) and overridden by `body.light-mode`. The `<body>` currently has `class="light-mode"` **by default**. Key variables: `--bg`, `--bg-soft`, `--card`, `--card-hover`, `--gold`, `--gold-light`, `--gold-dim`, `--text`, `--text-dim`, `--line`, `--green`. Theme toggle button is `#themeToggle`.

---

## 5. JavaScript Data Model

All configurable data is at the top of the `<script>`. Everything is keyed off a `CATEGORIES` object.

### CATEGORIES

Each category has: `name`, `icon`, `info` (form field labels/placeholders), `packages[]`, and `services[]`.

| Key          | Name (AR)                 | Packages | Services |
|--------------|---------------------------|----------|----------|
| `weddings`   | تصوير الأعراس             | 5        | 11       |
| `realestate` | تصوير منتجات وأطعمة       | 4        | 3        |
| `event`      | تصوير إيفنت               | 4        | 7        |
| `montage`    | مونتاج / تعديل            | 3        | 5        |
| `graduation` | حفل تخرج                  | 3        | 5        |

> Category **key order** in `CATEGORIES` determines display order of the pills. `weddings` is first.

- **Package shape:** `{id, name, icon, price, desc, badge?, tier?}`
  - `desc` uses `+` separators; it is split and re-joined for display.
  - `badge` (e.g. "الأكثر طلباً") adds the `.popular` highlight.
  - `tier` is currently retained in data but styling is default (no tier color coding).
- **Service shape:** `{id, name, price, note?, perUnit?}`
  - `note` shows a sub-line under the name (e.g. QR barcode explanation).
  - `perUnit: true` adds a quantity stepper and multiplies price by qty (used for printing photos).

### Gallery (one folder per category)

- `CATEGORY_PHOTOS` — maps every category key to `{ folder, photos[] }`:

  | Key          | `folder`        | `photos[]`                          |
  |--------------|-----------------|-------------------------------------|
  | `weddings`   | `photos/`       | 10 wedding photos                   |
  | `realestate` | `prodacts_pic/` | `[]` (empty → placeholders)         |
  | `event`      | `Event_pic/`    | `[]` (empty → placeholders)         |
  | `montage`    | `Editing_pic/`  | `[]` (empty → placeholders)         |
  | `graduation` | `party_pic/`    | `[]` (empty → placeholders)         |

  **To add photos for a category:** copy the files into that category's folder, then add the exact filenames to its `photos` array. (Filenames with spaces are fine — they are `encodeURI`-encoded when built into URLs.)
- `GALLERY_COUNT = 6` — number of images shown at a time.
- `FALLBACK_FOLDER = 'photos/'` — used only if a category has no folder configured.
- `galleryFolder(categoryKey)` — returns the folder configured for a category.
- `pickRandomPhotos(categoryKey, count)` — Fisher–Yates shuffle of **that category's** `photos`, returns up to `count` `folder/name` URLs. If the category's `photos` is empty it returns `count` × `null` → cards render as "قريبًا" placeholders (**never** photos from another category).
- `GALLERIES` — maps each category key to its gallery `title`.
- `buildGallerySlides(images)` — builds the cards (`null` → placeholder). It also probes every image with `new Image()`: if a listed file does not exist in the folder, the card is converted to the "قريبًا" placeholder instead of showing a broken image.
- `placeholderInner(num)` — shared markup for a "قريبًا" card body.
- `renderGallery()` — sets the title, picks random photos **from the active category's own folder** each time the category changes, shows/hides `#galleryHint` (an Arabic hint naming the folder when it has no photos yet), builds the slides and starts the 2s auto-advancing slideshow. Clicking a card jumps to it and restarts the slideshow.


### State

- `activeCategory` — currently selected category key (set via `selectCategory`).
- `selectedPackage` — the chosen package object.
- `selectedServices` — map of service `id` → `{qty}`.

### Key Functions

- `renderInfoCard()` — rebuilds the client info form; preserves previously typed values.
- `selectCategory(key)` — central function: sets active category, highlights the pill, resets package/services, re-renders info/packages/services/gallery, updates summary. Called on every category click **and once on load**.
- `renderPackagesAndServices()` — renders package and service lists; handles `perUnit` steppers.
- `update()` — recalculates totals, applies discount, renders the summary, enables/disables send buttons.
- `getDiscountRate()` — validates the discount code input.
- `calcRawTotal()` — sums package + services (respecting qty).
- `money(n)` — formats a number as Bahraini Dinar ("BD", up to 3 decimals, trailing zeros trimmed).
- `buildMessage()` — validates required fields and builds the WhatsApp/email booking text.
- `startGallerySlideshow()` / `stopGallerySlideshow()` / `restartGallerySlideshow()` / `goToSlide(i)` / `buildGallerySlides()` — gallery slideshow helpers.

### Initialization (bottom of script)

```js
selectCategory('weddings'); // selects "تصوير الأعراس" by default on page load
```

> Note: this replaced an earlier standalone `update()` call at the very end. `selectCategory` internally calls `update()`.

---

## 6. Discount Codes

Defined in `DISCOUNT_CODES` (lowercase keys):

| Code | Discount |
|------|----------|
| `m10`| 10%      |
| `f15`| 15%      |

Input field: `#discountCode`; feedback message: `#discountMsg`. Invalid codes show an error and apply 0%.

---

## 7. Sending Bookings

Configured near the bottom of the script:

```js
const STUDIO_WHATSAPP = "97336659456"; // Bahrain country code 973
const STUDIO_EMAIL = "studio@example.com";
```

- **WhatsApp** (`#sendWhatsapp`): opens `https://wa.me/<number>?text=<encoded message>`.
- **Email** (`#sendEmail`): opens a `mailto:` link with subject and body.
- Both buttons are disabled until a package is selected.
- Required before sending: category selected, name, date, time, and a package.
- Message includes: category, name, date, time, package, selected services, totals, discount (if any), **50% deposit amount**, and notes.

---

## 8. Business Rules

- Booking is confirmed only after paying **50% deposit** (نصف المبلغ مقدمًا).
- Totals are shown live in the summary; discount applies to the total.
- Printing photos is a per-unit service (qty × 0.5 BD) across relevant categories.

---

## 9. Conventions & Gotchas

- Keep all UI text in **Arabic**; the layout is RTL.
- Prefer `replace_in_file` for edits and use the latest saved file content as the search reference (the editor may auto-format).
- **Filenames with spaces** (e.g. the WhatsApp image) must be `encodeURI`-encoded when used as URLs — already handled in `pickRandomPhotos`.
- The gallery never hardcodes images inline: it reads each category's own folder via `CATEGORY_PHOTOS` and samples randomly from it (`.gallery-hint` CSS class styles the `#galleryHint` folder hint).
- Do not commit `.DS_Store`.
- There is no backend; all logic runs in the browser.

---

## 10. How to Run

- **Quickest:** open `index.html` in a browser (double-click, or `open index.html` on macOS).
- **Local server (recommended so `photos/` loads cleanly):**
  ```bash
  cd /Users/hasanshuaib/Documents/ShuaibStudio
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

---

## 11. Git Workflow

- Remote: `origin` → `https://github.com/ihasanshuaib-lgtm/ShuaibStudio.git`
- Branch: `main`
- Convention: make a focused commit per change with a clear message, then optionally push.
- **Exclude `.DS_Store`** when staging (use `git reset -- .DS_Store photos/.DS_Store` if it gets staged).

Recent history (most recent first) — run `git log --oneline` for the current hashes:

| Commit     | Message |
|------------|---------|
| *(latest)* | Separate gallery photos per category folder |
| `1141ba2`  | Add AGENTS.md project documentation |
| `da47a48`  | Select weddings category by default on page load |

---

## 12. Change Log (AGENTS.md maintenance log)

- **2026-09-24** — Created AGENTS.md documenting the full project.
- **2026-09-24** — Gallery now shows random photos from `photos/`; images moved into `photos/`; weddings selected by default on load.
- **2026-09-24** — **Separate photo folder per category**: added `CATEGORY_PHOTOS` (`weddings → photos/`, `realestate → prodacts_pic/`, `event → Event_pic/`, `montage → Editing_pic/`, `graduation → party_pic/`); `pickRandomPhotos(categoryKey, count)` now uses only the active category's folder; empty folders render "قريبًا" placeholders plus a `#galleryHint` line naming the folder; missing files fall back to placeholders via an `Image()` probe; `.gitkeep` added to the photo folders.

> **Reminder for the agent:** Before making any change, read this file. After every change, update the relevant sections here (structure, data model, functions, changelog) so this file always reflects the current state of the project.