<script lang="ts">
   import { router } from '@inertiajs/svelte';
   
   export let user: any;
   export let title: string = 'Dashboard Administrator';
   export let subtitle: string = 'Portal Manajemen NETSA';
   export let showBackButton: boolean = false;
   export let backUrl: string = '';
   
   function logout() {
      router.post('/logout');
   }
   
   function goBack() {
      if (backUrl) {
         router.visit(backUrl);
      } else {
         window.history.back();
      }
   }
</script>

<!-- Modern Material Design Header -->
<header class="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-xl relative overflow-hidden header-enhanced">
   <!-- Background Pattern -->
   <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 left-0 w-full h-full">
         <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
               <g fill="#ffffff" fill-opacity="0.1">
                  <circle cx="30" cy="30" r="2"/>
               </g>
            </g>
         </svg>
      </div>
   </div>
   
   <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
         <div class="flex items-center space-x-4">
            {#if showBackButton}
               <button
                  on:click={goBack}
                  class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Kembali ke halaman sebelumnya"
               >
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
               </button>
            {:else}
               <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
               </div>
            {/if}
            <div>
               <h1 class="text-2xl font-bold text-white">{title}</h1>
               <p class="text-red-100 text-sm">{subtitle}</p>
            </div>
         </div>
         <div class="flex items-center space-x-6">
            <div class="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
               <span class="text-white font-medium">Selamat datang, {user.name}</span>
               <div class="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-sm font-medium">
                  👑
               </div>
            </div>
            <div class="flex items-center">
               <button 
                  on:click={logout}
                  class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm border border-white/20 hover:border-white/30"
               >
                  Keluar
               </button>
            </div>
         </div>
      </div>
   </div>
</header>

<style>
   /* Enhanced Header Animations */
   .header-enhanced {
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
   }

   .header-enhanced::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.8s ease;
   }

   .header-enhanced:hover::before {
      left: 100%;
   }
</style>