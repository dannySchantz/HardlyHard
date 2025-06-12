import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'langchain/llms/openai';
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI
const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});

// Simple in-memory store for our scientific documents
let vectorStore: MemoryVectorStore;

async function initializeVectorStore() {
  // Initialize with some sample documents
  const documents = [
    new Document({
      pageContent: "Quantum computing leverages quantum mechanical phenomena like superposition and entanglement to perform computations.",
      metadata: { source: "quantum_computing_intro.pdf" }
    }),
    // Add more sample documents here
  ];

  vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    new OpenAIEmbeddings()
  );
}

initializeVectorStore();

// API Routes
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    // TODO: Implement proper source retrieval and context building
    const response = await model.call(
      `You are a helpful AI tutor that explains complex scientific concepts in simple terms. 
       Your knowledge comes exclusively from peer-reviewed sources.
       Question: ${message}
       Answer in a clear and engaging way:`
    );

    res.json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user/:userId/progress', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const progress = await prisma.learningItem.findMany({
      where: { userId },
      include: { user: true }
    });
    res.json(progress);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/user/:userId/learning-item', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { content } = req.body;
    
    const learningItem = await prisma.learningItem.create({
      data: {
        userId,
        content,
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next review in 24 hours
      }
    });
    
    res.json(learningItem);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 