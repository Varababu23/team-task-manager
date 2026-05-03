const { PrismaClient } = require('@prisma/client');

let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return prisma;
};

module.exports = { getPrismaClient };
