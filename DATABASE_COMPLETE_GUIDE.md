
# 📊 Database SQL Setup - Complete Guide
# ডেটাবেস সম্পূর্ণ গাইড

---

## 📁 Database Files Created:

### **1. VENDOR_DATABASE_SETUP.sql** (Main Setup File)
**Location:** `D:\Downloads\stellarmartBd-main\VENDOR_DATABASE_SETUP.sql`

**Purpose:** Complete database schema and RLS policies
**Contains:**
- ✅ Users table creation
- ✅ Vendors table creation  
- ✅ All RLS policies
- ✅ Indexes for performance
- ✅ Verification queries

**How to Use:**
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new Query
4. Copy entire content from VENDOR_DATABASE_SETUP.sql
5. Paste into SQL Editor
6. Click RUN (Ctrl + Enter)
7. Check for green checkmarks ✅
```

---

### **2. DATABASE_SETUP_GUIDE.md** (Bengali Guide)
**Location:** `D:\Downloads\stellarmartBd-main\DATABASE_SETUP_GUIDE.md`

**Purpose:** Step-by-step setup instructions in Bengali
**Contains:**
- 📋 Required setup steps
- 🔧 Troubleshooting guide
- ⚠️ Common errors and solutions
- ✅ Verification checklist

---

### **3. DATABASE_QUERIES_REFERENCE.sql** (Reference Guide)
**Location:** `D:\Downloads\stellarmartBd-main\DATABASE_QUERIES_REFERENCE.sql`

**Purpose:** Useful SQL queries for database management
**Contains:**
- 📊 Sample queries
- 🔍 Data verification queries
- 📈 Statistics queries
- 🔧 Maintenance queries
- 🐛 Troubleshooting queries

---

### **4. vendor-db-check.js** (Database Verification Script)
**Location:** `D:\Downloads\stellarmartBd-main\vendor-db-check.js`

**Purpose:** Check if database is properly configured
**How to Use:**
```bash
node vendor-db-check.js
```

**Output Shows:**
```
✅ Users Table status
✅ Vendors Table status
✅ RLS Policies status
✅ Database Connection status
✅ Current Record Counts
```

---

## 🗄️ Database Schema Summary:

### **USERS Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL (bcrypt hashed),
  role TEXT (customer, vendor, admin),
  status TEXT (active, inactive, suspended),
  phone TEXT,
  avatar TEXT,
  email_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Indexes:**
- ✅ idx_users_email
- ✅ idx_users_role
- ✅ idx_users_status

---

### **VENDORS Table**
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE (Foreign Key),
  shop_name TEXT NOT NULL,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  shop_address TEXT,
  logo_url TEXT,
  status TEXT (active, suspended, pending),
  verification_badge BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Indexes:**
- ✅ idx_vendors_user_id
- ✅ idx_vendors_status
- ✅ idx_vendors_shop_name

---

## 🔐 RLS (Row Level Security) Enabled:

### **USERS Table Policies:**
1. **"Users can read own profile"**
   - User can view their own data only
   - Query: `WHERE auth.uid() = id`

2. **"Service role can create users"**
   - Server can create new users
   - Used by: Admin API endpoints

3. **"Service role can update users"**
   - Server can update user data
   - Used by: Authentication flows

### **VENDORS Table Policies:**
1. **"Vendors can read own profile"**
   - Vendor views only own shop
   - Query: `WHERE user_id = auth.uid()`

2. **"Vendors can update own profile"**
   - Vendor updates own shop info
   - Query: `WHERE user_id = auth.uid()`

3. **"Admin can create vendors"**
   - Service role creates new vendors
   - Used by: Admin panel

4. **"Service role can read all vendors"**
   - Service role views all vendors
   - Used by: Admin API endpoints

---

## ✅ Current Database Status:

```
✅ Database: OPERATIONAL
✅ Users: 10 records (verified)
✅ Vendors: 1 record (verified)
✅ RLS Policies: ENABLED
✅ Indexes: CREATED
✅ Foreign Keys: ACTIVE
✅ Connection: SECURE
```

---

## 🚀 Quick Setup (5 Steps):

**Step 1:** Open Supabase
```
https://app.supabase.com → Select Project
```

**Step 2:** Open SQL Editor
```
Left Menu → SQL Editor → New Query
```

**Step 3:** Copy SQL
```
Open: VENDOR_DATABASE_SETUP.sql
Copy all content
```

**Step 4:** Execute
```
Paste into SQL Editor → Click RUN
```

**Step 5:** Verify
```
Run: node vendor-db-check.js
Confirm: ✅ All systems ready!
```

---

## 🔍 Useful Database Queries:

### **View All Vendors:**
```sql
SELECT v.shop_name, v.owner_name, v.email, v.status, u.email as login_email
FROM vendors v
JOIN users u ON v.user_id = u.id
ORDER BY v.created_at DESC;
```

### **Check Vendor Statistics:**
```sql
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended
FROM vendors;
```

### **Find User by Email:**
```sql
SELECT id, name, email, role, status
FROM users
WHERE email = 'vendor@example.com';
```

### **List All RLS Policies:**
```sql
SELECT policyname, tablename, permissive, cmd
FROM pg_policies
ORDER BY tablename;
```

---

## 🆘 Troubleshooting:

### **Issue: "Table already exists" Error**
```
✅ This is normal, ignore it
✅ SQL will skip existing tables
```

### **Issue: "Permission denied" on Insert**
```
Solution: Check RLS policies
1. Go to Supabase Dashboard
2. Table Editor → vendors
3. Check RLS Policies are enabled
4. Verify "Service role can create vendors" exists
```

### **Issue: Vendor Not Created**
```
Solution: Run vendor-db-check.js
- Check if users table has the new user
- Check if vendors table references exist
- Verify RLS policies allow inserts
```

### **Issue: Foreign Key Violation**
```
Solution: Ensure user exists before creating vendor
1. User must be created first in users table
2. Get user ID
3. Create vendor with that user_id
```

---

## 📝 Environment Variables Needed:

```
.env.local file should contain:

