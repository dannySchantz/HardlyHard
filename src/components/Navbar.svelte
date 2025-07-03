<!-- Navbar.svelte -->
<script lang="ts">
  import { Link } from "svelte-routing";
  import { onMount } from 'svelte';
  
  let isMenuOpen = false;
  
  let isDark = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  function updateTheme() {
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark');
      isDark = true;
    } else {
      document.documentElement.classList.remove('dark');
      isDark = false;
    }
  }

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }

  onMount(() => {
    updateTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
  });
</script>

<nav class="bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-800">
  <div class="max-auto">
    <div class="flex h-16 items-center w-full">
      <!-- Left: Logo -->
      <div class="flex-1 flex items-center">
        <Link to="/" class="ml-4 text-2xl font-bold text-primary-600 dark:text-primary-400">HardlyHard</Link>
      </div>
      <!-- Center: Menu or Mobile Icon -->
      <div class="flex justify-center items-center flex-[2]">
        <!-- Desktop Menu -->
        <div class="hidden sm:flex items-center">
          {#if isDark}
          <Link
            to="/"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-600 font-bold"
          >
            Home
          </Link>
          {:else}
          <Link
            to="/"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-900 hover:text-primary-600 font-bold"
          >
            Home
          </Link>
          {/if}
          {#if isDark}
          <Link
            to="/learn"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-600 font-bold"
          >
            Learn
          </Link>
          {:else}
          <Link
            to="/learn"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-900 hover:text-primary-600 font-bold"
          >
            Learn
          </Link>
          {/if}
          {#if isDark}
          <Link
            to="/notes"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-600 font-bold"
          >
            Notes
          </Link>
          {:else}
          <Link
            to="/notes"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-900 hover:text-primary-600 font-bold"
          >
            Notes
          </Link>
          {/if}
          {#if isDark}
          <Link
            to="/profile"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-100 hover:text-primary-600 font-bold"
          >
            Profile
          </Link>
          {:else}
          <Link
            to="/profile"
            class="inline-flex items-center px-4 py-1 text-sm font-medium text-gray-900 hover:text-primary-600 font-bold"
          >
            Profile
          </Link>
          {/if}
        </div>
        <!-- Mobile Menu Icon -->
        <div class="sm:hidden flex items-center justify-center">
          <button
            type="button"
            class="bg-white dark:bg-gray-900 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-controls="mobile-menu"
            aria-expanded="false"
            on:click={toggleMenu}
          >
            <span class="sr-only">Open main menu</span>
            <svg
              class="h-6 w-6 text-gray-900 dark:text-gray-100"
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
      <!-- Right: Actions -->
      <div class="flex-1 flex justify-end items-center">
          {#if isDark}
            <button
            class="bg-white dark:bg-gray-900 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 mr-4"
            on:click={toggleTheme}
            aria-label="Toggle dark mode"
          >
            <svg xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-100"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
          </button> 
          {:else}
            <button
              class="bg-white dark:bg-gray-900 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 mr-4"
              on:click={toggleTheme}
              aria-label="Toggle dark mode"
            >
            <svg xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-gray-900"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none"/>
              <path stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
            </button>
          {/if}
      </div>
    </div>
  </div>

  {#if isMenuOpen}
    <div class="sm:hidden bg-white dark:bg-gray-900" id="mobile-menu">
      <div class="pt-2 pb-3 space-y-1 flex flex-col items-center justify-center">
        <Link
          to="/"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
        >
          Home
        </Link>
        <Link
          to="/learn"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
        >
          Learn
        </Link>
        <Link
          to="/profile"
          class="rounded block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
        >
          Profile
        </Link>
      </div>
    </div>
  {/if}
</nav> 