# Vendor System Complete Implementation Guide

## 📋 Overview

This document provides a comprehensive guide to the vendor system implementation for StellarMartBD, including database schema, API endpoints, frontend pages, and setup instructions.

## 🏗️ Architecture

### Database Layer (Supabase)

All vendor data is stored in Supabase PostgreSQL database with the following main tables:

#### Core Vendor Tables:
- **vendors** - Vendor profile and store information
- **vendor_orders** - Orders belonging to each vendor
- **vendor_products** - Extended product information per vendor
- **vendor_settings** - Vendor-specific store settings
- **vendor_analytics** - Daily analytics and metrics
- **vendor_revenue** - Revenue reports and payouts
- **vendor_notifications** - Vendor notifications
- **vendor_coupons** - Vendor-specific discount coupons
- **vendor_reviews** - Customer reviews for vendors
- **vendor_messages** - Customer-vendor communications
- **vendor_disputes** - Customer disputes with vendors
- **vendor_followers** - Store followers/subscribers
- **vendor_payouts** - Payment/payout information

See `vendor-supabase-schema.sql` for complete schema definition.

## 🔌 API Endpoints

### Vendor Endpoints

All vendor endpoints require authentication and are prefixed with `/api/vendor/`:

#### Profile
- `GET /api/vendor/profile` - Get vendor profile
- `PATCH /api/vendor/profile` - Update vendor profile

#### Orders
- `GET /api/vendor/orders` - List vendor orders
- `PATCH /api/vendor/orders` - Update order status
- `GET /api/vendor/orders/[orderId]` - Get order details

#### Products
- `GET /api/vendor/products/list` - List vendor products
- `POST /api/vendor/products` - Create product
- `PATCH /api/vendor/products/[productId]` - Update product
- `DELETE /api/vendor/products/[productId]` - Delete product

#### Analytics
- `GET /api/vendor/analytics` - Get analytics data

#### Revenue
- `GET /api/vendor/revenue` - Get revenue reports

#### Notifications
- `GET /api/vendor/notifications` - List notifications
- `PATCH /api/vendor/notifications` - Mark as read

#### Settings
- `GET /api/vendor/settings` - Get vendor settings
- `PATCH /api/vendor/settings` - Update settings

### Admin Endpoints

#### Vendor Management
- `GET /api/admin/vendors` - List all vendors
- `POST /api/admin/vendors` - Create vendor
- `PATCH /api/admin/vendors/[vendorId]` - Update vendor
- `DELETE /api/admin/vendors/[vendorId]` - Delete vendor

## 🎨 Frontend Pages

### Vendor Panel (`/vendor/`)

#### Authenticated Routes (`/vendor/(authenticated)/`)

1. **Dashboard** (`/vendor/dashboard`)
   - Store overview and key metrics
   - Recent orders
   - Quick stats

2. **Orders** (`/vendor/orders`)
   - List all vendor orders
   - Filter by status
   - Update order status and tracking

3. **Products** (`/vendor/products`)
   - Manage products
   - Add new products
   - Edit/delete products
   - Inventory management

4. **Analytics** (`/vendor/analytics`)
   - Sales reports
   - Traffic metrics
   - Conversion rates
   - Custom date range filtering

5. **Revenue** (`/vendor/revenue`)
   - Earnings reports
   - Payment history
   - Invoice generation
   - Payout details

6. **Profile** (`/vendor/profile`)
   - Store information
   - Store logo/banner
   - Business details

7. **Settings** (`/vendor/settings`)
   - Store policies
   - Notification preferences
   - General configuration

8. **Shipping** (`/vendor/shipping`)
   - Shipping method configuration
   - Rate management
   - Free shipping settings

9. **Notifications** (`/vendor/notifications`)
   - View all notifications
   - Mark as read

10. **Messages** (`/vendor/messages`)
    - Customer communications
    - Message threads

11. **Reviews** (`/vendor/reviews`)
    - Customer reviews
    - Rating management

12. **Coupons** (`/vendor/coupons`)
    - Create and manage coupons
    - Offer tracking

### Admin Panel (`/admin/vendors`)

