const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

const dbUrl = process.env.DATABASE_URL;
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL_URL;

console.log('Database URL exists:', !!dbUrl);
console.log('Is Vercel:', isVercel);

// Use PostgreSQL in production, SQLite for local development
if (dbUrl && (dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres'))) {
  console.log('Configuring PostgreSQL...');
  
  try {
    // Try to use Neon serverless driver (works on Vercel)
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.fetchConnectionCache = true;
    
    console.log('Using Neon serverless driver');
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      dialectModule: require('@neondatabase/serverless'),
      logging: false,
      dialectOptions: {
        ssl: true
      },
      pool: {
        max: 1,
        min: 0,
        idle: 0,
        acquire: 3000
      }
    });
  } catch (e) {
    console.log('Neon driver not available, using pg:', e.message);
    // Fallback to standard pg driver
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });
  }
} else {
  // SQLite for local development
  console.log('Using SQLite database');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
