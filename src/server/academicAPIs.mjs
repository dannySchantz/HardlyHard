import axios from 'axios';
import xml2js from 'xml2js';

// Semantic Scholar API (Free, comprehensive)
export class SemanticScholarAPI {
  constructor() {
    this.baseURL = 'https://api.semanticscholar.org/graph/v1';
  }
  
  async searchPapers(query, limit = 10) {
    try {
      const response = await axios.get(`${this.baseURL}/paper/search`, {
        params: {
          query,
          limit,
          fields: 'title,authors,journal,year,abstract,citationCount,externalIds,url'
        },
        timeout: 10000
      });

      if (!response.data.data) return [];

      return response.data.data.map(paper => ({
        id: paper.paperId,
        title: paper.title || 'Unknown Title',
        authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown Authors',
        journal: paper.journal?.name || 'Unknown Journal',
        year: paper.year || 0,
        doi: paper.externalIds?.DOI,
        url: paper.url || `https://semanticscholar.org/paper/${paper.paperId}`,
        abstract: paper.abstract?.substring(0, 500) || 'No abstract available',
        citationCount: paper.citationCount || 0,
        isPeerReviewed: !!paper.journal?.name,
        confidence: paper.citationCount ? Math.min(paper.citationCount / 100, 1) : 0.5,
        source: 'Semantic Scholar'
      }));
    } catch (error) {
      console.error('Semantic Scholar API error:', error.message);
      return [];
    }
  }
}

// PubMed API (Medical/Biological sciences)
export class PubMedAPI {
  constructor() {
    this.baseURL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  }
  
  async searchPapers(query, limit = 10) {
    try {
      // Step 1: Search for paper IDs
      const searchResponse = await axios.get(`${this.baseURL}/esearch.fcgi`, {
        params: {
          db: 'pubmed',
          term: query,
          retmax: limit,
          retmode: 'json'
        },
        timeout: 10000
      });

      const ids = searchResponse.data.esearchresult?.idlist;
      if (!ids || ids.length === 0) return [];

      // Step 2: Get paper details
      const detailsResponse = await axios.get(`${this.baseURL}/esummary.fcgi`, {
        params: {
          db: 'pubmed',
          id: ids.join(','),
          retmode: 'json'
        },
        timeout: 10000
      });

      const papers = detailsResponse.data.result;
      
      return ids.map(id => {
        const paper = papers[id];
        if (!paper) return null;
        
        return {
          id: paper.uid,
          title: paper.title || 'Unknown Title',
          authors: paper.authors?.map(a => a.name).join(', ') || 'Unknown Authors',
          journal: paper.fulljournalname || paper.source || 'PubMed',
          year: paper.pubdate ? new Date(paper.pubdate).getFullYear() : 0,
          doi: paper.articleids?.find(aid => aid.idtype === 'doi')?.value,
          url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
          abstract: 'Abstract available on PubMed',
          isPeerReviewed: true, // PubMed only contains peer-reviewed papers
          confidence: 0.9, // High confidence for PubMed
          source: 'PubMed'
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('PubMed API error:', error.message);
      return [];
    }
  }
}

// CrossRef API (DOI and citation data)
export class CrossRefAPI {
  constructor() {
    this.baseURL = 'https://api.crossref.org/works';
  }
  
  async searchPapers(query, limit = 10) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          query,
          rows: limit,
          select: 'title,author,published-print,DOI,URL,abstract,is-referenced-by-count,container-title'
        },
        timeout: 10000
      });

      const items = response.data.message?.items || [];
      
      return items.map(item => ({
        id: item.DOI || `crossref-${Date.now()}`,
        title: Array.isArray(item.title) ? item.title[0] : item.title || 'Unknown Title',
        authors: item.author?.map(a => `${a.given || ''} ${a.family || ''}`).join(', ') || 'Unknown Authors',
        journal: Array.isArray(item['container-title']) ? item['container-title'][0] : 'Unknown Journal',
        year: item['published-print']?.['date-parts']?.[0]?.[0] || 0,
        doi: item.DOI,
        url: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : ''),
        abstract: item.abstract?.substring(0, 500) || 'Abstract not available',
        citationCount: item['is-referenced-by-count'] || 0,
        isPeerReviewed: !!item['container-title'],
        confidence: item['is-referenced-by-count'] ? Math.min(item['is-referenced-by-count'] / 50, 1) : 0.7,
        source: 'CrossRef'
      }));
    } catch (error) {
      console.error('CrossRef API error:', error.message);
      return [];
    }
  }
}

// arXiv API (Physics, Math, Computer Science preprints)
export class ArXivAPI {
  constructor() {
    this.baseURL = 'http://export.arxiv.org/api/query';
  }
  
