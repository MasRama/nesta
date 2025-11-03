<script>
   import { router } from '@inertiajs/svelte';
   import { fly, fade, scale } from 'svelte/transition'

   export let leaderboard = [];
   
   let currentSection = 'leaderboard';
   let isMenuOpen = false;
   
   // Get top 3 for podium
   $: top3 = leaderboard.slice(0, 3);
   $: others = leaderboard.slice(3);
   
   // Get rank badge with medal
   function getRankBadge(index) {
      if (index === 0) return '🥇';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return `#${index + 1}`;
   }

   // Get podium height class
   function getPodiumHeight(index) {
      if (index === 0) return 'h-64';
      if (index === 1) return 'h-48';
      if (index === 2) return 'h-40';
      return 'h-32';
   }

   // Get podium order for visual arrangement (2nd, 1st, 3rd)
   function getPodiumOrder(index) {
      if (index === 0) return 1; // Center
      if (index === 1) return 0; // Left
      if (index === 2) return 2; // Right
      return index;
   }

   function navigateToHome() {
      router.visit('/');
   }

   function navigateToLogin() {
      router.visit('/login');
   }

   function toggleMenu() {
      isMenuOpen = !isMenuOpen;
   }
</script>

<svelte:head>
   <title>Leaderboard Kelas - NETSA</title>
</svelte:head>

