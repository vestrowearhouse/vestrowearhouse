# Supabase Database Menu - Setup & Connection Guide

## 🚀 Quick Start

Your admin panel database menu is now connected to your **real Supabase instance**!

### Step 1: Create Required RPC Functions (⚡ Important)

You must run these SQL queries in your Supabase Dashboard to enable all features.

**Instructions:**
1. Go to: https://app.supabase.com/project/vgdejacoshvwpvbdpiqf/sql/new
2. Copy the contents of `SUPABASE_RPC_SETUP.sql`
3. Paste into the SQL Editor
4. Click "Run" button

**Or copy this single query to test:**
```sql
CREATE OR REPLACE FUNCTION exec_sql(query_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF query_sql ILIKE 'SELECT%' THEN
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_sql || ') t';
  ELSE
    EXECUTE query_sql;
  END IF;
  RETURN '{"status": "success"}'::jsonb;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
```

### Step 2: Verify Environment Variables ✅

Your `.env.local` already has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://vgdejacoshvwpvbdpiqf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **All configured!** No changes needed.

### Step 3: Start the Dev Server

```bash
npm run dev
```

### Step 4: Access Database Menu

1. Go to: http://localhost:3000/admin
2. Navigate to: **System > Database**
3. You should see your Supabase tables!

## 📊 What You Can Do Now

### ✅ View Tables
- All tables from your Supabase database appear in the sidebar
- Click any table to view its data

### ✅ View Data
- Spreadsheet-like grid with all rows
- Search, sort, and filter data
- Pagination (50 rows per page)

### ✅ Edit Data
- Double-click any cell to edit
- Press Enter to save
- Changes saved immediately to Supabase

### ✅ Create Tables
- Click "New Table" button
- Define columns with types (text, integer, json, uuid, etc.)
- Set constraints (primary key, unique, nullable)
- Table created in your Supabase database

### ✅ Manage Columns
- Switch to "Structure" tab
- Add or delete columns
- Changes applied instantly

### ✅ Run SQL
- Switch to "SQL Editor" tab
- Write any PostgreSQL query
- View formatted results

## 🔑 Environment Variables Explained

| Variable | Purpose | Status |
|----------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access (server-only) | ✅ Set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Limited access (public) | ✅ Set |

**Note:** Service Role Key gives full database access. Keep it secret! Only store in `.env.local` (not in git).

## 🔒 Security Checklist

✅ Do:
- Use Service Role Key only on server (backend)
- Keep .env.local in .gitignore
- Run SQL validation on inputs
- Use prepared statements

⚠️ Don't:
- Expose Service Role Key in frontend code
- Commit .env.local to git
- Allow DROP DATABASE commands
- Give admin panel access to untrusted users

## 🧪 Testing Checklist

Run these tests to verify everything works:

### Test 1: View Existing Tables
- [ ] Visit `/admin/database`
- [ ] Tables appear in sidebar
- [ ] Data loads when you click a table

### Test 2: Create a Test Table
- [ ] Click "New Table"
- [ ] Create table: `test_items`
- [ ] Add columns:
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `created_at` (timestamp, default now())
- [ ] Click "Create Table"
- [ ] Table appears in sidebar

### Test 3: Add Data
- [ ] Select `test_items` table
- [ ] Click "Add Row"
- [ ] Enter a name
- [ ] Verify row appears in table

### Test 4: Edit Data
- [ ] Double-click a cell
- [ ] Change the value
- [ ] Press Enter
- [ ] Verify change saved

### Test 5: SQL Editor
- [ ] Click "SQL Editor" tab
- [ ] Write: `SELECT COUNT(*) FROM test_items;`
- [ ] Click "Execute Query"
- [ ] See results

### Test 6: Delete Table
- [ ] In sidebar, hover over `test_items`
- [ ] Click delete icon
- [ ] Confirm deletion
- [ ] Table removed from Supabase

## 🐛 Troubleshooting

### Problem: Empty table list
**Solution:**
- Check browser console (F12) for errors
- Verify Supabase URL is correct
- Ensure Service Role Key is set
- Restart dev server: `npm run dev`

### Problem: "RPC function not found"
**Solution:**
- You didn't run the SQL setup queries
- Go to Supabase SQL Editor
- Copy `SUPABASE_RPC_SETUP.sql` and run it
- The error should disappear

### Problem: Can't edit/delete cells
**Solution:**
- Table must have a primary key column
- Check your table has `id` field
- Restart dev server and try again

### Problem: Supabase credentials not working
**Solution:**
- Verify credentials in `.env.local`
- Copy them exactly from Supabase dashboard
- No extra spaces or quotes
- Restart dev server

