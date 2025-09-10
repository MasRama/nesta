<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   import { fly, fade } from 'svelte/transition';


   export let schoolInfo = {
      name: "NETSA - New Era Technology School Administration",
      tagline: "Mengelola Masa Depan Pendidikan dengan Teknologi",
      description: "Sistem manajemen sekolah terpadu yang menggabungkan teknologi modern untuk memberikan pengalaman pendidikan terbaik bagi siswa, guru, dan orang tua.",
      address: "Jl. Pendidikan No. 123, Jakarta",
      phone: "+62 21 12345678",
      email: "info@netsa.school.id"
   };

   let currentSection = 'home';
   let isMenuOpen = false;
   let isVisible = false;

   onMount(() => {
      // Handle smooth scrolling for navigation
      const hash = window.location.hash;
      if (hash) {
         currentSection = hash.substring(1);
         scrollToSection(currentSection);
      }
      
      // Trigger entrance animation
      setTimeout(() => {
         isVisible = true;
      }, 100);
   });

   function scrollToSection(section) {
      currentSection = section;
      const element = document.getElementById(section);
      if (element) {
         element.scrollIntoView({ behavior: 'smooth' });
      }
      // Update URL without page reload
      history.pushState(null, '', `#${section}`);
      isMenuOpen = false;
   }

   function navigateToLogin() {
      router.visit('/login');
   }

   function navigateToRegister() {
      router.visit('/register');
   }

   function toggleMenu() {
      isMenuOpen = !isMenuOpen;
   }
</script>

<svelte:head>
   <title>{schoolInfo.name}</title>
   <meta name="description" content={schoolInfo.description} />
</svelte:head>

