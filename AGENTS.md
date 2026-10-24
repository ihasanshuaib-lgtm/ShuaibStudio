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
- Fonts loaded from Google Fonts: **Aref Ruqaa** (section headings), **IBM Plex Sans Arabic** (the top-bar "شعيب استوديو" `.studio-logo` and the page title `h1` «حجز موعد التصوير», since 2026-10-20) and **Tajawal** (body).
- Must work by simply opening `index.html` (file://) or serving statically.
- Gallery images are loaded from the local `photos/` folder at runtime (client-side).

---

## 3. File & Folder Structure

```
ShuaibStudio/
├── AGENTS.md          # This documentation file (keep updated)
├── index.html         # The entire site: markup, styles, and scripts
├── login.html         # Login page (username + password) reachable only by its direct URL (the logo no longer links to it)
├── payroll.enc.js     # AES-256-GCM encrypted payroll page (generated — safe to commit; see section 13)
├── .gitignore         # Ignores .DS_Store and private/
├── private/           # LOCAL ONLY (git-ignored): payroll.src.html = plaintext source of the protected page
├── supabase-config.js # Supabase URL + public (anon/publishable) key — loaded by index.html and pay.html (key must be pasted in)
├── supabase/bookings.sql # SQL for the `bookings` table + RLS (run once in Supabase SQL Editor)
├── staff.html         # Employees-only page (login → calendar + upcoming shoots + shoot-count report, NO prices) — own link /staff.html
├── supabase/staff.sql  # SQL: `staff_schedule` table (no prices) + restricts `app_state` to the owner email (run once)
├── supabase/app_state.sql # SQL for the `app_state` table (cloud copy of pay.html data) + RLS (run once)
├── sw.js              # Service worker: browser cache for photos + page (faster repeat visits)
├── vercel.json        # Hosting headers: long-lived caching for thumbs/ (deployed on Vercel)
├── hero.jpg           # Hero/studio image asset
├── logo.png           # Studio logo (gray metallic S monogram + "SHUAIB STUDIO", transparent bg, 581×700) — shown as `<img class="brand-logo">` at the top of the page
├── scripts/
│   ├── build-login.mjs # Encrypts private/payroll.src.html → payroll.enc.js with a username + password
│   └── make-thumbs.sh # Generates the small thumbs/ copies of every photo (run after adding photos)
├── thumbs/            # Optimized copies of every photo (~70 KB each, 59 files ≈ 4.2 MB) — loaded by the gallery
│   ├── photos/        # mirrors photos/
│   ├── prodacts_pic/  # mirrors prodacts_pic/
│   ├── Event_pic/     # mirrors Event_pic/
│   ├── Editing_pic/   # mirrors Editing_pic/
│   └── party_pic/     # mirrors party_pic/
├── photos/            # Gallery images for تصوير الأعراس (weddings)        — 9 photos
│   ├── 8.jpeg
│   ├── Artboard 1٠.jpg
│   ├── DSC02717-2.jpg
│   ├── DSC02746-2.jpg
│   ├── DSC02752-2.jpg
│   ├── gallery1.jpg
│   ├── gallery2.jpg
│   ├── gallery3.jpg
│   ├── gallery5.jpg
│   └── hero.jpg       # byte-identical to the root hero.jpg → deliberately NOT listed
├── prodacts_pic/      # Gallery images for تصوير منتجات وأطعمة (realestate)  — 26 photos
├── Event_pic/         # Gallery images for تصوير إيفنت (event)              — 12 photos
├── Editing_pic/       # Gallery images for مونتاج / تعديل (montage)         — 6 photos
└── party_pic/         # Gallery images for حفل تخرج (graduation)            — 5 photos
```

**The rule that keeps the site fast:** the originals in `photos/`, `prodacts_pic/`, … are the *full-size camera files* (5–18 MB each) and are **never** loaded by the page. `thumbUrl()` maps every original to its small twin in `thumbs/` (same relative path + the original name + `.jpg`, e.g. `prodacts_pic/7.png` → `thumbs/prodacts_pic/7.png.jpg`). Originals are only a fallback if a thumbnail is missing.

**One photo folder per category** — each category's gallery only shows photos from its own folder:

| Category key | Category (AR)        | Photo folder   |
|--------------|----------------------|----------------|
| `weddings`   | تصوير الأعراس        | `photos/`      |
| `realestate` | تصوير منتجات وأطعمة  | `prodacts_pic/`|
| `event`      | تصوير إيفنت          | `Event_pic/`   |
| `montage`    | مونتاج / تعديل       | `Editing_pic/` |
| `graduation` | حفل تخرج             | `party_pic/`   |

> Each photo folder contains a `.gitkeep` so the empty folders are still tracked by git (and deployed with the site). The matching folders under `thumbs/` have one too.
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
3. `<script>` — all application logic (see below). At the very end it runs `selectCategory('weddings')`, then on `window load` it calls `warmOtherCategories()` and registers `sw.js`.
4. Page CSS also defines `.gallery .card img.ph` (the thumbnail image inside each gallery card).

### Theming (CSS variables)

Defined on `:root` (dark default) and overridden by `body.light-mode`. The `<body>` currently has `class="light-mode"` **by default**. Key variables: `--bg`, `--bg-soft`, `--card`, `--card-hover`, `--gold`, `--gold-light`, `--gold-dim`, `--text`, `--text-dim`, `--line`, `--green`. Theme toggle button is `#themeToggle` — since 2026-10-20 the "Moonlight" sun/moon switch (design from `theme-toggle.html`, 76×40 px, sliding knob, twinkling sparks) plus, in dark mode only, a soft moonlight beam and floating dust (`.moon-fx`, behind the content, `pointer-events:none`, beam positioned from the toggle by `placeMoonBeam()`) styled by `.theme-toggle` with `body.light-mode` selectors; `aria-checked` = dark mode, kept in sync by `syncThemeToggle()`.

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
  | `weddings`   | `photos/`       | 9 wedding photos                    |
  | `realestate` | `prodacts_pic/` | 26 product & food photos            |
  | `event`      | `Event_pic/`    | 12 event photos                     |
  | `montage`    | `Editing_pic/`  | 6 montage/edit photos               |
  | `graduation` | `party_pic/`    | 5 graduation photos                 |

  **To add photos for a category:** copy the files into that category's folder, **run `bash scripts/make-thumbs.sh`** (so the small `thumbs/` copies exist), then add the exact filenames to its `photos` array. (Filenames with spaces are fine — they are `encodeURI`-encoded when built into URLs.)
  **Every listed name must exist on disk exactly as written** (same spelling, same `-2` suffix, same extension case) — a name that only exists as a stale `thumbs/` copy makes the gallery show an outdated picture. See the rename trap in section 9.
- `GALLERY_COUNT = 10` — number of images shown at a time (the 3D gallery arranges them in space).
- `FALLBACK_FOLDER = 'photos/'` — used only if a category has no folder configured.
- `galleryFolder(categoryKey)` — returns the folder configured for a category.
- `pickRandomPhotos(categoryKey, count)` — Fisher–Yates shuffle of **that category's** `photos`, returns up to `count` `folder/name` URLs. If the category's `photos` is empty it returns `count` × `null` → cards render as "قريبًا" placeholders (**never** photos from another category).
- `GALLERIES` — maps each category key to its gallery `title`.
- **3D gallery (since 2026-10-20):** `#gallerySlideshow` (class `.gallery`) is a 3D stage (`perspective`) holding `#galleryScene`; cards are positioned in `galleryApply()` in one of four layouts — Barrel (default) / Helix / Ring / Sphere — chosen with the `.gallery-tab` buttons in `#galleryBar`; prev/next/pause buttons, drag to rotate, click a card to bring it to the front, mouse parallax, auto-rotation (off with `prefers-reduced-motion`). One `requestAnimationFrame` loop (`galleryFrame`) runs only while the section is visible (`stopGallerySlideshow()` stops it). State vars are `gMode/gAuto/gT/gTarget/...`; `goToSlide/startGallerySlideshow/restartGallerySlideshow` no longer exist. Vertical page scroll still works on touch (`touch-action:pan-y`).
- `buildGallerySlides(images)` — builds the cards (`null` → placeholder). **Speed:** each card holds a real `<img class="ph">` whose `src` is the small `thumbs/` copy (first two cards `loading="eager"`, the rest `loading="lazy"`), all with `decoding="async"`; the full-size URL is kept in `data-full` only as a fallback.
- `handleGalleryImageError(img)` — the graceful-degradation chain: if the thumbnail 404s it retries **once** with the full-size original (`data-full`), and only if that fails too the card becomes a "قريبًا" placeholder. (Replaces the old `new Image()` probe, which downloaded every photo twice.)
- `THUMB_DIR = 'thumbs/'`, `THUMB_VERSION = '4'`, `thumbUrl(src)` — thumbnail path + cache-busting version (`…/8.jpeg.jpg?v=4`). **Bump `THUMB_VERSION` whenever photos/thumbs change** so browsers don't reuse stale cached copies.
- `preloadThumbs(categoryKey, limit)` — warms the browser cache with a category's thumbnails (skips already-requested URLs via `preloadedThumbs`). Called on `mouseenter`/`touchstart` of every category pill and by `warmOtherCategories()`.
- `canPrefetch()` — respects the user's network: no prefetching when `navigator.connection.saveData` is true or the connection is `2g`/`slow-2g`.
- `warmOtherCategories()` — runs on `window load`; prefetches the other categories' thumbnails one category per second so switching a category is instant.
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
- **Never put a full-size photo in the page**: the gallery always goes through `thumbUrl()` (i.e. `thumbs/`); originals are only the last-resort fallback inside `handleGalleryImageError()`.
- Do not commit `.DS_Store`.
- There is no backend; all logic runs in the browser.

### Speed & caching rules (how the gallery stays fast)

The originals are 5–18 MB each; six of them meant ~40–60 MB per page load. Five mechanisms keep image loading fast:

1. **Small thumbnails** — every photo has a ~70 KB JPEG twin in `thumbs/` (longest side 720 px, quality 72), generated by `scripts/make-thumbs.sh`. A gallery load now transfers **~400 KB instead of ~33 MB (≈85× less)**. Total `thumbs/` size: ~4.2 MB for all 59 photos, so prefetching whole categories is safe.
2. **Native lazy loading + async decode** — cards are real `<img>` elements (`loading="eager"` for the first two, `lazy` for the rest, `decoding="async"`), styled by `.gallery .card img.ph` (`position:absolute; inset:0; object-fit:cover; border-radius:9px`).
3. **Prefetch / warm cache** — hovering or touching a category pill preloads that category; after `load`, `warmOtherCategories()` prefetches the rest one category per second (skipped on `saveData`/2G connections). Switching categories then renders instantly from the browser cache.
4. **Service worker (`sw.js`)** — images are *cache-first* (with a background refresh), `index.html` is *network-first* with a cache fallback, so repeat visits are near-instant and the page still opens offline. It is registered from `index.html` only on `http(s)`; on `file://` it is skipped silently.
5. **Host cache headers (`vercel.json`)** — the host sends `max-age=0, must-revalidate` for everything by default, which forces a revalidation round-trip per image. `vercel.json` overrides `/thumbs/*` with `public, max-age=31536000, immutable`, so even without a service worker the browser reuses them with **zero requests**. This is safe because thumb URLs carry `?v=THUMB_VERSION` — bumping that version (or changing a filename) produces new URLs. Originals under `photos/` etc. are deliberately left revalidated so replacing a file with the same name still shows up.

Keeping it fast when you change photos:

```bash
bash scripts/make-thumbs.sh          # generates only new/changed thumbnails
FORCE=1 bash scripts/make-thumbs.sh  # regenerates everything
```

Then **raise `THUMB_VERSION` in `index.html`** (currently `'4'`, e.g. → `'5'`) and commit `thumbs/` — the host serves the repo files as-is (no build step), so the thumbnails must be in the repo.

> **Renaming or deleting a photo is the trap that caused the 2026-10-03 bug.** If a listed filename no longer exists on disk, `make-thumbs.sh` never touches it, so the **stale** `thumbs/<folder>/<old name>.jpg` keeps being served and the gallery silently shows the *old* picture (and the `data-full` fallback 404s). Whenever you rename/add/delete files, do all four steps: update that category's `photos` array with the exact on-disk names, delete the orphan `thumbs/<folder>/<old name>.jpg`, run `bash scripts/make-thumbs.sh`, and bump `THUMB_VERSION`. Verify with a quick script that every listed name exists in both the folder **and** `thumbs/`.

---

## 10. How to Run

- **Quickest:** open `index.html` in a browser (double-click, or `open index.html` on macOS).
- **Local server (recommended so `photos/` loads cleanly):**
  ```bash
  cd /Users/hasanshuaib/Documents/ShuaibStudio
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```
- **After adding or changing photos**, regenerate the small copies the gallery uses:
  ```bash
  bash scripts/make-thumbs.sh
  ```

### Deployment

- **Live site:** https://shuaib-studio.vercel.app — hosted on Vercel, connected to this GitHub repo.
- **Deploy = `git push origin main`.** Vercel builds nothing (static files); it just serves the repo, usually live within seconds.
- `vercel.json` adds one `Cache-Control` header for `/thumbs/*` (see section 9). It must stay valid JSON or the deployment fails.
- GitHub Pages is **not** enabled for this repo (`has_pages: false`) — Vercel is the only host.

---

## 11. Git Workflow

- Remote: `origin` → `https://github.com/ihasanshuaib-lgtm/ShuaibStudio.git`
- Branch: `main`
- Convention: make a focused commit per change with a clear message, then optionally push.
- **Exclude `.DS_Store`** when staging (use `git reset -- .DS_Store photos/.DS_Store` if it gets staged).
- **`thumbs/` must be committed** together with any photo change (the host serves the repo files as-is, there is no build step).
- Pushing `main` deploys the live site (Vercel → https://shuaib-studio.vercel.app, see section 10).

Recent history (most recent first) — run `git log --oneline` for the current hashes. This list deliberately has **no `HEAD` marker** (it used to label a row as HEAD and went stale with every commit); the newest commits are simply at the top.

| Commit     | Message |
|------------|---------|
| `7acdd8b`  | Update AGENTS.md: sync commit history table with HEAD |
| `af3e18c`  | Show graduation photos: wire party_pic gallery and add thumbnails *(deployed)* |
| `bf676b4`  | add pic 2 (5 photos into `party_pic/` — `CATEGORY_PHOTOS.graduation` not updated at that point) |
| `7739eb7`  | add (`.DS_Store` only — against the convention) |
| `2a73424`  | Update AGENTS.md: event gallery fix, thumbs counts and commit history |
| `d17ef21`  | Fix event gallery: sync photo list with renamed files and regenerate thumbs *(deployed)* |
| `29c7935`  | add pic (4 new `Event_pic/` photos, 5 deleted — `CATEGORY_PHOTOS.event` not updated at that point) |
| `4c18495`  | change price |
| `50006f2`  | Update AGENTS.md commit history |
| `e2cbcb1`  | Rename event packages and update live streaming price |
| `f4bc093`  | show pictures (empty commit) |
| `af37cdc`  | Update AGENTS.md: gallery lists, thumbnails and commit history |
| `2a574f5`  | Show montage photos and sync gallery lists with renamed files |
| `dc83230`  | chagne names (realestate package names) |
| `c82c54e`  | restroe new prodacts |
| `85c9b4a`  | restore |
| `a677689`  | add pic in edits (6 photos into `Editing_pic/`, not yet wired up at that point) |
| `d59899e`  | add price in montiage |
| `c1fcedf`  | add servies |
| `3d77a49`  | chagne names |
| `ecc2bde`  | new price in prodacts |
| `db54455`  | update price |
| `2d22609`  | change price |
| `ca5755b`  | add pic 2 |
| `711f918`  | add |
| `b4fe89f`  | add pic (renamed the wedding/event originals to `…-2.jpg`, deleted the WhatsApp image) |
| `68e7207`  | Cache thumbnails for a year on the host (vercel.json) |

---

## 12. Change Log (AGENTS.md maintenance log)

- **2026-09-24** — Created AGENTS.md documenting the full project.
- **2026-09-24** — Gallery now shows random photos from `photos/`; images moved into `photos/`; weddings selected by default on load.
- **2026-09-24** — **Separate photo folder per category**: added `CATEGORY_PHOTOS` (`weddings → photos/`, `realestate → prodacts_pic/`, `event → Event_pic/`, `montage → Editing_pic/`, `graduation → party_pic/`); `pickRandomPhotos(categoryKey, count)` now uses only the active category's folder; empty folders render "قريبًا" placeholders plus a `#galleryHint` line naming the folder; missing files fall back to placeholders via an `Image()` probe; `.gitkeep` added to the photo folders.
- **2026-09-29** — Added 39 new photos: 13 in `Event_pic/` (event) and 26 in `prodacts_pic/` (realestate), plus `photos/hero.jpg`; `photos/0.jpeg` removed (commit `06ff74b`).
- **2026-09-29** — **Event & product galleries wired up**: filled `CATEGORY_PHOTOS.realestate` (26 filenames) and `CATEGORY_PHOTOS.event` (13 filenames) with the exact on-disk names, so those galleries now render real photos instead of "قريبًا" placeholders; dropped the dead `'0.jpeg'` entry from `weddings` (the file no longer exists, so that card could only ever be an empty placeholder); `photos/hero.jpg` deliberately left unlisted because it is a byte-identical copy of the root `hero.jpg` asset (verified by MD5).
- **2026-09-29** — **Gallery is ~85× lighter and appears immediately**: added `scripts/make-thumbs.sh` + the generated `thumbs/` tree (49 JPEGs, 720 px, quality 72, ~70 KB each — the whole folders dropped from 180 MB to 3.4 MB); the gallery now renders real `<img class="ph">` cards from `thumbUrl()` with `loading="lazy"`/`decoding="async"` instead of full-size `background-image` URLs, so a gallery load goes from ~33 MB to ~400 KB; the old `new Image()` existence probe (which downloaded each photo twice) was replaced by `handleGalleryImageError()`, which falls back to the original and then to "قريبًا"; added `preloadThumbs()`/`warmOtherCategories()` prefetching (pill hover + idle warm-up, skipped on save-data/2G) and `sw.js`, a service worker that caches images cache-first and the page network-first (registered on `http(s)` only).
- **2026-09-29** — **Host caching for thumbnails**: discovered the live site is hosted on **Vercel** (`https://shuaib-studio.vercel.app`, auto-deploy from `main`; GitHub Pages is not enabled) and that Vercel sends `Cache-Control: public, max-age=0, must-revalidate` for every file, forcing a revalidation round-trip per image. Added `vercel.json` overriding `/thumbs/*` to `public, max-age=31536000, immutable` (safe because the URLs carry `?v=THUMB_VERSION`). Documented deployment in section 10.

- **2026-10-03** — **صور المونتاج/التعديل والمنتجات تظهر الآن — إصلاح قوائم الصور بعد إعادة التسمية**: commit `a677689` added 6 photos to `Editing_pic/` but `CATEGORY_PHOTOS.montage.photos` stayed `[]`, so the مونتاج / تعديل gallery rendered nothing but "قريبًا" cards; separately, commit `b4fe89f` had renamed the wedding photos (`DSC0271x.jpg` → `DSC0271x-2.jpg`), all 13 event photos (`DSC…jpg` → `DSC…-2.jpg`) and deleted `photos/WhatsApp Image 2026-09-05 at 15.28.24.jpeg`, while `index.html` still listed the **old** names — those cards kept showing only because the stale `thumbs/<folder>/<old name>.jpg` copies were still being served (their `data-full` originals 404'd), so the newly added/renamed photos never appeared on the site. Fixed by rewriting `CATEGORY_PHOTOS.weddings` (9 exact on-disk names, including the new `Artboard 1٠.jpg`; `photos/hero.jpg` still excluded as a byte-identical duplicate of the root `hero.jpg`), `CATEGORY_PHOTOS.event` (13 `-2` names) and `CATEGORY_PHOTOS.montage` (6 names: `1–5.jpg`, `6.png`); deleted the 17 orphan thumbnails of the vanished names; ran `bash scripts/make-thumbs.sh` (23 new thumbnails; `thumbs/` is now 55 files ≈ 3.8 MB); bumped `THUMB_VERSION` `'1'` → `'2'`. Verified: all 54 listed names exist in both the photo folder **and** `thumbs/`, all 54 gallery thumbnail URLs return HTTP 200 against a local server, and `node --check` on the inline script passes. (`realestate` / المنتجات was already in sync — 26/26 — and its thumbnails serve 200 on the live site.)

- **2026-10-03** — **باقات الإيفنت بأسماء عامة + رفع سعر البث المباشر**: أُعيدت تسمية باقات `event` إلى «الباقة الأولى / الثانية / الثالثة / الرابعة» (بأسعار 50 / 80 / 110 / 150 كما هي، وبقاء شارة «الأكثر طلباً» على الثالثة) — نفس نمط الأسماء العامة المتبع في `realestate` (commit `dc83230`); ورُفع سعر الخدمة `es3` «بث مباشر للحفل (Live Streaming)» من 30 إلى **40 د.ب**. تغييرات بيانات فقط داخل `CATEGORY_PHOTOS`/`CATEGORIES` — لا مساس بالصور ولا بـ `THUMB_VERSION` (بقي `'2'`). تم التحقق: `node --check` على السكربت المضمّن يمر بنجاح، وقوائم صور الفئات الخمس ما زالت مطابقة للقرص تمامًا (54/54 داخل المجلدات و`thumbs/`).

- **2026-10-03** — **صور الإيفنت الجديدة تظهر الآن — نفس فخّ إعادة التسمية يتكرّر** (commit `d17ef21`): commit `29c7935` («add pic») أضاف 4 صور إلى `Event_pic/` (`8H7A1539.jpg`, `8H7A1551.jpg`, `8H7A1571.jpg`, `8H7A1652.jpg`) وحذف 5 صور (`DSC00324-2.jpg`, `DSC00347-2.jpg`, `DSC01674-2.jpg`, `DSC01735-2.jpg`, `PIC04477-2.jpg`)، لكن `CATEGORY_PHOTOS.event.photos` بقي على الأسماء القديمة (13 اسمًا، منها 5 غير موجودة) ولم تُشغَّل `scripts/make-thumbs.sh` — فبقيت المصغّرات اليتيمة للصور المحذوفة تُعرض (فتظهر صور قديمة مكرّرة)، ولم تظهر الصور الأربع الجديدة إطلاقًا لأنها غير مُدرجة في القائمة. الإصلاح (commit `d17ef21`): القائمة الآن 12 اسمًا مطابقًا للقرص تمامًا، حُذفت المصغّرات اليتيمة الخمس، وُلّدت 4 مصغّرات جديدة (`thumbs/` = 54 ملفًا ≈ 3.8 ميجابايت)، ورُفع `THUMB_VERSION` `'2'` → `'3'`. تم التحقق: 53/53 اسمًا موجود داخل مجلد الصور **و** `thumbs/`، و53/53 رابط مصغّر يرجّع HTTP 200 على خادم محلي، و`node --check` على السكربت المضمّن يمر.

- **2026-10-03** — **صور حفل التخرج تظهر الآن**: commit `bf676b4` («add pic 2») أضاف 5 صور إلى `party_pic/` (`١.jpg` … `٥.jpg` بأرقام عربية) ونُشرت على الموقع، لكن `CATEGORY_PHOTOS.graduation.photos` بقيت `[]` و`thumbs/party_pic/` بقيت فارغة — فظهر قسم «حفل تخرج» ببطاقات «قريبًا» مع التنبيه «لا توجد صور بعد في مجلد party_pic/». الإصلاح (commit `af3e18c`): القائمة الآن الأسماء الخمسة بالضبط (الأرقام العربية تُرمَّز عبر `encodeURI` تمامًا كحال المسافات)، وُلّدت 5 مصغّرات (`thumbs/` = 59 ملفًا ≈ 4.2 ميجابايت، منها 452 كيلوبايت لـ `party_pic`)، ورُفع `THUMB_VERSION` `'3'` → `'4'`. تم التحقق: 58/58 اسمًا موجود داخل مجلده **و** `thumbs/`، و58/58 رابط مصغّر يرجّع HTTP 200 على خادم محلي، و`node --check` على السكربت المضمّن يمر.

- **2026-10-03** — **إصلاح جدول الـ commits في هذا الملف (وسم HEAD المتقادم)**: كان الجدول يوسم صفًا بـ`*(HEAD)*` فيتقادم تلقائيًا مع كل commit يعدّل الجدول نفسه (وكان يشير إلى رسالة commit خاطئة). أُزيل وسم `*(HEAD)*` نهائيًا وصار الجدول قائمة hashes فقط (الأحدث في الأعلى) فلا يتقادم بعد الآن؛ وأُضيف hash إصلاح صور حفل التخرج `af3e18c`. تغيير في `AGENTS.md` فقط — لا مساس بـ `index.html` ولا بالصور ولا بـ `THUMB_VERSION` (بقي `'4'`).

- **2026-10-19** — **الضغط على «شعيب استوديو» يفتح صفحة دخول (يوزر + باسورد) تحمي صفحة حساب رواتب المصورين**: الشعار في `.top-bar` صار رابطًا `<a class="studio-logo" href="login.html">` (أُضيف `text-decoration:none`)؛ أُنشئت `login.html` و`scripts/build-login.mjs` و`payroll.enc.js` و`.gitignore`. التفاصيل في القسم 13. تم التحقق بسكربت node: الدخول الصحيح يطابق المصدر، والباسورد الخاطئ واليوزر الخاطئ يُرفضان، ولا نص ظاهر للصفحة داخل `payroll.enc.js`.

---

## 13. Login page & protected payroll page

- (Since 2026-10-20 the logo is a plain `<div>` again and no longer links anywhere; `login.html` is reached only by its direct URL.) Previously, clicking the logo (`.studio-logo` in `index.html`) went to `login.html` (RTL form, same gold theme, follows the OS dark/light setting, has a back link to `index.html`).
- The protected page is `photographers-pay-v6.html` (حساب رواتب المصورين, copied from `~/Downloads`). Its plaintext lives only in `private/payroll.src.html` (**git-ignored, never deploy it**).
- **There is no backend**, so protection is client-side encryption: `scripts/build-login.mjs` encrypts the page with AES-256-GCM; the key comes from PBKDF2-SHA256 (310 000 iterations) over `username.trim().toLowerCase() + "\0" + password`. The result is `window.PAYROLL_ENC` in `payroll.enc.js`. `login.html` derives the key from what the user types and decrypts; a wrong username or password fails the GCM check, so the page never appears. On success `document.write` replaces the login page with the payroll page, plus a floating "خروج" button. The derived key is kept in `sessionStorage` (`shuaib-admin-key`) so a refresh in the same tab stays logged in; closing the tab or pressing "خروج" logs out. The username is case-insensitive; the password is case-sensitive.
- Web Crypto needs a secure context: works on `https://shuaib-studio.vercel.app` and `http://localhost`, not on a plain `file://`.
- **Credentials are deliberately NOT written in this file or anywhere in the repo** (this file is pushed to GitHub); only the ciphertext is stored. The username is now `hasan` (changed 2026-10-19; the password is known to the owner only). Change them by re-running:
  ```bash
  node scripts/build-login.mjs <username> <password>        # reads private/payroll.src.html
  node scripts/build-login.mjs <user> <pass> path/to/new.html  # to replace the protected page
  ```
  then commit `payroll.enc.js` and push. Use a password of 8+ characters (the script only warns if it is shorter).
- Limits: the encrypted file is public, so an attacker could try offline guesses — a long random password is what makes this safe. Anyone with the password can read the page; this is not per-user access control.
- The payroll page stores data in the browser's `localStorage` on the site origin (`shuaib-photog-v2`), per device. Its optional cloud save (`claude.use('db')`) only works inside Claude and silently falls back to local storage elsewhere.
- Editing the payroll page = edit `private/payroll.src.html`, then re-run the build script and commit `payroll.enc.js`.

- **2026-10-19** — تغيير بيانات الدخول إلى يوزر جديد وباسورد جديد بإعادة تشغيل `scripts/build-login.mjs` (أُعيد توليد `payroll.enc.js`)؛ الباسورد 6 أحرف فيُظهر السكربت تحذيرًا بدل الرفض. لم تُكتب البيانات في الريبو.

- **2026-10-20** — إزالة رابط شعار «شعيب استوديو» إلى `login.html`: عاد الشعار `<div class="studio-logo">` عاديًا بدون رابط (وحُذف `text-decoration:none`). صفحة الدخول ما زالت موجودة وتُفتح برابطها المباشر فقط.

- **2026-10-20** — **المعرض صار ثلاثي الأبعاد** (بدل البطاقات المتناثرة): أشكال Helix/Barrel/Ring/Sphere، سحب للتدوير، أزرار السابق/التالي/إيقاف، وعدد الصور في المعرض 10. بقيت المصغّرات `thumbs/` ومنطق الصور المفقودة كما هي. `node --check` يمر.

- **2026-10-20** — الشكل الافتراضي للمعرض صار **Barrel**؛ ورسالة الواتساب/الإيميل صارت تتضمن الحقول الإضافية لكل نوع (`extraFields`: اسم القصر/الصالة، مكان التصوير، موقع الإيفنت، الجامعة، نوع المنتج…) التي كانت تُعرض في النموذج لكنها لا تدخل الرسالة أبدًا (`buildMessage()` → `extraLines`).

- **2026-10-20** — إضافة شعار الاستوديو `logo.png` (حرف S أبيض على خلفية شفافة، قُصّ من 1170×869 إلى 360×440) أعلى الصفحة فوق عنوان «حجز موعد التصوير» داخل `<header>` عبر `<div class="brand-logo">`. يُلوَّن بلون `--gold` بواسطة CSS `mask` لأنه أبيض ولن يظهر على الخلفية الفاتحة، فيعمل في الوضعين الفاتح والداكن.

- **2026-10-20** — **خدمات «تصوير منتجات وأطعمة» عادت للظهور**: كتلة `services` الخاصة بـ`realestate` (3 خدمات: `rs1` فيديو ترويجي إضافي 25، `rs4` خلفيات إضافية 8، `rs5` تسريع التسليم 20) كانت قد اختفت من `CATEGORIES` خلال commits الاستعادة (`c82c54e`/`dc83230`) فلم يكن هناك قسم خدمات إضافية لهذا النوع. أُعيدت، وأُضيف `|| []` في `currentServices()` حتى لا يتعطل الكود لو نقصت `services` في أي نوع مستقبلًا.

- **2026-10-20** — ثلاثة تعديلات في `index.html`:
  1. **خطأ المبلغ الكلي**: خدمتا الأعراس «تسريع التسليم (خلال 24 ساعة)» و«تصوير وتصميم بطاقة الدعوة» كانتا بنفس المعرّف `s11`، و`selectedServices` يُفهرس بالمعرّف فاختيار إحداهما يفعّل الأخرى ويُحسب 40 بدل 20. أُعيدت تسمية الثانية إلى `s12`. **قاعدة: معرّفات الباقات والخدمات يجب أن تكون فريدة داخل النوع.**
  2. **شريط أنواع التصوير متحرك**: `#categoriesList` (class `marquee`) يحوي `.cat-track` بثلاث نسخ `.cat-copy` من الأزرار، تتحرك ببطء (45 ثانية للنسخة) نحو اليمين في حلقة لا تنتهي بـ CSS `@keyframes catScroll`؛ تتوقف عند المرور بالمؤشر أو اللمس، ومع `prefers-reduced-motion` تعود شريطًا عاديًا قابلًا للتمرير. الأزرار صارت تُعرَّف بـ`data-key` بدل `id="cat-<key>"` (لأنها مكررة 3 مرات)، و`selectCategory` يضع `selected` على كل النسخ.
  3. **شريط المبلغ الكلي الثابت** (`#totalBar`): يظهر أسفل الشاشة عند اختيار باقة أو خدمة (`hasSelection`) ويختفي حين يدخل قسم الملخص `#summaryCard` الشاشة (`IntersectionObserver`)؛ الضغط عليه ينقل إلى الملخص. يتحدث من `update()` ويعرض المبلغ بعد الخصم.

- **2026-10-20** — إصلاح تأخّر ظهور أنواع التصوير: كانت الحركة تبدأ من إزاحة ثابتة `-33%` فلا تظهر الأزرار كاملة في البداية. الآن `layoutCategoryMarquee()` تقيس عرض نسخة واحدة وعرض المنطقة الظاهرة وتضبط `--cat-from`/`--cat-to` بحيث تبدأ النسخة الوسطى كاملة ومحاذية لليمين ثم تنزاح نسخة واحدة نحو اليمين (وتُعاد عند تغيير حجم النافذة وبعد تحميل الخطوط).

- **2026-10-20** — زر الوضع الليلي/النهاري صار مفتاحًا بقمر وشمس (مأخوذ من تصميم `theme-toggle.html`، مصغّر إلى 76×40 بكسل): كرة تنزلق بين القمر (ليلي) والشمس (نهاري) مع نجوم تلمع في الوضع الليلي. لم يُنقل شعاع ضوء القمر والغبار على كامل الصفحة. المنطق كما هو (`body.light-mode`).

- **2026-10-20** — شريط أنواع التصوير صار **ثابتًا** (أُلغيت الحركة المتكررة ونسخ الأزرار الثلاث `.cat-track`/`.cat-copy` ودالة `layoutCategoryMarquee`): الأزرار الخمسة تظهر كلها دائمًا وتلتف إلى سطر ثانٍ عند ضيق الشاشة (`.categories{flex-wrap:wrap}`). الأزرار تُعرَّف بـ`data-key` وتُحدَّد في `selectCategory` بمقارنته. هذا يلغي بند «شريط الأنواع المتحرك» السابق.

- **2026-10-20** — زر الوضع الليلي/النهاري استُبدل بتصميم `day-night-switch.html` (مشهد ليل بنجوم وجبال ↔ مشهد نهار بغيوم، وكرة قمر/شمس تنزلق)، مرسومًا بحجم 220×88 ومصغّرًا بـ`scale(.4)` إلى 88×35 بكسل داخل `.theme-toggle`. المنطق كما هو (`body.light-mode`).

- **2026-10-20** — أزرار أنواع التصوير في **سطر واحد** (بدل الالتفاف): `.categories{flex-wrap:nowrap}` والأزرار تتمدد/تتقلص (`flex:1 1 auto`)، وعلى الجوال (≤640px) يصبح الأيقونة فوق الاسم بخط أصغر ليتسع الخمسة؛ وإن ضاقت الشاشة أكثر يُمرَّر الشريط أفقيًا. (يستبدل بند الالتفاف السابق.)

- **2026-10-20** — زر الوضع الليلي رجع إلى تصميم «Moonlight» (`theme-toggle.html`) مع شعاع ضوء القمر والغبار العائم في الوضع الليلي (`.moon-fx` خلف المحتوى)، بدل تصميم `day-night-switch.html`. وأزرار أنواع التصوير في سطر واحد.

- **2026-10-20** — تغيير الشعار: `logo.png` صار الشعار الجديد (حرف S رمادي معدني مع نص «SHUAIB STUDIO»، خلفية شفافة، قُصّ إلى 581×700). لم يعد يُلوَّن بـCSS mask بل يُعرض كصورة عادية `<img class="brand-logo" width=130>` أعلى `<header>`، فيعمل أيضًا على `file://`.

- **2026-10-20** — خط «شعيب استوديو» (`.studio-logo` في الشريط العلوي) وعنوان «حجز موعد التصوير» (`h1`) صار **IBM Plex Sans Arabic** بدل Aref Ruqaa، وأُضيف الخط إلى رابط Google Fonts (أوزان 500/600/700).

- **2026-10-20** — **تبويب «حجز» في `pay.html` لا يعمل**: كان الـ iframe (`#booking-iframe`) يشير إلى `booking.html` وهو ملف غير موجود. الآن يشير إلى `index.html` (صفحة الحجز). وأُضيف في آخر سكربت `index.html` إرسال ارتفاع الصفحة للأم (`postMessage {type:'booking-height'}`) عند التحميل وتغيير الحجم، وتستقبله `pay.html` لضبط ارتفاع الإطار، وذلك فقط حين تُعرض الصفحة داخل iframe.

- **2026-10-20** — **خلفية كل الصفحات أغمق قليلًا (الوضع الفاتح)**: ضُربت ألوان الخلفيات/البطاقات/الظلال الفاتحة جدًا (كل قناة ≥ `#c8`، ما عدا الأبيض الصافي للضوء) بمعامل 0.93 داخل كتلة الثيم الأزرق الرمادي في `index.html` و`pay.html` (مثلًا `--bg:#eef2f6` → `#dde1e5`، `--bg-soft:#e4ebf1` → `#d4dbe0`، وتدرّج الـbody)، وفي `login.html` (`--bg:#faf6ee` → `#ebe7dd`، `--bg-soft:#f1e9d8` → `#e0d9c9`). الوضع الليلي لم يتغيّر. للتعديل لاحقًا غيّر هذه المتغيرات.

- **2026-10-21** — **لوحة التحكم (`pay.html`)**: حُذف قسم «خدماتنا / Our Services» (بطاقات الخدمات الست) من الصفحة الرئيسية مع نصوصه في كود الترجمة (`srvTitle`)؛ وتبويب «الجدول» أُعيدت تسميته إلى **«التقويم / Calendar»** (`page-schedule`: تقويم الإنتاج + «التصوير القادم» `upTitle` يُرسم عبر `PR.renderSchedule()` من جلسات الرواتب). صفحة التقويم كانت موجودة أصلًا في `pay.html`.

- **2026-10-21** — **التقويم صار داخل لوحة التحكم (الرئيسية) في `pay.html`**: نُقل `#page-schedule` (تقويم الإنتاج + «التصوير القادم») من صفحة مستقلة إلى أسفل صفّ الإحصائيات في `#page-home` (صار `<div>` عاديًا لا `.page`)، وحُذف تبويب «التقويم» من القائمة العلوية وكلمة `schedule` من مصفوفة الصفحات؛ و`showPage('home')` يستدعي الآن `updateStats()` و`PR.renderSchedule()`. الأحداث ما زالت مربوطة عبر `G('page-schedule')`.

- **2026-10-21** — **`pay.html`: صفحة الموظفين + إصلاح الجلسة الجديدة + الحجز يذهب للتكاليف**:
  1. **الموظفون**: النموذج والبطاقة صارا يحويان فقط: اسم الموظف، المنصب، رقم الهاتف، المعدات التي يملكها (`equip`، نص حر)، الأجر (`rate`، د.ب). حُذف سجل الأيام اليومي (Work Log) وكشف الراتب (Slip) بكل دوالهما وفلاترهما ونوافذهما؛ وأُضيف زر «تعديل» (`editStaff`/`editingStaffId`/`hideStaffForm`). `ss_worklog` ما زال يُحفظ كمتغير فارغ للتوافق فقط.
  2. **«جلسة جديدة» لا تفتح / جلسات بلا عنوان**: السبب أن فلتر المصور/الباقة/البحث النشط كان يُخفي الجلسة الجديدة الفارغة (`shown()`) فيتكرر الضغط وتتراكم الجلسات الفارغة. الإصلاح في `newSession()`: تصفير الفلاتر وضبط الشهر، وإعادة استخدام مسودة فارغة موجودة بدل إنشاء أخرى، وفي `norm()` حذف الجلسات الفارغة تمامًا (بلا اسم/سعر/مصورين/معدات/فاتورة/حجز) عند التحميل.
  3. **الحجز → التكاليف**: عند الإرسال (واتساب أو بريد) داخل تبويب «حجز» (iframe) يرسل `index.html` الرسالة `postMessage({type:'booking-created', booking:{categoryKey, category, name, date, time, package, services, extras, notes, total}})`؛ تستقبلها `pay.html` (تتحقق من `e.source`) وتستدعي `PR.addBooking()` فتُنشئ جلسة جاهزة: التاريخ والوقت والاسم «العميل — النوع» والسعر النهائي بعد الخصم والباقة المطابقة (`BK_PKG`: الأعراس/المنتجات/الإيفنت) وتفتحها في وضع التعديل، ويظهر شريط `#bk-banner` بزر «فتح الجلسة»؛ يبقى فقط اختيار المصورين والمعدات. مفتاح `bk` يمنع تكرار الجلسة عند الضغط على واتساب ثم البريد. لا يعمل هذا إلا حين تُفتح صفحة الحجز من داخل `pay.html` (حجوزات الزبائن من أجهزتهم لا تصل لجهازك لأنه لا يوجد backend).

- **2026-10-21** — **حجوزات الزبائن من `index.html` تصل إلى التكاليف عبر Supabase** (مشروع `rhelsbblrpnvtptobbzq`): `index.html` → `submitBooking()` = `bookingPayload()` (يضيف `key` = date|time|name|category|total) ثم `postBookingToParent()` (عند العرض داخل iframe) و`saveBookingRemote()` (POST إلى `/rest/v1/bookings` بالمفتاح العام، `return=minimal`، ولا يمنع واتساب لو فشل، ولا يكرر الإرسال في نفس الجلسة عبر `sessionStorage`). `pay.html` (بطاقة `#sb-box` في الرئيسية): تسجيل دخول صاحب الاستوديو عبر Supabase Auth REST (إيميل/باسورد، التوكن في `localStorage.ss_sb` مع تجديد تلقائي)، ثم `sbSync()` (عند الفتح/التركيز/كل دقيقة/زر «مزامنة الآن») تقرأ `bookings?imported=eq.false`، تستدعي `PR.addBooking(payload,true)` لكل حجز (تمنع التكرار بمفتاح `bk`)، ثم تضع `imported=true` وتُظهر شريط `#bk-banner`. الجدول: `supabase/bookings.sql` — RLS: الإضافة للجميع (`anon`)، والقراءة/التعديل للمستخدم المسجّل فقط، وحد حجم الـpayload 8KB.
  **خطوات الإعداد (مرة واحدة)**: (1) شغّل `supabase/bookings.sql` في Supabase → SQL Editor؛ (2) أنشئ مستخدمًا في Authentication → Users (حساب الاستوديو)؛ (3) الصق مفتاح `anon`/`publishable` (وليس `service_role`) في `supabase-config.js`؛ (4) commit + push. بدون المفتاح لا يُرسل شيء ويُظهر `pay.html` تنبيهًا بذلك.

- **2026-10-22** — رسالة «الله يطرح البركة إن شاء الله» (`#blessOv` ← `showBlessingThenGo`) صارت تظهر بعد ضغط «إرسال عبر واتساب» في **الأعراس فقط** (`activeCategory === 'weddings'`)؛ بقية الأنواع تفتح واتساب مباشرة (`window.open(url,'_blank')`).

- **2026-10-24** — **بيانات `pay.html` لا تظهر في متصفح آخر → مزامنة سحابية**: كانت كل البيانات (الفواتير `ss_invoices`، الموظفون `ss_staff`، العملاء `ss_clients`، السجل `ss_worklog`، التكاليف `ss_payroll`) في `localStorage` فقط، أي لكل متصفح/نطاق نسخته. الآن بعد تسجيل دخول حساب الاستوديو (بطاقة `#sb-box`) تُحفظ نسخة في Supabase جدول `app_state` (صف واحد `key='pay'` قيمته `{ts, data:{<المفاتيح الخمسة>}}`): `save()` و`persist()` يستدعيان `syncTouch()` (يحدّث `ss_ts` ويرفع بعد 1.5 ثانية عبر `syncPush()`)، و`syncPull()` عند الفتح/التركيز/الدخول تقارن `remote.ts` مع `ss_ts` المحلي: الأحدث يفوز (إذا السحابة أحدث تُحفظ نسخة محلية في `ss_backup_before_sync` ثم تُستبدل البيانات وتُعاد الصفحة). بدون تسجيل دخول لا شيء يتغيّر (يبقى `localStorage` فقط). جُرّب بمحاكاة: حفظ موظف ← مسح بيانات المتصفح ← إعادة فتح ← عادت البيانات. الجدول: `supabase/app_state.sql` (RLS: المستخدم المسجّل فقط). **خطوات**: شغّل `app_state.sql` في SQL Editor، وسجّل الدخول أولًا من المتصفح الذي فيه بياناتك الحقيقية (ليُرفع)، ثم من بقية المتصفحات. يُنصح بتعطيل «Allow new users to sign up» من Authentication → Sign In / Providers.

- **2026-10-24** — تسجيل دخول `pay.html` (بطاقة `#sb-box`) صار **باليوزر** بدل البريد: الحقل يقبل `hasan` ويُحوّله `sbUserEmail()` (الخريطة `SB_USERS`) إلى `ihasanshuaib@gmail.com` (Supabase Auth يعمل بالبريد؛ ويُقبل البريد الكامل أيضًا). يجب أن يكون لهذا البريد مستخدم في Supabase → Authentication → Users (مؤكَّد Confirmed). كلمة المرور لا تُكتب في الريبو.

- **2026-10-24** — **بوابة دخول (يوزر + باسورد) لـ`pay.html`**: شاشة كاملة `#gate` (`#gate-form`: `gate-user`/`gate-pass`) تُخفي كل الصفحة (`html.locked body>*:not(#gate){display:none}`، وتُفعَّل قبل الرسم بسكربت في `<head>` إن لم يوجد `ss_sb`) حتى يتم تسجيل الدخول عبر Supabase Auth (`sbToken`؛ اليوزر `hasan` ← `ihasanshuaib@gmail.com` عبر `SB_USERS`). `gateRefresh()` (تُستدعى من `sbRender`) تُظهر/تُخفي البوابة حسب `sbAuth`؛ «خروج» في بطاقة الحساب السحابي أو فشل تجديد الجلسة يعيد القفل. **ملاحظة أمنية**: الصفحة ملف ثابت علني، فالبوابة تحجب الواجهة فقط؛ الحماية الفعلية لبيانات السحابة هي RLS في Supabase، وبيانات `localStorage` تبقى في المتصفح نفسه.

- **2026-10-24** — **صفحة الموظفين `staff.html` (رابط منفصل، بلا أسعار)**: صفحة مستقلة بدخول (يوزر/باسورد عبر Supabase Auth؛ `staff` ← `staff@shuaib-studio.com` عبر `USERS`، ويُقبل البريد الكامل) تعرض: تقويم شهري، «التصوير القادم»، تفاصيل اليوم، فلتر المصوّر (يُحفظ في `ss_staff_ph`)، و**تقرير عدد التصويرات** (سنة/شهر: العدد، أيام التصوير، القادم، حسب الشهر، حسب المصوّر، قائمة التصويرات، زر طباعة). تقرأ من جدول `staff_schedule` (صف `key='sched'` قيمته `{ts, sessions:[{d,t,n,pk,ph[],eq[]}]}` — لا أسعار ولا أجور) وتتحدث كل دقيقة وعند التركيز. يرفعه `pay.html`: `PR.scheduleSnapshot()` ← `pushSchedule()` بعد كل `syncPush()` وعند المزامنة المتساوية. `supabase/staff.sql`: ينشئ الجدول (قراءة لأي مستخدم مسجّل، كتابة للمالك فقط `auth.jwt()->>'email' = 'ihasanshuaib@gmail.com'`) **ويقيّد `app_state` (فيه الأسعار) على المالك فقط** حتى لا يقرأه حساب الموظفين. **خطوات**: شغّل `staff.sql`، أنشئ مستخدم الموظفين في Authentication → Users (`staff@shuaib-studio.com` + باسورد + Auto Confirm)، ثم افتح `pay.html` واضغط «مزامنة الآن» ليُرفع الجدول، وأعطِ الموظفين رابط `/staff.html` ويوزر `staff` والباسورد.

- **2026-10-24** — **صفحة الموظفين في `pay.html`: مجموع المبلغ + المهام لكل مصور**: بطاقة الموظف تعرض الآن «مجموع المبلغ» (مجموع `l.a` لكل أسطر الجلسات المسندة له، كل الأوقات) و«هذا الشهر» وعدد الجلسات — من `PR.totals()`. وحقل جديد `tasks` (مصفوفة نصوص) لكل موظف: تُضاف من الحقل أسفل البطاقة (فاصل `،` أو `,` ليضيف عدة مهام دفعة واحدة، مثل «تعديل صور، مونتاج العرس») وتُحذف بـ ×؛ الدوال `addTask(id)`/`delTask(id,i)` وتُحفظ مع `staffList` (وتُزامن سحابيًا). وتُرفع المهام أيضًا إلى `staff_schedule` (`value.tasks = {اسم المصور:[مهام]}` في `pushSchedule()`) فتظهر في `staff.html` في لوحة «المهام» (تتأثر بفلتر المصوّر) — بدون أي مبالغ. جُرّب: مجموع 28 (15+5+8) وهذا الشهر 20 وجلستان، وإضافة/حذف المهام.

- **2026-10-24** — ثيم `staff.html` صار مثل بقية الصفحات (Soft UI: خلفية بيج متدرجة، بطاقات بارزة `--lift`، حقول غائرة `--sunk`، أزرار سيج `--btn-sage`، أيام التقويم كبطاقات ناعمة) بنفس متغيرات `pay.html`؛ وحُذف وضع الألوان الداكنة التلقائي لتتطابق مع الصفحات الأخرى.

- **2026-10-24** — **`pay.html` لصاحب الاستوديو فقط**: بوابة الدخول (وبطاقة الحساب السحابي) ترفض أي حساب Supabase إيميله ليس `SB_OWNER` (`ihasanshuaib@gmail.com`)، وتمسح أي جلسة محفوظة لحساب آخر عند التحميل؛ فحسابات المصورين تدخل `staff.html` فقط. هذا فحص في الواجهة (الصفحة ثابتة علنية)، أما الحماية الفعلية فبـRLS: أُضيف إلى `supabase/staff.sql` البند 3 الذي يقصر قراءة/تعديل `bookings` على إيميل المالك (كانت مفتوحة لأي مستخدم مسجّل)، وكان البند 1 قد قصر `app_state` عليه.

- **2026-10-24** — `staff.html`: (1) **المهام كقائمة To-do واضحة**: لكل مصوّر بطاقة بها اسمه وعدّاد `منجَز / الكل` وشريط تقدّم وصناديق اختيار كبيرة؛ التأشير يشطب المهمة، وحالة الإنجاز تُحفظ في متصفح الموظف فقط (`localStorage.ss_todo_done`، مفتاحها `اسم|مهمة`) ولا تُكتب في السحابة. (2) **الضغط على «التصوير القادم» يفتح نافذة تفاصيل** (`showDetails`): اسم الجلسة + التاريخ + الوقت + **المكان** + الباقة + المصورون + المعدات، مع زر «عرض في التقويم»؛ والمكان يظهر أيضًا في بطاقات اليوم والقائمة القادمة. (3) **حقل المكان `loc` جديد في الجلسة (`pay.html`)**: يُملأ تلقائيًا عند الحجز من الحقول الإضافية (اسم القصر/الصالة، مكان التصوير، موقع الإيفنت، الجامعة) عبر `PR.addBooking`، ويمكن كتابته/تعديله يدويًا في نموذج تعديل الجلسة (خانة «المكان»)، ويُرفع في `scheduleSnapshot()` إلى `staff_schedule`.

- **2026-10-24** — **تحديث تلقائي**: `staff.html` يعيد تحميل الجدول والمهام كل **15 ثانية** (والتبويب ظاهر) وفورًا عند العودة للتبويب (`visibilitychange`/`focus`). `pay.html` يرفع أي تعديل تلقائيًا بعد 1.5 ثانية (`syncTouch`→`syncPush`→`pushSchedule`، لا يحتاج «مزامنة الآن»)، ويسحب تغييرات الأجهزة الأخرى كل **30 ثانية** (`syncPull`) فقط وقت الخمول (لا حقل نشط ولا تعديل خلال آخر 10 ثوانٍ لأن السحب قد يعيد تحميل الصفحة)، ويجلب حجوزات الزبائن الجديدة كل 30 ثانية (`sbSync`). مجموع التأخير من تعديلك إلى ظهوره عند الموظف ≈ 2–17 ثانية.

- **2026-10-24** — فلتر «المصوّر» في `staff.html` صار يأخذ قائمته من صفحة **الموظفين (فريق العمل)** في `pay.html` وليس من أسماء الجلسات فقط: `pushSchedule()` يرفع `value.team` = أسماء الموظفين النشطين، و`render()` تدمجها مع أي اسم ما زال في الجلسات. (كان يظهر فقط من له جلسة، فيبدو فيه مصوّر واحد.)

> **Reminder for the agent:** Before making any change, read this file. After every change, update the relevant sections here (structure, data model, functions, changelog) so this file always reflects the current state of the project.