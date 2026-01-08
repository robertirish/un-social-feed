const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

const dbUrl = process.env.DATABASE_URL;
console.log('Database URL exists:', !!dbUrl);
console.log('Database URL starts with postgres:', dbUrl ? dbUrl.substring(0, 10) + '...' : 'N/A');

// Use PostgreSQL in production (Railway), SQLite for local development
if (dbUrl && (dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres'))) {
  console.log('Using PostgreSQL database');
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
