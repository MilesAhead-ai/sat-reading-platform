import dataSource from '../../config/data-source';
import { seedSkills } from './skill.seed';
import { seedContent } from './content.seed';
import { seedKnowledgeBase } from './knowledge-base.seed';
import { seedContentExpansion } from './content-expansion.seed';
// Optional: import official content seeds (see README for details)
// import { seedOfficialContent } from './content-official.seed';

async function runSeeds() {
  console.log('Initializing data source...');
  await dataSource.initialize();
  console.log('Data source initialized.');

  try {
    await seedSkills(dataSource);
    await seedContent(dataSource);
    await seedContentExpansion(dataSource);
    // Optional: await seedOfficialContent(dataSource);
    await seedKnowledgeBase(dataSource);

    console.log('All seeds completed successfully.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Data source connection closed.');
  }
}

runSeeds();
