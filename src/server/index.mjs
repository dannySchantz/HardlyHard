import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { AcademicSearchService } from './academicAPIs.mjs';
import OpenAI from 'openai';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const academicService = new AcademicSearchService();
const port = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

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

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin Authentication Middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    authenticateToken(req, res, async () => {
      // Then check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { isAdmin: true }
      });
      
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      next();
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path} - ${req.ip}`);
  console.log(`📋 Headers:`, req.headers.origin, req.headers['user-agent']?.substring(0, 50));
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
    const { message, userId, conversationContext } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`🔍 Processing academic query: "${message}" for user: ${userId || 'anonymous'}`);
    
    let allSources = [];
    let isFollowUp = false;
    
    // Handle conversation context for follow-up questions
    if (conversationContext && conversationContext.existingSources.length > 0) {
      console.log(`💬 Follow-up question detected. Using ${conversationContext.existingSources.length} existing sources`);
      isFollowUp = true;
      allSources = conversationContext.existingSources;
      
      // For follow-up questions, search for additional relevant sources (smaller search)
      try {
        const additionalResults = await academicService.searchAllSources(message, 4);
        if (additionalResults.sources.length > 0) {
          console.log(`📚 Found ${additionalResults.sources.length} additional sources for follow-up`);
          // Merge new sources with existing ones, avoiding duplicates
          const existingDOIs = new Set(allSources.map(s => s.doi).filter(Boolean));
          const newSources = additionalResults.sources.filter(s => !existingDOIs.has(s.doi));
          allSources = [...allSources, ...newSources];
        }
      } catch (error) {
        console.log(`⚠️ Additional search failed for follow-up, using existing sources: ${error.message}`);
      }
    } else {
      // First question in conversation - do full search
      console.log(`🆕 New conversation - searching academic databases`);
      const searchResults = await academicService.searchAllSources(message, 8);
      allSources = searchResults.sources;
    }
    
    if (allSources.length === 0) {
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
    
    // Generate AI response based on academic sources
    const response = await generateAIResponse(message, allSources, conversationContext, isFollowUp);
    
    // Log successful processing
    console.log(`✅ Found ${allSources.length} peer-reviewed sources for "${message}"`);
    
    res.json({
      id: Date.now().toString(),
      query: message,
      response: response,
      sources: allSources.map(source => ({
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

// Streaming chat endpoint for real-time AI responses
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { message, userId, conversationContext } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    console.log(`🔍 Processing streaming query: "${message}" for user: ${userId || 'anonymous'}`);
    
    let allSources = [];
    let isFollowUp = false;
    
    // Handle conversation context for follow-up questions
    if (conversationContext && conversationContext.existingSources.length > 0) {
      console.log(`💬 Follow-up question detected. Using ${conversationContext.existingSources.length} existing sources`);
      isFollowUp = true;
      allSources = conversationContext.existingSources;
      
      // For follow-up questions, search for additional relevant sources (smaller search)
      try {
        const additionalResults = await academicService.searchAllSources(message, 4);
        if (additionalResults.sources.length > 0) {
          console.log(`📚 Found ${additionalResults.sources.length} additional sources for follow-up`);
          // Merge new sources with existing ones, avoiding duplicates
          const existingDOIs = new Set(allSources.map(s => s.doi).filter(Boolean));
          const newSources = additionalResults.sources.filter(s => !existingDOIs.has(s.doi));
          allSources = [...allSources, ...newSources];
        }
      } catch (error) {
        console.log(`⚠️ Additional search failed for follow-up, using existing sources: ${error.message}`);
      }
    } else {
      // First question in conversation - do full search
      console.log(`🆕 New conversation - searching academic databases`);
      const searchResults = await academicService.searchAllSources(message, 8);
      allSources = searchResults.sources;
    }

    if (allSources.length === 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'No academic sources found' })}\n\n`);
      res.end();
      return;
    }

    // Send sources first
    const conversationId = Date.now().toString();
    res.write(`data: ${JSON.stringify({ 
      type: 'init', 
      id: conversationId,
      query: message,
      sources: allSources.map(source => ({
        title: source.title,
        authors: source.authors,
        journal: source.journal,
        year: source.year,
        url: source.url,
        doi: source.doi,
        source: source.source
      }))
    })}\n\n`);

    // Generate streaming AI response
    await generateStreamingAIResponse(res, message, allSources, conversationContext, isFollowUp);
    
    console.log(`✅ Streaming response completed for "${message}"`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('❌ Error in streaming chat:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Internal server error' })}\n\n`);
    res.end();
  }
});

// Generate AI-powered response based on real academic sources
async function generateAIResponse(query, sources, conversationContext = null, isFollowUp = false) {
  try {
    // Prepare source context for AI
    const sourceContext = sources.slice(0, 6).map((source, index) => `
