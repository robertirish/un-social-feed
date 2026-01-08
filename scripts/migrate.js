require('dotenv').config();
const { sequelize } = require('../models');

async function migrate() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');
    
    console.log('Running migrations...');
    await sequelize.sync({ alter: true });
    console.log('Migrations completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
