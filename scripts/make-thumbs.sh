#!/usr/bin/env bash
# ============================================================
# make-thumbs.sh — يولّد صورًا مصغّرة (thumbnails) لصور الجلري
#
# لماذا؟ صور الكاميرا الأصلية كبيرة جدًا (5–18 ميجابايت للصورة الواحدة)
# لذلك تتأخر في الظهور. بطاقات الجلري صغيرة (150×210 بكسل) ولا تحتاج
# إلا صورة بعرض ~720 بكسل، وحجمها يصبح ~70 كيلوبايت بدل 17 ميجابايت.
#
# كل صورة في مجلد نوع تُحوّل إلى:
#     thumbs/<المجلد>/<اسم الملف الأصلي>.jpg
# مثال: prodacts_pic/7.png  →  thumbs/prodacts_pic/7.png.jpg
#       photos/DSC02717.jpg →  thumbs/photos/DSC02717.jpg.jpg
# (يبقى الامتداد الأصلي داخل الاسم حتى لا يتعارض 7.jpg مع 7.png)
#
# الاستخدام:
#     bash scripts/make-thumbs.sh          # يولّد الناقص/المتغيّر فقط
#     FORCE=1 bash scripts/make-thumbs.sh  # يعيد توليد كل الصور
#
# ملاحظة: بعد تشغيله ارفع مجلد thumbs/ إلى git (لا يوجد بناء تلقائي
# على GitHub Pages)، ولا تنسَ زيادة THUMB_VERSION داخل index.html
# حتى يتجاهل المتصفح النسخ القديمة المخزّنة.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

MAX=720        # أطول ضلع في الصورة المصغّرة (بكسل)
QUALITY=72     # جودة JPEG (0-100)
FOLDERS=(photos prodacts_pic Event_pic Editing_pic party_pic)
FORCE="${FORCE:-0}"

command -v sips >/dev/null 2>&1 || { echo "sips غير موجود (يحتاج macOS)"; exit 1; }

count=0
skipped=0
src_bytes=0
out_bytes=0

for folder in "${FOLDERS[@]}"; do
  src_dir="$ROOT/$folder"
  [ -d "$src_dir" ] || continue
  out_dir="$ROOT/thumbs/$folder"
  mkdir -p "$out_dir"
  # .gitkeep حتى تبقى المجلدات الفارغة متتبَّعة في git
  [ -f "$out_dir/.gitkeep" ] || : > "$out_dir/.gitkeep"

  while IFS= read -r -d '' src; do
    name="$(basename "$src")"
    out="$out_dir/$name.jpg"
    if [ "$FORCE" != "1" ] && [ -f "$out" ] && [ "$out" -nt "$src" ]; then
      skipped=$((skipped + 1))
      continue
    fi
    sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAX" "$src" --out "$out" >/dev/null
    count=$((count + 1))
    src_bytes=$((src_bytes + $(stat -f%z "$src")))
    out_bytes=$((out_bytes + $(stat -f%z "$out")))
    printf '%-52s %6s KB → %5s KB\n' \
      "$folder/$name" \
      "$(( $(stat -f%z "$src") / 1024 ))" \
      "$(( $(stat -f%z "$out") / 1024 ))"
  done < <(find "$src_dir" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' \) -print0)
done

echo "------------------------------------------------------------"
echo "تم توليد: $count صورة (تم تخطّي: $skipped صورة محدّثة مسبقًا)"
if [ "$count" -gt 0 ]; then
  echo "الحجم قبل: $(( src_bytes / 1024 / 1024 )) ميجابايت → بعد: $(( out_bytes / 1024 )) كيلوبايت"
fi
echo "مجلد النتائج: $ROOT/thumbs/"
