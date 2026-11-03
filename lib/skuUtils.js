/**
 * SKU Utilities & Registry Helpers for StellarMartBD
 */

import { decodeSKU, isValidSKU, formatSKU } from './skuDecoder.js';

// Seed Categories Dictionary
export const SEED_SKU_CATEGORIES = [
  // Electronics
  { code: '10', name: 'Mobile Phone', group: 'Electronics' },
  { code: '11', name: 'Tablet', group: 'Electronics' },
  { code: '12', name: 'Laptop', group: 'Electronics' },
  { code: '13', name: 'Desktop & Computer Parts', group: 'Electronics' },
  { code: '14', name: 'Headphone/Earbuds', group: 'Electronics' },
  { code: '15', name: 'Smart Watch/Band', group: 'Electronics' },
  { code: '16', name: 'Camera', group: 'Electronics' },
  { code: '17', name: 'Charger/Cable/Power Bank', group: 'Electronics' },
  { code: '18', name: 'Speaker/Audio', group: 'Electronics' },
  { code: '19', name: 'Other Electronics', group: 'Electronics' },

  // Men's Fashion
  { code: '20', name: 'T-Shirt', group: "Men's Fashion" },
  { code: '21', name: 'Shirt', group: "Men's Fashion" },
  { code: '22', name: 'Panjabi', group: "Men's Fashion" },
  { code: '23', name: 'Pant/Jeans', group: "Men's Fashion" },
  { code: '24', name: 'Hoodie/Sweater/Jacket', group: "Men's Fashion" },
  { code: '25', name: 'Innerwear', group: "Men's Fashion" },
  { code: '26', name: 'Lungi/Traditional', group: "Men's Fashion" },
  { code: '27', name: "Other Men's", group: "Men's Fashion" },

  // Women's Fashion
  { code: '30', name: 'Saree', group: "Women's Fashion" },
  { code: '31', name: 'Three-piece/Salwar Kameez', group: "Women's Fashion" },
  { code: '32', name: 'Kurti/Top', group: "Women's Fashion" },
  { code: '33', name: 'Hijab/Abaya/Burka', group: "Women's Fashion" },
  { code: '34', name: 'Western (Dress, Jeans)', group: "Women's Fashion" },
  { code: '35', name: 'Innerwear', group: "Women's Fashion" },
  { code: '36', name: 'Lehenga/Party Wear', group: "Women's Fashion" },
  { code: '37', name: "Other Women's", group: "Women's Fashion" },

  // Kids & Baby
  { code: '40', name: 'Baby Clothes', group: 'Kids & Baby' },
  { code: '41', name: 'Boys Clothing', group: 'Kids & Baby' },
  { code: '42', name: 'Girls Clothing', group: 'Kids & Baby' },
  { code: '43', name: 'Toys', group: 'Kids & Baby' },
  { code: '44', name: 'Baby Care', group: 'Kids & Baby' },

  // Shoes & Bags
  { code: '45', name: "Men's Shoes", group: 'Shoes & Bags' },
  { code: '46', name: "Women's Shoes", group: 'Shoes & Bags' },
  { code: '47', name: "Kids' Shoes", group: 'Shoes & Bags' },
  { code: '48', name: 'Bag', group: 'Shoes & Bags' },
  { code: '49', name: 'Wallet/Belt', group: 'Shoes & Bags' },

  // Beauty & Health
  { code: '50', name: 'Skincare', group: 'Beauty & Health' },
  { code: '51', name: 'Makeup', group: 'Beauty & Health' },
  { code: '52', name: 'Haircare', group: 'Beauty & Health' },
  { code: '53', name: 'Perfume/Attar', group: 'Beauty & Health' },
  { code: '54', name: 'Personal Care', group: 'Beauty & Health' },
  { code: '55', name: 'Health & Supplement', group: 'Beauty & Health' },
  { code: '56', name: "Men's Grooming", group: 'Beauty & Health' },

  // Home & Kitchen
  { code: '60', name: 'Kitchenware', group: 'Home & Kitchen' },
  { code: '61', name: 'Furniture', group: 'Home & Kitchen' },
  { code: '62', name: 'Bedding', group: 'Home & Kitchen' },
  { code: '63', name: 'Home Decor', group: 'Home & Kitchen' },
  { code: '64', name: 'Lighting', group: 'Home & Kitchen' },
  { code: '65', name: 'Cleaning', group: 'Home & Kitchen' },
  { code: '66', name: 'Home Appliance', group: 'Home & Kitchen' },

  // Food & Grocery
  { code: '70', name: 'Rice/Dal/Oil', group: 'Food & Grocery' },
  { code: '71', name: 'Spices', group: 'Food & Grocery' },
  { code: '72', name: 'Snacks', group: 'Food & Grocery' },
  { code: '73', name: 'Beverages', group: 'Food & Grocery' },
  { code: '74', name: 'Dry Fruits/Honey', group: 'Food & Grocery' },
  { code: '75', name: 'Fresh/Frozen', group: 'Food & Grocery' },

  // Accessories
  { code: '76', name: 'Watch', group: 'Accessories' },
  { code: '77', name: 'Jewellery', group: 'Accessories' },
  { code: '78', name: 'Sunglasses', group: 'Accessories' },
  { code: '79', name: 'Mobile Case/Accessories', group: 'Accessories' },

  // Others
  { code: '80', name: 'Sports & Fitness', group: 'Others' },
  { code: '81', name: 'Books', group: 'Others' },
  { code: '82', name: 'Stationery', group: 'Others' },
  { code: '83', name: 'Gaming', group: 'Others' },
  { code: '84', name: 'Bike/Car Accessories', group: 'Others' },
  { code: '85', name: 'Tools & Hardware', group: 'Others' },
  { code: '86', name: 'Pet Supplies', group: 'Others' },
  { code: '87', name: 'Musical Instruments', group: 'Others' },
  { code: '88', name: 'Gift Items', group: 'Others' },
  { code: '89', name: 'Islamic Items', group: 'Others' },
  { code: '99', name: 'Others', group: 'Others' },
];

