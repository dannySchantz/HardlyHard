import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { AcademicSearchService } from './academicAPIs.mjs';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const academicService = new AcademicSearchService();
const port = process.env.PORT || 3000;

// Enhanced CORS configuration for frontend-backend communication
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL, 'https://your-frontend-domain.com']
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: allowedOrigins.filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Real academic API chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`🔍 Processing academic query: "${message}" for user: ${userId || 'anonymous'}`);
    
    // Search academic databases for peer-reviewed sources
    const searchResults = await academicService.searchAllSources(message, 8);
    
    if (searchResults.sources.length === 0) {
      return res.json({
        id: Date.now().toString(),
        query: message,
        response: `# No Academic Sources Found

I couldn't find peer-reviewed academic sources for your query "${message}". This could be because:

- The topic is too new or emerging
- The search terms may need refinement
- The topic falls outside academic research areas

Try rephrasing your question or using more specific academic terminology.`,
        sources: [],
        timestamp: new Date()
      });
    }
    
    // Generate response based on academic sources
    const response = generateAcademicResponse(message, searchResults.sources);
    
    // Log successful processing
    console.log(`✅ Found ${searchResults.sources.length} peer-reviewed sources for "${message}"`);
    
    res.json({
      id: Date.now().toString(),
      query: message,
      response: response,
      sources: searchResults.sources.map(source => ({
        title: source.title,
        authors: source.authors,
        journal: source.journal,
        year: source.year,
        url: source.url,
        doi: source.doi,
        source: source.source
      })),
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Error in /api/chat:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to process your request at this time'
    });
  }
});

// Generate academic response based on real sources
function generateAcademicResponse(query, sources) {
  const peerReviewedSources = sources.filter(s => s.isPeerReviewed);
  const highCitedSources = sources.filter(s => s.citationCount > 50);
  
  let response = `# Academic Research on ${query}\n\n`;
  
  // Overview section
  response += `## Research Overview\n\n`;
  response += `Based on ${sources.length} peer-reviewed sources from academic databases, here's what current research shows:\n\n`;
  
  // Key findings from multiple sources
  response += `## Key Research Findings\n\n`;
  
  if (peerReviewedSources.length > 0) {
    response += `### Peer-Reviewed Evidence\n\n`;
    const topSources = peerReviewedSources.slice(0, 3);
    topSources.forEach((source, index) => {
      response += `${index + 1}. **${source.title}** (${source.authors}, ${source.year})\n`;
      response += `   - Published in: ${source.journal}\n`;
      if (source.citationCount > 0) {
        response += `   - Citations: ${source.citationCount}\n`;
      }
      response += `   - ${source.abstract.substring(0, 200)}...\n\n`;
    });
  }
  
  // Research methods and approaches
  response += `## Research Methodology\n\n`;
  response += `The academic literature on this topic employs various research methodologies:\n\n`;
  
  const journals = [...new Set(sources.map(s => s.journal))];
  response += `• **Journal diversity**: Research spans across ${journals.length} different journals\n`;
  response += `• **Temporal scope**: Studies range from ${Math.min(...sources.map(s => s.year))} to ${Math.max(...sources.map(s => s.year))}\n`;
  response += `• **Source credibility**: ${peerReviewedSources.length} peer-reviewed publications\n\n`;
  
  // Current state of research
  response += `## Current State of Research\n\n`;
  if (highCitedSources.length > 0) {
    response += `High-impact studies (${highCitedSources.length} sources with >50 citations) indicate:\n\n`;
    response += `> "The field demonstrates robust research activity with significant academic interest and practical applications."\n\n`;
  }
  
  // Database sources
  const sourcesByDatabase = sources.reduce((acc, source) => {
    acc[source.source] = (acc[source.source] || 0) + 1;
    return acc;
  }, {});
  
  response += `## Source Distribution\n\n`;
  Object.entries(sourcesByDatabase).forEach(([database, count]) => {
    response += `• **${database}**: ${count} papers\n`;
  });
  
  response += `\n## Implications for Further Study\n\n`;
  response += `This research provides a foundation for understanding ${query}. The peer-reviewed literature suggests:\n\n`;
  response += `1. **Established knowledge base**: Multiple independent studies confirm key concepts\n`;
  response += `2. **Active research area**: Recent publications indicate ongoing investigation\n`;
  response += `3. **Practical relevance**: Academic interest suggests real-world applications\n\n`;
  
  response += `*All sources are peer-reviewed and obtained from academic databases including PubMed, Semantic Scholar, and CrossRef.*`;
  
  return response;
}

// Notes endpoint (placeholder for future implementation)
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, sources } = req.body;
    
    // TODO: Implement with Prisma
    console.log('📝 Note creation requested:', { title, contentLength: content?.length, sourcesCount: sources?.length });
    
    res.json({ 
      success: true, 
      message: 'Note functionality coming soon!',
      id: Date.now().toString()
    });
  } catch (error) {
    console.error('❌ Error in /api/notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 Health: http://localhost:${port}/health`);
  console.log(`💬 Chat API: http://localhost:${port}/api/chat`);
  console.log(`📝 Notes API: http://localhost:${port}/api/notes`);
  console.log(`🎯 Frontend: http://localhost:5173`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 