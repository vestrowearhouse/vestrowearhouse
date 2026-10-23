# Vendor System - Developer Quick Reference

## 🔗 API Endpoints Quick Reference

### Vendor Profile
```bash
# Get profile
GET /api/vendor/profile

# Update profile
PATCH /api/vendor/profile
Body: { shop_name, owner_name, email, phone, address }
```

### Orders
```bash
# List orders
GET /api/vendor/orders?page=1&limit=20&status=pending

# Get order details
GET /api/vendor/orders/{orderId}

# Update order status
PATCH /api/vendor/orders
Body: { orderId, vendor_status, tracking_number }
```

### Analytics
```bash
# Get analytics
GET /api/vendor/analytics?period=30
# Periods: 7, 30, 90, 365
```

### Revenue
```bash
# List revenue
GET /api/vendor/revenue?page=1&limit=20
```

### Notifications
```bash
# List notifications
GET /api/vendor/notifications?page=1&limit=20

# Mark as read
PATCH /api/vendor/notifications
Body: { id, is_read: true }
```

### Products
```bash
# List products
GET /api/vendor/products/list?page=1&limit=20&status=active
```

### Settings
```bash
# Get settings
GET /api/vendor/settings

# Update settings
PATCH /api/vendor/settings
Body: { email, phone, shop_name, owner_name }
```

### Admin - Vendors
```bash
# List all vendors
GET /api/admin/vendors?page=1&limit=10&status=active&search=name

# Create vendor
POST /api/admin/vendors
Body: {
  shop_name: "Store Name",
  owner_name: "Owner Name",
  email: "vendor@example.com",
  phone: "017xxxxxxxx",
  password: "SecurePassword123!"
}

# Update vendor
PATCH /api/admin/vendors/{vendorId}
Body: { status, verification_badge, commission_rate }

# Delete vendor
DELETE /api/admin/vendors/{vendorId}
```

## 📦 Import Utilities

### API Client
```javascript
import { vendorApi, adminApi } from '@/lib/vendor-api-client';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/vendor-api-client';
```

### Custom Hooks
```javascript
import {
  useVendorProfile,
  useVendorOrders,
  useOrderDetails,
  useVendorAnalytics,
  useVendorRevenue,
  useVendorNotifications,
  useVendorProducts,
  useAllVendors,
  useAsync,
  useUpdateOrderStatus,
  useMarkNotificationRead,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor
} from '@/lib/vendor-hooks';
```

## 🎣 Hook Usage Examples

### Fetch Vendor Profile
```javascript
const { profile, loading, error, refetch } = useVendorProfile();

return (
  <>
    {loading && <p>Loading...</p>}
    {error && <p>Error: {error}</p>}
    {profile && <h1>{profile.shop_name}</h1>}
  </>
);
```

### Fetch Orders with Pagination
```javascript
const [page, setPage] = useState(1);
const { orders, pagination, loading, error } = useVendorOrders(page, 20);

return (
  <>
    {orders.map(order => (
      <div key={order.id}>{order.order_number}</div>
    ))}
    <button onClick={() => setPage(page + 1)}>Next</button>
  </>
);
```

### Update Order Status
```javascript
const { updateStatus, loading, error } = useUpdateOrderStatus();

const handleStatusChange = async (orderId, newStatus) => {
  try {
    await updateStatus(orderId, newStatus, 'TRACKING123');
    // Success - refetch orders
  } catch (err) {
    console.error(err);
  }
};
```

### Admin Create Vendor
```javascript
const { createVendor, loading, error } = useCreateVendor();

const handleCreate = async () => {
  try {
    const result = await createVendor({
      shop_name: 'New Store',
      owner_name: 'Owner',
      email: 'vendor@example.com',
      phone: '017xxxxx',
      password: 'secure123'
    });
    console.log('Vendor created:', result.vendor);
  } catch (err) {
    console.error(err);
  }
};
```

## 🎨 Common UI Patterns

