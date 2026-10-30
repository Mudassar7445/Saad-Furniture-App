import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  console.log('Target Database URL:', process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL : 'Local fallback');
  const { seedDatabase } = await import('../src/lib/db/seed');
  await seedDatabase();
  console.log('✅ Turso Database successfully populated and seeded with all master records!');
}

main().catch(console.error);
