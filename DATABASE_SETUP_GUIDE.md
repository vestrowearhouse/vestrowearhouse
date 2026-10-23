
# 🗄️ Database Setup Guide - Vendor System

## সুপাবেস ডেটাবেস সেটআপ নির্দেশিকা

---

## ✅ প্রয়োজনীয় জিনিস:

1. ✅ Supabase Account (https://supabase.com)
2. ✅ আপনার Supabase Project
3. ✅ SQL Editor Access

---

## 📋 সেটআপ স্টেপস:

### **Step 1: Supabase Dashboard এ যান**
```
1. https://app.supabase.com এ ভিজিট করুন
2. লগইন করুন
3. আপনার প্রজেক্ট খুলুন
```

### **Step 2: SQL Editor খুলুন**
```
1. বাম পাশের মেনু থেকে "SQL Editor" ক্লিক করুন
2. "New Query" বাটন ক্লিক করুন
```

### **Step 3: SQL কোড কপি এবং পেস্ট করুন**
```
File: VENDOR_DATABASE_SETUP.sql
Location: D:\Downloads\stellarmartBd-main\VENDOR_DATABASE_SETUP.sql

এই ফাইলের সমস্ত কন্টেন্ট কপি করুন এবং Supabase SQL Editor এ পেস্ট করুন
```

### **Step 4: Query এক্সিকিউট করুন**
```
"RUN" বাটন ক্লিক করুন (Ctrl + Enter)
সফল হলে সবুজ টিক দেখাবে ✅
```

### **Step 5: Verification চেক করুন**
```
নিচের কমান্ড চালিয়ে ডেটাবেস সঠিকভাবে সেটআপ হয়েছে কিনা যাচাই করুন:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 📊 সম্পূর্ণ হওয়ার পর কি দেখবেন:

```
✅ users table created
✅ vendors table created
✅ RLS policies enabled
✅ Indexes created
```

---

## 🔧 যদি সমস্যা হয়:

### **সমস্যা 1: "Table already exists" Error**
```
সমাধান: এটা ঠিক আছে, ignore করুন
```

### **সমস্যা 2: "Permission denied" Error**
```
সমাধান: Supabase API key check করুন
- Settings > API Settings এ যান
- ANON KEY এবং SERVICE ROLE KEY কপি করুন
- .env.local ফাইলে আপডেট করুন
```

### **সমস্যা 3: RLS Policy Error**
```
সমাধান: পুরানো policies remove করুন:

DROP POLICY IF EXISTS "policy_name" ON table_name;

তারপর নতুন policies add করুন
```

---

## 🗑️ Clean Install এর জন্য:

যদি সবকিছু ফ্রেশ শুরু করতে চান:

```sql
-- ⚠️ সতর্কতা: এটি সমস্ত ডেটা মুছে দেবে

DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- তারপর VENDOR_DATABASE_SETUP.sql চালান
```

---

## 📝 Supabase Environment Variables:

আপনার `.env.local` ফাইলে এই ভ্যারিয়েবলস থাকা উচিত:

```
NEXT_PUBLIC_SUPABASE_URL=https://vgdejacoshvwpvbdpiqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

---

## ✨ Database Tables ডিটেইলস:

### **1. Users Table**
```
- id: UUID (Primary Key)
- email: TEXT UNIQUE
- password: TEXT (hashed)
- role: TEXT (customer, vendor, admin)
- status: TEXT (active, inactive, suspended)
- name, phone, avatar
- timestamps: created_at, updated_at
```

### **2. Vendors Table**
```
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key → users.id)
- shop_name: TEXT (দোকানের নাম)
- owner_name: TEXT
- email: TEXT
- phone: TEXT
- status: TEXT (active, suspended, pending)
- verification_badge: BOOLEAN
- timestamps: created_at, updated_at
```

---

## 🔐 RLS (Row Level Security) Policies:

### **Users Table:**
- ✅ ইউজার নিজের প্রোফাইল পড়তে পারে
- ✅ Service Role Key দিয়ে নতুন ইউজার তৈরি হতে পারে

### **Vendors Table:**
- ✅ ভেন্ডর নিজের প্রোফাইল পড়তে এবং আপডেট করতে পারে
- ✅ Service Role Key দিয়ে নতুন ভেন্ডর তৈরি এবং দেখা যায়

---

## 🎯 Testing:

সেটআপের পর টেস্ট করতে:

```bash
# Development সার্ভার চালান
npm run dev

# Admin Panel খোলুন
http://localhost:3000/admin/vendors

# নতুন ভেন্ডর তৈরি করুন
Shop Name: Tech Store
Owner Name: John Doe
Email: john@techstore.com
Password: Test@123456

# Vendor পোর্টালে লগইন করুন
http://localhost:3000/vendor
```

---

## 📞 সমর্থন:

যদি কোনো সমস্যা হয়, নিচের কমান্ড চালান ডেটাবেস স্ট্যাটাস চেক করতে:

```bash
# PowerShell এ
node vendor-db-check.js
```

---

## ✅ সম্পূর্ণ চেকলিস্ট:

- [ ] Supabase Project তৈরি করা হয়েছে
- [ ] SQL Query চালানো হয়েছে
- [ ] Users table যাচাই করা হয়েছে
- [ ] Vendors table যাচাই করা হয়েছে
- [ ] RLS policies enable করা হয়েছে
- [ ] .env.local আপডেট করা হয়েছে
- [ ] Admin account তৈরি করা হয়েছে
- [ ] Dev সার্ভার চালু করা হয়েছে
- [ ] Vendor তৈরি টেস্ট করা হয়েছে

---

## 🎉 সাফল্য!

যখন সবকিছু সঠিকভাবে সেটআপ হবে, আপনি:
1. Admin Panel থেকে ভেন্ডর তৈরি করতে পারবেন
2. ভেন্ডর লগইন করতে পারবেন
3. ভেন্ডর ড্যাশবোর্ড এক্সেস করতে পারবেন

Happy Selling! 🛒
