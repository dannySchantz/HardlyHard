<!-- Learn.svelte -->
<script lang="ts">
  type Conversation = {
    id: string;
    query: string; 
    response: string; 
    sources: { title: string; authors: string; journal: string; year: number; url: string; doi?: string; source?: string }[];
    timestamp: Date;
  };

  type ChatSession = {
    id: number;
    title: string;
    summary: string;
    conversations: Conversation[];
    isMinimized: boolean;
    createdAt: Date;
  };

  let userInput = "";
  let chatSessions: ChatSession[] = [];
  let activeChatId: number | null = null;
  let isLoading = false;
  let nextChatId = 1;
  
  // Streaming state
  let streamingConversationId: string | null = null;
  let streamedText: string = "";
  let isStreaming = false;
  let currentEventSource: EventSource | null = null;
  
  // Expandable sources state
  let expandedSources: Set<string> = new Set();
  
  // Add to Notes state
  let addingToNotes = false;

  // Helper function to generate short summary from query
  function generateSummary(query: string): string {
    const words = query.toLowerCase().split(' ');
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about'];
    const meaningfulWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    
    if (meaningfulWords.length >= 2) {
      return meaningfulWords.slice(0, 2).join(' ').substring(0, 15);
    } else if (meaningfulWords.length === 1) {
      return meaningfulWords[0].substring(0, 15);
    } else {
      return words.slice(0, 2).join(' ').substring(0, 15);
    }
  }

  // Toggle source expansion
  function toggleSourceExpansion(sourceId: string) {
    if (expandedSources.has(sourceId)) {
      expandedSources.delete(sourceId);
    } else {
      expandedSources.add(sourceId);
    }
    expandedSources = expandedSources; // Trigger reactivity
  }

  // Add conversation to notes
  async function addToNotes(conversation: any) {
    try {
      addingToNotes = true;
      
      // Check if user is authenticated
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        alert('Please log in to save notes.');
        return;
      }

      const response = await fetch('/api/notes/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: conversation.query,
          response: conversation.response,
          sources: conversation.sources
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Please log in to save notes.');
          return;
        }
        throw new Error('Failed to save note');
      }

      const data = await response.json();
      
      // Show success message
      alert('Note saved successfully! Check your Notes page to view it.');
      
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      addingToNotes = false;
    }
  }

  // Real-time streaming function
  async function startStreaming(conversationContext: any, currentInput: string) {
    isStreaming = true;
    streamedText = "";
    
    try {
      // Create EventSource for streaming
      const eventSourceUrl = new URL('/api/chat/stream', 'http://localhost:3000');
      
      // Since EventSource doesn't support POST, we'll use fetch with streaming
      const response = await fetch('http://localhost:3000/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          userId: 'user-123',
          conversationContext: conversationContext
        })
      });

      if (!response.body) {
        throw new Error('Streaming not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'init') {
                // Initialize conversation with sources
                streamingConversationId = data.id;
                const newConversation: Conversation = {
                  id: data.id,
                  query: data.query,
                  response: "",
                  sources: data.sources,
                  timestamp: new Date()
                };

                // Update chat with new conversation
                chatSessions = chatSessions.map(chat => 
                  chat.id === activeChatId ? {
                    ...chat,
                    conversations: [...chat.conversations, newConversation],
                    summary: chat.summary || generateSummary(currentInput),
                    title: chat.summary || generateSummary(currentInput)
                  } : chat
                );
                
              } else if (data.type === 'content') {
                // Append streamed content
                streamedText += data.content;
                
                // Update the conversation in real-time
                chatSessions = chatSessions.map(chat => ({
                  ...chat,
                  conversations: chat.conversations.map(conv => 
                    conv.id === streamingConversationId 
                      ? { ...conv, response: streamedText }
                      : conv
                  )
                }));
                
              } else if (data.type === 'done') {
                // Streaming complete
                isStreaming = false;
                streamingConversationId = null;
                streamedText = "";
                break;
                
              } else if (data.type === 'error') {
                console.error('Streaming error:', data.content);
                isStreaming = false;
                break;
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Streaming failed:', error);
      isStreaming = false;
      // Fall back to regular API call if streaming fails
      throw error;
    }
  }

  // Get active chat session
  $: activeChat = chatSessions.find(chat => chat.id === activeChatId);

  // Create new chat session
  function createNewChat(): ChatSession {
    const newChatId = nextChatId++;
    const newChat: ChatSession = {
      id: newChatId,
      title: `Research ${newChatId}`,
      summary: '',
      conversations: [],
      isMinimized: false,
      createdAt: new Date()
    };
    chatSessions = [...chatSessions, newChat];
    activeChatId = newChatId;
    return newChat;
  }

  // Switch to a specific chat
  function switchToChat(chatId: number) {
    // Stop any ongoing streaming
    if (isStreaming) {
      currentEventSource?.close();
      streamingConversationId = null;
      isStreaming = false;
      streamedText = "";
    }
    
    activeChatId = chatId;
    // Unminimize the chat
    chatSessions = chatSessions.map(chat => 
      chat.id === chatId ? { ...chat, isMinimized: false } : chat
    );
  }

  // Minimize current chat and prepare for new one
  function startNewChat() {
    if (activeChat && activeChat.conversations.length > 0) {
      // Minimize current chat
      chatSessions = chatSessions.map(chat => 
        chat.id === activeChatId ? { ...chat, isMinimized: true } : chat
      );
    }
    // Create new chat
    createNewChat();
  }

  async function handleSubmit() {
    if (!userInput.trim()) return;

    const currentInput = userInput;
    userInput = "";
    isLoading = true;

    // If no active chat exists, create one
    if (!activeChat) {
      createNewChat();
    }

    try {
      // Prepare conversation context for follow-up questions
      const conversationContext = activeChat && activeChat.conversations.length > 0 ? {
        previousQuestions: activeChat.conversations.map(conv => conv.query),
        existingSources: activeChat.conversations.flatMap(conv => conv.sources),
        conversationId: activeChat.id
      } : null;

      // Start real-time streaming
      await startStreaming(conversationContext, currentInput);

    } catch (error) {
      console.error('Error fetching response:', error);
      
      // Fallback to mock response if API fails
      const errorText = `# Error: Unable to fetch peer-reviewed sources

I'm currently unable to connect to the academic databases to provide you with peer-reviewed research on "${currentInput}". 

## What this means:
• The academic API services may be temporarily unavailable
• Your internet connection might be interrupted
• The server might be experiencing high load

## What you can do:
• Try your question again in a few moments
• Check your internet connection
• Contact support if the issue persists

I apologize for the inconvenience. The system is designed to only provide information from verified peer-reviewed sources, so I cannot provide a general response without proper citations.`;

      const mockResponse: Conversation = {
        id: Date.now().toString(),
        query: currentInput,
        response: errorText, // Add error text directly
        sources: [],
        timestamp: new Date()
      };
      
      // Add to active chat
      chatSessions = chatSessions.map(chat => 
        chat.id === activeChatId ? {
          ...chat,
          conversations: [...chat.conversations, mockResponse],
          summary: chat.summary || generateSummary(currentInput),
          title: chat.summary || generateSummary(currentInput)
        } : chat
      );
    } finally {
      isLoading = false;
    }
  }