  async searchPapers(query, limit = 10) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          search_query: `all:${query}`,
          start: 0,
          max_results: limit
        },
        timeout: 10000
      });

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      const entries = result.feed?.entry || [];

      if (!Array.isArray(entries)) {
        return entries ? [this.parseArxivEntry(entries)] : [];
      }

      return entries.map(entry => this.parseArxivEntry(entry));
    } catch (error) {
      console.error('arXiv API error:', error.message);
      return [];
    }
  }

  parseArxivEntry(entry) {
    return {
      id: Array.isArray(entry.id) ? entry.id[0] : entry.id,
      title: (Array.isArray(entry.title) ? entry.title[0] : entry.title)?.replace(/\s+/g, ' ').trim() || 'Unknown Title',
      authors: entry.author ? 
        (Array.isArray(entry.author) ? entry.author : [entry.author])
          .map(a => Array.isArray(a.name) ? a.name[0] : a.name)
          .join(', ') : 'Unknown Authors',
      journal: 'arXiv (Preprint)',
      year: new Date(Array.isArray(entry.published) ? entry.published[0] : entry.published).getFullYear(),
      doi: entry.doi ? (Array.isArray(entry.doi) ? entry.doi[0] : entry.doi) : null,
      url: Array.isArray(entry.id) ? entry.id[0] : entry.id,
      abstract: (Array.isArray(entry.summary) ? entry.summary[0] : entry.summary)?.replace(/\s+/g, ' ').trim().substring(0, 500) || 'No abstract available',
      isPeerReviewed: false, // arXiv contains preprints, not peer-reviewed
      confidence: 0.6, // Medium confidence for preprints
      source: 'arXiv'
    };
  }
}

// Main Academic Search Service
export class AcademicSearchService {
  constructor() {
    this.semanticScholar = new SemanticScholarAPI();
    this.pubmed = new PubMedAPI();
    this.arxiv = new ArXivAPI();
    this.crossref = new CrossRefAPI();
  }

  async searchAllSources(query, limit = 12) {
    console.log(`🔍 Searching academic databases for: "${query}"`);
    
    const searchTerms = this.extractSearchTerms(query);
    const limitPerSource = Math.ceil(limit / 3); // Divide among 3 main sources (excluding arXiv for peer-review focus)
    
    // Search multiple APIs in parallel
    const searchPromises = [
      this.semanticScholar.searchPapers(searchTerms[0], limitPerSource),
      this.pubmed.searchPapers(searchTerms[0], limitPerSource),
      this.crossref.searchPapers(searchTerms[0], limitPerSource)
    ];

    try {
      const results = await Promise.allSettled(searchPromises);
      const allSources = results
        .filter(result => result.status === 'fulfilled')
        .flatMap(result => result.value);
      
      console.log(`📚 Found ${allSources.length} total papers from academic databases`);
      
      // Remove duplicates and sort by confidence/peer-review status
      const uniqueSources = this.removeDuplicates(allSources);
      const validSources = uniqueSources.filter(source => this.validateSource(source).isValid);
      const sortedSources = validSources
        .sort((a, b) => {
          // Prioritize peer-reviewed papers
          if (a.isPeerReviewed && !b.isPeerReviewed) return -1;
          if (!a.isPeerReviewed && b.isPeerReviewed) return 1;
          // Then sort by confidence
          return b.confidence - a.confidence;
        })
        .slice(0, limit);

      console.log(`✅ Returning ${sortedSources.length} validated peer-reviewed sources`);

      return {
        sources: sortedSources,
        totalCount: uniqueSources.length,
        searchTerms
      };
    } catch (error) {
      console.error('Academic search error:', error);
      return {
        sources: [],
        totalCount: 0,
        searchTerms
      };
    }
  }

  extractSearchTerms(query) {
    // Extract key terms from the query
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const terms = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(term => term.length > 2 && !stopWords.includes(term));
    
    // Return the original query if no good terms found
    return terms.length > 0 ? [terms.join(' ')] : [query];
  }

  removeDuplicates(sources) {
    const seen = new Set();
    return sources.filter(source => {
      // Use DOI as primary key, fall back to title
      const key = source.doi || source.title.toLowerCase().substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  validateSource(source) {
    const reasons = [];
    
    if (!source.title || source.title === 'Unknown Title') {
      reasons.push('Missing title');
    }
    
    if (!source.authors || source.authors === 'Unknown Authors') {
      reasons.push('Missing authors');
    }
    
    if (source.year < 1990) {
      reasons.push('Publication too old');
    }
    
    if (!source.url) {
      reasons.push('No access link');
    }

    return {
      isValid: reasons.length === 0,
      reasons
    };
  }
} 