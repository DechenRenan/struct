const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearUploadsTable() {
  try {
    await prisma.upload.deleteMany(); // Deleta todos os registros da tabela Upload
    console.log('Tabela Upload foi limpa com sucesso.');
  } catch (error) {
    console.error('Erro ao limpar a tabela Upload:', error);
  } finally {
    await prisma.$disconnect(); // Desconecta o Prisma do banco de dados
  }
}

clearUploadsTable();