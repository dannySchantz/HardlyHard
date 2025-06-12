<!-- Navbar.svelte -->
<script lang="ts">
  import { Link } from "svelte-routing";
  
  let isMenuOpen = false;
  
  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }
</script>

<nav class="bg-white shadow-lg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <Link to="/" class="text-2xl font-bold text-primary-600">HardlyHard</Link>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <Link to="/" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">Home</Link>
          <Link to="/learn" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">Learn</Link>
          <Link to="/profile" class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">Profile</Link>
        </div>
      </div>
      
      <div class="-mr-2 flex items-center sm:hidden">
        <button
          type="button"
          class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          aria-controls="mobile-menu"
          aria-expanded="false"
          on:click={toggleMenu}
        >
          <span class="sr-only">Open main menu</span>
          <svg
            class="h-6 w-6"
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
  </div>

  {#if isMenuOpen}
    <div class="sm:hidden" id="mobile-menu">
      <div class="pt-2 pb-3 space-y-1">
        <Link
          to="/"
          class="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        >
          Home
        </Link>
        <Link
          to="/learn"
          class="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        >
          Learn
        </Link>
        <Link
          to="/profile"
          class="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
        >
          Profile
        </Link>
      </div>
    </div>
  {/if}
</nav> 