- Vendor management dashboard
- Create/edit/delete vendors
- View vendor analytics
- Approve/suspend vendors
- Commission management

## 🔐 Security Features

1. **Row Level Security (RLS)** - Vendors can only access their own data
2. **Authentication** - All endpoints require valid session
3. **Authorization** - Role-based access control
4. **Data Validation** - Input validation on all endpoints
5. **Encryption** - Sensitive data encrypted at rest

## 📊 Key Features

### For Vendors

1. **Dashboard**
   - Real-time metrics
   - Sales overview
   - Recent orders
   - Performance indicators

2. **Order Management**
   - Order tracking
   - Status updates
   - Shipping management
   - Invoice generation

3. **Product Management**
   - Create/edit/delete products
   - Inventory tracking
   - Product analytics
   - Bulk operations

4. **Analytics & Reports**
   - Sales analytics
   - Customer metrics
   - Traffic analysis
   - Revenue reports

5. **Revenue Management**
   - Earnings tracking
   - Payout history
   - Commission breakdown
   - Payment methods

6. **Customer Management**
   - Messages and inquiries
   - Reviews and ratings
   - Customer support
   - Dispute resolution

7. **Store Customization**
   - Store branding
   - Policies and settings
   - Shipping configuration
   - Notification preferences

### For Admins

1. **Vendor Management**
   - Create/manage vendors
   - Approval workflows
   - Commission settings
   - Suspension/activation

2. **Vendor Analytics**
   - Performance metrics
   - Sales data
   - Customer satisfaction
   - Commission calculations

3. **Reporting**
   - Vendor reports
   - Revenue analysis
   - Activity logs
   - Compliance checks

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Copy the schema file
cp vendor-supabase-schema.sql supabase/

# Execute in Supabase SQL Editor
# Go to your Supabase project
# SQL Editor > Paste the schema > Run
```

### 2. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run the Application

```bash
npm install
npm run dev
```

### 4. Create Test Vendor

```bash
# Via Admin Panel
# Navigate to /admin/vendors
# Click "Add Vendor"
# Fill in details
```

## 📝 Database Query Examples

### Get vendor statistics

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
GROUP BY v.id;
```

### Get vendor daily analytics

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

## 🔄 Data Flow

1. **Order Creation**
   ```
   Customer Order → Orders Table → Vendor Orders → Vendor Notification
   ```

2. **Product Management**
   ```
   Vendor Upload → Products → Vendor Products → Analytics
   ```

3. **Revenue Calculation**
   ```
   Order Completion → Commission Calc → Vendor Revenue → Payout
   ```

## ⚙️ Configuration

### Commission Settings

```javascript
// app/api/admin/vendors/route.js
const DEFAULT_COMMISSION_RATE = 0.10; // 10%
```

### Notification Types

- `order` - New order
- `product` - Product-related
- `system` - System notifications
- `message` - Customer messages
- `review` - New reviews
- `payment` - Payment updates

## 🧪 Testing

### Test Vendor Account

```
Email: test-vendor@stellarmartbd.com
Password: TestVendor123!
Shop: Test Store
```

### Test Admin Account

```
Email: admin@stellarmartbd.com
Password: Admin123!
```

## 📱 API Response Examples

### Get Vendor Profile

```json
{
  "vendor": {
    "id": "uuid",
    "shop_name": "Test Store",
    "owner_name": "John Doe",
    "total_products": 25,
    "total_orders": 150,
    "total_revenue": 50000,
    "average_rating": 4.5
  },
  "stats": {
    "delivered_orders": 140,
    "last_revenue": 5000
  }
}
```

### List Orders

```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-001",
      "customer_name": "Customer Name",
      "net_amount": 5000,
      "vendor_status": "delivered",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Vendor not found"**
   - Check user has vendor profile
   - Verify user_id matches

2. **"Unauthorized" error**
   - Check authentication token
   - Verify user role is 'vendor'

3. **"Failed to update order"**
   - Check vendor_id matches
   - Verify order exists

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Database Schema](./vendor-supabase-schema.sql)

## 📞 Support

For issues or questions, contact the development team.

---

**Last Updated:** 2024
**Version:** 1.0
