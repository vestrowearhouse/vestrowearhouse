/**
 * lib/csvHelper.js
 * High-performance, robust CSV/TSV parser, template generator, and exporter.
 * Seamlessly integrates with 'xlsx' if available for full Excel (.xlsx/.xls) support.
 */

// Parse CSV text respecting quotes and commas
export function parseCSV(text) {
  if (!text || typeof text !== 'string') return [];

  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  while (i < normalized.length) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
      i++;
    } else if (char === '\n' && !inQuotes) {
      row.push(cell.trim());
      if (row.some(c => c !== '')) {
        lines.push(row);
      }
      row = [];
      cell = '';
      i++;
    } else {
      cell += char;
      i++;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== '')) {
      lines.push(row);
    }
  }

  if (lines.length < 2) return [];

  const rawHeaders = lines[0].map(h => h.trim().replace(/^["']|["']$/g, ''));
  const headerMap = rawHeaders.map(h => normalizeHeader(h));

  const results = [];
  for (let r = 1; r < lines.length; r++) {
    const values = lines[r];
    const obj = {};
    for (let c = 0; c < headerMap.length; c++) {
      const key = headerMap[c];
      if (key) {
        obj[key] = values[c] !== undefined ? values[c] : '';
      }
    }
    results.push(obj);
  }

  return results;
}

// Parse Tab-Separated Values (Copied directly from Excel or Google Sheets)
export function parseTSV(text) {
  if (!text || typeof text !== 'string') return [];
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Check if first line contains headers or values
  const rows = lines.map(line => line.split('\t').map(c => c.trim()));
  const firstRow = rows[0];

  // If first row looks like headers (contains words like "name", "price", etc.)
  const hasHeaders = firstRow.some(col => 
    /^(name|title|price|sku|category|stock|brand|description)/i.test(col.trim())
  );

  if (hasHeaders && rows.length > 1) {
    const headers = firstRow.map(h => normalizeHeader(h));
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        if (header) obj[header] = row[i] || '';
      });
      return obj;
    });
  }

  // Otherwise assume sequential columns: Name, Selling Price, Regular Price, Stock, Category, SKU, Brand
  const defaultCols = ['name', 'sellingPrice', 'regularPrice', 'stockQuantity', 'category', 'sku', 'brand', 'images', 'description'];
  return rows.map(row => {
    const obj = {};
    defaultCols.forEach((col, i) => {
      if (row[i] !== undefined) obj[col] = row[i];
    });
    return obj;
  });
}

// Normalize various column name variations
export function normalizeHeader(h) {
  const clean = String(h).trim().toLowerCase().replace(/[\s_-]+/g, '');
  
  if (['name', 'productname', 'title', 'itemname', 'nameen', 'englishname'].includes(clean)) return 'name';
  if (['namebn', 'bengaliname', 'banglaname', 'name_bn'].includes(clean)) return 'nameBn';
  if (['sellingprice', 'price', 'saleprice', 'currentprice', 'discountprice', 'offerprice'].includes(clean)) return 'sellingPrice';
  if (['regularPrice', 'regularprice', 'oldprice', 'originalprice', 'mrp', 'costprice'].includes(clean)) return 'regularPrice';
  if (['stock', 'stockquantity', 'quantity', 'qty', 'inventory', 'available'].includes(clean)) return 'stockQuantity';
  if (['category', 'categoryname', 'cat', 'categoryid', 'parentcategory'].includes(clean)) return 'category';
  if (['sku', 'productcode', 'code', 'barcode'].includes(clean)) return 'sku';
  if (['brand', 'brandname', 'manufacturer'].includes(clean)) return 'brand';
  if (['image', 'images', 'imageurl', 'imageurls', 'photos', 'picture', 'photo'].includes(clean)) return 'images';
  if (['featuredimage', 'mainimage', 'thumbnail', 'thumb'].includes(clean)) return 'featuredImage';
  if (['description', 'desc', 'details', 'body'].includes(clean)) return 'description';
  if (['shortdescription', 'shortdesc', 'summary'].includes(clean)) return 'shortDescription';
  if (['tags', 'keywords', 'labels'].includes(clean)) return 'tags';
  if (['slug', 'urlslug'].includes(clean)) return 'slug';
  if (['isfeatured', 'featured'].includes(clean)) return 'isFeatured';
  if (['status', 'active', 'isactive'].includes(clean)) return 'status';
  if (['parent', 'parentid', 'parent_id', 'parentcategory'].includes(clean)) return 'parent_id';
  if (['icon', 'emoji'].includes(clean)) return 'icon';
  if (['sortorder', 'sort_order', 'order'].includes(clean)) return 'sort_order';

  return String(h).trim();
}