### Problem: 401 Unauthorized errors
**Solution:**
- Make sure you're logged in as admin
- Check `/admin-login` is working
- Verify admin session is active
- Check browser cookies

### Problem: CORS errors
**Solution:**
- These are normal - API routes handle them
- Check browser console for details
- Verify API routes exist in `/app/api/database/`

## 📝 Your Table Lists

### Your Existing Supabase Tables

You should see these tables in the sidebar:
- `users`
- `products`
- `orders`
- `categories`
- `coupons`
- `banners`
- `settings`
- `cart`

(Plus any other tables you've created)

## 🔄 How It Works

### Data Flow:
```
Frontend (React Component)
    ↓
Database Service (/lib/database-service.js)
    ↓
API Routes (/app/api/database/*)
    ↓
Supabase SDK
    ↓
Supabase RPC Functions
    ↓
PostgreSQL Database
```

### File Structure:
```
/app/admin/database/page.jsx          ← Main UI
/app/components/database/             ← React components
  ├── DatabaseSidebar.jsx
  ├── DataGrid.jsx
  ├── CreateTableModal.jsx
  ├── SchemaViewer.jsx
  └── SQLConsole.jsx
/app/api/database/                    ← API endpoints
  ├── /tables/route.js
  ├── /query/route.js
  └── ... (8+ more endpoints)
/lib/database-service.js              ← Service layer
```

## 📚 API Endpoints Available

```
GET    /api/database/tables                              List tables
POST   /api/database/tables                              Create table
DELETE /api/database/tables/[name]                       Drop table

GET    /api/database/tables/[name]/schema                Get schema
GET    /api/database/tables/[name]/rows                  Get rows
POST   /api/database/tables/[name]/rows                  Insert row
PATCH  /api/database/tables/[name]/rows/[id]             Update row
DELETE /api/database/tables/[name]/rows/[id]             Delete row

POST   /api/database/tables/[name]/columns               Add column
DELETE /api/database/tables/[name]/columns/[col]         Delete column

POST   /api/database/query                               Execute SQL
GET    /api/database/stats                               Database stats
```

## 🎓 Next Steps

### Immediate:
1. ✅ Set up RPC functions (SUPABASE_RPC_SETUP.sql)
2. ✅ Start dev server
3. ✅ Test database menu
4. ✅ Create/edit test data

### Soon:
- [ ] Deploy to Vercel
- [ ] Set up Row-Level Security (RLS)
- [ ] Enable audit logging
- [ ] Set database backups

### Later:
- [ ] Add data export (CSV)
- [ ] Add query builder UI
- [ ] Add performance monitoring
- [ ] Add change history/rollback

## 💡 Pro Tips

### Tip 1: SQL Editor Shortcuts
- Write common queries and save them
- Use `SELECT COUNT(*) FROM table_name;` to check row counts
- Preview queries before running

### Tip 2: Large Datasets
- Database auto-paginates at 50 rows per page
- Use search/sort to find specific rows
- Don't load millions of rows at once

### Tip 3: Schema Planning
- Always use UUID for primary keys
- Use lowercase with underscores for column names
- Set default timestamps: `DEFAULT NOW()`
- Use JSONB for flexible data

### Tip 4: Backup Before Changes
- Before running destructive queries:
  - Export important data
  - Test on a small table first
  - Have backups ready

## 🆘 Support

If you encounter issues:

1. **Check the console:**
   - Open browser DevTools (F12)
   - Look at Console and Network tabs
   - Share error messages

2. **Check logs:**
   - Supabase: Logs → Database → Editor
   - Next.js: Terminal output
   - Browser: Console tab

3. **Reset:**
   ```bash
   # Clear cache and restart
   npm run build
   npm run dev
   ```

## ✨ Features Summary

| Feature | Status |
|---------|--------|
| View tables | ✅ |
| View rows | ✅ |
| Search/sort | ✅ |
| Inline editing | ✅ |
| Add rows | ✅ |
| Delete rows | ✅ |
| Create tables | ✅ |
| Add columns | ✅ |
| Delete columns | ✅ |
| Drop tables | ✅ |
| SQL editor | ✅ |
| SQL execution | ✅ |
| Pagination | ✅ |
| Error handling | ✅ |
| Loading states | ✅ |
| Responsive UI | ✅ |

## 🎉 You're All Set!

Your admin database management interface is now connected to your real Supabase database.

**Next Action:** Run `npm run dev` and visit `/admin/database` to start managing your data!
