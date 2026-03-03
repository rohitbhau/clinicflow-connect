
import http from 'http';
import https from 'https';
import { URL } from 'url';

const TARGET_URL = process.argv[2] || 'http://localhost:5000/api/v1/auth/login';
const CONCURRENCY = parseInt(process.argv[3] || '200', 10);
const TOTAL_REQUESTS = parseInt(process.argv[4] || '1000', 10);

console.log(`Starting DB load test against ${TARGET_URL}`);
console.log(`Concurrency: ${CONCURRENCY}, Total Requests: ${TOTAL_REQUESTS}`);

const payload = JSON.stringify({
    email: "stress-test@example.com",
    password: "wrong-password"
});

let completed = 0;
let success = 0; // 200 or 401 (expected failure)
let failed = 0;
let active = 0;
const start = Date.now();
const latencies: number[] = [];

const makeRequest = () => {
    if (completed >= TOTAL_REQUESTS) return;

    active++;
    const reqStart = Date.now();
    const url = new URL(TARGET_URL);
    const lib = url.protocol === 'https:' ? https : http;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = lib.request(TARGET_URL, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            const duration = Date.now() - reqStart;
            latencies.push(duration);

            // 401 is expected behavior for invalid login, so count as success
            if (res.statusCode && (res.statusCode === 200 || res.statusCode === 401)) {
                success++;
            } else {
                failed++;
                // console.error(`Request failed with status: ${res.statusCode}`);
            }

            active--;
            completed++;
            checkProgress();

            if (completed + active < TOTAL_REQUESTS) {
                makeRequest();
            }
        });
    });

    req.on('error', (err) => {
        const duration = Date.now() - reqStart;
        latencies.push(duration);
        failed++;
        console.error(`Request error: ${err.message}`);
        active--;
        completed++;
        checkProgress();

        if (completed + active < TOTAL_REQUESTS) {
            makeRequest();
        }
    });

    req.write(payload);
    req.end();
};

const checkProgress = () => {
    if (completed % 50 === 0) {
        process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} (Success: ${success}, Fail: ${failed})`);
    }

    if (completed >= TOTAL_REQUESTS && active === 0) {
        finish();
    }
};

const finish = () => {
    const duration = (Date.now() - start) / 1000;
    const rps = TOTAL_REQUESTS / duration;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const p99 = latencies[Math.floor(latencies.length * 0.99)];

    console.log('\n\n--- DB Load Test Results ---');
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Requests/sec: ${rps.toFixed(2)}`);
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log(`Successful (200/401): ${success}`);
    console.log(`Failed: ${failed}`);
    console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`P95 Latency: ${p95}ms`);
    console.log(`P99 Latency: ${p99}ms`);
};

// Start initial batch
for (let i = 0; i < Math.min(CONCURRENCY, TOTAL_REQUESTS); i++) {
    makeRequest();
}
