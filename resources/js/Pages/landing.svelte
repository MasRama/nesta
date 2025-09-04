<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';

   export let schoolInfo = {
      name: "NETSA - New Era Technology School Administration",
      tagline: "Mengelola Masa Depan Pendidikan dengan Teknologi",
      description: "Sistem manajemen sekolah terpadu yang menggabungkan teknologi modern untuk memberikan pengalaman pendidikan terbaik bagi siswa, guru, dan orang tua.",
      address: "Jl. Pendidikan No. 123, Jakarta",
      phone: "+62 21 12345678",
      email: "info@netsa.school.id"
   };

   let currentSection = 'home';

   onMount(() => {
      // Handle smooth scrolling for navigation
      const hash = window.location.hash;
      if (hash) {
         currentSection = hash.substring(1);
         scrollToSection(currentSection);
      }
   });

   function scrollToSection(section) {
      currentSection = section;
      const element = document.getElementById(section);
      if (element) {
         element.scrollIntoView({ behavior: 'smooth' });
      }
      // Update URL without page reload
      history.pushState(null, '', `#${section}`);
   }

   function navigateToLogin() {
      router.visit('/login');
   }

   function navigateToRegister() {
      router.visit('/register');
   }
</script>

<svelte:head>
   <title>{schoolInfo.name}</title>
   <meta name="description" content={schoolInfo.description} />
</svelte:head>

<!-- Navigation -->
<nav class="bg-blue-900 text-white shadow-lg fixed w-full top-0 z-50">
   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
         <div class="flex items-center">
            <div class="flex-shrink-0">
               <h1 class="text-xl font-bold">NETSA</h1>
            </div>
            <div class="hidden md:block ml-10">
               <div class="flex items-baseline space-x-4">
                  <button 
                     class="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                     class:bg-blue-700={currentSection === 'home'}
                     on:click={() => scrollToSection('home')}
                  >
                     Home
                  </button>
                  <button 
                     class="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                     class:bg-blue-700={currentSection === 'academic'}
                     on:click={() => scrollToSection('academic')}
                  >
                     Akademik
                  </button>
                  <button 
                     class="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                     class:bg-blue-700={currentSection === 'information'}
                     on:click={() => scrollToSection('information')}
                  >
                     Informasi
                  </button>
               </div>
            </div>
         </div>
         <div class="flex items-center space-x-4">
            <button 
               class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
               on:click={navigateToLogin}
            >
               Masuk
            </button>
            <button 
               class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
               on:click={navigateToRegister}
            >
               Daftar
            </button>
         </div>
      </div>
   </div>
</nav>

