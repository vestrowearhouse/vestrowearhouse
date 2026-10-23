# Admin Panel Database Management - Implementation Guide

## Overview

A comprehensive, Supabase-inspired database management interface for the admin panel. This allows administrators to visually manage database tables, data, and execute SQL queries without leaving the admin interface.

## Features Implemented

### ✅ Core Features

- **Database Sidebar** - Navigate between tables, views, functions, and enums
- **Table Explorer** - List all tables with row counts and created dates
- **Create Table Modal** - Visual builder for creating new database tables
- **Data Grid View** - Spreadsheet-like interface for viewing and editing table data
- **Pagination & Sorting** - Navigate large datasets efficiently
- **Search & Filter** - Find specific rows quickly
- **Inline Cell Editing** - Double-click cells to edit values
- **Row Management** - Add, edit, delete rows
- **Table Structure View** - View and modify table schema
- **Column Management** - Add and delete columns
- **SQL Editor** - Execute raw SQL queries
- **Modern UI** - Dark sidebar, clean design with Supabase inspiration
- **Responsive Layout** - Works on various screen sizes

### ✅ API Endpoints

```
GET    /api/database/tables                              - List all tables
POST   /api/database/tables                              - Create new table
DELETE /api/database/tables/[tableName]                  - Drop table

GET    /api/database/tables/[tableName]/schema           - Get table schema
GET    /api/database/tables/[tableName]/rows             - Fetch table rows
POST   /api/database/tables/[tableName]/rows             - Insert row
PATCH  /api/database/tables/[tableName]/rows/[id]        - Update row
DELETE /api/database/tables/[tableName]/rows/[id]        - Delete row

POST   /api/database/tables/[tableName]/columns          - Add column
DELETE /api/database/tables/[tableName]/columns/[name]   - Delete column

POST   /api/database/query                               - Execute SQL
GET    /api/database/stats                               - Get database stats
```

### ✅ Components

1. **DatabaseSidebar** - Expandable navigation sidebar with table list
2. **DataGrid** - Advanced table display with inline editing
3. **CreateTableModal** - Modal for defining new tables
4. **SQLConsole** - SQL editor and query executor
5. **SchemaViewer** - Table structure view with column management

### ✅ Database Service

Central service layer (`lib/database-service.js`) with reusable functions:
- `getTables()` - Fetch all tables
- `getTableSchema(tableName)` - Get column information
- `getTableRows(tableName, options)` - Fetch rows with pagination/sorting
- `insertRow(tableName, data)` - Add new row
- `updateRow(tableName, id, data)` - Modify row
- `deleteRow(tableName, id)` - Remove row
- `createTable(tableName, columns)` - Create table
- `deleteTable(tableName)` - Drop table
- `addColumn(tableName, columnDef)` - Add column
- `deleteColumn(tableName, columnName)` - Remove column
- `executeSql(query)` - Run raw SQL
- `getDatabaseStats()` - Get database metrics

## File Structure

```
/app
  /admin
    /database
      page.jsx                  - Main database page
      actions.js               - Server actions (if needed)
  /api
    /database
      /tables
        route.js               - List/create tables
        /[tableName]
          route.js             - Drop table
          /schema
            route.js           - Get schema
          /rows
            route.js           - Get/insert rows
            /[id]
              route.js         - Update/delete rows
          /columns
            route.js           - Add column
            /[columnName]
              route.js         - Delete column
      /query
        route.js               - Execute SQL
      /stats
        route.js               - Database stats
  /components
    /database
      DatabaseSidebar.jsx      - Sidebar navigation
      DataGrid.jsx             - Data table component
      CreateTableModal.jsx     - Table creation form
      SQLConsole.jsx           - SQL editor
      SchemaViewer.jsx         - Schema management
/lib
  database-service.js          - Database API client
```

## Usage

### Accessing Database Management

1. Navigate to Admin Panel > System > Database
2. Select a table from the sidebar to view its data
3. Use tabs to switch between Data, Structure, and SQL Editor views

### Creating a Table

1. Click "New Table" button
2. Enter table name
3. Add columns:
   - Column name
   - Data type (text, integer, boolean, json, uuid, etc.)
   - Options: Primary Key, Nullable, Unique, Auto Increment, Default Value
