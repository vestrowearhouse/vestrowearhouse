/**
 * Supabase Business Tables List for Nightly Backup Engine
 * Extracted from schema.sql and codebase migrations.
 * Easily extensible by adding new table definitions here.
 */

export const BACKUP_TABLES = [
  { name: 'products', pk: 'id' },
  { name: 'categories', pk: 'id' },
  { name: 'subcategories', pk: 'id' },
  { name: 'brands', pk: 'id' },
  { name: 'orders', pk: 'id' },
  { name: 'order_items', pk: 'id' },
  { name: 'users', pk: 'id' },
  { name: 'admins', pk: 'id' },
  { name: 'vendors', pk: 'id' },
  { name: 'vendor_orders', pk: 'id' },
  { name: 'vendor_products', pk: 'id' },
  { name: 'vendor_revenue', pk: 'id' },
  { name: 'vendor_payouts', pk: 'id' },
  { name: 'carts', pk: 'id' },
  { name: 'wishlists', pk: 'id' },
  { name: 'coupons', pk: 'id' },
  { name: 'settings', pk: 'id' },
  { name: 'banners', pk: 'id' },
  { name: 'pages', pk: 'id' },
  { name: 'notifications', pk: 'id' },
  { name: 'messages', pk: 'id' },
  { name: 'chat_sessions', pk: 'id' },
  { name: 'chat_messages', pk: 'id' },
  { name: 'contact_messages', pk: 'id' },
  { name: 'newsletters', pk: 'id' },
  { name: 'marketing_campaigns', pk: 'id' },
  { name: 'support_messages', pk: 'id' },
];

export default BACKUP_TABLES;