<!-- Main Content -->
<main class="pt-16">
   <!-- Home Section -->
   <section id="home" class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         <div class="text-center">
            <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
               {schoolInfo.name}
            </h1>
            <p class="text-xl md:text-2xl text-gray-600 mb-8">
               {schoolInfo.tagline}
            </p>
            <p class="text-lg text-gray-700 mb-12 max-w-3xl mx-auto">
               {schoolInfo.description}
            </p>
            
            <div class="flex flex-col md:flex-row gap-4 justify-center items-center">
               <button 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg transition-colors"
                  on:click={() => scrollToSection('academic')}
               >
                  Jelajahi Sistem Akademik
               </button>
               <button 
                  class="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-medium shadow-lg transition-colors"
                  on:click={() => scrollToSection('information')}
               >
                  Info Sekolah
               </button>
            </div>
         </div>

         <!-- Feature Cards -->
         <div class="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="bg-white p-8 rounded-lg shadow-lg">
               <div class="text-blue-600 text-4xl mb-4">👥</div>
               <h3 class="text-xl font-semibold mb-3">Multi-Role Dashboard</h3>
               <p class="text-gray-600">Dashboard khusus untuk siswa, guru, dan orang tua dengan fitur yang disesuaikan kebutuhan masing-masing.</p>
            </div>
            
            <div class="bg-white p-8 rounded-lg shadow-lg">
               <div class="text-blue-600 text-4xl mb-4">📱</div>
               <h3 class="text-xl font-semibold mb-3">QR Code Absensi</h3>
               <p class="text-gray-600">Sistem absensi modern menggunakan QR code untuk mencatat kehadiran siswa secara real-time.</p>
            </div>
            
            <div class="bg-white p-8 rounded-lg shadow-lg">
               <div class="text-blue-600 text-4xl mb-4">📚</div>
               <h3 class="text-xl font-semibold mb-3">Manajemen Ujian</h3>
               <p class="text-gray-600">Platform ujian digital dengan import soal dari Excel dan pengacakan otomatis untuk integritas ujian.</p>
            </div>
         </div>
      </div>
   </section>

   <!-- Academic Section -->
   <section id="academic" class="min-h-screen bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Sistem Akademik NETSA</h2>
            <p class="text-lg text-gray-600 max-w-3xl mx-auto">
               Platform terpadu yang menghubungkan seluruh aspek kehidupan akademik sekolah dalam satu sistem yang terintegrasi.
            </p>
         </div>

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
               <h3 class="text-2xl font-bold text-gray-900 mb-6">Dashboard Siswa</h3>
               <ul class="space-y-4">
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Lihat jadwal pelajaran dan kehadiran real-time</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Akses ujian online dengan sistem anti-curang</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Notifikasi tugas dan pengumuman penting</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Riwayat nilai dan progress akademik</span>
                  </li>
               </ul>
            </div>
            <div class="bg-blue-50 p-8 rounded-lg">
               <div class="bg-blue-600 text-white p-4 rounded-t-lg">
                  <h4 class="font-semibold">Portal Siswa</h4>
               </div>
               <div class="bg-white p-6 rounded-b-lg shadow-inner">
                  <p class="text-gray-600 mb-4">Akses mudah ke semua informasi akademik Anda dalam satu tempat.</p>
                  <button 
                     class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition-colors"
                     on:click={navigateToLogin}
                  >
                     Masuk sebagai Siswa
                  </button>
               </div>
            </div>
         </div>

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div class="bg-green-50 p-8 rounded-lg lg:order-1">
               <div class="bg-green-600 text-white p-4 rounded-t-lg">
                  <h4 class="font-semibold">Portal Guru</h4>
               </div>
               <div class="bg-white p-6 rounded-b-lg shadow-inner">
                  <p class="text-gray-600 mb-4">Kelola kelas, buat jurnal pembelajaran, dan evaluasi siswa dengan efisien.</p>
                  <button 
                     class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
                     on:click={navigateToLogin}
                  >
                     Masuk sebagai Guru
                  </button>
               </div>
            </div>
            <div class="lg:order-0">
               <h3 class="text-2xl font-bold text-gray-900 mb-6">Dashboard Guru</h3>
               <ul class="space-y-4">
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Kelola absensi siswa dengan QR code generator</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Buat dan publikasikan jurnal pembelajaran harian</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Import soal ujian dari file Excel secara otomatis</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Monitor progress dan hasil belajar siswa</span>
                  </li>
               </ul>
            </div>
         </div>

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
               <h3 class="text-2xl font-bold text-gray-900 mb-6">Dashboard Orang Tua</h3>
               <ul class="space-y-4">
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Pantau kehadiran anak secara real-time</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Lihat progress akademik dan nilai ujian</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Akses jurnal pembelajaran dari guru</span>
                  </li>
                  <li class="flex items-start">
                     <span class="text-green-500 mr-3">✓</span>
                     <span>Komunikasi langsung dengan pihak sekolah</span>
                  </li>
               </ul>
            </div>
            <div class="bg-purple-50 p-8 rounded-lg">
               <div class="bg-purple-600 text-white p-4 rounded-t-lg">
                  <h4 class="font-semibold">Portal Orang Tua</h4>
               </div>
               <div class="bg-white p-6 rounded-b-lg shadow-inner">
                  <p class="text-gray-600 mb-4">Tetap terhubung dengan perkembangan pendidikan anak Anda.</p>
                  <button 
                     class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded transition-colors"
                     on:click={navigateToLogin}
                  >
                     Masuk sebagai Orang Tua
                  </button>
               </div>
            </div>
         </div>
      </div>
   </section>

   <!-- Information Section -->
   <section id="information" class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         <div class="text-center mb-16">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Informasi Sekolah</h2>
            <p class="text-lg text-gray-600 max-w-3xl mx-auto">
               Pelajari lebih lanjut tentang NETSA dan komitmen kami dalam memberikan pendidikan berkualitas.
            </p>
         </div>

         <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <!-- About -->
            <div class="bg-white p-8 rounded-lg shadow-lg">
               <h3 class="text-xl font-bold text-gray-900 mb-4">Tentang NETSA</h3>
               <p class="text-gray-600 mb-6">
                  NETSA adalah sistem manajemen sekolah yang mengintegrasikan teknologi modern dengan pendekatan pendidikan holistik untuk menciptakan lingkungan belajar yang optimal.
               </p>
               <ul class="space-y-2 text-sm text-gray-600">
                  <li>• Berbasis teknologi cloud</li>
                  <li>• Interface yang user-friendly</li>
                  <li>• Keamanan data terjamin</li>
                  <li>• Support 24/7</li>
               </ul>
            </div>

            <!-- Contact -->
            <div class="bg-white p-8 rounded-lg shadow-lg">
               <h3 class="text-xl font-bold text-gray-900 mb-4">Kontak Kami</h3>
               <div class="space-y-4">
                  <div>
                     <strong class="text-gray-900">Alamat:</strong>
                     <p class="text-gray-600">{schoolInfo.address}</p>
                  </div>
                  <div>
                     <strong class="text-gray-900">Telepon:</strong>
                     <p class="text-gray-600">{schoolInfo.phone}</p>
                  </div>
                  <div>
                     <strong class="text-gray-900">Email:</strong>
                     <p class="text-gray-600">{schoolInfo.email}</p>
                  </div>
               </div>
            </div>

            <!-- Features -->
            <div class="bg-white p-8 rounded-lg shadow-lg">
               <h3 class="text-xl font-bold text-gray-900 mb-4">Fitur Unggulan</h3>
               <ul class="space-y-3 text-gray-600">
                  <li class="flex items-center">
                     <span class="text-blue-500 mr-2">📊</span>
                     Dashboard Analytics
                  </li>
                  <li class="flex items-center">
                     <span class="text-blue-500 mr-2">🔔</span>
                     Notifikasi Real-time
                  </li>
                  <li class="flex items-center">
                     <span class="text-blue-500 mr-2">📄</span>
                     Laporan Otomatis
                  </li>
                  <li class="flex items-center">
                     <span class="text-blue-500 mr-2">🔒</span>
                     Keamanan Tingkat Tinggi
                  </li>
                  <li class="flex items-center">
                     <span class="text-blue-500 mr-2">📱</span>
                     Mobile Responsive
                  </li>
               </ul>
            </div>
         </div>

         <!-- FAQ Section -->
         <div class="bg-white rounded-lg shadow-lg p-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-8 text-center">Pertanyaan Umum</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Bagaimana cara mendaftar akun?</h4>
                  <p class="text-gray-600 text-sm">Hubungi admin sekolah untuk mendapatkan akun dan informasi login Anda. Setiap pengguna akan mendapatkan role sesuai dengan status di sekolah.</p>
               </div>
               <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Apakah sistem ini aman?</h4>
                  <p class="text-gray-600 text-sm">Ya, kami menggunakan enkripsi tingkat enterprise dan protokol keamanan terbaru untuk melindungi data pribadi dan akademik.</p>
               </div>
               <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Bisakah diakses via mobile?</h4>
                  <p class="text-gray-600 text-sm">Tentu! Sistem NETSA responsive dan dapat diakses dengan mudah melalui smartphone atau tablet.</p>
               </div>
               <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Apakah ada panduan penggunaan?</h4>
                  <p class="text-gray-600 text-sm">Ya, kami menyediakan dokumentasi lengkap dan video tutorial untuk setiap fitur dalam sistem.</p>
               </div>
            </div>
         </div>
      </div>
   </section>
