# 🏋️ Fit & Meal Planner

เว็บแอปส่วนตัวสำหรับวางแผน **ออกกำลังกาย** และ **อาหารการกิน** รายวัน พร้อมปฏิทินดูภาพรวมทั้งเดือน และหน้าโปรไฟล์เก็บข้อมูลส่วนตัว (น้ำหนัก ส่วนสูง เป้าหมาย ฯลฯ)

สร้างด้วย **Next.js 14 (App Router) + TypeScript + Tailwind CSS** ฝั่งหน้าบ้าน และ **Supabase (Postgres)** เป็นฐานข้อมูล/แบ็กเอนด์ ไม่มีระบบ login เพราะออกแบบไว้ให้ใช้คนเดียว

---

## โครงสร้างหน้าเว็บ

| หน้า | path | ใช้ทำอะไร |
|---|---|---|
| วันนี้ | `/` | ดู/เพิ่ม/ติ๊กเสร็จ มื้ออาหารและท่าออกกำลังกายของ "วันนี้" |
| ปฏิทิน | `/calendar` | ปฏิทินรายเดือน จุดเขียว = วันที่มีแผนแล้ว คลิกวันไหนก็ไปดู/แก้ไขวันนั้นได้ |
| รายวัน | `/day/2026-10-20` | หน้ารายละเอียดของวันที่เลือก (เข้าจาก Calendar) |
| โปรไฟล์ | `/profile` | ข้อมูลส่วนตัว: ชื่อ อายุ น้ำหนัก ส่วนสูง เป้าหมาย เป้าแคลอรี่/วัน |

ข้อมูลทั้งหมดถูกเก็บถาวรใน Supabase ตามตาราง `profiles`, `meal_entries`, `workout_entries`

---

## 1) ตั้งค่า Supabase (ฐานข้อมูล)

1. ไปที่ https://supabase.com สมัคร/ล็อกอิน แล้วกด **New Project**
2. ตั้งชื่อโปรเจกต์และรหัสผ่านฐานข้อมูล รอจนโปรเจกต์พร้อม (ไม่กี่นาที)
3. ไปที่เมนู **SQL Editor** → **New query**
4. เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์นี้ คัดลอกทั้งหมด วางแล้วกด **Run**
   - จะได้ตาราง `profiles`, `meal_entries`, `workout_entries` พร้อม Row Level Security ที่เปิดให้อ่าน/เขียนได้ (ดูหัวข้อ "ความปลอดภัย" ด้านล่าง)
5. ไปที่เมนู **Project Settings → API** คัดลอกค่า 2 ค่า:
   - **Project URL** → ใช้เป็น `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → ใช้เป็น `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2) รันทดสอบในเครื่องตัวเอง (ไม่บังคับ แต่แนะนำ)

ต้องมี [Node.js](https://nodejs.org) เวอร์ชัน 18 ขึ้นไป

```bash
# ติดตั้ง dependencies
npm install

# คัดลอกไฟล์ env แล้วใส่ค่าจาก Supabase
cp .env.local.example .env.local
# แก้ไข .env.local ใส่ URL และ anon key ของคุณ

# รันเซิร์ฟเวอร์ dev
npm run dev
```

เปิดเบราว์เซอร์ไปที่ http://localhost:3000

---

## 3) อัปโหลดขึ้น GitHub

```bash
cd fitness-planner
git init
git add .
git commit -m "Initial commit: fitness & meal planner"
```

จากนั้นไปที่ https://github.com/new สร้าง repository ใหม่ (ตั้งชื่อ เช่น `fitness-planner`) **อย่าติ๊ก** "Add a README" (เพราะมีแล้ว) แล้วรันคำสั่งที่ GitHub แสดงให้ เช่น:

```bash
git remote add origin https://github.com/<ชื่อผู้ใช้ของคุณ>/fitness-planner.git
git branch -M main
git push -u origin main
```

> ไฟล์ `.env.local` จะไม่ถูกอัปขึ้น GitHub เพราะอยู่ใน `.gitignore` อยู่แล้ว (ปลอดภัย ไม่หลุด key)

---

## 4) Deploy ขึ้น Vercel

1. ไปที่ https://vercel.com แล้วล็อกอินด้วยบัญชี GitHub เดียวกัน
2. กด **Add New... → Project** แล้วเลือก repo `fitness-planner` ที่เพิ่ง push ไป
3. Vercel จะตรวจพบว่าเป็นโปรเจกต์ Next.js อัตโนมัติ ไม่ต้องแก้ Build settings
4. ก่อนกด Deploy ให้เปิดส่วน **Environment Variables** แล้วเพิ่ม 2 ตัวแปรนี้ (ค่าจาก Supabase ข้อ 1):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. กด **Deploy** รอสักครู่ เสร็จแล้วจะได้ลิงก์ เช่น `https://fitness-planner-xxxx.vercel.app`

ทุกครั้งที่ `git push` โค้ดใหม่ขึ้น GitHub, Vercel จะ deploy เวอร์ชันใหม่ให้อัตโนมัติ

---

## ความปลอดภัย (สำคัญ อ่านก่อน deploy จริง)

เพราะไม่มีระบบ login, การตั้งค่าฐานข้อมูลตอนนี้เปิดให้ **ใครก็ตามที่รู้ลิงก์เว็บไซต์ของคุณ** สามารถอ่าน/แก้ไขข้อมูลอาหารและออกกำลังกายได้ (ไม่ใช่แค่ดูอย่างเดียว) ถ้าต้องการใช้คนเดียวจริง ๆ แนะนำอย่างใดอย่างหนึ่ง:

- **ง่ายสุด**: อย่าแชร์ลิงก์ Vercel ให้ใคร และเลือก "ไม่ทำ SEO/ไม่ลิงก์จากที่อื่น" ก็ลดความเสี่ยงไปมากแล้ว
- **เพิ่มรหัสผ่านง่าย ๆ**: ใช้ Vercel's "Password Protection" (มีในแพ็กเกจ Pro) หรือเพิ่ม Next.js Middleware ตรวจรหัสผ่านแบบง่าย (บอกผมได้ถ้าอยากให้ช่วยเพิ่มส่วนนี้)
- **ทำเต็มรูปแบบ**: เพิ่ม Supabase Auth (อีเมล/รหัสผ่าน หรือ Magic Link) แล้วผูก Row Level Security ให้เช็ค `auth.uid()` แทนการเปิดสาธารณะ (บอกผมได้เช่นกันถ้าอยากอัปเกรดภายหลัง)

---

## เทคโนโลยีที่ใช้

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (Postgres + auto-generated REST API ผ่าน `@supabase/supabase-js`)
- [date-fns](https://date-fns.org/) สำหรับคำนวณปฏิทิน
- Deploy บน [Vercel](https://vercel.com/)
