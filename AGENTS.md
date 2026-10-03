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
├── sw.js              # Service worker: browser cache for photos + page (faster repeat visits)
├── vercel.json        # Hosting headers: long-lived caching for thumbs/ (deployed on Vercel)
├── hero.jpg           # Hero/studio image asset
├── scripts/
│   └── make-thumbs.sh # Generates the small thumbs/ copies of every photo (run after adding photos)
├── thumbs/            # Optimized copies of every photo (~70 KB each, 55 files ≈ 3.8 MB) — loaded by the gallery
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
├── Event_pic/         # Gallery images for تصوير إيفنت (event)              — 13 photos
├── Editing_pic/       # Gallery images for مونتاج / تعديل (montage)         — 6 photos
└── party_pic/         # Gallery images for حفل تخرج (graduation)            — empty for now
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
  | `weddings`   | `photos/`       | 9 wedding photos                    |
  | `realestate` | `prodacts_pic/` | 26 product & food photos            |
  | `event`      | `Event_pic/`    | 13 event photos                     |
  | `montage`    | `Editing_pic/`  | 6 montage/edit photos               |
  | `graduation` | `party_pic/`    | `[]` (empty → placeholders)         |

  **To add photos for a category:** copy the files into that category's folder, **run `bash scripts/make-thumbs.sh`** (so the small `thumbs/` copies exist), then add the exact filenames to its `photos` array. (Filenames with spaces are fine — they are `encodeURI`-encoded when built into URLs.)
  **Every listed name must exist on disk exactly as written** (same spelling, same `-2` suffix, same extension case) — a name that only exists as a stale `thumbs/` copy makes the gallery show an outdated picture. See the rename trap in section 9.
- `GALLERY_COUNT = 6` — number of images shown at a time.
- `FALLBACK_FOLDER = 'photos/'` — used only if a category has no folder configured.
- `galleryFolder(categoryKey)` — returns the folder configured for a category.
- `pickRandomPhotos(categoryKey, count)` — Fisher–Yates shuffle of **that category's** `photos`, returns up to `count` `folder/name` URLs. If the category's `photos` is empty it returns `count` × `null` → cards render as "قريبًا" placeholders (**never** photos from another category).
- `GALLERIES` — maps each category key to its gallery `title`.
- `buildGallerySlides(images)` — builds the cards (`null` → placeholder). **Speed:** each card holds a real `<img class="ph">` whose `src` is the small `thumbs/` copy (first two cards `loading="eager"`, the rest `loading="lazy"`), all with `decoding="async"`; the full-size URL is kept in `data-full` only as a fallback.
- `handleGalleryImageError(img)` — the graceful-degradation chain: if the thumbnail 404s it retries **once** with the full-size original (`data-full`), and only if that fails too the card becomes a "قريبًا" placeholder. (Replaces the old `new Image()` probe, which downloaded every photo twice.)
- `THUMB_DIR = 'thumbs/'`, `THUMB_VERSION = '2'`, `thumbUrl(src)` — thumbnail path + cache-busting version (`…/8.jpeg.jpg?v=2`). **Bump `THUMB_VERSION` whenever photos/thumbs change** so browsers don't reuse stale cached copies.
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

1. **Small thumbnails** — every photo has a ~70 KB JPEG twin in `thumbs/` (longest side 720 px, quality 72), generated by `scripts/make-thumbs.sh`. A gallery load now transfers **~400 KB instead of ~33 MB (≈85× less)**. Total `thumbs/` size: ~3.8 MB for all 55 photos, so prefetching whole categories is safe.
2. **Native lazy loading + async decode** — cards are real `<img>` elements (`loading="eager"` for the first two, `lazy` for the rest, `decoding="async"`), styled by `.gallery .card img.ph` (`position:absolute; inset:0; object-fit:cover; border-radius:9px`).
3. **Prefetch / warm cache** — hovering or touching a category pill preloads that category; after `load`, `warmOtherCategories()` prefetches the rest one category per second (skipped on `saveData`/2G connections). Switching categories then renders instantly from the browser cache.
4. **Service worker (`sw.js`)** — images are *cache-first* (with a background refresh), `index.html` is *network-first* with a cache fallback, so repeat visits are near-instant and the page still opens offline. It is registered from `index.html` only on `http(s)`; on `file://` it is skipped silently.
5. **Host cache headers (`vercel.json`)** — the host sends `max-age=0, must-revalidate` for everything by default, which forces a revalidation round-trip per image. `vercel.json` overrides `/thumbs/*` with `public, max-age=31536000, immutable`, so even without a service worker the browser reuses them with **zero requests**. This is safe because thumb URLs carry `?v=THUMB_VERSION` — bumping that version (or changing a filename) produces new URLs. Originals under `photos/` etc. are deliberately left revalidated so replacing a file with the same name still shows up.

Keeping it fast when you change photos:

```bash
bash scripts/make-thumbs.sh          # generates only new/changed thumbnails
FORCE=1 bash scripts/make-thumbs.sh  # regenerates everything
```

Then **raise `THUMB_VERSION` in `index.html`** (currently `'2'`, e.g. → `'3'`) and commit `thumbs/` — the host serves the repo files as-is (no build step), so the thumbnails must be in the repo.

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

Recent history (most recent first) — run `git log --oneline` for the current hashes:

| Commit     | Message |
|------------|---------|
| `68e7207`  | Cache thumbnails for a year on the host (vercel.json) *(latest)* |
| `53953ba`  | Speed up gallery with thumbnails, prefetch and service worker caching |
| `c8eaab9`  | Show event and product photos in gallery |
| `06ff74b`  | Add event and product gallery photos |
| `309a72a`  | Separate gallery photos per category folder |
| `1141ba2`  | Add AGENTS.md project documentation |
| `da47a48`  | Select weddings category by default on page load |

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

> **Reminder for the agent:** Before making any change, read this file. After every change, update the relevant sections here (structure, data model, functions, changelog) so this file always reflects the current state of the project.