<!-- Modern Material Design Navigation (sama dengan landing page) -->
<nav class="bg-white shadow-lg fixed w-full top-0 z-50 backdrop-blur-md bg-white/95">
   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
         <!-- Logo -->
         <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
               <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
               </svg>
            </div>
            <div>
               <h1 class="text-xl font-bold text-gray-900">NETSA</h1>
               <p class="text-xs text-gray-500">School Management</p>
            </div>
         </div>

         <!-- Desktop Navigation -->
         <div class="hidden md:flex items-center space-x-1">
            <button 
               class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100 text-gray-600"
               on:click={navigateToHome}
            >
               Home
            </button>
            <button 
               class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-blue-50 text-blue-600"
            >
               Leaderboard
            </button>
         </div>

         <!-- Action Buttons -->
         <div class="hidden md:flex items-center space-x-3">
            <button
               class="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
               on:click={navigateToLogin}
            >
               Masuk
            </button>
         </div>

         <!-- Mobile Menu Button -->
         <div class="md:hidden flex items-center space-x-2">
            <button
               class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
               on:click={toggleMenu}
            >
               <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {#if isMenuOpen}
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  {:else}
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                  {/if}
               </svg>
            </button>
         </div>
      </div>

      <!-- Mobile Menu -->
      {#if isMenuOpen}
         <div class="md:hidden py-4 border-t border-gray-200" transition:fly="{{ y: -20, duration: 200 }}">
            <div class="flex flex-col space-y-2">
               <button 
                  class="px-4 py-3 text-left rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 text-gray-600"
                  on:click={navigateToHome}
               >
                  Home
               </button>
               <button 
                  class="px-4 py-3 text-left rounded-lg text-sm font-medium bg-blue-50 text-blue-600"
               >
                  Leaderboard
               </button>
               <hr class="border-gray-200 my-2">
               <button
                  class="mx-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                  on:click={navigateToLogin}
               >
                  Masuk
               </button>
            </div>
         </div>
      {/if}
   </div>
</nav>

<!-- Main Content -->
<main class="pt-16">
<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <!-- Header -->
      <div class="text-center mb-16" in:fly={{ y: 20, duration: 800, delay: 200 }}>
         <h1 class="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
            🏆 <span class="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">Leaderboard</span> Kelas
         </h1>
         <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Ranking kelas berdasarkan poin prestasi dan pencapaian
         </p>
      </div>

      {#if leaderboard.length === 0}
         <!-- Empty State -->
         <div class="text-center py-16" in:fade={{ duration: 600 }}>
            <div class="text-6xl mb-4">📊</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Belum Ada Data Leaderboard</h3>
            <p class="text-gray-600">Data leaderboard akan ditampilkan di sini</p>
         </div>
      {:else}
         <!-- Top 3 Podium -->
         {#if top3.length > 0}
            <div class="mb-16" in:scale={{ duration: 800, delay: 400 }}>
               <h2 class="text-3xl font-bold text-center mb-8 text-gray-900">🌟 Top 3 Kelas Terbaik</h2>
               <div class="flex justify-center items-end gap-4 md:gap-8 max-w-4xl mx-auto">
                  {#each [top3[1], top3[0], top3[2]].filter(Boolean) as entry, visualIndex}
                     {@const actualIndex = getPodiumOrder(visualIndex) === 0 ? 1 : getPodiumOrder(visualIndex) === 1 ? 0 : 2}
                     {@const podiumHeight = getPodiumHeight(actualIndex)}
                     <div 
                        class="flex-1 max-w-xs"
                        in:fly={{ y: 50, duration: 600, delay: 600 + (visualIndex * 100) }}
                     >
                        <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border-4 {actualIndex === 0 ? 'border-yellow-400' : actualIndex === 1 ? 'border-gray-400' : 'border-amber-700'} transform hover:scale-105 transition-transform duration-300">
                           <!-- Medal Badge -->
                           <div class="text-center py-4 bg-gradient-to-r {actualIndex === 0 ? 'from-yellow-400 to-amber-500' : actualIndex === 1 ? 'from-gray-300 to-gray-400' : 'from-amber-600 to-amber-700'}">
                              <div class="text-6xl mb-2">{getRankBadge(actualIndex)}</div>
                              <div class="text-2xl font-bold text-white">Rank {actualIndex + 1}</div>
                           </div>
                           
                           <!-- Class Info -->
                           <div class="p-6 text-center">
                              <h3 class="text-2xl font-bold text-gray-900 mb-2">{entry.class_name}</h3>
                              <div class="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300 mb-3">
                                 ⭐ {entry.points} pts
                              </div>
                              {#if entry.description}
                                 <p class="text-sm text-gray-600 mt-2 line-clamp-3">{entry.description}</p>
                              {/if}
                           </div>
                        </div>
                        
                        <!-- Podium Base -->
                        <div class="{podiumHeight} bg-gradient-to-b {actualIndex === 0 ? 'from-yellow-500 to-amber-600' : actualIndex === 1 ? 'from-gray-400 to-gray-500' : 'from-amber-700 to-amber-800'} rounded-b-xl shadow-lg flex items-center justify-center">
                           <div class="text-white text-4xl font-bold opacity-20">#{actualIndex + 1}</div>
                        </div>
                     </div>
                  {/each}
               </div>
            </div>
         {/if}

         <!-- Other Rankings -->
         {#if others.length > 0}
            <div in:fade={{ duration: 600, delay: 1000 }}>
               <h2 class="text-2xl font-bold text-center mb-6 text-gray-900">📋 Ranking Lainnya</h2>
               <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-yellow-200/30">
                  <div class="overflow-x-auto">
                     <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-yellow-50 to-amber-50">
                           <tr>
                              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ranking</th>
                              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Kelas</th>
                              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Poin</th>
                              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pencapaian</th>
                           </tr>
                        </thead>
                        <tbody class="bg-white/80 backdrop-blur-sm divide-y divide-gray-200">
                           {#each others as entry, index}
                              {@const actualRank = index + 4}
                              <tr 
                                 class="hover:bg-yellow-50/50 transition-colors duration-200"
                                 in:fly={{ x: -20, duration: 400, delay: 1100 + (index * 50) }}
                              >
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="text-2xl font-bold text-gray-700">#{actualRank}</span>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="text-lg font-bold text-gray-900">{entry.class_name}</span>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-300">
                                       ⭐ {entry.points} pts
                                    </span>
                                 </td>
                                 <td class="px-6 py-4 text-sm text-gray-700 max-w-md">
                                    {entry.description || '-'}
                                 </td>
                              </tr>
                           {/each}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         {/if}
      {/if}

      <!-- Back to Home Button -->
      <div class="text-center mt-12" in:fade={{ duration: 600, delay: 1200 }}>
         <button
            on:click={navigateToHome}
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-medium"
         >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Kembali ke Beranda
         </button>
      </div>
   </div>
</div>
</main>

<style>
   /* Line clamp utility */
   .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
   }

   /* Gradient text clip for Safari */
   .bg-clip-text {
      -webkit-background-clip: text;
      background-clip: text;
   }

   /* Smooth transitions */
   * {
      transition-property: transform, box-shadow, background-color;
      transition-duration: 0.3s;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
   }
</style>