// Convert array of objects to CSV string
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Download Product Sample CSV Template
export function downloadProductSampleCSV() {
  const sampleData = [
    {
      name: 'Wireless Bluetooth Earbuds Pro',
      nameBn: 'ওয়্যারলেস ব্লুটুথ ইয়ারবাডস প্রো',
      sellingPrice: 1250,
      regularPrice: 1800,
      stockQuantity: 50,
      category: 'Electronics',
      sku: 'WBE-PRO-01',
      brand: 'SoundCore',
      images: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df,https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb',
      tags: 'earbuds, bluetooth, wireless, audio',
      description: 'High quality wireless earbuds with active noise cancellation and 24h battery life.',
      shortDescription: 'Active Noise Cancelling Earbuds with Deep Bass',
      isFeatured: 'TRUE'
    },
    {
      name: 'Men Slim Fit Casual Cotton Shirt',
      nameBn: 'পুরুষদের স্লিফ ফিট কটন শার্ট',
      sellingPrice: 890,
      regularPrice: 1200,
      stockQuantity: 100,
      category: 'Men Fashion',
      sku: 'SHIRT-SLIM-M',
      brand: 'UrbanStyle',
      images: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
      tags: 'men, shirt, fashion, casual',
      description: '100% premium breathable cotton casual long sleeve shirt.',
      shortDescription: 'Premium 100% Cotton Shirt for Daily Wear',
      isFeatured: 'FALSE'
    },
    {
      name: 'Smart Fitness Watch Series 7',
      nameBn: 'স্মার্ট ফিটনেস ওয়াচ সিরিজ ৭',
      sellingPrice: 2450,
      regularPrice: 3200,
      stockQuantity: 30,
      category: 'Smartphones & Gadgets',
      sku: 'WATCH-S7-BLK',
      brand: 'FitPro',
      images: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      tags: 'smartwatch, fitness, health, tracker',
      description: 'Waterproof smart fitness watch with heart rate monitor and AMOLED display.',
      shortDescription: 'Heart Rate & Sleep Monitoring AMOLED Smartwatch',
      isFeatured: 'TRUE'
    }
  ];

  exportToCSV(sampleData, 'stellar_mart_products_bulk_template.csv');
}

// Download Category Sample CSV Template
export function downloadCategorySampleCSV() {
  const sampleData = [
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      parentCategory: '',
      description: 'All electronic gadgets, phones, audio gear and accessories',
      icon: '⚡',
      status: 'active',
      sort_order: 1,
      isFeatured: 'TRUE'
    },
    {
      name: 'Smartphones & Mobiles',
      slug: 'smartphones-mobiles',
      parentCategory: 'Electronics & Gadgets',
      description: 'Latest Android and iOS smartphones and features phones',
      icon: '📱',
      status: 'active',
      sort_order: 2,
      isFeatured: 'TRUE'
    },
    {
      name: 'Men Fashion',
      slug: 'men-fashion',
      parentCategory: '',
      description: 'Clothing, shoes and fashion wear for men',
      icon: '👔',
      status: 'active',
      sort_order: 3,
      isFeatured: 'FALSE'
    },
    {
      name: 'Women Fashion & Beauty',
      slug: 'women-fashion-beauty',
      parentCategory: '',
      description: 'Dresses, jewelry and cosmetics for women',
      icon: '👗',
      status: 'active',
      sort_order: 4,
      isFeatured: 'TRUE'
    }
  ];

  exportToCSV(sampleData, 'stellar_mart_categories_bulk_template.csv');
}

