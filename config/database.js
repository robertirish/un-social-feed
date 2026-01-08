const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

const dbUrl = process.env.DATABASE_URL;
console.log('Database URL exists:', !!dbUrl);
console.log('Database URL starts with postgres:', dbUrl ? dbUrl.substring(0, 10) + '...' : 'N/A');
console.log('Environment:', process.env.VERCEL ? 'Vercel' : (process.env.NODE_ENV || 'development'));

// Use PostgreSQL in production (Railway/Vercel), SQLite for local development
if (dbUrl && (dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres'))) {
  console.log('Using PostgreSQL database');
  
  // For Vercel, use Neon serverless driver
  if (process.env.VERCEL) {
    const { neonConfig } = require('@neondatabase/serverless');
    neonConfig.fetchConnectionCache = true;
    
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      dialectModule: require('@neondatabase/serverless'),
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 1,
        min: 0,
        idle: 0,
        acquire: 3000,
        evict: 30000
      }
    });
  } else {
    // For Railway or other platforms, use standard pg
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
  console.log('Using SQLite database (local development)');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: false
  });
}

module.exports = sequelize;