<!-- Modern Material Design Navigation -->
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
               class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100:bg-gray-800"
               class:bg-blue-50={currentSection === 'home'}
               class:text-blue-600={currentSection === 'home'}
               class:text-gray-600={currentSection !== 'home'}
               on:click={() => scrollToSection('home')}
            >
               Home
            </button>
            <button 
               class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100:bg-gray-800"
               class:bg-blue-50={currentSection === 'academic'}
               class:text-blue-600={currentSection === 'academic'}
               class:text-gray-600={currentSection !== 'academic'}
               on:click={() => scrollToSection('academic')}
            >
               Akademik
            </button>
            <button 
               class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-100:bg-gray-800"
               class:bg-blue-50={currentSection === 'information'}
               class:text-blue-600={currentSection === 'information'}
               class:text-gray-600={currentSection !== 'information'}
               on:click={() => scrollToSection('information')}
            >
               Informasi
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
               class="p-2 rounded-lg hover:bg-gray-100:bg-gray-800 transition-colors"
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
                  class="px-4 py-3 text-left rounded-lg text-sm font-medium transition-colors hover:bg-gray-100:bg-gray-800"
                  class:bg-blue-50={currentSection === 'home'}
                  class:text-blue-600={currentSection === 'home'}
                  class:text-gray-600={currentSection !== 'home'}
                  on:click={() => scrollToSection('home')}
               >
                  Home
               </button>
               <button 
                  class="px-4 py-3 text-left rounded-lg text-sm font-medium transition-colors hover:bg-gray-100:bg-gray-800"
                  class:bg-blue-50={currentSection === 'academic'}
                  class:text-blue-600={currentSection === 'academic'}
                  class:text-gray-600={currentSection !== 'academic'}
                  on:click={() => scrollToSection('academic')}
               >
                  Akademik
               </button>
               <button 
                  class="px-4 py-3 text-left rounded-lg text-sm font-medium transition-colors hover:bg-gray-100:bg-gray-800"
                  class:bg-blue-50={currentSection === 'information'}
                  class:text-blue-600={currentSection === 'information'}
                  class:text-gray-600={currentSection !== 'information'}
                  on:click={() => scrollToSection('information')}
               >
                  Informasi
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
   <!-- Hero Section with Material Design -->
   <section id="home" class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         {#if isVisible}
            <div class="text-center" transition:fly="{{ y: 50, duration: 800, delay: 200 }}">
               <!-- Hero Badge -->
               <div class="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-8" transition:fade="{{ duration: 600, delay: 400 }}">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Teknologi Terdepan untuk Pendidikan
               </div>

               <!-- Main Heading -->
               <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight" transition:fly="{{ y: 30, duration: 800, delay: 600 }}">
                  <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">NETSA</span>
                  <br>
                  <span class="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-700">School Management</span>
               </h1>

               <!-- Subtitle -->
               <p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed" transition:fly="{{ y: 30, duration: 800, delay: 800 }}">
                  {schoolInfo.tagline}
               </p>

               <!-- Description -->
               <p class="text-lg text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed" transition:fly="{{ y: 30, duration: 800, delay: 1000 }}">
                  {schoolInfo.description}
               </p>
               
               <!-- CTA Buttons -->
               <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16" transition:fly="{{ y: 30, duration: 800, delay: 1200 }}">
                  <button 
                     class="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 flex items-center space-x-2"
                     on:click={() => scrollToSection('academic')}
                  >
                     <span>Jelajahi Sistem Akademik</span>
                     <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                     </svg>
                  </button>
                  <button 
                     class="group px-8 py-4 bg-white text-blue-600 border-2 border-blue-200 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
                     on:click={() => scrollToSection('information')}
                  >
                     <svg class="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                     </svg>
                     <span>Info Sekolah</span>
                  </button>
               </div>
            </div>

            <!-- Feature Cards with Material Design -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8" transition:fly="{{ y: 50, duration: 800, delay: 1400 }}">
               <!-- Multi-Role Dashboard Card -->
               <div class="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                     <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                     </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600:text-blue-400 transition-colors">Multi-Role Dashboard</h3>
                  <p class="text-gray-600 leading-relaxed">Dashboard khusus untuk siswa, guru, dan orang tua dengan fitur yang disesuaikan kebutuhan masing-masing.</p>
                  <div class="mt-6 flex items-center text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="mr-2">Pelajari lebih lanjut</span>
                     <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                  </div>
               </div>
               
               <!-- QR Code Attendance Card -->
               <div class="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                     <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                     </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600:text-green-400 transition-colors">QR Code Absensi</h3>
                  <p class="text-gray-600 leading-relaxed">Sistem absensi modern menggunakan QR code untuk mencatat kehadiran siswa secara real-time.</p>
                  <div class="mt-6 flex items-center text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="mr-2">Pelajari lebih lanjut</span>
                     <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                  </div>
               </div>
               
               <!-- Exam Management Card -->
               <div class="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                     <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                     </svg>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600:text-purple-400 transition-colors">Manajemen Ujian</h3>
                  <p class="text-gray-600 leading-relaxed">Platform ujian digital dengan import soal dari Excel dan pengacakan otomatis untuk integritas ujian.</p>
                  <div class="mt-6 flex items-center text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                     <span class="mr-2">Pelajari lebih lanjut</span>
                     <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                  </div>
               </div>
            </div>
         {/if}
      </div>
   </section>

   <!-- Academic Section with Material Design -->
   <section id="academic" class="min-h-screen bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         <div class="text-center mb-16">
            <div class="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-6">
               <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
               </svg>
               Sistem Akademik Terpadu
            </div>
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
               <span class="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Sistem Akademik</span> NETSA
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
               Platform terpadu yang menghubungkan seluruh aspek kehidupan akademik sekolah dalam satu sistem yang terintegrasi.
            </p>
         </div>

         <!-- Student Dashboard Section -->
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div class="order-2 lg:order-1">
               <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                     <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                     </svg>
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900">Dashboard Siswa</h3>
               </div>
               <p class="text-gray-600 mb-8 text-lg leading-relaxed">
                  Interface yang intuitif dan user-friendly khusus dirancang untuk siswa dengan semua fitur yang dibutuhkan.
               </p>
               <div class="space-y-4">
                  <div class="flex items-start p-4 bg-blue-50 rounded-xl">
                     <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Jadwal & Kehadiran Real-time</h4>
                        <p class="text-gray-600 text-sm">Lihat jadwal pelajaran dan status kehadiran secara langsung</p>
                     </div>
                  </div>
                  <div class="flex items-start p-4 bg-green-50 rounded-xl">
                     <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Ujian Online Anti-Curang</h4>
                        <p class="text-gray-600 text-sm">Akses ujian dengan sistem keamanan tingkat tinggi</p>
                     </div>
                  </div>
                  <div class="flex items-start p-4 bg-purple-50 rounded-xl">
                     <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Progress Akademik</h4>
                        <p class="text-gray-600 text-sm">Monitor perkembangan nilai dan pencapaian belajar</p>
                     </div>
                  </div>
               </div>
            </div>
            <div class="order-1 lg:order-2">
               <div class="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-3xl shadow-xl">
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                     <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                        <div class="flex items-center justify-between text-white">
                           <h4 class="text-xl font-bold">Portal Siswa</h4>
                           <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                              </svg>
                           </div>
                        </div>
                     </div>
                     <div class="p-6">
                        <p class="text-gray-600 mb-6 leading-relaxed">Akses mudah ke semua informasi akademik Anda dalam satu tempat yang terintegrasi.</p>
                        <button 
                           class="w-full group bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                           on:click={navigateToLogin}
                        >
                           <span>Masuk sebagai Siswa</span>
                           <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                           </svg>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Teacher Dashboard Section -->
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
               <div class="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-3xl shadow-xl">
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                     <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                        <div class="flex items-center justify-between text-white">
                           <h4 class="text-xl font-bold">Portal Guru</h4>
                           <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                              </svg>
                           </div>
                        </div>
                     </div>
                     <div class="p-6">
                        <p class="text-gray-600 mb-6 leading-relaxed">Kelola kelas, buat jurnal pembelajaran, dan evaluasi siswa dengan tools yang powerful.</p>
                        <button 
                           class="w-full group bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                           on:click={navigateToLogin}
                        >
                           <span>Masuk sebagai Guru</span>
                           <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                           </svg>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
            <div>
               <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4">
                     <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                     </svg>
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900">Dashboard Guru</h3>
               </div>
               <p class="text-gray-600 mb-8 text-lg leading-relaxed">
                  Platform komprehensif untuk mengelola semua aspek pembelajaran dan evaluasi siswa.
               </p>
               <div class="space-y-4">
                  <div class="flex items-start p-4 bg-green-50 rounded-xl">
                     <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">QR Code Generator</h4>
                        <p class="text-gray-600 text-sm">Kelola absensi siswa dengan teknologi QR code modern</p>
                     </div>
                  </div>
                  <div class="flex items-start p-4 bg-blue-50 rounded-xl">
                     <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Jurnal Pembelajaran</h4>
                        <p class="text-gray-600 text-sm">Buat dan publikasikan jurnal pembelajaran harian</p>
                     </div>
                  </div>
                  <div class="flex items-start p-4 bg-purple-50 rounded-xl">
                     <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Import Soal Excel</h4>
                        <p class="text-gray-600 text-sm">Import soal ujian dari file Excel secara otomatis</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Parent Dashboard Section -->
         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
               <div class="flex items-center mb-6">
                  <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                     <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                     </svg>
                  </div>
                  <h3 class="text-3xl font-bold text-gray-900">Dashboard Orang Tua</h3>
               </div>
               <p class="text-gray-600 mb-8 text-lg leading-relaxed">
                  Pantau perkembangan pendidikan anak dengan akses informasi lengkap dan real-time.
               </p>
               <div class="space-y-4">
                  <div class="flex items-start p-4 bg-purple-50 rounded-xl">
                     <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Monitoring Real-time</h4>
                        <p class="text-gray-600 text-sm">Pantau kehadiran anak secara langsung dan akurat</p>
                     </div>
                  </div>
                  <div class="flex items-start p-4 bg-blue-50 rounded-xl">
                     <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Progress Akademik</h4>
                        <p class="text-gray-600 text-sm">Lihat perkembangan nilai dan prestasi akademik</p>
                     </div>
                  </div>
                  <div class="flex items-start p-4 bg-green-50 rounded-xl">
                     <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-0.5 flex-shrink-0">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                     </div>
                     <div>
                        <h4 class="font-semibold text-gray-900 mb-1">Komunikasi Langsung</h4>
                        <p class="text-gray-600 text-sm">Komunikasi efektif dengan pihak sekolah dan guru</p>
                     </div>
                  </div>
               </div>
            </div>
            <div>
               <div class="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-3xl shadow-xl">
                  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                     <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                        <div class="flex items-center justify-between text-white">
                           <h4 class="text-xl font-bold">Portal Orang Tua</h4>
                           <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                              </svg>
                           </div>
                        </div>
                     </div>
                     <div class="p-6">
                        <p class="text-gray-600 mb-6 leading-relaxed">Tetap terhubung dengan perkembangan pendidikan anak Anda melalui platform terintegrasi.</p>
                        <button 
                           class="w-full group bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                           on:click={navigateToLogin}
                        >
                           <span>Masuk sebagai Orang Tua</span>
                           <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                           </svg>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </section>

   <!-- Modern Information Section -->
   <section id="information" class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         <div class="text-center mb-16">
            <div class="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full text-indigo-800 text-sm font-medium mb-6">
               <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
               </svg>
               Informasi Lengkap
            </div>
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
               <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Informasi</span> Sekolah
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
               Pelajari lebih lanjut tentang NETSA dan komitmen kami dalam memberikan pendidikan berkualitas.
            </p>
         </div>

         <!-- Info Cards Grid -->
         <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <!-- About Card -->
            <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
               <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6m0 0v-3.5a2 2 0 011-1.732V9.5a2 2 0 011-1.732V5a2 2 0 011-1h2a2 2 0 011 1v2.768a2 2 0 011 1.732v2.268a2 2 0 011 1.732V21"/>
                  </svg>
               </div>
               <h3 class="text-2xl font-bold text-gray-900 mb-4">Tentang NETSA</h3>
               <p class="text-gray-600 mb-6 leading-relaxed">
                  NETSA adalah sistem manajemen sekolah yang mengintegrasikan teknologi modern dengan pendekatan pendidikan holistik.
               </p>
               <div class="space-y-3">
                  <div class="flex items-center text-gray-600">
                     <div class="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                     <span class="text-sm">Berbasis teknologi cloud</span>
                  </div>
                  <div class="flex items-center text-gray-600">
                     <div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                     <span class="text-sm">Interface yang user-friendly</span>
                  </div>
                  <div class="flex items-center text-gray-600">
                     <div class="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                     <span class="text-sm">Keamanan data terjamin</span>
                  </div>
               </div>
            </div>

            <!-- Contact Card -->
            <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
               <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
               </div>
               <h3 class="text-2xl font-bold text-gray-900 mb-4">Kontak Kami</h3>
               <div class="space-y-4">
                  <div class="flex items-start">
                     <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                     </svg>
                     <div>
                        <p class="font-medium text-gray-900">Alamat</p>
                        <p class="text-gray-600 text-sm">{schoolInfo.address}</p>
                     </div>
                  </div>
                  <div class="flex items-start">
                     <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                     </svg>
                     <div>
                        <p class="font-medium text-gray-900">Telepon</p>
                        <p class="text-gray-600 text-sm">{schoolInfo.phone}</p>
                     </div>
                  </div>
                  <div class="flex items-start">
                     <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                     </svg>
                     <div>
                        <p class="font-medium text-gray-900">Email</p>
                        <p class="text-gray-600 text-sm">{schoolInfo.email}</p>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Features Card -->
            <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
               <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
               </div>
               <h3 class="text-2xl font-bold text-gray-900 mb-4">Fitur Unggulan</h3>
               <div class="space-y-3">
                  <div class="flex items-center">
                     <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                     </div>
                     <span class="text-gray-700">Dashboard Analytics</span>
                  </div>
                  <div class="flex items-center">
                     <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-12z"/>
                        </svg>
                     </div>
                     <span class="text-gray-700">Notifikasi Real-time</span>
                  </div>
                  <div class="flex items-center">
                     <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                     </div>
                     <span class="text-gray-700">Laporan Otomatis</span>
                  </div>
                  <div class="flex items-center">
                     <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                     </div>
                     <span class="text-gray-700">Keamanan Tingkat Tinggi</span>
                  </div>
               </div>
            </div>
         </div>

         <!-- Modern FAQ Section -->
         <div class="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
            <div class="text-center mb-12">
               <h3 class="text-3xl font-bold text-gray-900 mb-4">Pertanyaan yang Sering Diajukan</h3>
               <p class="text-gray-600">Temukan jawaban untuk pertanyaan umum tentang sistem NETSA</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="space-y-6">
                  <div class="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100:bg-gray-700 transition-colors">
                     <div class="flex items-start">
                        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                           <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                           </svg>
                        </div>
                        <div>
                           <h4 class="font-bold text-gray-900 mb-2">Bagaimana cara mendaftar akun?</h4>
                           <p class="text-gray-600 text-sm leading-relaxed">Hubungi admin sekolah untuk mendapatkan akun dan informasi login Anda. Setiap pengguna akan mendapatkan role sesuai dengan status di sekolah.</p>
                        </div>
                     </div>
                  </div>
                  <div class="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100:bg-gray-700 transition-colors">
                     <div class="flex items-start">
                        <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                           <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                           </svg>
                        </div>
                        <div>
                           <h4 class="font-bold text-gray-900 mb-2">Apakah sistem ini aman?</h4>
                           <p class="text-gray-600 text-sm leading-relaxed">Ya, kami menggunakan enkripsi tingkat enterprise dan protokol keamanan terbaru untuk melindungi data pribadi dan akademik.</p>
                        </div>
                     </div>
                  </div>
               </div>
               <div class="space-y-6">
                  <div class="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100:bg-gray-700 transition-colors">
                     <div class="flex items-start">
                        <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                           <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                           </svg>
                        </div>
                        <div>
                           <h4 class="font-bold text-gray-900 mb-2">Bisakah diakses via mobile?</h4>
                           <p class="text-gray-600 text-sm leading-relaxed">Tentu! Sistem NETSA responsive dan dapat diakses dengan mudah melalui smartphone atau tablet.</p>
                        </div>
                     </div>
                  </div>
                  <div class="p-6 bg-gray-50 rounded-2xl hover:bg-gray-100:bg-gray-700 transition-colors">
                     <div class="flex items-start">
                        <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-4 mt-1">
                           <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                           </svg>
                        </div>
                        <div>
                           <h4 class="font-bold text-gray-900 mb-2">Apakah ada panduan penggunaan?</h4>
                           <p class="text-gray-600 text-sm leading-relaxed">Ya, kami menyediakan dokumentasi lengkap dan video tutorial untuk setiap fitur dalam sistem.</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </section>
</main>

<!-- Modern Material Design Footer -->
<footer class="bg-gray-900 text-white relative overflow-hidden">
   <!-- Background Pattern -->
   <div class="absolute inset-0 opacity-5">
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
   
   <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
         <!-- Brand Section -->
         <div class="md:col-span-2">
            <div class="flex items-center space-x-3 mb-6">
               <div class="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
               </div>
               <div>
                  <h3 class="text-2xl font-bold">NETSA</h3>
                  <p class="text-gray-400 text-sm">School Management System</p>
               </div>
            </div>
            <p class="text-gray-400 leading-relaxed mb-6 max-w-md">
               New Era Technology School Administration - Solusi manajemen sekolah terdepan untuk era digital dengan teknologi yang inovatif dan user-friendly.
            </p>
            <div class="flex space-x-4">
               <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors group">
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
               </a>
               <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors group">
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
               </a>
               <a href="#" class="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors group">
                  <svg class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
               </a>
            </div>
         </div>

         <!-- Quick Links -->
         <div>
            <h4 class="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul class="space-y-4">
               <li>
                  <button 
                     on:click={() => scrollToSection('home')} 
                     class="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                     <svg class="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                     Home
                  </button>
               </li>
               <li>
                  <button 
                     on:click={() => scrollToSection('academic')} 
                     class="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                     <svg class="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                     Akademik
                  </button>
               </li>
               <li>
                  <button 
                     on:click={() => scrollToSection('information')} 
                     class="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                     <svg class="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                     Informasi
                  </button>
               </li>
               <li>
                  <button 
                     on:click={navigateToLogin} 
                     class="text-gray-400 hover:text-white transition-colors duration-200 flex items-center group"
                  >
                     <svg class="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                     </svg>
                     Login
                  </button>
               </li>
            </ul>
         </div>

         <!-- Contact Info -->
         <div>
            <h4 class="text-lg font-bold mb-6 text-white">Kontak</h4>
            <ul class="space-y-4">
               <li class="flex items-start">
                  <svg class="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span class="text-gray-400 text-sm leading-relaxed">{schoolInfo.address}</span>
               </li>
               <li class="flex items-center">
                  <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span class="text-gray-400 text-sm">{schoolInfo.phone}</span>
               </li>
               <li class="flex items-center">
                  <svg class="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span class="text-gray-400 text-sm">{schoolInfo.email}</span>
               </li>
            </ul>
         </div>
      </div>
      
      <!-- Bottom Section -->
      <div class="border-t border-gray-800 pt-8">
         <div class="flex flex-col md:flex-row justify-between items-center">
            <p class="text-gray-400 text-sm mb-4 md:mb-0">
               &copy; 2024 NETSA - New Era Technology School Administration. All rights reserved.
            </p>
            <div class="flex items-center space-x-6 text-sm text-gray-400">
               <button class="hover:text-white transition-colors">Privacy Policy</button>
               <button class="hover:text-white transition-colors">Terms of Service</button>
               <button class="hover:text-white transition-colors">Support</button>
            </div>
         </div>
      </div>
   </div>
</footer>

<style>
   /* Modern Material Design Styles */
   :global(html) {
      scroll-behavior: smooth;
   }
   
   /* Ensure sections have proper spacing for fixed navigation */
   section {
      scroll-margin-top: 5rem;
   }

   /* Custom gradient animations */
   @keyframes gradient {
      0% {
         background-position: 0% 50%;
      }
      50% {
         background-position: 100% 50%;
      }
      100% {
         background-position: 0% 50%;
      }
   }

   /* Enhanced backdrop blur for navigation */
   nav {
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
   }

   /* Smooth elevation transitions for cards */
   .card-elevation {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateZ(0);
   }

   .card-elevation:hover {
      transform: translateY(-8px) translateZ(0);
      box-shadow: 0 24px 38px 3px rgba(0, 0, 0, 0.14), 0 9px 46px 8px rgba(0, 0, 0, 0.12), 0 11px 15px -7px rgba(0, 0, 0, 0.2);
   }

   /* Enhanced focus states */
   button:focus-visible {
      outline: 2px solid theme('colors.blue.500');
      outline-offset: 2px;
   }

   /* Improved text selection */
   ::selection {
      background-color: theme('colors.blue.200');
      color: theme('colors.blue.900');
   }



   /* Custom scrollbar styling */
   :global(body)::-webkit-scrollbar {
      width: 8px;
   }

   :global(body)::-webkit-scrollbar-track {
      background: theme('colors.gray.100');
   }

   :global(body)::-webkit-scrollbar-thumb {
      background: theme('colors.blue.500');
      border-radius: 4px;
   }

   :global(body)::-webkit-scrollbar-thumb:hover {
      background: theme('colors.blue.600');
   }

   /* Dark mode scrollbar */
   :global(.dark body)::-webkit-scrollbar-track {
      background: theme('colors.gray.800');
   }

   :global(.dark body)::-webkit-scrollbar-thumb {
      background: theme('colors.gray.600');
   }

   :global(.dark body)::-webkit-scrollbar-thumb:hover {
      background: theme('colors.gray.500');
   }
</style>