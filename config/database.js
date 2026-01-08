const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

// Use PostgreSQL in production (Railway), SQLite for local development
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql')) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  });
} else {
  // SQLite for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '..', 'database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  });
}

module.exports = sequelize;
