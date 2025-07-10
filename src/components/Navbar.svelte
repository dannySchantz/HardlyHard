<!-- Navbar.svelte -->
<script lang="ts">
  import { Link } from "svelte-routing";
  import { onMount } from 'svelte';
  import { navigate } from 'svelte-routing';
  
  let isMenuOpen = false;
  let isProfileMenuOpen = false;
  let user: any = null;
  let isAuthenticated = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function toggleProfileMenu() {
    isProfileMenuOpen = !isProfileMenuOpen;
  }

  // Close profile menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (isProfileMenuOpen && event.target instanceof Element && !event.target.closest('.profile-menu-container')) {
      isProfileMenuOpen = false;
    }
  }

  function checkAuthState() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        user = JSON.parse(userData);
        isAuthenticated = true;
      } catch (e) {
        // Invalid user data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        user = null;
        isAuthenticated = false;
      }
    } else {
      user = null;
      isAuthenticated = false;
    }
  }

  function handleSignOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    user = null;
    isAuthenticated = false;
    isProfileMenuOpen = false;
    navigate('/');
  }

  function handleSignIn() {
    isProfileMenuOpen = false;
    navigate('/login');
  }

  function handleSignUp() {
    isProfileMenuOpen = false;
    navigate('/register');
  }

  // Set app to always use dark mode
  onMount(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
    
    // Check initial auth state
    checkAuthState();
    
    // Listen for storage changes (for login/logout across tabs)
    window.addEventListener('storage', checkAuthState);
    
    // Listen for clicks outside profile menu
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      window.removeEventListener('storage', checkAuthState);
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Get display name for user
  $: displayName = user?.name || user?.email?.split('@')[0] || 'User';
</script>

<nav class="fixed top-0 w-full z-50 bg-gray-900/80 backdrop-blur-md shadow-lg shadow-gray-800 border-b border-gray-700/30">
  <div class="max-auto">
    <div class="flex h-16 items-center w-full">
      <!-- Left: Logo -->
      <div class="flex-1 flex items-center">
        <Link to="/" class="ml-4 text-2xl font-bold text-primary-400 hover:text-primary-300">HardlyHard</Link>
      </div>
      
      <!-- Center: Menu or Mobile Icon -->
      <div class="flex justify-center items-center flex-[2]">
        <!-- Desktop Menu -->
        <div class="hidden sm:flex items-center">
          <Link
            to="/"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-400 font-bold">
            Home
          </Link>

          <Link
            to="/learn"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-400 font-bold">
            Learn
          </Link>

          <Link
            to="/notes"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-400 font-bold">
            Notes
          </Link>
        </div>
        
        <!-- Mobile Menu Icon -->
        <div class="sm:hidden flex items-center justify-center">
          <button
            type="button"
            class="bg-gray-900 inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:bg-gray-800"
            aria-controls="mobile-menu"
            aria-expanded="false"
            on:click={toggleMenu}
          >
            <span class="sr-only">Open main menu</span>
            <svg
              class="h-6 w-6 text-gray-100"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Right: User Profile Menu -->
      <div class="flex-1 flex justify-end items-center">
        <div class="relative profile-menu-container">
          <!-- Profile Button -->
          <button
            class="bg-gray-900 inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:bg-gray-800 mr-4 transition-colors"
            on:click={toggleProfileMenu}
            aria-label="User menu"
          >
            {#if isAuthenticated}
              <!-- Logged in: Show user avatar -->
              <div class="flex items-center space-x-2">
                <div class="w-8 h-8 bg-primary-400 rounded-full flex items-center justify-center">
                  <span class="text-sm font-bold text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                {#if user?.isAdmin}
                  <span class="w-2 h-2 bg-yellow-400 rounded-full" title="Admin"></span>
                {/if}
              </div>
            {:else}
              <!-- Not logged in: Show user icon -->
              <svg class="h-6 w-6 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            {/if}
          </button>

          <!-- Dropdown Menu -->
          {#if isProfileMenuOpen}
            <div class="absolute right-0 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 mt-2">
              {#if isAuthenticated}
                <!-- Logged in menu -->
                <div class="px-4 py-3 border-b border-gray-700">
                  <p class="text-sm font-medium text-gray-100">{displayName}</p>
                  <p class="text-xs text-gray-400">{user?.email}</p>
                  {#if user?.isAdmin}
                    <span class="inline-block mt-1 px-2 py-0.5 text-xs bg-yellow-600 text-yellow-100 rounded">Admin</span>
                  {/if}
                </div>
                
                <div>
                  <Link
                    to="/profile"
                    class="block px-4 py-2 text-sm text-gray-100 hover:text-primary-400 hover:bg-gray-700 transition-colors"
                    on:click={() => isProfileMenuOpen = false}
                  >
                    Profile
                  </Link>
                  
                  <Link
                    to="/notes"
                    class="block px-4 py-2 text-sm text-gray-100 hover:text-primary-400 hover:bg-gray-700 transition-colors"
                    on:click={() => isProfileMenuOpen = false}
                  >
                    My Notes
                  </Link>
                  
                  {#if user?.isAdmin}
                    <div class="border-t border-gray-700">
                      <button
                        class="w-full justify-center block px-4 py-2 text-sm text-yellow-300 hover:bg-gray-700 transition-colors"
                        on:click={() => {
                          isProfileMenuOpen = false;
                          // TODO: Navigate to admin dashboard
                          alert('Admin dashboard coming soon!');
                        }}
                      >
                        Admin Panel
                      </button>
                    </div>
                  {/if}
                  
                  <div>
                    <button
                      class="w-full justify-center px-4 py-2 bg-gray-800 border-none block text-sm text-gray-100 hover:bg-gray-700 hover:text-primary-400 transition-colors rounded-none"
                      on:click={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              {:else}
                <!-- Not logged in menu -->
                <div class="py-1">
                  <button
                    class="block w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-gray-700 transition-colors"
                    on:click={handleSignIn}
                  >
                    Sign In
                  </button>
                  
                  <button
                    class="block w-full text-left px-4 py-2 text-sm text-primary-400 hover:bg-gray-700 transition-colors"
                    on:click={handleSignUp}
                  >
                    Sign Up
                  </button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  {#if isMenuOpen}
    <div class="sm:hidden bg-gray-900/80 backdrop-blur-md border-b border-gray-700/30" id="mobile-menu">
      <div class="pt-2 pb-3 space-y-1 flex flex-col items-center justify-center">
        <Link
          to="/"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          on:click={() => isMenuOpen = false}
        >
          Home
        </Link>
        <Link
          to="/learn"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          on:click={() => isMenuOpen = false}
        >
          Learn
        </Link>
        <Link
          to="/notes"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          on:click={() => isMenuOpen = false}
        >
          Notes
        </Link>
        <Link
          to="/profile"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-800"
          on:click={() => isMenuOpen = false}
        >
          Profile
        </Link>
      </div>
    </div>
  {/if}
</nav> 