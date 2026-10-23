const http = require('http');

const ROUTES_TO_TEST = [
  { path: '/', name: 'Homepage', maxExpectedKB: 500 },
  { path: '/api/products', name: 'Products API', maxExpectedKB: 50 },
  { path: '/api/categories', name: 'Categories API', maxExpectedKB: 50 },
  { path: '/categories', name: 'Categories Page', maxExpectedKB: 250 },
  { path: '/shop', name: 'Shop Page', maxExpectedKB: 100 },
  { path: '/cart', name: 'Cart Page', maxExpectedKB: 50 },
  { path: '/api/banners', name: 'Banners API', maxExpectedKB: 10 },
  { path: '/wp-admin/install.php', name: 'Bot Block Test', expectedStatus: 404, maxExpectedBytes: 50 }
];

function fetchOnce(path) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          durationMs: Date.now() - start,
          sizeBytes: Buffer.byteLength(data),
          sizeKB: (Buffer.byteLength(data) / 1024).toFixed(2),
          hasBase64: data.includes('data:image/')
        });
      });
    }).on('error', (err) => {
      resolve({
        statusCode: 0,
        error: err.message,
        durationMs: Date.now() - start,
        sizeBytes: 0,
        sizeKB: '0.00',
        hasBase64: false
      });
    });
  });
}

async function runHealthCheck(cycle) {
  console.log(`\n======================================================`);
  console.log(`[Cycle #${cycle}] Running Full Server Health & Speed Audit: ${new Date().toLocaleTimeString()}`);
  console.log(`======================================================`);
  console.log('Route                  | Status | Latency  | Size     | Base64 Leak? | Health');
  console.log('---------------------------------------------------------------------------------');

  let allHealthy = true;

  for (const route of ROUTES_TO_TEST) {
    const res = await fetchOnce(route.path);
    const expected = route.expectedStatus || 200;
    const isOk = res.statusCode === expected;
    const isLeaking = res.hasBase64;
    const isTooBig = route.maxExpectedKB ? parseFloat(res.sizeKB) > route.maxExpectedKB : false;
    const statusMark = isOk && !isLeaking && !isTooBig ? 'PASS' : 'WARN';

    if (!isOk || isLeaking || isTooBig) allHealthy = false;

    console.log(
      route.name.padEnd(22) + ' | ' +
      String(res.statusCode).padEnd(6) + ' | ' +
      (res.durationMs + 'ms').padStart(8) + ' | ' +
      (res.sizeKB + ' KB').padStart(8) + ' | ' +
      (res.hasBase64 ? 'YES (LEAK!)' : 'NO (CLEAN)').padStart(12) + ' | ' +
      statusMark
    );
  }

  const memory = process.memoryUsage();
  console.log('---------------------------------------------------------------------------------');
  console.log(`Memory Usage: RSS: ${(memory.rss / 1024 / 1024).toFixed(1)} MB | Heap: ${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Cycle #${cycle} Overall Status: ${allHealthy ? 'PERFECT HEALTH (100% OK)' : 'ATTENTION NEEDED'}\n`);
}

async function startContinuousMonitor(maxCycles = 5, delaySeconds = 6) {
  console.log('Starting automated speed & health monitor...');
  console.log(`Target: http://localhost:3000 | Testing every ${delaySeconds}s for ${maxCycles} cycles.`);

  for (let i = 1; i <= maxCycles; i++) {
    await runHealthCheck(i);
    if (i < maxCycles) {
      await new Promise(r => setTimeout(r, delaySeconds * 1000));
    }
  }

  console.log('======================================================');
  console.log('  ALL MONITORING CYCLES COMPLETED - RESULTS LOGGED!   ');
  console.log('======================================================');
}

startContinuousMonitor(5, 5);