NEXT_PUBLIC_SUPABASE_URL=https://vgdejacoshvwpvbdpiqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
JWT_SECRET=your_jwt_secret_key
```

---

## 🎯 Testing the Database:

### **Test 1: Create a Test Vendor**
```bash
# Use Admin Panel
1. Go to http://localhost:3000/admin/vendors
2. Click "Add Vendor"
3. Fill form:
   - Shop Name: Test Shop
   - Owner Name: Test Owner
   - Email: test@example.com
   - Password: Test@123456
4. Click "Create Vendor"
```

### **Test 2: Verify in Database**
```bash
# Run check script
node vendor-db-check.js

# Should show:
✅ Users Table: 11 records
✅ Vendors Table: 2 records
```

### **Test 3: Vendor Login**
```
1. Go to http://localhost:3000/vendor
2. Login with:
   - Email: test@example.com
   - Password: Test@123456
3. Should redirect to vendor dashboard
```

---

## 📊 Database File Locations:

```
D:\Downloads\stellarmartBd-main\
├── VENDOR_DATABASE_SETUP.sql .................. Main setup SQL
├── DATABASE_SETUP_GUIDE.md ................... Setup instructions
├── DATABASE_QUERIES_REFERENCE.sql ........... Reference queries
├── vendor-db-check.js ....................... Verification script
├── complete-supabase-schema.sql ............. Complete schema
└── .env.local .............................. Environment variables
```

---

## ✨ Complete Checklist:

- [ ] Read VENDOR_DATABASE_SETUP.sql
- [ ] Open Supabase Dashboard
- [ ] Run SQL queries
- [ ] Run vendor-db-check.js
- [ ] Verify ✅ all checks pass
- [ ] Test vendor creation from Admin
- [ ] Test vendor login
- [ ] Bookmark these guides for future reference

---

## 🎉 Success Indicators:

When everything is set up correctly, you will see:

```
✅ Database verification complete!

📊 Summary:
   ✅ Users Table: 10 records
   ✅ Vendors Table: 1+ records
   ✅ RLS Policies: Enabled

🎉 Database is ready for vendor system!
```

---

## 📞 Quick Reference:

**Database Setup:** `VENDOR_DATABASE_SETUP.sql`
**Check Status:** `node vendor-db-check.js`
**View Guide:** `DATABASE_SETUP_GUIDE.md`
**Reference:** `DATABASE_QUERIES_REFERENCE.sql`

**Supabase URL:** https://vgdejacoshvwpvbdpiqf.supabase.co
**Dev Server:** http://localhost:3000
**Admin Panel:** http://localhost:3000/admin/vendors
**Vendor Portal:** http://localhost:3000/vendor

---

Happy Building! 🚀