export const SKU_CATEGORIES_MAP = Object.fromEntries(
  SEED_SKU_CATEGORIES.map((c) => [c.code, c])
);

// Seed Sizes Dictionary
export const SEED_SIZES = [
  { code: '00', name: 'No size' },
  { code: '01', name: 'S' },
  { code: '02', name: 'M' },
  { code: '03', name: 'L' },
  { code: '04', name: 'XL' },
  { code: '05', name: '2XL' },
  { code: '06', name: '3XL' },
  { code: '07', name: '4XL' },
  { code: '99', name: 'Free Size' },
  { code: '38', name: 'Size 38' },
  { code: '39', name: 'Size 39' },
  { code: '40', name: 'Size 40' },
  { code: '41', name: 'Size 41' },
  { code: '42', name: 'Size 42' },
  { code: '43', name: 'Size 43' },
  { code: '44', name: 'Size 44' },
  { code: '45', name: 'Size 45' },
];

// Seed Colors Dictionary
export const SEED_COLORS = [
  { code: '01', name: 'Black', hex: '#000000' },
  { code: '02', name: 'White', hex: '#FFFFFF' },
  { code: '03', name: 'Red', hex: '#EF4444' },
  { code: '04', name: 'Blue', hex: '#3B82F6' },
  { code: '05', name: 'Green', hex: '#10B981' },
  { code: '06', name: 'Yellow', hex: '#FACC15' },
  { code: '07', name: 'Grey', hex: '#6B7280' },
  { code: '08', name: 'Brown', hex: '#78350F' },
  { code: '09', name: 'Navy', hex: '#1E3A8A' },
  { code: '10', name: 'Olive', hex: '#84CC16' },
  { code: '11', name: 'Pink', hex: '#EC4899' },
  { code: '12', name: 'Orange', hex: '#F97316' },
  { code: '13', name: 'Purple', hex: '#A855F7' },
  { code: '14', name: 'Maroon', hex: '#831843' },
  { code: '15', name: 'Beige', hex: '#F5F5DC' },
  { code: '16', name: 'Gold', hex: '#D97706' },
  { code: '17', name: 'Silver', hex: '#94A3B8' },
  { code: '18', name: 'Multicolor', hex: 'linear-gradient(135deg, #EF4444 0%, #3B82F6 50%, #10B981 100%)' },
  { code: '99', name: 'Other', hex: '#9CA3AF' },
];

/**
 * Match a raw size value (e.g. "XL", "42", "Free Size") to a standard size code.
 */
export function matchSizeCode(value) {
  if (!value) return '00';
  const clean = String(value).trim().toUpperCase();
  const found = SEED_SIZES.find(
    (s) => s.code === clean || s.name.toUpperCase() === clean || s.name.toUpperCase() === `SIZE ${clean}`
  );
  if (found) return found.code;
  if (/^\d{2}$/.test(clean)) return clean; // Shoe sizes like 38, 39, 40
  return '99'; // Default to free size / other
}

/**
 * Match a raw color name (e.g. "Red", "Navy Blue") to a standard color code.
 */
export function matchColorCode(value) {
  if (!value) return '99';
  const clean = String(value).trim().toLowerCase();
  const found = SEED_COLORS.find(
    (c) => c.code === clean || c.name.toLowerCase() === clean || clean.includes(c.name.toLowerCase())
  );
  return found ? found.code : '99';
}

