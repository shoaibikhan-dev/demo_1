const { Sequelize } = require('sequelize');
require('dotenv').config();
let sequelize;
if (process.env.DATABASE_URL) {
  const isNeon =
    process.env.DATABASE_URL.includes("neon.tech") ||
    process.env.DATABASE_URL.includes("sslmode=require");
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DATABASE_URL.includes('sslmode=disable') || process.env.DB_HOST === 'postgres'
        ? false
        : { require: true, rejectUnauthorized: false },
    },
    logging: false,
    pool: { max: 25, min: 2, acquire: 30000, idle: 10000 },
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME     || 'mardan_smart_city',
    process.env.DB_USER     || 'postgres',
    process.env.DB_PASSWORD,
    {
      host:    process.env.DB_HOST || 'localhost',
      port:    parseInt(process.env.DB_PORT || '5432'),
      dialect: 'postgres',
      logging: false,
      pool: { max: 25, min: 2, acquire: 30000, idle: 10000 },
    }
  );
}
const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 1.5;
      } else {
        console.error('❌ All database connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};
module.exports = { sequelize, connectDB };
