import http from 'http';

const API_URL = 'http://localhost:3000';
const BATCH_SIZE = 1000;

function post(path: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => (body += chunk.toString()));
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    http.get(`${API_URL}${path}`, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => (body += chunk.toString()));
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBenchmark(): Promise<void> {
  console.log(`\n🚀 Starting benchmark — ${BATCH_SIZE} documents\n`);

  const userIds = Array.from({ length: BATCH_SIZE }, (_, i) => `user-${i + 1}`);

  // Mesures initiales
  const memBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  const startTime = Date.now();

  // Lancer le batch
  const response = await post('/api/documents/batch', { userIds }) as {
    success: boolean;
    data: { batchId: string; totalDocuments: number };
  };

  if (!response.success) {
    console.error('❌ Failed to create batch:', response);
    process.exit(1);
  }

  const { batchId } = response.data;
  console.log(`✅ Batch created: ${batchId}`);
  console.log(`📋 Total documents: ${response.data.totalDocuments}\n`);

  // Polling jusqu'à completion
  let completed = false;
  let lastProcessed = 0;
  const pollInterval = 1000;

  while (!completed) {
    await sleep(pollInterval);

    const status = await get(`/api/documents/batch/${batchId}`) as {
      success: boolean;
      data: {
        status: string;
        processedDocuments: number;
        failedDocuments: number;
        totalDocuments: number;
      };
    };

    const { data } = status;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const docsPerSec = (data.processedDocuments / parseFloat(elapsed)).toFixed(1);
    const progress = ((data.processedDocuments / data.totalDocuments) * 100).toFixed(1);

    if (data.processedDocuments !== lastProcessed) {
      console.log(
        `⏱  ${elapsed}s | ${progress}% | ${data.processedDocuments}/${data.totalDocuments} docs | ${docsPerSec} docs/s`
      );
      lastProcessed = data.processedDocuments;
    }

    if (data.status === 'completed' || data.status === 'failed') {
      completed = true;

      const totalTime = (Date.now() - startTime) / 1000;
      const memAfter = process.memoryUsage();
      const cpuAfter = process.cpuUsage(cpuBefore);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 BENCHMARK REPORT');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ Status         : ${data.status}`);
      console.log(`📄 Total docs     : ${data.totalDocuments}`);
      console.log(`✔  Processed      : ${data.processedDocuments}`);
      console.log(`❌ Failed         : ${data.failedDocuments}`);
      console.log(`⏱  Total time     : ${totalTime.toFixed(2)}s`);
      console.log(`🚀 Throughput     : ${(data.processedDocuments / totalTime).toFixed(1)} docs/s`);
      console.log(`🧠 Memory before  : ${(memBefore.heapUsed / 1024 / 1024).toFixed(1)} MB`);
      console.log(`🧠 Memory after   : ${(memAfter.heapUsed / 1024 / 1024).toFixed(1)} MB`);
      console.log(`🧠 Memory delta   : +${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(1)} MB`);
      console.log(`⚙  CPU user       : ${(cpuAfter.user / 1000).toFixed(0)}ms`);
      console.log(`⚙  CPU system     : ${(cpuAfter.system / 1000).toFixed(0)}ms`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  }
}

runBenchmark().catch(console.error);