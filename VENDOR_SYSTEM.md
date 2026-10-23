# Vendor Portal System - StellarMartBD

## Overview

The Vendor Portal is a comprehensive management system for sellers to manage their store, products, orders, analytics, and revenue on StellarMartBD platform.

## Features

### 1. **Dashboard** (`/vendor/dashboard`)
- Real-time statistics (total products, orders, revenue, pending orders)
- Sales performance overview
- Quick access to key metrics
- Last update timestamp
- Refresh button to reload data

### 2. **Products Management** (`/vendor/products`)
- View all products with details (name, price, stock, status)
- Create new products (`/vendor/products/add`)
- Edit existing products
- Delete products
- Filter by status (active, inactive, draft)
- Stock management

### 3. **Orders Management** (`/vendor/orders`)
- View all orders with status tracking
- Filter orders by status (all, pending, processing, shipped, delivered, cancelled)
- View order details (ID, amount, items count, date)
- Print invoices
- Order status management

### 4. **Analytics** (`/vendor/analytics`)
- Store performance metrics:
  - Total views
  - Unique visitors
  - Total orders
  - Conversion rate
- Time range filtering (7 days, 30 days, 90 days, 1 year)
- Sales trend charts
- Top products analysis

### 5. **Revenue Management** (`/vendor/revenue`)
- Revenue reports with period selection
- Total revenue tracking
- Net earnings calculation
- Average order value
- Transaction history
- Performance trends

### 6. **Store Profile** (`/vendor/profile`)
- Store logo management (upload/change)
- Basic information:
  - Shop name
  - Owner name
  - Email and phone
  - Shop address
- Profile editing and updates

### 7. **Settings** (`/vendor/settings`)
- General store settings:
  - Store status (active/inactive)
  - Order acceptance toggle
- Notification preferences:
  - Email on new order
  - Email on new message
- Custom configuration options

### 8. **Shipping Configuration** (`/vendor/shipping`)
- Default shipping method selection
- Shipping cost management:
  - Standard shipping cost
  - Express shipping cost
- Free shipping options and threshold
- Processing time configuration

### 9. **Notifications** (`/vendor/notifications`)
- Real-time notifications
- Notification center with filters
- Read/unread status tracking
- Notification deletion
- Notification types:
  - New orders
  - Product-related updates
  - System notifications
  - Messages from customers

## Database Schema

### Key Tables

#### `vendors`
Vendor profile information linked to users table.

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  shop_name TEXT,
  shop_address TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  status TEXT,
  verification_badge BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `vendor_orders`
Orders specific to each vendor.