/**
 * Derive SKU category code from a category object.
 * Reads category.sku_category_code directly if configured,
 * otherwise falls back to intelligent matching based on category name.
 */
export function deriveCategoryCode(category) {
  if (!category) return '99';
  if (category.sku_category_code && typeof category.sku_category_code === 'string') {
    return category.sku_category_code.padStart(2, '0');
  }

  const name = (category.name || category.slug || '').toLowerCase();

  // Electronics
  if (name.includes('mobile phone') || name.includes('smartphone')) return '10';
  if (name.includes('tablet') || name.includes('ipad')) return '11';
  if (name.includes('laptop') || name.includes('macbook')) return '12';
  if (name.includes('computer') || name.includes('parts') || name.includes('desktop') || name.includes('pc')) return '13';
  if (name.includes('headphone') || name.includes('earbud') || name.includes('earphone') || name.includes('iem') || name.includes('tws')) return '14';
  if (name.includes('smart watch') || name.includes('smartwatch') || name.includes('smart band')) return '15';
  if (name.includes('camera')) return '16';
  if (name.includes('charger') || name.includes('power bank') || name.includes('cable')) return '17';
  if (name.includes('speaker') || name.includes('soundbar') || name.includes('audio')) return '18';
  if (name.includes('electronic')) return '19';

  // Men's Fashion
  if (name.includes('t-shirt') || name.includes('tshirt')) return '20';
  if (name.includes('shirt')) return '21';
  if (name.includes('panjabi') || name.includes('punjabi')) return '22';
  if (name.includes('pant') || name.includes('jean') || name.includes('trouser')) return '23';
  if (name.includes('hoodi') || name.includes('sweater') || name.includes('jacket')) return '24';
  if (name.includes('lungi')) return '26';
  if (name.includes('men')) return '27';

  // Women's Fashion
  if (name.includes('saree') || name.includes('shari')) return '30';
  if (name.includes('salwar') || name.includes('three-piece') || name.includes('three piece')) return '31';
  if (name.includes('kurti') || name.includes('top')) return '32';
  if (name.includes('hijab') || name.includes('abaya') || name.includes('burka')) return '33';
  if (name.includes('western') || name.includes('gown')) return '34';
  if (name.includes('lehenga')) return '36';
  if (name.includes('women')) return '37';

  // Kids
  if (name.includes('baby clothes')) return '40';
  if (name.includes('boys')) return '41';
  if (name.includes('girls')) return '42';
  if (name.includes('toy')) return '43';
  if (name.includes('baby') || name.includes('kid') || name.includes('children')) return '44';

  // Shoes & Bags
  if (name.includes('men') && name.includes('shoe')) return '45';
  if (name.includes('women') && name.includes('shoe')) return '46';
  if (name.includes('shoe') || name.includes('sneaker')) return '45';
  if (name.includes('bag') || name.includes('backpack')) return '48';
  if (name.includes('wallet') || name.includes('belt')) return '49';

  // Beauty & Health
  if (name.includes('skincare') || name.includes('skin care')) return '50';
  if (name.includes('makeup')) return '51';
  if (name.includes('haircare') || name.includes('hair care')) return '52';
  if (name.includes('perfume') || name.includes('attar') || name.includes('fragrance')) return '53';
  if (name.includes('health') || name.includes('supplement')) return '55';

  // Home & Kitchen
  if (name.includes('kitchen') || name.includes('cookware')) return '60';
  if (name.includes('furniture')) return '61';
  if (name.includes('bedding') || name.includes('bed sheet')) return '62';
  if (name.includes('home decor') || name.includes('decor')) return '63';
  if (name.includes('light') || name.includes('rgb')) return '64';
  if (name.includes('appliance')) return '66';

  // Food & Grocery
  if (name.includes('rice') || name.includes('dal') || name.includes('oil')) return '70';
  if (name.includes('spice')) return '71';
  if (name.includes('snack')) return '72';
  if (name.includes('beverage') || name.includes('tea') || name.includes('coffee')) return '73';
  if (name.includes('honey') || name.includes('dry fruit')) return '74';

  // Accessories
  if (name.includes('watch')) return '76';
  if (name.includes('jewel') || name.includes('churi') || name.includes('bangle') || name.includes('ring')) return '77';
  if (name.includes('sunglass') || name.includes('glass')) return '78';
  if (name.includes('case') || name.includes('cooler') || name.includes('sleeve')) return '79';

  // Others
  if (name.includes('sport') || name.includes('jersey') || name.includes('football')) return '80';
  if (name.includes('book')) return '81';
  if (name.includes('gaming') || name.includes('game')) return '83';
  if (name.includes('tool') || name.includes('hardware')) return '85';
  if (name.includes('islamic')) return '89';

  return '99';
}

export { decodeSKU, isValidSKU, formatSKU };

