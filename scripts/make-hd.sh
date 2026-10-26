#!/usr/bin/env bash
# ============================================================
# make-hd.sh — يولّد نسخًا عالية الجودة (HD) لصفحة «المزيد من الصور» photos.html
#
# الأصول الأصلية كبيرة (حتى 18 ميجابايت للصورة) والمصغّرات صغيرة (720px) لا تكفي للعرض
# الكامل؛ لذلك لكل صورة نسخة وسطى: أطول ضلع 2000 بكسل وجودة 85 (~300–900 كيلوبايت):
#     hd/<المجلد>/<اسم الملف الأصلي>.jpg      مثال: prodacts_pic/7.png → hd/prodacts_pic/7.png.jpg
#
# الاستخدام:
#     bash scripts/make-hd.sh          # يولّد الناقص/المتغيّر فقط
#     FORCE=1 bash scripts/make-hd.sh  # يعيد توليد الكل
# بعد التشغيل ارفع مجلد hd/ إلى git، ولا تنسَ رفع THUMB_VERSION في photos-data.js.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

MAX=2000       # أطول ضلع (بكسل): جودة عالية للعرض الكامل
QUALITY=85     # جودة JPEG (0-100)
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
  out_dir="$ROOT/hd/$folder"
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
    # لا نكبّر الصور الصغيرة (التكبير يزيد الحجم بلا جودة)؛ نصغّر فقط ما هو أكبر من MAX
    w="$(sips -g pixelWidth "$src" | awk '/pixelWidth/{print $2}')"
    h="$(sips -g pixelHeight "$src" | awk '/pixelHeight/{print $2}')"
    big=$(( w > h ? w : h ))
    if [ "$big" -gt "$MAX" ]; then
      sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAX" "$src" --out "$out" >/dev/null
    else
      sips -s format jpeg -s formatOptions "$QUALITY" "$src" --out "$out" >/dev/null
    fi
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
echo "مجلد النتائج: $ROOT/hd/"