[${index + 1}] ${source.title}
Authors: ${source.authors}
Journal: ${source.journal} (${source.year})
${source.citationCount ? `Citations: ${source.citationCount}` : ''}
Abstract: ${source.abstract}
DOI: ${source.doi}
Source: ${source.source}
---`).join('\n');

    // Build conversation-aware prompt
    let prompt;
    
    if (isFollowUp && conversationContext) {
      const previousQuestionsText = conversationContext.previousQuestions.join('", "');
      prompt = `You are an academic research assistant continuing a conversation with a student. 

CONVERSATION CONTEXT:
Previous questions: "${previousQuestionsText}"

The student is now asking a follow-up question: "${query}"

I have ${sources.length} peer-reviewed academic sources available (some from our previous discussion, some newly found). Please provide a conversational response that:

1. **Builds on our previous discussion** naturally
2. **Directly addresses the follow-up question** 
3. **References previous findings** when relevant
4. **Integrates new information** seamlessly
5. **Maintains conversational flow** while being educational
6. **Uses "we discussed" or "as mentioned earlier"** for continuity

Format your response in Markdown. Use [1], [2] citations for sources. Make it feel like a natural continuation of our academic discussion.

ACADEMIC SOURCES:
${sourceContext}

Continue our conversation by answering their follow-up question while building on what we've already discussed.`;
    } else {
      prompt = `You are an academic research assistant. A student has asked: "${query}"

I have found ${sources.length} peer-reviewed academic sources relevant to this question. Please provide a comprehensive, intelligent response that:

1. **Synthesizes information** from the provided sources
2. **Explains key concepts** clearly for a learning context
3. **Highlights important findings** and their implications
4. **Uses proper academic tone** but remains accessible
5. **References specific studies** when making claims
6. **Organizes information** logically with clear sections

Format your response in Markdown with headers and bullet points. Always cite sources by referencing them as [1], [2], etc. corresponding to the source numbers below.

ACADEMIC SOURCES:
${sourceContext}

Provide a thorough, educational response that helps the student understand this topic based on the latest peer-reviewed research.`;
    }

    console.log('🤖 Generating AI response with OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert academic research assistant. Provide thorough, well-structured educational content based on peer-reviewed sources. Always cite sources using [1], [2] format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: false // We'll handle streaming in a separate endpoint
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('✅ AI response generated successfully');
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ Error generating AI response:', error);
    
    // Fallback to simple formatting if AI fails
    const papersList = sources.slice(0, 3).map((source, index) => `
**${index + 1}. ${source.title}**  
*${source.authors} (${source.year})*  
Published in: ${source.journal}  
${source.citationCount ? `Citations: ${source.citationCount}` : ''}

${source.abstract.substring(0, 300)}...
`).join('\n');

    const fallbackResponse = isFollowUp 
      ? `# Follow-up: ${query}

Building on our previous discussion, here are additional insights from ${sources.length} academic sources:

## Key Research Papers

${papersList}

## Research Context

This topic has been studied across ${sources.length} academic sources from databases including PubMed, Semantic Scholar, and CrossRef. The research spans from ${Math.min(...sources.map(s => s.year))} to ${Math.max(...sources.map(s => s.year))}.

*Note: AI synthesis temporarily unavailable. Please refer to the individual sources above for detailed insights.*`
      : `# Academic Research: ${query}

Based on ${sources.length} peer-reviewed sources, here are the key findings:

## Key Research Papers

${papersList}

## Research Context

This topic has been studied across ${sources.length} academic sources from databases including PubMed, Semantic Scholar, and CrossRef. The research spans from ${Math.min(...sources.map(s => s.year))} to ${Math.max(...sources.map(s => s.year))}.

*Note: AI synthesis temporarily unavailable. Please refer to the individual sources above for detailed insights.*`;

    return fallbackResponse;
  }
}

