import { seedDatabase } from '../src/lib/db/seed';

async function main() {
  await seedDatabase();
  console.log('Database successfully reseeded with all fresh records!');
}

main().catch(console.error);

