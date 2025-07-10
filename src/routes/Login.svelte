<!-- Beautiful Login Page -->
<script lang="ts">
  import { navigate } from 'svelte-routing';
  
  let email = '';
  let password = '';
  let isLoading = false;
  let error = '';
  let showPassword = false;
  
  async function handleLogin() {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token and user info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Trigger auth state update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_token',
        newValue: data.token
      }));
      
      // Navigate to Learn page
      navigate('/learn');
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      isLoading = false;
    }
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
  <div class="max-w-md w-full space-y-8">
    
    <!-- Header -->
    <div class="text-center">
      <div class="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
        <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.168 18.477 18.582 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      </div>
      <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h2>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Sign in to your HardlyHard account
      </p>
    </div>

    <!-- Login Form -->
    <div class="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
      <form on:submit|preventDefault={handleLogin} class="space-y-6">
        
        {#if error}
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="ml-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        {/if}

        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter your email"
          />
        </div>

        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div class="relative">
                         {#if showPassword}
               <input
                 id="password"
                 type="text"
                 bind:value={password}
                 required
                 class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Enter your password"
               />
             {:else}
               <input
                 id="password"
                 type="password"
                 bind:value={password}
                 required
                 class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                 placeholder="Enter your password"
               />
             {/if}
            <button
              type="button"
              on:click={() => showPassword = !showPassword}
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {#if showPassword}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                </svg>
              {:else}
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {#if isLoading}
              <svg class="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            {:else}
              Sign in
            {/if}
          </button>
        </div>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Don't have an account?</span>
          </div>
        </div>

        <!-- Register Link -->
        <div class="text-center">
          <a 
            href="/register"
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200"
          >
            Create new account
          </a>
        </div>
      </form>
    </div>

    <!-- Back to Home -->
    <div class="text-center">
      <a 
        href="/"
        class="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Back to Home
      </a>
    </div>
  </div>
</div> 