</script>

<div class="max-w-6xl mx-auto py-10 px-10 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden">
  <div class="space-y-8 justify-center items-center">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Interactive Learning Session</h2>
    
    <!-- Chat Session Tabs -->
    {#if chatSessions.length > 0}
      <div class="flex flex-wrap gap-2 mb-6">
        {#each chatSessions as chatSession}
          <button
            on:click={() => switchToChat(chatSession.id)}
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 {
              chatSession.id === activeChatId 
                ? 'bg-primary-600 text-white shadow-md' 
                : chatSession.isMinimized 
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }"
          >
            {chatSession.title}
          </button>
        {/each}
        
        <!-- New Chat Button -->
        <button
          on:click={startNewChat}
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200 flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          New Chat
        </button>
      </div>
    {/if}
    
    <!-- Active Chat Conversations Display -->
    <div class="space-y-8">
      {#if activeChat && activeChat.conversations}
        {#each activeChat.conversations as conversation}
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <!-- User Query -->
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">Your Question:</h3>
            <p class="text-gray-700 dark:text-gray-300 italic">"{conversation.query}"</p>
          </div>
          
          <!-- AI Response -->
          <div class="prose prose-gray dark:prose-invert max-w-none">
            <div class="text-gray-900 dark:text-gray-100">
              {#if streamingConversationId === conversation.id && isStreaming}
                <!-- Show streaming animation -->
                <div class="relative">
                  {#each streamedText.split('\n') as line}
                    {#if line.startsWith('# ')}
                      <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{line.substring(2)}</h1>
                    {:else if line.startsWith('## ')}
                      <h2 class="text-xl font-semibold mb-3 mt-6 text-gray-900 dark:text-gray-100">{line.substring(3)}</h2>
                    {:else if line.startsWith('### ')}
                      <h3 class="text-lg font-medium mb-2 mt-4 text-gray-900 dark:text-gray-100">{line.substring(4)}</h3>
                    {:else if line.startsWith('• ') || line.startsWith('* ')}
                      <li class="ml-4 text-gray-700 dark:text-gray-300 mb-2">{@html line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                    {:else if line.match(/^\d+\. /)}
                      <li class="ml-4 text-gray-700 dark:text-gray-300 mb-2">{@html line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                    {:else if line.startsWith('> ')}
                      <blockquote class="border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{line.substring(2)}</blockquote>
                    {:else if line.trim() !== ''}
                      <p class="mb-3 text-gray-700 dark:text-gray-300">{@html line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                    {/if}
                  {/each}
                  <!-- Typing cursor -->
                  <span class="inline-block w-2 h-5 bg-primary-500 ml-1 animate-pulse"></span>
                </div>
              {:else}
                <!-- Show complete response -->
                {#each conversation.response.split('\n') as line}
                  {#if line.startsWith('# ')}
                    <h1 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{line.substring(2)}</h1>
                  {:else if line.startsWith('## ')}
                    <h2 class="text-xl font-semibold mb-3 mt-6 text-gray-900 dark:text-gray-100">{line.substring(3)}</h2>
                  {:else if line.startsWith('### ')}
                    <h3 class="text-lg font-medium mb-2 mt-4 text-gray-900 dark:text-gray-100">{line.substring(4)}</h3>
                  {:else if line.startsWith('• ') || line.startsWith('* ')}
                    <li class="ml-4 text-gray-700 dark:text-gray-300 mb-2">{@html line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                  {:else if line.match(/^\d+\. /)}
                    <li class="ml-4 text-gray-700 dark:text-gray-300 mb-2">{@html line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>
                  {:else if line.startsWith('> ')}
                    <blockquote class="border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{line.substring(2)}</blockquote>
                  {:else if line.trim() !== ''}
                    <p class="mb-3 text-gray-700 dark:text-gray-300">{@html line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
                  {/if}
                {/each}
              {/if}
            </div>
          </div>
          
          <!-- Sources -->
          {#if conversation.sources.length > 0}
            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Sources</h4>
              <div class="space-y-2">
                {#each conversation.sources as source, index}
                  {@const sourceId = `${conversation.id}-${index}`}
                  {@const isExpanded = expandedSources.has(sourceId)}
                  <button 
                    class="w-full text-left bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    on:click={() => toggleSourceExpansion(sourceId)}
                  >
                    <div class="flex items-start gap-3">
                      <!-- Source Number Badge -->
                      <div class="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                      
                      <!-- Source Content -->
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                          <p class="font-medium text-gray-900 dark:text-gray-100 {isExpanded ? '' : 'truncate'}" title={source.title}>
                            {source.title}
                          </p>
                          <!-- Expand/Collapse Icon -->
                          <svg class="flex-shrink-0 w-4 h-4 text-gray-400 ml-2 transform transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 {isExpanded ? '' : 'truncate'}" title="{source.authors} • {source.journal} • {source.year}">
                          {source.authors} • {source.journal} • {source.year}
                        </p>
                        
                                                 {#if isExpanded}
                           <!-- Expanded content -->
                           <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                             {#if source.doi}
                               <div class="mb-2">
                                 <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">DOI:</span>
                                 <span class="text-sm text-gray-700 dark:text-gray-300 ml-2">{source.doi}</span>
                               </div>
                             {/if}
                             
                             <div class="mb-2">
                               <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Source:</span>
                               <span class="text-sm text-gray-700 dark:text-gray-300 ml-2">{source.source || 'Academic Database'}</span>
                             </div>
                           </div>
                         {/if}
                        
                        <a href={source.url} target="_blank" class="text-primary-600 dark:text-primary-400 text-sm hover:underline block mt-2 {isExpanded ? '' : 'truncate'}" title={source.url} on:click|stopPropagation>
                          {source.url}
                        </a>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Add to Notes Button -->
          <div class="mt-4 flex justify-end">
            <button
              on:click={() => addToNotes(conversation)}
              disabled={addingToNotes}
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900 dark:text-primary-400 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {#if addingToNotes}
                <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              {:else}
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add to Notes
              {/if}
            </button>
          </div>
        </div>
        {/each}
      {/if}
      
      {#if isLoading}
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div class="flex items-center space-x-3">
            <div class="flex space-x-2">
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
            <span class="text-gray-600 dark:text-gray-400">🔍 Searching academic databases & analyzing research...</span>
          </div>
        </div>
      {:else if isStreaming}
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div class="flex items-center space-x-3">
            <div class="flex space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-green-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
            <span class="text-gray-600 dark:text-gray-400">🤖 AI is typing response...</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Input Form -->
    <form on:submit|preventDefault={handleSubmit} class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
      <div class="flex space-x-4">
        <input
          type="text"
          bind:value={userInput}
          placeholder="Ask about any scientific topic..."
          class="flex-1 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={isLoading}
          class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 dark:bg-primary-400 dark:hover:bg-primary-700"
        >
          {isLoading ? 'Searching...' : 'Send'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  /* Enhanced cursor blinking effect */
  input:focus {
    caret-color: #3b82f6;
    animation: blink-caret 1s step-end infinite;
  }
  
  @keyframes blink-caret {
    from, to { caret-color: transparent; }
    50% { caret-color: #3b82f6; }
  }
</style> 