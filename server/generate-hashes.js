// Generate bcrypt password hashes for seeding database
const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('Generating password hashes...\n');
  
  // Admin password: Admin@123456
  const adminHash = await bcrypt.hash('Admin@123456', 10);
  console.log('Admin (admin@converge.com):');
  console.log('Password: Admin@123456');
  console.log('Hash:', adminHash);
  console.log('');
  
  // Test user password: TestUser@123
  const testUserHash = await bcrypt.hash('TestUser@123', 10);
  console.log('Test User (testuser@example.com):');
  console.log('Password: TestUser@123');
  console.log('Hash:', testUserHash);
  console.log('');
  
  console.log('Copy these hashes to db/init.sql');
}

(async () => {
  try {
    await generateHashes();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
