import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password_here', // In production, use proper password hashing
    },
  });

  // Create some sample articles
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        title: 'Introduction to Quantum Computing',
        source: 'https://arxiv.org/abs/quantum-computing-intro',
        type: 'RESEARCH_PAPER',
        mainPoints: [
          'Quantum bits can exist in multiple states simultaneously',
          'Quantum entanglement enables powerful parallel computations',
          'Quantum computers could break current encryption methods'
        ],
        summary: 'A comprehensive introduction to quantum computing principles and their implications for future technology.',
      },
    }),
    prisma.article.create({
      data: {
        title: 'CRISPR Gene Editing: A Revolution in Biotechnology',
        source: 'https://doi.org/10.1038/crispr-review',
        type: 'SCIENTIFIC_ARTICLE',
        mainPoints: [
          'CRISPR allows precise DNA modification',
          'Applications include disease treatment and crop improvement',
          'Ethical considerations in genetic engineering'
        ],
        summary: 'An overview of CRISPR technology and its potential applications in medicine and agriculture.',
      },
    }),
  ]);

  // Create some learning sessions
  await Promise.all(
    articles.map((article) =>
      prisma.learnSession.create({
        data: {
          userId: user.id,
          articleId: article.id,
          progress: Math.random() * 100,
          notes: 'Sample learning session notes',
        },
      })
    )
  );

  // Create some learning items for spaced repetition
  await Promise.all([
    prisma.learningItem.create({
      data: {
        userId: user.id,
        content: 'Quantum superposition allows qubits to exist in multiple states simultaneously',
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }),
    prisma.learningItem.create({
      data: {
        userId: user.id,
        content: 'CRISPR-Cas9 is a precise gene-editing tool that can modify DNA sequences',
        nextReview: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 