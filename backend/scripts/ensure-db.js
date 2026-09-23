const { execSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL is not defined in backend/.env');
  process.exit(1);
}

try {
  const parsed = new URL(dbUrl);
  const username = parsed.username || 'postgres';
  const password = parsed.password || '';
  const host = parsed.hostname || 'localhost';
  const port = parsed.port || '5432';
  const targetDb = parsed.pathname ? parsed.pathname.replace('/', '') : 'cloud_optimizer';

  console.log(`Connecting to PostgreSQL at ${host}:${port} as user '${username}'...`);

  const psqlPath = '"C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe"';

  // Check if database exists
  const checkCmd = `${psqlPath} -U ${username} -h ${host} -p ${port} -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${targetDb}'"`;
  
  const env = { ...process.env, PGPASSWORD: password };
  
  const result = execSync(checkCmd, { env, encoding: 'utf8' }).trim();

  if (result === '1') {
    console.log(`Database '${targetDb}' already exists.`);
  } else {
    console.log(`Database '${targetDb}' does not exist. Creating database...`);
    const createCmd = `${psqlPath} -U ${username} -h ${host} -p ${port} -d postgres -c "CREATE DATABASE ${targetDb};"`;
    execSync(createCmd, { env, encoding: 'utf8' });
    console.log(`Database '${targetDb}' created successfully.`);
  }
} catch (err) {
  console.error('Failed to check/create PostgreSQL database:', err.message);
  if (err.stdout) console.log('stdout:', err.stdout.toString());
  if (err.stderr) console.error('stderr:', err.stderr.toString());
  process.exit(1);
}