```sql
CREATE TABLE vendor_orders (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  order_id UUID REFERENCES orders(id),
  items JSONB,
  vendor_status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `vendor_product_requests`
Product action requests for admin approval.

```sql
CREATE TABLE vendor_product_requests (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  action_type TEXT,
  product_id UUID,
  payload JSONB,
  status TEXT,
  admin_note TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `vendor_notifications`
Notification system for vendors.

```sql
CREATE TABLE vendor_notifications (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  type TEXT,
  payload JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/vendor/auth/login` - Vendor login
- `POST /api/vendor/auth/logout` - Vendor logout
- `GET /api/vendor/auth/me` - Get current vendor info

### Dashboard
- `GET /api/vendor/dashboard-stats` - Get dashboard statistics

### Products
- `GET /api/vendor/products` - List all vendor products
- `POST /api/vendor/products` - Create new product
- `GET /api/vendor/products/:id` - Get product details
- `PUT /api/vendor/products/:id` - Update product
- `DELETE /api/vendor/products/:id` - Delete product

### Orders
- `GET /api/vendor/orders` - List vendor orders
- `GET /api/vendor/orders/:id` - Get order details
- `PUT /api/vendor/orders/:id` - Update order status

### Analytics
- `GET /api/vendor/analytics` - Get analytics data

### Revenue
- `GET /api/vendor/revenue` - Get revenue data

### Profile
- `GET /api/vendor/profile` - Get vendor profile
- `PUT /api/vendor/profile` - Update vendor profile

### Settings
- `GET /api/vendor/settings` - Get vendor settings
- `PUT /api/vendor/settings` - Update vendor settings

### Shipping
- `GET /api/vendor/shipping` - Get shipping settings
- `PUT /api/vendor/shipping` - Update shipping settings

### Notifications
- `GET /api/vendor/notifications` - Get notifications
- `PUT /api/vendor/notifications/:id/read` - Mark as read
- `DELETE /api/vendor/notifications/:id` - Delete notification

## Authentication & Security

### Session Management
- Sessions stored in `sessionStorage`
- Hard timeout: 7 days for vendor sessions
- Automatic logout on browser close/refresh
- Session validation on every authenticated request

### Protected Routes
All routes under `/vendor/(authenticated)/*` require:
- Valid vendor authentication
- Active session
- Proper authorization

### Dynamic Rendering
All vendor pages use `export const dynamic = 'force-dynamic'` to prevent static generation during build time.

## File Structure

```
app/
├── vendor/
│   ├── page.jsx                 # Login page
│   ├── layout.jsx               # (empty)
│   ├── VendorNavbar.jsx         # Navigation bar
│   ├── VendorSidebar.jsx        # Sidebar navigation
│   ├── VendorSessionTimer.jsx   # Session timeout timer
│   └── (authenticated)/         # Protected routes
│       ├── layout.jsx           # Auth layout wrapper
│       ├── dashboard/
│       │   └── page.jsx
│       ├── products/
│       │   ├── page.jsx
│       │   └── add/
│       │       └── page.jsx
│       ├── orders/
│       │   └── page.jsx
│       ├── analytics/
│       │   └── page.jsx
│       ├── revenue/
│       │   └── page.jsx
│       ├── profile/
│       │   └── page.jsx
│       ├── settings/
│       │   └── page.jsx
│       ├── shipping/
│       │   └── page.jsx
│       └── notifications/
│           └── page.jsx
└── api/vendor/                  # API routes
    ├── auth/
    ├── dashboard-stats/
    ├── products/
    ├── orders/
    ├── analytics/
    ├── revenue/
    ├── profile/
    ├── settings/
    ├── shipping/
    └── notifications/
```

## Styling

The vendor portal uses:
- **Tailwind CSS** for styling
- **Lucide Icons** for UI icons
- **Color Scheme**: Amber/Gold (#b45309) for primary actions
- **Responsive Design**: Mobile-first approach

## Performance Considerations

1. **Dynamic Rendering**: All authenticated pages render dynamically to handle session-dependent content
2. **Data Fetching**: Client-side fetching with `credentials: 'include'` for session management
3. **Caching**: Implement SWR or React Query for better data caching (optional enhancement)
4. **Image Optimization**: Use Next.js Image component for product images

## Future Enhancements

- [ ] Advanced analytics with chart visualizations
- [ ] Product variant management (sizes, colors)
- [ ] Bulk product operations
- [ ] Vendor ratings and reviews management
- [ ] Promotional campaign management
- [ ] Vendor support ticketing system
- [ ] Advanced shipping integrations (courier APIs)
- [ ] Multi-currency support
- [ ] Vendor dashboard customization
- [ ] Mobile app for vendor management

## Troubleshooting

### Session Expired Error
- Clear browser storage (`SessionStorage`, `LocalStorage`, `Cookies`)
- Log in again
- Check browser console for auth-related errors

### Page Not Loading
- Verify vendor authentication status
- Check API endpoints are responding
- Ensure database tables exist
- Check browser console for errors

### Build Errors
- Ensure `export const dynamic = 'force-dynamic'` is present in all authenticated pages
- Verify no serialization errors in components (functions, class instances)
- Check Node.js version compatibility

## Testing

To test the vendor portal:

1. Create a vendor account
2. Access `/vendor` login page
3. Navigate through different sections
4. Verify API calls in Network tab
5. Test session timeout and logout
6. Verify form submissions and updates

## Support & Maintenance

For issues or feature requests, refer to the main project documentation and GitHub issues tracker.
