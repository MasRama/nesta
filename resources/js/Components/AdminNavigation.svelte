<script lang="ts">
   import { router } from '@inertiajs/svelte';
   
   export let currentSection: string = 'overview';
   
   interface NavItem {
      id: string;
      label: string;
      icon: string;
      colors: {
         from: string;
         to: string;
      };
      action?: () => void;
   }
   
   const navItems: NavItem[] = [
      {
         id: 'overview',
         label: 'Ringkasan',
         icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
         colors: {
            from: 'from-red-600',
            to: 'to-rose-600'
         }
      },
      {
         id: 'students',
         label: 'Manajemen Siswa',
         icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
         colors: {
            from: 'from-red-600',
            to: 'to-rose-600'
         }
      },
      {
         id: 'teachers',
         label: 'Manajemen Guru',
         icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
         colors: {
            from: 'from-blue-600',
            to: 'to-indigo-600'
         }
      }
   ];
   
   function navigateToSection(section: string) {
      if (section === 'overview') {
         router.visit('/dashboard/admin');
      } else if (section === 'students') {
         router.visit('/admin/students');
      } else if (section === 'teachers') {
         router.visit('/admin/teachers');
      }
   }
</script>

<!-- Modern Material Design Navigation -->
<nav class="bg-white/90 backdrop-blur-md border-b border-red-200/30 sticky top-0 z-40 shadow-sm">
   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex space-x-2 py-4">
         {#each navItems as item}
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === item.id}
               class:from-red-600={currentSection === item.id}
               class:to-rose-600={currentSection === item.id}
               class:text-white={currentSection === item.id}
               class:shadow-lg={currentSection === item.id}
               class:bg-white={currentSection !== item.id}
               class:text-gray-800={currentSection !== item.id}
               class:hover:bg-gray-50={currentSection !== item.id}
               class:border={currentSection !== item.id}
               class:border-gray-200={currentSection !== item.id}
               on:click={() => navigateToSection(item.id)}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon}/>
                  </svg>
                  <span>{item.label}</span>
               </div>
            </button>
         {/each}
      </div>
   </div>
</nav>

<style>
   /* Navigation Button Enhancements */
   .nav-btn-enhanced {
      position: relative;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
   }

   .nav-btn-enhanced::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transition: all 0.4s ease;
      transform: translate(-50%, -50%);
      z-index: 0;
   }

   .nav-btn-enhanced:hover::before {
      width: 300px;
      height: 300px;
   }

   .nav-btn-enhanced:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
   }

   .nav-btn-enhanced > * {
      position: relative;
      z-index: 1;
   }
</style>