// Generate streaming AI response using OpenAI's streaming API
async function generateStreamingAIResponse(res, query, sources, conversationContext = null, isFollowUp = false) {
  try {
    // Prepare source context for AI
    const sourceContext = sources.slice(0, 6).map((source, index) => `
[${index + 1}] ${source.title}
Authors: ${source.authors}
Journal: ${source.journal} (${source.year})
${source.citationCount ? `Citations: ${source.citationCount}` : ''}
Abstract: ${source.abstract}
DOI: ${source.doi}
Source: ${source.source}
---`).join('\n');

    // Build conversation-aware prompt
    let prompt;
    
    if (isFollowUp && conversationContext) {
      const previousQuestionsText = conversationContext.previousQuestions.join('", "');
      prompt = `You are an academic research assistant continuing a conversation with a student. 

CONVERSATION CONTEXT:
Previous questions: "${previousQuestionsText}"

The student is now asking a follow-up question: "${query}"

I have ${sources.length} peer-reviewed academic sources available (some from our previous discussion, some newly found). Please provide a conversational response that:

1. **Builds on our previous discussion** naturally
2. **Directly addresses the follow-up question** 
3. **References previous findings** when relevant
4. **Integrates new information** seamlessly
5. **Maintains conversational flow** while being educational
6. **Uses "we discussed" or "as mentioned earlier"** for continuity

Format your response in Markdown. Use [1], [2] citations for sources. Make it feel like a natural continuation of our academic discussion.

ACADEMIC SOURCES:
${sourceContext}

Continue our conversation by answering their follow-up question while building on what we've already discussed.`;
    } else {
      prompt = `You are an academic research assistant. A student has asked: "${query}"

I have found ${sources.length} peer-reviewed academic sources relevant to this question. Please provide a comprehensive, intelligent response that:

1. **Synthesizes information** from the provided sources
2. **Explains key concepts** clearly for a learning context
3. **Highlights important findings** and their implications
4. **Uses proper academic tone** but remains accessible
5. **References specific studies** when making claims
6. **Organizes information** logically with clear sections

Format your response in Markdown with headers and bullet points. Always cite sources by referencing them as [1], [2], etc. corresponding to the source numbers below.

ACADEMIC SOURCES:
${sourceContext}

Provide a thorough, educational response that helps the student understand this topic based on the latest peer-reviewed research.`;
    }

    console.log('🌊 Starting streaming AI response with OpenAI...');
    
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert academic research assistant. Provide thorough, well-structured educational content based on peer-reviewed sources. Always cite sources using [1], [2] format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // Send each chunk to the client
        res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
      }
    }

    console.log('✅ Streaming AI response completed');
    
  } catch (error) {
    console.error('❌ Error generating streaming AI response:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'AI streaming failed' })}\n\n`);
  }
}

// ==============================================
// ADMIN ENDPOINTS
// ==============================================

// Get all users (Admin only)
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            notes: true,
            sessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all notes (Admin only)
app.get('/api/admin/notes', authenticateAdmin, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ notes });
  } catch (error) {
    console.error('Error fetching all notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Update user admin status (Admin only)
app.patch('/api/admin/users/:id/admin', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true
      }
    });
    
    res.json({ user });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Get system statistics (Admin only)
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.note.count(),
      prisma.note.count({ where: { isAIGenerated: true } }),
      prisma.note.count({ where: { isRecentlyUpdated: true } })
    ]);
    
    res.json({
      totalUsers: stats[0],
      adminUsers: stats[1],
      totalNotes: stats[2],
      aiGeneratedNotes: stats[3],
      recentlyUpdatedNotes: stats[4]
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==============================================
// AUTHENTICATION ENDPOINTS
// ==============================================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==============================================
// NOTES ENDPOINTS
// ==============================================

// Get all notes for a user
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: 'desc' }
    });
    
    res.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create a new note (user-created)
app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const note = await prisma.note.create({
      data: {
        userId: req.user.userId,
        title,
        content,
        tags,
        isAIGenerated: false,
        isRecentlyUpdated: true
      }
    });
    
    res.status(201).json({ note });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// AI-generated note creation (from "Add to Notes" button)
app.post('/api/notes/ai-generate', authenticateToken, async (req, res) => {
  try {
    const { query, response, sources } = req.body;
    
    if (!query || !response) {
      return res.status(400).json({ error: 'Query and response are required' });
    }
    
    // Generate AI summary for the note
    const summaryPrompt = `Create a concise, well-structured note summarizing this academic discussion:

Query: ${query}

Academic Response: ${response}

Create a note that:
1. Has a clear, descriptive title
2. Summarizes key findings and insights
3. Highlights important academic sources
4. Is formatted for easy review and reference

Return ONLY the note content in markdown format.`;
    
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: summaryPrompt }],
      max_tokens: 1000,
      temperature: 0.3
    });
    
    const aiSummary = aiResponse.choices[0].message.content;
    
    // Extract title from the first heading or create one
    const titleMatch = aiSummary.match(/^#\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1] : `Notes: ${query.substring(0, 50)}...`;
    
    const note = await prisma.note.create({
      data: {
        userId: req.user.userId,
        title,
        content: aiSummary,
        summary: `AI-generated summary from query: "${query}"`,
        isAIGenerated: true,
        isRecentlyUpdated: true,
        relatedQuery: query,
        relatedSources: sources || null,
        tags: ['ai-generated', 'academic']
      }
    });
    
    res.status(201).json({ note });
  } catch (error) {
    console.error('Error creating AI note:', error);
    res.status(500).json({ error: 'Failed to create AI-generated note' });
  }
});

// Update a note
app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    
    // Verify note belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const note = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        tags,
        isRecentlyUpdated: true
      }
    });
    
    res.json({ note });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify note belongs to user
    const existingNote = await prisma.note.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    await prisma.note.delete({
      where: { id }
    });
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Mark note as read (remove "recently updated" flag)
app.patch('/api/notes/:id/mark-read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const note = await prisma.note.updateMany({
      where: { id, userId: req.user.userId },
      data: { isRecentlyUpdated: false }
    });
    
    if (note.count === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({ message: 'Note marked as read' });
  } catch (error) {
    console.error('Error marking note as read:', error);
    res.status(500).json({ error: 'Failed to mark note as read' });
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