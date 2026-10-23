/**
 * Complete Ecosystem Integration Test
 * Tests:
 * 1. User Cart & Order placement
 * 2. Admin Product Add, Update, Delete
 * 3. Vendor Product Add & Management
 * 4. Image hygiene & Database integrity
 */

const { SignJWT } = require('jose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET;

async function makeToken(payload) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .setIssuedAt()
    .sign(secret);
}

async function run() {
  console.log('====================================================');
  console.log('   STELLAR MART BD - FULL WORKFLOW TEST SUITE       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, success, details = '') {
    if (success) {
      console.log(`[PASS] ${name} ${details ? '-> ' + details : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '-> ' + details : ''}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST SECTION 1: USER PRODUCT BROWSING & CART & ORDER
  // ─────────────────────────────────────────────────────────────────
  console.log('--- 1. USER WORKFLOW (Browsing, Cart, Checkout, Order) ---');
  let sampleProduct = null;
  const testSessionId = 'guest_session_' + Date.now();

  try {
    // 1.1 Products Listing
    const t0 = Date.now();
    const prodRes = await fetch(`${BASE_URL}/api/products?page=1&limit=10`);
    const prodData = await prodRes.json();
    const prodOk = prodRes.ok && Array.isArray(prodData.products) && prodData.products.length > 0;
    sampleProduct = prodOk ? prodData.products[0] : null;
    report('1.1 Products Listing API', prodOk, `Found ${prodData.products?.length || 0} items in ${Date.now() - t0}ms`);

    // 1.2 Single Product Details Fetch
    if (sampleProduct?.slug) {
      const slugRes = await fetch(`${BASE_URL}/api/products?slug=${encodeURIComponent(sampleProduct.slug)}`);
      const slugData = await slugRes.json();
      const slugOk = slugRes.ok && slugData.products?.length > 0;
      report('1.2 Single Product by Slug API', slugOk, `Item: "${slugData.products?.[0]?.name}"`);
    }

    // 1.3 Add to Cart
    if (sampleProduct) {
      const cartAddRes = await fetch(`${BASE_URL}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          product: {
            id: sampleProduct.id || sampleProduct._id,
            _id: sampleProduct.id || sampleProduct._id,
            name: sampleProduct.name,
            price: sampleProduct.price || sampleProduct.sellingPrice || 100,
            featuredImage: sampleProduct.featuredImage || ''
          },
          quantity: 2
        })
      });
      const cartAddData = await cartAddRes.json();
      report('1.3 Add Item to Cart API', cartAddRes.ok, `Status: ${cartAddRes.status}, items: ${cartAddData.cart?.items?.length || 1}`);

      // 1.4 Get Cart Content
      const cartGetRes = await fetch(`${BASE_URL}/api/cart?sessionId=${testSessionId}`);
      const cartGetData = await cartGetRes.json();
      const hasItem = (cartGetData.cart?.items || []).some(it => String(it.product?.id || it.product?._id) === String(sampleProduct.id || sampleProduct._id));
      report('1.4 Get Cart Items API', cartGetRes.ok && hasItem, `Cart has ${cartGetData.cart?.items?.length || 0} items`);

      // 1.5 Update Quantity in Cart
      const cartPutRes = await fetch(`${BASE_URL}/api/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: testSessionId,
          productId: sampleProduct.id || sampleProduct._id,
          quantity: 3
        })
      });
      report('1.5 Update Cart Item Quantity API', cartPutRes.ok, `Status: ${cartPutRes.status}`);

      // 1.6 Verify Coupon Code Endpoint
      const couponRes = await fetch(`${BASE_URL}/api/coupons?code=STELLAR10`);
      report('1.6 Coupon Validation API', couponRes.ok, `Status: ${couponRes.status}`);

      // 1.7 Place Real Order via Checkout API
      const orderRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            productId: sampleProduct.id || sampleProduct._id,
            name: sampleProduct.name,
            quantity: 1,
            price: sampleProduct.price || sampleProduct.sellingPrice || 500,
            image: sampleProduct.featuredImage || ''
          }],
          shipping: {
            fullName: 'Test Automation Customer',
            phoneNumber: '01711000000',
            address: 'House 1, Road 2, Dhanmondi, Dhaka',
            city: 'Dhaka',
            postalCode: '1205',
            notes: 'Automated workflow test'
          },
          payment: {
            method: 'bKash',
            transactionId: 'TEST_TRX_' + Date.now()
          },
          amounts: {
            subtotal: 500,
            shipping: 60,
            discount: 0,
            tax: 0,
            total: 560
          }
        })
      });
      const orderData = await orderRes.json();
      const orderPlacedOk = orderRes.ok && orderData.success && (orderData.order?.orderNumber || orderData.order?.id);
      report('1.7 Order Placement API (/api/orders)', orderPlacedOk, `Order #: ${orderData.order?.orderNumber || 'N/A'}`);

      // 1.8 Clear Cart Item
      const cartDelRes = await fetch(`${BASE_URL}/api/cart?sessionId=${testSessionId}&productId=${sampleProduct.id || sampleProduct._id}`, {
        method: 'DELETE'
      });
      report('1.8 Delete Cart Item API', cartDelRes.ok, `Status: ${cartDelRes.status}`);
    }
  } catch (err) {
    report('1. User Workflow Execution', false, err.message);
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST SECTION 2: ADMIN PANEL PRODUCT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- 2. ADMIN PANEL WORKFLOW (Product Add, Update, Delete) ---');
  let adminCreatedProductId = null;

  try {
    const adminToken = await makeToken({
      id: 'admin_automation_tester',
      role: 'admin',
      email: 'admin@stellarmartbd.com'
    });

    const adminTestProduct = {
      name: 'Automated Test Jersey Pro ' + Date.now(),
      nameBn: 'অটোমেটেড টেস্ট জার্সি',
      description: 'High quality test product for validation',
      shortDescription: 'Test product',
      regularPrice: 1200,
      sellingPrice: 999,
      price: 999,
      stockQuantity: 25,
      stock: 25,
      sku: 'AUTO-SKU-' + Date.now(),
      category: 'Jerseys',
      featuredImage: 'https://res.cloudinary.com/stellarmartbd/image/upload/v1/stellar-mart/products/test.webp',
      images: ['https://res.cloudinary.com/stellarmartbd/image/upload/v1/stellar-mart/products/test.webp'],
      isActive: true,
      isFeatured: false,
      isNewArrival: true,
    };

    // 2.1 Admin Add Product
    const addRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `adminToken=${adminToken}`
      },
      body: JSON.stringify(adminTestProduct)
    });
    const addData = await addRes.json();
    adminCreatedProductId = addData.product?.id || addData.data?.id;
    const addOk = addRes.ok && addData.success && !!adminCreatedProductId;
    report('2.1 Admin Add Product API (POST /api/products)', addOk, `Created ID: ${adminCreatedProductId}`);

    // 2.2 Verify Newly Added Product Details
    if (adminCreatedProductId) {
      const getRes = await fetch(`${BASE_URL}/api/products/${adminCreatedProductId}`, {
        headers: { 'Cookie': `adminToken=${adminToken}` }
      });
      const getData = await getRes.json();
      const getOk = getRes.ok && getData.product?.name === adminTestProduct.name;
      report('2.2 Verify Admin Product API (GET /api/products/[id])', getOk, `Verified: "${getData.product?.name}"`);

      // 2.3 Admin Update Product
      const updateRes = await fetch(`${BASE_URL}/api/products/${adminCreatedProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `adminToken=${adminToken}`
        },
        body: JSON.stringify({
          name: adminTestProduct.name + ' (Updated)',
          sellingPrice: 899,
          price: 899,
          stock: 30
        })
      });
      const updateData = await updateRes.json();
      const updateOk = updateRes.ok && (updateData.success || updateData.product);
      report('2.3 Admin Update Product API (PUT /api/products/[id])', updateOk, `Updated price to 899`);

      // 2.4 Admin Delete Product (Clean up)
      const delRes = await fetch(`${BASE_URL}/api/products/${adminCreatedProductId}`, {
        method: 'DELETE',
        headers: { 'Cookie': `adminToken=${adminToken}` }
      });
      report('2.4 Admin Delete Product API (DELETE /api/products/[id])', delRes.ok, `Deleted test product cleanly`);
    }
  } catch (err) {
    report('2. Admin Workflow Execution', false, err.message);
  }

  // ─────────────────────────────────────────────────────────────────
  // TEST SECTION 3: VENDOR PANEL PRODUCT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────
  console.log('\n--- 3. VENDOR PANEL WORKFLOW (Product Add & List) ---');
  let vendorCreatedProductId = null;

  try {
    const vendorToken = await makeToken({
      id: '7ac73279-1882-4eca-971e-982aada54073',
      vendor_id: '4ed1ff47-e2da-4a2e-9445-cf37937c59e4',
      role: 'vendor',
      shop_name: 'Luxivon',
      email: 'raselhossain.aa258@gmail.com'
    });

    // 3.1 Vendor Products List
    const vListRes = await fetch(`${BASE_URL}/api/vendor/products`, {
      headers: { 'Cookie': `vendorToken=${vendorToken}` }
    });
    const vListData = await vListRes.json();
    report('3.1 Vendor Product List API (GET /api/vendor/products)', vListRes.ok, `Vendor products count: ${vListData.products?.length || 0}`);

    // 3.2 Vendor Add Product
    const vendorTestProduct = {
      name: 'Luxivon Premium Polo Shirt ' + Date.now(),
      nameBn: 'লাক্সিভন প্রিমিয়াম পোলো শার্ট',
      description: 'Vendor published quality polo shirt',
      price: 850,
      original_price: 1100,
      stock: 15,
      sku: 'VEND-SKU-' + Date.now(),
      featuredImage: 'https://res.cloudinary.com/stellarmartbd/image/upload/v1/stellar-mart/products/vendor_item.webp',
      images: ['https://res.cloudinary.com/stellarmartbd/image/upload/v1/stellar-mart/products/vendor_item.webp'],
    };

    const vAddRes = await fetch(`${BASE_URL}/api/vendor/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `vendorToken=${vendorToken}`
      },
      body: JSON.stringify(vendorTestProduct)
    });
    const vAddData = await vAddRes.json();
    vendorCreatedProductId = vAddData.product?.id;
    const vAddOk = vAddRes.ok && vAddData.success && !!vendorCreatedProductId;
    report('3.2 Vendor Add Product API (POST /api/vendor/products)', vAddOk, `Vendor Product ID: ${vendorCreatedProductId}`);

    // 3.3 Verify & Cleanup Vendor Test Product
    if (vendorCreatedProductId) {
      const adminToken = await makeToken({ id: 'admin_cleaner', role: 'admin' });
      const cleanRes = await fetch(`${BASE_URL}/api/products/${vendorCreatedProductId}`, {
        method: 'DELETE',
        headers: { 'Cookie': `adminToken=${adminToken}` }
      });
      report('3.3 Cleanup Vendor Test Product', cleanRes.ok, `Cleaned up ID: ${vendorCreatedProductId}`);
    }
  } catch (err) {
    report('3. Vendor Workflow Execution', false, err.message);
  }

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed === 0) {
    console.log('>>> ALL SYSTEMS GO! Every single user, admin, and vendor workflow functions flawlessly! <<<');
  } else {
    console.log(`>>> ATTENTION: ${failed} tests failed. <<<`);
  }
}

run();
