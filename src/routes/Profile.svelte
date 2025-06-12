<!-- Profile.svelte -->
<script lang="ts">
  // Mock data for now
  const learningHistory = [
    {
      id: 1,
      topic: "Quantum Computing",
      lastStudied: "2024-03-20",
      progress: 75,
      nextReview: "2024-03-25"
    },
    {
      id: 2,
      topic: "CRISPR Gene Editing",
      lastStudied: "2024-03-18",
      progress: 60,
      nextReview: "2024-03-23"
    },
    {
      id: 3,
      topic: "Machine Learning Algorithms",
      lastStudied: "2024-03-15",
      progress: 90,
      nextReview: "2024-03-22"
    }
  ];

  const stats = {
    topicsLearned: 15,
    hoursSpent: 24,
    streakDays: 7,
    masteryScore: 85
  };
</script>

<div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
  <!-- Profile header -->
  <div class="bg-white shadow rounded-lg mb-6">
    <div class="px-4 py-5 sm:p-6">
      <div class="flex items-center space-x-5">
        <div class="flex-shrink-0">
          <div class="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
            <span class="text-2xl text-white font-bold">U</span>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">User Profile</h2>
          <p class="text-sm text-gray-500">Joined March 2024</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate">Topics Learned</dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">{stats.topicsLearned}</dd>
      </div>
    </div>
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate">Hours Spent Learning</dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">{stats.hoursSpent}</dd>
      </div>
    </div>
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate">Day Streak</dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">{stats.streakDays}</dd>
      </div>
    </div>
    <div class="bg-white overflow-hidden shadow rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <dt class="text-sm font-medium text-gray-500 truncate">Mastery Score</dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">{stats.masteryScore}%</dd>
      </div>
    </div>
  </div>

  <!-- Learning History -->
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Learning History</h3>
      <div class="flow-root">
        <ul role="list" class="-mb-8">
          {#each learningHistory as item, index}
            <li>
              <div class="relative pb-8">
                {#if index !== learningHistory.length - 1}
                  <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                {/if}
                <div class="relative flex space-x-3">
                  <div>
                    <span class="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center ring-8 ring-white">
                      <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium text-gray-900">{item.topic}</div>
                    <div class="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                      <span>Last studied: {item.lastStudied}</span>
                      <span>•</span>
                      <span>Progress: {item.progress}%</span>
                    </div>
                    <div class="mt-2 text-sm text-primary-600">
                      Next review: {item.nextReview}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</div> 