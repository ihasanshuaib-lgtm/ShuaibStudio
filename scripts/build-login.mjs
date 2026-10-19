// ============================================================
// build-login.mjs — يشفّر صفحة الرواتب ويولّد payroll.enc.js
//
// الاستخدام (من مجلد المشروع):
//   node scripts/build-login.mjs <username> <password> [source.html]
//
// المصدر الافتراضي: private/payroll.src.html (غير مرفوع إلى git).
// الناتج: payroll.enc.js (هذا الملف هو الذي يُرفع إلى الموقع).
//
// التشفير: AES-256-GCM، والمفتاح مشتق من (username + password)
// عبر PBKDF2-SHA256 — يجب أن يطابق login.html تمامًا.
// لتغيير اليوزر أو الباسورد: شغّل السكربت من جديد بالقيم الجديدة.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [user, pass, src = join(root, 'private', 'payroll.src.html')] = process.argv.slice(2);

if (!user || !pass) {
  console.error('Usage: node scripts/build-login.mjs <username> <password> [source.html]');
  process.exit(1);
}
if (pass.length < 8) {
  console.warn('WARNING: password is shorter than 8 characters — payroll.enc.js is public, so a short password can be guessed offline.');
}

const ITER = 310000;
const salt = randomBytes(16);
const iv = randomBytes(12);
const secret = user.trim().toLowerCase() + '\u0000' + pass;
const key = pbkdf2Sync(secret, salt, ITER, 32, 'sha256');

const cipher = createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cipher.update(readFileSync(src, 'utf8'), 'utf8'), cipher.final()]);
const data = Buffer.concat([ct, cipher.getAuthTag()]); // WebCrypto expects ciphertext||tag

const payload = {
  v: 1,
  iter: ITER,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  data: data.toString('base64'),
};

writeFileSync(join(root, 'payroll.enc.js'), 'window.PAYROLL_ENC = ' + JSON.stringify(payload) + ';\n');
console.log('OK -> payroll.enc.js (' + Math.round(data.length / 1024) + ' KB), user: ' + user.trim().toLowerCase());
