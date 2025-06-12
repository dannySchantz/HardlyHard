<!-- Learn.svelte -->
<script lang="ts">
  let userInput = "";
  let messages: { role: 'user' | 'assistant'; content: string }[] = [];
  let isLoading = false;

  async function handleSubmit() {
    if (!userInput.trim()) return;

    const newMessage = {
      role: 'user' as const,
      content: userInput
    };

    messages = [...messages, newMessage];
    const currentInput = userInput;
    userInput = "";
    isLoading = true;

    try {
      // TODO: Implement actual API call to backend
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      messages = [...messages, {
        role: 'assistant',
        content: "I'm currently in development, but I'll be able to help you understand complex scientific topics soon! For now, I can tell you that I'll be using peer-reviewed sources to explain things in a way that's easy to understand."
      }];
    } catch (error) {
      console.error('Error:', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
  <div class="bg-white shadow-xl rounded-lg overflow-hidden">
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Interactive Learning Session</h2>
      
      <div class="space-y-4 mb-4 h-96 overflow-y-auto">
        {#each messages as message}
          <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div
              class="max-w-sm rounded-lg px-4 py-2 {message.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'}"
            >
              {message.content}
            </div>
          </div>
        {/each}
        
        {#if isLoading}
          <div class="flex justify-start">
            <div class="max-w-sm rounded-lg px-4 py-2 bg-gray-100">
              <div class="flex space-x-2">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <form on:submit|preventDefault={handleSubmit} class="mt-4">
        <div class="flex space-x-4">
          <input
            type="text"
            bind:value={userInput}
            placeholder="Ask about any scientific topic..."
            class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  </div>
</div> 