### Status Badge
```jsx
import { getStatusColor } from '@/lib/vendor-api-client';

<span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
  {status}
</span>
```

### Currency Display
```jsx
import { formatCurrency } from '@/lib/vendor-api-client';

<p>{formatCurrency(amount)}</p>
// Output: "৳1,000.00"
```

### Date Display
```jsx
import { formatDate, formatDateTime } from '@/lib/vendor-api-client';

<p>{formatDate(createdAt)}</p>
<p>{formatDateTime(createdAt)}</p>
```

### Pagination
```jsx
const { pagination } = useVendorOrders(page, limit);

<div>
  {pagination && (
    <>
      <p>Page {pagination.page} of {pagination.pages}</p>
      <p>Total: {pagination.total}</p>
    </>
  )}
</div>
```

### Loading State
```jsx
{loading ? (
  <div className="flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin" />
  </div>
) : (
  // Your content
)}
```

### Error State
```jsx
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
    {error}
  </div>
)}
```

## 🗄️ Database Queries

### Get Vendor Statistics
```sql
SELECT 
  v.id,
  v.shop_name,
  COUNT(DISTINCT vo.id) as total_orders,
  SUM(vo.net_amount) as total_revenue,
  AVG(vr.rating) as avg_rating
FROM vendors v
LEFT JOIN vendor_orders vo ON v.id = vo.vendor_id
LEFT JOIN vendor_reviews vr ON v.id = vr.vendor_id
WHERE v.id = $1
GROUP BY v.id;
```

### Get Vendor Analytics
```sql
SELECT 
  analytics_date,
  total_views,
  unique_visitors,
  total_orders,
  net_revenue
FROM vendor_analytics
WHERE vendor_id = $1
ORDER BY analytics_date DESC
LIMIT 30;
```

### Get Revenue Summary
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total
FROM vendor_revenue
WHERE vendor_id = $1
GROUP BY status;
```

## 🔑 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# API Base (optional)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Testing
VENDOR_TOKEN=token_here
ADMIN_TOKEN=token_here
```

## 📋 Common Task Patterns

### Create New Page
```jsx
'use client';

import { useVendorProfile } from '@/lib/vendor-hooks';
import VendorSidebar from '../VendorSidebar';
import VendorNavbar from '../VendorNavbar';

export default function NewPage() {
  const { profile, loading } = useVendorProfile();

  return (
    <div className="flex h-screen bg-gray-100">
      <VendorSidebar />
      <div className="flex-1 flex flex-col">
        <VendorNavbar />
        <main className="flex-1 overflow-auto p-6">
          {loading ? <p>Loading...</p> : <h1>{profile?.shop_name}</h1>}
        </main>
      </div>
    </div>
  );
}
```

### Create API Endpoint
```javascript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## 🚀 Deployment Checklist

- [ ] Environment variables set in production
- [ ] Database schema executed in Supabase
- [ ] Test vendor account created
- [ ] Run test suite: `node vendor-system-test.js`
- [ ] Check console for errors
- [ ] Verify database RLS policies
- [ ] Set up notifications (optional)
- [ ] Configure email service (optional)
- [ ] Set up payment integration (if needed)

## 🐛 Debugging Tips

1. **Check Supabase logs**
   - Go to Supabase Dashboard > Logs
   - Filter by your table/endpoint

2. **Check browser console**
   - Open DevTools (F12)
   - Check Network tab for API calls

3. **Check server logs**
   - Run with `npm run dev` and watch terminal
   - Check for database errors

4. **Validate authentication**
   - Check Authorization header in Network tab
   - Verify Bearer token is valid

5. **Test API manually**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/vendor/profile
   ```

## 📞 Support Resources

- **Database**: [Supabase Docs](https://supabase.com/docs)
- **Framework**: [Next.js Docs](https://nextjs.org/docs)
- **Frontend**: [Tailwind CSS](https://tailwindcss.com/docs)
- **Icons**: [Lucide Icons](https://lucide.dev)

---

**Last Updated**: 2024
**Version**: 1.0