4. Click "Create Table"

### Managing Data

**View Data:**
- Tables are displayed in a spreadsheet-like grid
- Scroll horizontally for columns, vertically for rows
- Sort by clicking column headers
- Search using the search bar

**Edit Data:**
- Double-click any cell to edit
- Press Enter to save, Escape to cancel
- Changes are saved to database immediately

**Add Row:**
- Click "Add Row" button
- Form will be generated based on table schema
- Fill in values and submit

**Delete Row:**
- Click delete icon in row actions
- Confirm deletion
- Or select multiple rows and bulk delete

### Managing Schema

1. Switch to "Structure" tab
2. View all columns with their types and constraints
3. Add Column: Click "Add Column" button
4. Edit Column: Click edit icon
5. Delete Column: Click delete icon (prevents deleting primary keys)

### Writing SQL

1. Switch to "SQL Editor" tab
2. Write your SQL query (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, etc.)
3. Click "Execute Query"
4. Results appear in the Results panel below
5. Copy queries or clear editor as needed

**Security Notes:**
- Cannot execute DROP DATABASE or TRUNCATE
- All queries use Service Role key (if available)
- All inputs are validated server-side

## Configuration Requirements

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

The interface will use the Service Role key for full database access. If not available, it falls back to the Anon key.

### Required RPC Functions

For full functionality, you may need these RPC functions in Supabase:

```sql
-- Execute SQL (if not exists)
CREATE OR REPLACE FUNCTION exec_sql(query_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  IF query_sql ILIKE 'SELECT%' THEN
    EXECUTE 'SELECT json_agg(row) FROM (' || query_sql || ') row' INTO result;
    RETURN result;
  ELSE
    EXECUTE query_sql;
    RETURN '{"status": "success"}'::jsonb;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM)::jsonb;
END;
$$;

-- Get tables
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (name text, row_count bigint, created_at timestamp)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    tablename::text,
    (SELECT count(*) FROM information_schema.tables) as row_count,
    now()
  FROM pg_tables
  WHERE schemaname = 'public';
$$;

-- Get table schema
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text
  FROM information_schema.columns
  WHERE table_name = $1 AND table_schema = 'public';
$$;
```

## Styling & Theming

The interface uses Tailwind CSS with:
- Dark sidebar (slate-900) with white text
- Light main content area (gray-50 background)
- Blue accent color (#2563EB)
- Responsive design with mobile support

## Performance Optimizations

- **Virtual Scrolling**: Large datasets are paginated (50 rows per page default)
- **Lazy Loading**: Data loads only when needed
- **Query Optimization**: Server-side pagination and sorting
- **Caching**: API responses cached where appropriate

## Security Considerations

✅ **Implemented:**
- Server-side validation of all inputs
- SQL injection prevention through parameterized queries
- Dangerous SQL operations blocked (DROP DATABASE, TRUNCATE)
- Admin authentication required
- CORS and credential checks

⚠️ **To Implement:**
- Row-level security policies (RLS)
- Audit logging of database changes
- API rate limiting
- Data encryption at rest
- Backup before bulk operations

## Future Enhancements

- [ ] Table relationships visualization
- [ ] Advanced filtering UI
- [ ] Query builder
- [ ] Data export (CSV, JSON)
- [ ] Backup and restore functions
- [ ] Database performance insights
- [ ] Real-time collaboration
- [ ] Change history/rollback
- [ ] Custom functions management
- [ ] Replication setup UI

## Troubleshooting

**"Supabase not configured"**
- Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables

**"RPC function not found"**
- The `exec_sql` RPC function needs to be created in your Supabase database
- Run the SQL provided in the "Required RPC Functions" section

**Empty table list**
- Check that tables exist in your database
- Verify Supabase credentials are correct
- Check browser console for detailed error messages

**Cannot edit cells**
- Ensure you have proper table permissions
- Check that table has a primary key column
- Verify Supabase RLS policies (if enabled)

## Technical Stack

- **Frontend**: React 18, Next.js 14, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **State Management**: React Hooks

## License

Part of StellarMart E-commerce Platform

## Support

For issues or questions:
1. Check the browser console for error messages
2. Review Supabase logs
3. Verify environment configuration
4. Check database permissions and RLS policies