</main>

<!-- Footer -->
<footer class="bg-gray-900 text-white py-12">
   <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div>
            <h3 class="text-xl font-bold mb-4">NETSA</h3>
            <p class="text-gray-400">New Era Technology School Administration - Solusi manajemen sekolah terdepan untuk era digital.</p>
         </div>
         <div>
            <h4 class="font-semibold mb-4">Quick Links</h4>
            <ul class="space-y-2 text-gray-400">
               <li><button on:click={() => scrollToSection('home')} class="hover:text-white transition-colors">Home</button></li>
               <li><button on:click={() => scrollToSection('academic')} class="hover:text-white transition-colors">Akademik</button></li>
               <li><button on:click={() => scrollToSection('information')} class="hover:text-white transition-colors">Informasi</button></li>
               <li><button on:click={navigateToLogin} class="hover:text-white transition-colors">Login</button></li>
            </ul>
         </div>
         <div>
            <h4 class="font-semibold mb-4">Kontak</h4>
            <ul class="space-y-2 text-gray-400">
               <li>{schoolInfo.address}</li>
               <li>{schoolInfo.phone}</li>
               <li>{schoolInfo.email}</li>
            </ul>
         </div>
      </div>
      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
         <p>&copy; 2024 NETSA - New Era Technology School Administration. All rights reserved.</p>
      </div>
   </div>
</footer>

<style>
   /* Smooth scrolling for the entire page */
   :global(html) {
      scroll-behavior: smooth;
   }
   
   /* Ensure sections have proper spacing */
   section {
      scroll-margin-top: 4rem;
   }
</style>