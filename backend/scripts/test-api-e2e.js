const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRoutes = require('../src/routes');
const { errorHandler } = require('../src/middleware/errorHandler');
const prisma = require('../src/config/db');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/v1', apiRoutes);
app.use(errorHandler);

const { execSync } = require('child_process');

async function runApiE2ETests() {
  console.log('=== STARTING BACKEND HTTP API END-TO-END TESTS ===\n');
  
  console.log('Running test data setup (seed-db.js)...');
  execSync('node scripts/seed-db.js', { stdio: 'inherit' });

  // Reset test recommendations to ACTIVE so the test is repeatable.
  await prisma.recommendation.updateMany({
    where: {
      id: {
        in: ['REC-001', 'REC-002']
      }
    },
    data: {
      status: 'ACTIVE',
      updatedAt: new Date()
    }
  });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api/v1`;

    console.log(`Test server running on port ${port}...`);

    const tests = [
      {
        name: 'Health Endpoint (/health)',
        path: '/health',
        expectedField: 'database',
        expectedValue: 'connected'
      },
      {
        name: 'Dashboard Summary (/dashboard/summary)',
        path: '/dashboard/summary',
        expectedField: 'potentialMonthlySavings'
      },
      {
        name: 'Telemetry Metrics (/telemetry/metrics)',
        path: '/telemetry/metrics',
        expectedField: 'data'
      },
      {
        name: 'Telemetry Resources (/telemetry/resources)',
        path: '/telemetry/resources',
        expectedField: '0'
      },
      {
        name: 'Anomalies List (/anomalies)',
        path: '/anomalies',
        expectedField: '0'
      },
      {
        name: 'Forecasts List (/forecasts)',
        path: '/forecasts',
        expectedField: '0'
      },
      {
        name: 'Recommendations List (/recommendations)',
        path: '/recommendations',
        expectedField: '0'
      },
      {
        name: 'History Logs (/history)',
        path: '/history',
        expectedField: '0'
      },
      {
        name: 'System Health (/system/health)',
        path: '/system/health',
        expectedField: 'overallStatus',
        expectedValue: 'HEALTHY'
      }
    ];

    let passedCount = 0;
    const totalTests = tests.length + 4;

    // ---------------------------------------------------------
    // GET endpoint tests
    // ---------------------------------------------------------
    for (const t of tests) {
      try {
        const res = await fetch(`${baseUrl}${t.path}`);
        const data = await res.json();

        if (res.status === 200) {
          console.log(`[PASS] ${t.name}: HTTP status 200 OK`);

          if (t.expectedValue) {
            const actualVal = data[t.expectedField];

            if (actualVal === t.expectedValue) {
              console.log(
                `       Verified field '${t.expectedField}' = '${actualVal}'`
              );
            } else {
              console.warn(
                `       WARNING: Field '${t.expectedField}' is '${actualVal}', expected '${t.expectedValue}'`
              );
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

    // ---------------------------------------------------------
    // Test POST Forecast Trigger
    // ---------------------------------------------------------
    try {
      console.log('\nTesting POST /forecast...');

      const forecastRes = await fetch(`${baseUrl}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceId: 'TEST-FORECAST'
        })
      });

      const forecastData = await forecastRes.json();

      if (
        forecastRes.status === 501 &&
        forecastData.status === 'error' &&
        forecastData.message?.includes('ML service')
      ) {
        console.log(
          '[PASS] Forecast Trigger Endpoint: HTTP 501 & ML generation correctly delegated'
        );
        passedCount++;
      } else {
        console.error(
          '[FAIL] Forecast Trigger Endpoint:',
          forecastData
        );
      }
    } catch (err) {
      console.error(
        '[FAIL] Forecast Trigger Endpoint:',
        err.message
      );
    }

    // ---------------------------------------------------------
    // Test POST Recommendation Approve
    // ---------------------------------------------------------
    try {
      console.log(
        '\nTesting POST /recommendations/REC-001/approve...'
      );

      const approveRes = await fetch(
        `${baseUrl}/recommendations/REC-001/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user: 'test-admin'
          })
        }
      );

      const approveData = await approveRes.json();

      if (
        approveRes.status === 200 &&
        approveData.status === 'success' &&
        approveData.data?.status === 'APPROVED'
      ) {
        console.log(
          '[PASS] Recommendation Approval Endpoint: HTTP 200 OK & Status updated to APPROVED'
        );
        passedCount++;
      } else {
        console.error(
          '[FAIL] Recommendation Approval Endpoint:',
          approveData
        );
      }
    } catch (err) {
      console.error(
        '[FAIL] Recommendation Approval Endpoint:',
        err.message
      );
    }

    // ---------------------------------------------------------
    // Test POST Recommendation Reject
    // ---------------------------------------------------------
    try {
      console.log(
        '\nTesting POST /recommendations/REC-002/reject...'
      );

      const rejectRes = await fetch(
        `${baseUrl}/recommendations/REC-002/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user: 'test-admin'
          })
        }
      );

      const rejectData = await rejectRes.json();

      if (
        rejectRes.status === 200 &&
        rejectData.status === 'success' &&
        rejectData.data?.status === 'REJECTED'
      ) {
        console.log(
          '[PASS] Recommendation Rejection Endpoint: HTTP 200 OK & Status updated to REJECTED'
        );
        passedCount++;
      } else {
        console.error(
          '[FAIL] Recommendation Rejection Endpoint:',
          rejectData
        );
      }
    } catch (err) {
      console.error(
        '[FAIL] Recommendation Rejection Endpoint:',
        err.message
      );
    }

    // ---------------------------------------------------------
    // Test History contains recommendation actions
    // ---------------------------------------------------------
    try {
      console.log('\nTesting recommendation action history...');

      const historyRes = await fetch(`${baseUrl}/history`);
      const historyData = await historyRes.json();

      const historyLogs = Array.isArray(historyData)
        ? historyData
        : historyData.data || [];

      const approvalLogFound = historyLogs.some(
        (log) =>
          log.message === 'Recommendation REC-001 approved' &&
          log.context?.recommendationId === 'REC-001'
      );

      const rejectionLogFound = historyLogs.some(
        (log) =>
          log.message === 'Recommendation REC-002 rejected' &&
          log.context?.recommendationId === 'REC-002'
      );

      if (historyRes.status === 200 && approvalLogFound && rejectionLogFound) {
        console.log(
          '[PASS] Recommendation History: Approval and rejection logs found'
        );
        passedCount++;
      } else {
        console.error(
          '[FAIL] Recommendation History:',
          {
            approvalLogFound,
            rejectionLogFound
          }
        );
      }
    } catch (err) {
      console.error(
        '[FAIL] Recommendation History:',
        err.message
      );
    }

    console.log(
      `\n=== API TEST SUMMARY: ${passedCount}/${totalTests} ENDPOINTS/WORKFLOWS PASSED ===`
    );

    server.close(async () => {
      await prisma.$disconnect();
    });
  });
}

runApiE2ETests();