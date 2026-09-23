const prisma = require("../src/config/db");

async function verify() {
  console.log("Verifying PostgreSQL connection to 'cloud_optimizer' database...");

  // 1. Raw Query
  const result = await prisma.$queryRaw`SELECT current_database(), version();`;
  console.log("Connected Database Info:", result);

  // 2. Insert test system log
  const log = await prisma.systemLog.create({
    data: {
      level: "INFO",
      message: "PostgreSQL 18.6 migration verification complete",
      context: { db: "cloud_optimizer", engine: "PostgreSQL" }
    }
  });
  console.log("Created SystemLog record:", log.id);

  // 3. Query system logs
  const count = await prisma.systemLog.count();
  console.log(`Total SystemLog records: ${count}`);

  console.log("SUCCESS: PostgreSQL database verification passed!");
  await prisma.$disconnect();
}

verify().catch((err) => {
  console.error("VERIFICATION FAILED:", err);
  prisma.$disconnect();
  process.exit(1);
});
