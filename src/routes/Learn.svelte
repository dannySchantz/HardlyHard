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

    // If current chat has conversations and user is asking a new question, start a new chat
    if (activeChat && activeChat.conversations.length > 0) {
      startNewChat();
    }

    try {
      // Make actual API call to backend with peer-reviewed sources
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          userId: 'user-123' // TODO: Replace with actual user ID
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the real response to the active chat
      const newConversation: Conversation = {
        id: data.id,
        query: data.query,
        response: data.response,
        sources: data.sources,
        timestamp: new Date(data.timestamp)
      };

      // Update the active chat with new conversation and summary
      chatSessions = chatSessions.map(chat => 
        chat.id === activeChatId ? {
          ...chat,
          conversations: [...chat.conversations, newConversation],
          summary: chat.summary || generateSummary(currentInput),
          title: chat.summary || generateSummary(currentInput)
        } : chat
      );

    } catch (error) {
      console.error('Error fetching response:', error);
      
      // Fallback to mock response if API fails
      const mockResponse: Conversation = {
        id: Date.now().toString(),
        query: currentInput,
        response: `# Error: Unable to fetch peer-reviewed sources

I'm currently unable to connect to the academic databases to provide you with peer-reviewed research on "${currentInput}". 

## What this means:
• The academic API services may be temporarily unavailable
• Your internet connection might be interrupted
• The server might be experiencing high load

## What you can do:
• Try your question again in a few moments
• Check your internet connection
• Contact support if the issue persists

I apologize for the inconvenience. The system is designed to only provide information from verified peer-reviewed sources, so I cannot provide a general response without proper citations.`,
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

  async function addToNotes(conversation: Conversation) {
    // TODO: Implement note-taking functionality
    // This will create or update notes with summarized content
    const noteContent = {
      title: `Notes: ${conversation.query}`,
      summary: `Key insights from research on ${conversation.query}`,
      content: conversation.response,
      sources: conversation.sources,
      createdAt: new Date()
    };
    
    console.log('Adding to notes:', noteContent);
    alert('Note added! (Feature in development)');
  }
</script>

<div class="max-w-6xl mx-auto py-10 px-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
            </div>
          </div>
          
          <!-- Sources -->
          {#if conversation.sources.length > 0}
            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 class="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">Sources</h4>
              <div class="space-y-2">
                {#each conversation.sources as source}
                  <div class="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                    <p class="font-medium text-gray-900 dark:text-gray-100">{source.title}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{source.authors} • {source.journal} • {source.year}</p>
                    <a href={source.url} target="_blank" class="text-primary-600 dark:text-primary-400 text-sm hover:underline">
                      {source.url}
                    </a>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Add to Notes Button -->
          <div class="mt-4 flex justify-end">
            <button
              on:click={() => addToNotes(conversation)}
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900 dark:text-primary-400 dark:hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add to Notes
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
            <span class="text-gray-600 dark:text-gray-400">Searching peer-reviewed sources...</span>
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