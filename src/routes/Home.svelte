<!-- Home.svelte -->
<script lang="ts">
  import { Link } from "svelte-routing";
</script>

<div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
  <div class="text-center">
    <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
      <span class="block">Making Complex Knowledge</span>
      <span class="block text-primary-600">Simple and Accessible</span>
    </h1>
    <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
      Difficult to understand research and patents converted into simple, actionable, and teachable information.
    </p>
    <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
      <div class="rounded-md shadow">
        <Link
          to="/learn"
          class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
        >
          Start Learning
        </Link>
      </div>
      <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
        <a
          href="#features"
          class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
        >
          Learn More
        </a>
      </div>
    </div>
  </div>

  <div id="features" class="mt-24">
    <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      <div class="pt-6">
        <div class="flow-root bg-gray-50 rounded-lg px-6 pb-8">
          <div class="-mt-6">
            <div class="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">Scientific Knowledge</h3>
            <p class="mt-5 text-base text-gray-500">
              Access information exclusively from peer-reviewed articles, patents, and verified scientific sources.
            </p>
          </div>
        </div>
      </div>

      <div class="pt-6">
        <div class="flow-root bg-gray-50 rounded-lg px-6 pb-8">
          <div class="-mt-6">
            <div class="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">Spaced Repetition</h3>
            <p class="mt-5 text-base text-gray-500">
              Retain knowledge better with our intelligent spaced repetition system that adapts to your learning pace.
            </p>
          </div>
        </div>
      </div>

      <div class="pt-6">
        <div class="flow-root bg-gray-50 rounded-lg px-6 pb-8">
          <div class="-mt-6">
            <div class="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 class="mt-8 text-lg font-medium text-gray-900 tracking-tight">Personalized Learning</h3>
            <p class="mt-5 text-base text-gray-500">
              Experience adaptive learning paths that adjust to your understanding and previous knowledge.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 