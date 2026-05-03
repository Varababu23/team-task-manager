const { PrismaClient } = require('@prisma/client');

let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      accelerateUrl: process.env.DATABASE_URL,
      log: ['error', 'warn'],
    });
  }
  return prisma;
};

module.exports = { getPrismaClient };