const { errorHandler } = require("../src/middleware/errorHandler");

const testStatuses = [400, 404, 409, 502, 503, 504];

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

let passed = 0;

for (const statusCode of testStatuses) {
  const res = createResponse();

  errorHandler(
    {
      statusCode,
      message: `Controlled test error ${statusCode}`
    },
    {},
    res,
    () => {}
  );

  if (
    res.statusCode === statusCode &&
    res.body.status === "error" &&
    res.body.message === `Controlled test error ${statusCode}`
  ) {
    console.log(`[PASS] Controlled ${statusCode} preserved`);
    passed++;
  } else {
    console.error(`[FAIL] Controlled ${statusCode}`, res);
  }
}

const unexpectedRes = createResponse();

errorHandler(
  {
    statusCode: 500,
    message: "secret internal database detail"
  },
  {},
  unexpectedRes,
  () => {}
);

if (
  unexpectedRes.statusCode === 500 &&
  unexpectedRes.body.status === "error" &&
  unexpectedRes.body.message === "Internal server error"
) {
  console.log("[PASS] Unexpected 500 remains sanitized");
  passed++;
} else {
  console.error("[FAIL] Unexpected 500 was not sanitized", unexpectedRes);
}

const expected = testStatuses.length + 1;

console.log(`\n=== ERROR HANDLER TEST SUMMARY: ${passed}/${expected} PASSED ===`);

if (passed !== expected) {
  process.exit(1);
}