// Support Excel (.xlsx) download and parsing using dynamically loaded xlsx if present
export async function downloadExcelTemplate(type = 'products') {
  try {
    const XLSX = await import('xlsx');
    const isProduct = type === 'products';
    const filename = isProduct ? 'stellar_mart_products_bulk_template.xlsx' : 'stellar_mart_categories_bulk_template.xlsx';

    const data = isProduct ? [
      {
        'name': 'Wireless Bluetooth Earbuds Pro',
        'nameBn': 'ওয়্যারলেস ব্লুটুথ ইয়ারবাডস প্রো',
        'sellingPrice': 1250,
        'regularPrice': 1800,
        'stockQuantity': 50,
        'category': 'Electronics',
        'sku': 'WBE-PRO-01',
        'brand': 'SoundCore',
        'images': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df,https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb',
        'tags': 'earbuds, bluetooth, wireless, audio',
        'description': 'High quality wireless earbuds with active noise cancellation and 24h battery life.',
        'shortDescription': 'Active Noise Cancelling Earbuds with Deep Bass',
        'isFeatured': 'TRUE'
      },
      {
        'name': 'Men Slim Fit Casual Cotton Shirt',
        'nameBn': 'পুরুষদের স্লিফ ফিট কটন শার্ট',
        'sellingPrice': 890,
        'regularPrice': 1200,
        'stockQuantity': 100,
        'category': 'Men Fashion',
        'sku': 'SHIRT-SLIM-M',
        'brand': 'UrbanStyle',
        'images': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
        'tags': 'men, shirt, fashion, casual',
        'description': '100% premium breathable cotton casual long sleeve shirt.',
        'shortDescription': 'Premium 100% Cotton Shirt for Daily Wear',
        'isFeatured': 'FALSE'
      }
    ] : [
      {
        'name': 'Electronics & Gadgets',
        'slug': 'electronics-gadgets',
        'parentCategory': '',
        'description': 'All electronic gadgets, phones, audio gear and accessories',
        'icon': '⚡',
        'status': 'active',
        'sort_order': 1,
        'isFeatured': 'TRUE'
      },
      {
        'name': 'Smartphones & Mobiles',
        'slug': 'smartphones-mobiles',
        'parentCategory': 'Electronics & Gadgets',
        'description': 'Latest Android and iOS smartphones and features phones',
        'icon': '📱',
        'status': 'active',
        'sort_order': 2,
        'isFeatured': 'TRUE'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, isProduct ? 'Products' : 'Categories');
    XLSX.writeFile(workbook, filename);
  } catch (err) {
    console.warn('XLSX export fallback to CSV:', err);
    if (type === 'products') downloadProductSampleCSV();
    else downloadCategorySampleCSV();
  }
}

// Read any uploaded file (CSV, XLSX, XLS, JSON)
export async function parseUploadedFile(file) {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.json')) {
    const text = await file.text();
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : (json.products || json.categories || json.items || []);
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet);

      return rawRows.map(row => {
        const normalized = {};
        Object.keys(row).forEach(key => {
          normalized[normalizeHeader(key)] = row[key];
        });
        return normalized;
      });
    } catch (xlsxErr) {
      console.error('Failed to parse Excel file with xlsx library:', xlsxErr);
      throw new Error('Could not parse Excel spreadsheet. Please try saving as CSV and uploading.');
    }
  }

  // Fallback to CSV text parsing
  const text = await file.text();
  return parseCSV(text);
}
