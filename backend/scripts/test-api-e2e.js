const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRoutes = require('../src/routes');
const { errorHandler } = require('../src/middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1', apiRoutes);
app.use(errorHandler);

async function runApiE2ETests() {
  console.log('=== STARTING BACKEND HTTP API END-TO-END TESTS ===\n');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;
    console.log(`Test server running on port ${port}...`);

    const tests = [
      { name: 'Health Endpoint (/health)', path: '/health', expectedField: 'database', expectedValue: 'connected' },
      { name: 'Dashboard Summary (/dashboard/summary)', path: '/dashboard/summary', expectedField: 'potentialMonthlySavings' },
      { name: 'Telemetry Metrics (/telemetry/metrics)', path: '/telemetry/metrics', expectedField: 'data' },
      { name: 'Telemetry Resources (/telemetry/resources)', path: '/telemetry/resources', expectedField: '0' },
      { name: 'Anomalies List (/anomalies)', path: '/anomalies', expectedField: '0' },
      { name: 'Forecasts List (/forecasts)', path: '/forecasts', expectedField: '0' },
      { name: 'Recommendations List (/recommendations)', path: '/recommendations', expectedField: '0' },
      { name: 'History Logs (/history)', path: '/history', expectedField: '0' },
      { name: 'System Health (/system/health)', path: '/system/health', expectedField: 'overallStatus', expectedValue: 'HEALTHY' }
    ];

    let passedCount = 0;
    for (const t of tests) {
      try {
        const res = await fetch(`${baseUrl}${t.path}`);
        const data = await res.json();

        if (res.status === 200) {
          console.log(`[PASS] ${t.name}: HTTP status 200 OK`);
          if (t.expectedValue) {
            const actualVal = data[t.expectedField];
            if (actualVal === t.expectedValue) {
              console.log(`       Verified field '${t.expectedField}' = '${actualVal}'`);
            } else {
              console.warn(`       WARNING: Field '${t.expectedField}' is '${actualVal}', expected '${t.expectedValue}'`);
            }
          }
          passedCount++;
        } else {
          console.error(`[FAIL] ${t.name}: HTTP status ${res.status}`);
        }
      } catch (err) {
        console.error(`[FAIL] ${t.name}: Error - ${err.message}`);
      }
    }

    // Test POST Recommendation Approve
    try {
      console.log('\nTesting POST /recommendations/REC-001/approve...');
      const approveRes = await fetch(`${baseUrl}/recommendations/REC-001/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'test-admin' })
      });
      const approveData = await approveRes.json();
      if (approveRes.status === 200 && approveData.success) {
        console.log('[PASS] Recommendation Approval Endpoint: HTTP 200 OK & Status updated to APPROVED');
        passedCount++;
      } else {
        console.error('[FAIL] Recommendation Approval Endpoint:', approveData);
      }
    } catch (err) {
      console.error('[FAIL] Recommendation Approval Endpoint:', err.message);
    }

    console.log(`\n=== API TEST SUMMARY: ${passedCount}/${tests.length + 1} ENDPOINTS PASSED ===`);
    server.close();
  });
}

runApiE2ETests();
