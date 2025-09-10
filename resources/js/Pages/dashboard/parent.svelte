<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let children = [];
   export let attendanceData = [];
   
   let currentSection = 'overview';
   let selectedChild = children[0] || null;
   
   function navigateToSection(section) {
      currentSection = section;
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function selectChild(child) {
      selectedChild = child;
   }
   
   function getAttendanceStats(childId) {
      const childData = attendanceData.find(data => data.child_id === childId);
      if (!childData || !childData.attendance) return { present: 0, absent: 0, late: 0, total: 0 };
      
      const stats = childData.attendance.reduce((acc, curr) => {
         acc[curr.status] = curr.count;
         acc.total += curr.count;
         return acc;
      }, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
      
      return stats;
   }
   
   function getAttendancePercentage(childId) {
      const stats = getAttendanceStats(childId);
      if (stats.total === 0) return 0;
      return Math.round((stats.present / stats.total) * 100);
   }
   
   function getStatusColor(status) {
      switch (status) {
         case 'present': return 'text-green-600 bg-green-100';
         case 'absent': return 'text-red-600 bg-red-100';
         case 'late': return 'text-yellow-600 bg-yellow-100';
         case 'excused': return 'text-blue-600 bg-blue-100';
         default: return 'text-gray-600 bg-gray-100';
      }
   }
</script>

<svelte:head>
   <title>Dashboard Orang Tua - NETSA</title>
</svelte:head>

<style>
   /* Enhanced Material Design Animations */
   .stats-card-enhanced {
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      transform: translateZ(0);
   }
   
   .stats-card-enhanced:hover {
      transform: translateY(-8px) scale(1.02) translateZ(0);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
   }

   /* Fade in animations with stagger effect */
   .fade-in-up {
      opacity: 0;
      transform: translateY(30px);
      animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
   }

   .stagger-1 { animation-delay: 0.1s; }
   .stagger-2 { animation-delay: 0.2s; }
   .stagger-3 { animation-delay: 0.3s; }
   .stagger-4 { animation-delay: 0.4s; }
   .stagger-5 { animation-delay: 0.5s; }
   .stagger-6 { animation-delay: 0.6s; }
   .stagger-7 { animation-delay: 0.7s; }
   .stagger-8 { animation-delay: 0.8s; }
   .stagger-9 { animation-delay: 0.9s; }
   .stagger-10 { animation-delay: 1.0s; }

   @keyframes fadeInUp {
      to {
         opacity: 1;
         transform: translateY(0);
      }
   }

   /* Smooth hover transitions for buttons */
   .nav-btn-enhanced {
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   }

   .nav-btn-enhanced::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
   }

   .nav-btn-enhanced:hover::before {
      left: 100%;
   }

   /* Enhanced header animation */
   .header-enhanced {
      position: relative;
      overflow: hidden;
   }

   .header-enhanced::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.03), transparent);
      animation: headerShine 8s linear infinite;
   }

   @keyframes headerShine {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
   }

   /* Floating animation for icons */
   .floating-icon {
      animation: float 3s ease-in-out infinite;
   }

   @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
   }

   /* Enhanced backdrop blur */
   .backdrop-blur-enhanced {
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
   }

   /* Enhanced shadow effects */
   .shadow-enhanced {
      box-shadow: 
         0 4px 6px -1px rgba(0, 0, 0, 0.1),
         0 2px 4px -1px rgba(0, 0, 0, 0.06),
         0 0 0 1px rgba(255, 255, 255, 0.1) inset;
   }

   .shadow-enhanced:hover {
      box-shadow: 
         0 20px 25px -5px rgba(0, 0, 0, 0.1),
         0 10px 10px -5px rgba(0, 0, 0, 0.04),
         0 0 0 1px rgba(255, 255, 255, 0.2) inset;
   }

   /* Enhanced Card Interactions */
   .group:hover .floating-icon {
      transform: translateY(-2px) rotate(5deg);
   }
   
   /* Smooth Progress Bar Animation */
   .progress-bar {
      transition: width 1s ease-out;
   }
   
   /* Enhanced Table Row Hover */
   tbody tr:hover {
      background: linear-gradient(90deg, rgba(147, 51, 234, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%);
   }
</style>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
   <!-- Modern Material Design Header -->
   <header class="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 shadow-xl relative overflow-hidden header-enhanced backdrop-blur-enhanced">
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
               <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
               </div>
               <div>
                  <h1 class="text-2xl font-bold text-white">Dashboard Orang Tua</h1>
                  <p class="text-purple-100 text-sm">Portal Akademik NETSA</p>
               </div>
            </div>
            <div class="flex items-center space-x-6">
               <div class="flex items-center space-x-3">
                  <span class="text-white font-medium">Selamat datang, {user.name}</span>
                  <img src={user.profile_image || '/images/default-avatar.png'} alt="Profile" class="h-10 w-10 rounded-full border-2 border-white/30">
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

   <!-- Child Selector -->
   {#if children.length > 1}
      <div class="bg-gradient-to-r from-purple-500 to-indigo-600 text-white backdrop-blur-enhanced">
         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="py-4">
               <span class="text-sm font-medium mr-4 text-purple-100">Pilih Anak:</span>
               <div class="inline-flex space-x-3">
                  {#each children as child}
                     <button 
                        class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 nav-btn-enhanced backdrop-blur-sm border {selectedChild?.id === child.id ? 'bg-white/20 border-white/30 text-white' : 'bg-white/10 border-white/20 text-purple-100 hover:bg-white/15'}"
                        on:click={() => selectChild(child)}
                     >
                        {child.name}
                     </button>
                  {/each}
               </div>
            </div>
         </div>
      </div>
   {/if}

   <!-- Modern Material Design Navigation -->
   <nav class="bg-white/90 backdrop-blur-md border-b border-purple-200/30 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex space-x-2 py-4">
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'overview'}
               class:from-purple-600={currentSection === 'overview'}
               class:to-indigo-600={currentSection === 'overview'}
               class:text-white={currentSection === 'overview'}
               class:shadow-lg={currentSection === 'overview'}
               class:text-gray-600={currentSection !== 'overview'}
               class:hover:bg-purple-50={currentSection !== 'overview'}
               on:click={() => navigateToSection('overview')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"/>
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"/>
                  </svg>
                  <span>Ringkasan</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'attendance'}
               class:from-purple-600={currentSection === 'attendance'}
               class:to-indigo-600={currentSection === 'attendance'}
               class:text-white={currentSection === 'attendance'}
               class:shadow-lg={currentSection === 'attendance'}
               class:text-gray-600={currentSection !== 'attendance'}
               class:hover:bg-purple-50={currentSection !== 'attendance'}
               on:click={() => navigateToSection('attendance')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Kehadiran Anak</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'progress'}
               class:from-purple-600={currentSection === 'progress'}
               class:to-indigo-600={currentSection === 'progress'}
               class:text-white={currentSection === 'progress'}
               class:shadow-lg={currentSection === 'progress'}
               class:text-gray-600={currentSection !== 'progress'}
               class:hover:bg-purple-50={currentSection !== 'progress'}
               on:click={() => navigateToSection('progress')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <span>Progress Akademik</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'communication'}
               class:from-purple-600={currentSection === 'communication'}
               class:to-indigo-600={currentSection === 'communication'}
               class:text-white={currentSection === 'communication'}
               class:shadow-lg={currentSection === 'communication'}
               class:text-gray-600={currentSection !== 'communication'}
               class:hover:bg-purple-50={currentSection !== 'communication'}
               on:click={() => navigateToSection('communication')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <span>Komunikasi</span>
               </div>
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {#if currentSection === 'overview'}
         <!-- Overview Section -->
         <div class="px-4 py-6 sm:px-0">
            {#if children.length === 0}
               <div class="text-center py-12">
                  <div class="text-gray-400 text-6xl mb-4">👨‍👩‍👧‍👦</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Belum Ada Data Anak</h3>
                  <p class="text-gray-600">Silakan hubungi admin sekolah untuk menghubungkan akun Anda dengan data anak.</p>
               </div>
            {:else}
               <!-- Modern Material Design Children Overview -->
               <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                  {#each children as child, index}
                     <div class="group bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-{index + 1} border border-purple-100/50">
                        <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="relative p-6">
                           <div class="flex items-center space-x-4 mb-4">
                              <div class="relative">
                                 <img src={child.profile_image || '/images/default-avatar.png'} alt={child.name} class="h-16 w-16 rounded-2xl border-3 border-white shadow-lg">
                                 <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                       <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                                    </svg>
                                 </div>
                              </div>
                              <div class="flex-1">
                                 <h3 class="text-lg font-bold text-gray-900 mb-1">{child.name}</h3>
                                 <p class="text-sm text-purple-600 font-medium">ID: {child.student_id || 'Belum ditetapkan'}</p>
                                 <p class="text-xs text-gray-500 capitalize mt-1">{child.relationship}</p>
                              </div>
                           </div>
                           
                           <div class="space-y-3">
                              <div class="flex justify-between items-center">
                                 <span class="text-sm font-medium text-gray-600">Tingkat Kehadiran</span>
                                 <span class="text-lg font-bold text-purple-600">{getAttendancePercentage(child.id)}%</span>
                              </div>
                              <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                 <div class="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full progress-bar" style="width: {getAttendancePercentage(child.id)}%"></div>
                              </div>
                              
                              <div class="grid grid-cols-2 gap-3 mt-4">
                                 <div class="bg-green-50 rounded-xl p-3 text-center">
                                    <div class="text-lg font-bold text-green-600">{getAttendanceStats(child.id).present}</div>
                                    <div class="text-xs text-green-700 font-medium">Hadir</div>
                                 </div>
                                 <div class="bg-red-50 rounded-xl p-3 text-center">
                                    <div class="text-lg font-bold text-red-600">{getAttendanceStats(child.id).absent}</div>
                                    <div class="text-xs text-red-700 font-medium">Tidak Hadir</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  {/each}
               </div>

               {#if selectedChild}
                  <!-- Selected Child Details -->
                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <!-- Attendance Summary -->
                     <div class="bg-gradient-to-br from-white to-purple-50/30 shadow-2xl rounded-3xl border border-purple-100/50 fade-in-up">
                        <div class="px-8 py-8">
                           <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                              <svg class="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                              </svg>
                              Ringkasan Kehadiran - {selectedChild.name}
                           </h3>
                           <div class="grid grid-cols-2 gap-6">
                              {#each Object.entries(getAttendanceStats(selectedChild.id)) as [status, count], index}
                                 {#if status !== 'total'}
                                    <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-{index + 1}">
                                       <div class="text-3xl font-bold mb-2 {status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : status === 'late' ? 'text-yellow-600' : 'text-blue-600'}">{count}</div>
                                       <div class="text-sm font-semibold {status === 'present' ? 'text-green-700' : status === 'absent' ? 'text-red-700' : status === 'late' ? 'text-yellow-700' : 'text-blue-700'}">
                                          {status === 'present' ? 'Hadir' : status === 'absent' ? 'Tidak Hadir' : status === 'late' ? 'Terlambat' : 'Izin'}
                                       </div>
                                    </div>
                                 {/if}
                              {/each}
                           </div>
                           <div class="mt-6 p-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-200/50">
                              <div class="flex justify-between items-center">
                                 <span class="text-lg font-bold text-gray-900 flex items-center">
                                    <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                                    </svg>
                                    Persentase Kehadiran
                                 </span>
                                 <span class="text-2xl font-bold text-purple-600">{getAttendancePercentage(selectedChild.id)}%</span>
                              </div>
                              <div class="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
                                 <div class="progress-bar bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" style="width: {getAttendancePercentage(selectedChild.id)}%"></div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <!-- Academic Information -->
                     <div class="bg-gradient-to-br from-white to-purple-50/30 shadow-2xl rounded-3xl border border-purple-100/50 fade-in-up">
                        <div class="px-8 py-8">
                           <h3 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                              <svg class="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                              </svg>
                              Informasi Akademik
                           </h3>
                           <div class="space-y-6">
                              <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-1">
                                 <div class="flex items-center mb-3">
                                    <div class="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-3"></div>
                                    <h4 class="text-lg font-bold text-gray-900">ID Siswa</h4>
                                 </div>
                                 <p class="text-xl font-semibold text-blue-600 ml-7">{selectedChild.student_id || 'Belum ditetapkan'}</p>
                              </div>
                              <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-2">
                                 <div class="flex items-center mb-3">
                                    <div class="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mr-3"></div>
                                    <h4 class="text-lg font-bold text-gray-900">Status</h4>
                                 </div>
                                 <div class="ml-7">
                                    <span class="inline-flex items-center px-4 py-2 text-sm font-bold text-green-700 bg-green-100 rounded-full">
                                       <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                       </svg>
                                       Aktif
                                    </span>
                                 </div>
                              </div>
                              <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-3">
                                 <div class="flex items-center mb-3">
                                    <div class="w-4 h-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full mr-3"></div>
                                    <h4 class="text-lg font-bold text-gray-900">Hubungan</h4>
                                 </div>
                                 <p class="text-xl font-semibold text-purple-600 ml-7 capitalize">{selectedChild.relationship}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               {/if}
            {/if}
         </div>
      {/if}

      {#if currentSection === 'attendance'}
         <!-- Attendance Section -->
         <div class="px-4 py-6 sm:px-0">
            {#if selectedChild}
               <div class="bg-gradient-to-br from-white to-purple-50/30 shadow-2xl rounded-3xl border border-purple-100/50 fade-in-up">
                  <div class="px-8 py-8">
                     <div class="flex items-center justify-between mb-8">
                        <h3 class="text-2xl font-bold text-gray-900 flex items-center">
                           <svg class="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                           </svg>
                           Detail Kehadiran - {selectedChild.name}
                        </h3>
                        <div class="floating-icon">
                           <svg class="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                           </svg>
                        </div>
                     </div>
                     
                     <!-- Monthly Summary -->
                     <div class="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-200/50">
                        <h4 class="text-lg font-bold text-gray-900 mb-6 flex items-center">
                           <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12m-8 0V9a2 2 0 012-2h4a2 2 0 012 2v0"/>
                           </svg>
                           Ringkasan Bulan Ini
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                           {#each Object.entries(getAttendanceStats(selectedChild.id)) as [status, count]}
                              {#if status !== 'total'}
                                 <div class="group bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50">
                                    <div class="text-3xl font-bold mb-2 {status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : status === 'late' ? 'text-yellow-600' : 'text-blue-600'}">{count}</div>
                                    <div class="text-sm font-semibold {status === 'present' ? 'text-green-700' : status === 'absent' ? 'text-red-700' : status === 'late' ? 'text-yellow-700' : 'text-blue-700'}">
                                       {status === 'present' ? 'Hadir' : status === 'absent' ? 'Tidak Hadir' : status === 'late' ? 'Terlambat' : 'Izin'}
                                    </div>
                                 </div>
                              {/if}
                           {/each}
                        </div>
                     </div>

                     <!-- Modern Attendance Details -->
                     {#if attendanceData && attendanceData.find(data => data.child_id === selectedChild.id)?.attendance_records}
                        <div class="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100/50 overflow-hidden fade-in-up">
                           <div class="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                              <h4 class="text-lg font-bold text-white flex items-center">
                                 <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4"/>
                                 </svg>
                                 Riwayat Kehadiran Harian
                              </h4>
                           </div>
                           <div class="overflow-x-auto">
                              <table class="min-w-full">
                                 <thead class="bg-gradient-to-r from-gray-50 to-purple-50/30">
                                    <tr>
                                       <th scope="col" class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Tanggal</th>
                                       <th scope="col" class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                       <th scope="col" class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Waktu Masuk</th>
                                       <th scope="col" class="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Waktu Keluar</th>
                                    </tr>
                                 </thead>
                                 <tbody class="divide-y divide-purple-100/50">
                                    {#each attendanceData.find(data => data.child_id === selectedChild.id).attendance_records as attendance, index}
                                       <tr class="group hover:bg-purple-50/30 transition-colors duration-200 fade-in-up stagger-{index + 1}">
                                          <td class="px-6 py-4 whitespace-nowrap">
                                             <div class="flex items-center">
                                                <div class="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                                                <span class="text-sm font-medium text-gray-900">{formatDate(attendance.date)}</span>
                                             </div>
                                          </td>
                                          <td class="px-6 py-4 whitespace-nowrap">
                                             <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full shadow-sm {getStatusColor(attendance.status)}">
                                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                   {#if attendance.status === 'present'}
                                                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                                   {:else if attendance.status === 'absent'}
                                                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                                                   {:else}
                                                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                                                   {/if}
                                                </svg>
                                                {attendance.status === 'present' ? 'Hadir' : attendance.status === 'absent' ? 'Tidak Hadir' : attendance.status === 'late' ? 'Terlambat' : 'Izin'}
                                             </span>
                                          </td>
                                          <td class="px-6 py-4 whitespace-nowrap">
                                             <span class="text-sm font-medium text-gray-900 bg-green-50 px-2 py-1 rounded-lg">{attendance.check_in || '-'}</span>
                                          </td>
                                          <td class="px-6 py-4 whitespace-nowrap">
                                             <span class="text-sm font-medium text-gray-900 bg-red-50 px-2 py-1 rounded-lg">{attendance.check_out || '-'}</span>
                                          </td>
                                       </tr>
                                    {/each}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     {:else}
                        <div class="text-center py-12 bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100/50 fade-in-up">
                           <div class="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                           </div>
                           <h3 class="text-xl font-bold text-gray-900 mb-2">Tidak ada data kehadiran</h3>
                           <p class="text-gray-600 max-w-md mx-auto">Data kehadiran untuk anak ini belum tersedia. Silakan hubungi sekolah untuk informasi lebih lanjut.</p>
                        </div>
                     {/if}
                  </div>
               </div>
            {:else}
               <div class="text-center py-12">
                  <div class="text-gray-400 text-6xl mb-4">👶</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Pilih Anak</h3>
                  <p class="text-gray-600">Silakan pilih anak terlebih dahulu untuk melihat data kehadiran.</p>
               </div>
            {/if}
         </div>
      {/if}

      {#if currentSection === 'progress'}
         <!-- Progress Section -->
         <div class="px-4 py-6 sm:px-0">
            {#if selectedChild}
               <div class="bg-gradient-to-br from-white to-purple-50/30 shadow-2xl rounded-3xl border border-purple-100/50 fade-in-up">
                  <div class="px-8 py-8">
                     <div class="flex items-center justify-between mb-8">
                        <h3 class="text-2xl font-bold text-gray-900 flex items-center">
                           <svg class="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                           </svg>
                           Progress Akademik - {selectedChild.name}
                        </h3>
                        <div class="floating-icon">
                           <svg class="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                           </svg>
                        </div>
                     </div>
                     
                     <div class="text-center py-16 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl border border-purple-200/50 fade-in-up stagger-2">
                        <div class="mx-auto w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                           <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                           </svg>
                        </div>
                        <h4 class="text-xl font-bold text-gray-900 mb-3">Progress Akademik</h4>
                        <p class="text-gray-600 mb-2 max-w-md mx-auto">Data nilai, ujian, dan progress belajar anak akan ditampilkan di sini</p>
                        <p class="text-sm text-purple-600 font-medium">Fitur dalam pengembangan</p>
                     </div>

                     <!-- Placeholder for future academic data -->
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div class="bg-white/70 backdrop-blur-sm p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-3">
                           <div class="text-3xl text-purple-500 mb-3 floating-icon">📝</div>
                           <h5 class="font-bold text-gray-700 mb-2">Nilai Rata-rata</h5>
                           <p class="text-3xl font-bold text-gray-400">--</p>
                        </div>
                        <div class="bg-white/70 backdrop-blur-sm p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-4">
                           <div class="text-3xl text-purple-500 mb-3 floating-icon">🎯</div>
                           <h5 class="font-bold text-gray-700 mb-2">Ujian Selesai</h5>
                           <p class="text-3xl font-bold text-gray-400">--</p>
                        </div>
                        <div class="bg-white/70 backdrop-blur-sm p-6 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 fade-in-up stagger-5">
                           <div class="text-3xl text-purple-500 mb-3 floating-icon">📈</div>
                           <h5 class="font-bold text-gray-700 mb-2">Ranking Kelas</h5>
                           <p class="text-3xl font-bold text-gray-400">--</p>
                        </div>
                     </div>
                  </div>
               </div>
            {:else}
               <div class="text-center py-12 fade-in-up">
                  <div class="text-gray-400 text-6xl mb-4">👶</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Pilih Anak</h3>
                  <p class="text-gray-600">Silakan pilih anak terlebih dahulu untuk melihat progress akademik.</p>
               </div>
            {/if}
         </div>
      {/if}

      {#if currentSection === 'communication'}
         <!-- Communication Section -->
         <div class="px-4 py-6 sm:px-0">
            <div class="bg-gradient-to-br from-white to-purple-50/30 shadow-2xl rounded-3xl border border-purple-100/50 fade-in-up">
               <div class="px-8 py-8">
                  <div class="flex items-center justify-between mb-8">
                     <h3 class="text-2xl font-bold text-gray-900 flex items-center">
                        <svg class="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        Komunikasi dengan Sekolah
                     </h3>
                     <div class="floating-icon">
                        <svg class="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                           <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd"/>
                        </svg>
                     </div>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <!-- Announcements -->
                     <div class="fade-in-up stagger-2">
                        <h4 class="text-lg font-bold text-gray-900 mb-6 flex items-center">
                           <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
                           </svg>
                           Pengumuman Terbaru
                        </h4>
                        <div class="space-y-4">
                           <div class="bg-white/70 backdrop-blur-sm border-l-4 border-blue-500 pl-6 py-4 rounded-r-2xl shadow-lg hover:shadow-xl transition-all duration-300 fade-in-up stagger-3">
                              <p class="text-sm font-bold text-gray-900 mb-1">Libur Semester</p>
                              <p class="text-sm text-gray-600 mb-2">Informasi jadwal libur semester akan diumumkan segera</p>
                              <p class="text-xs text-blue-600 font-medium">2 hari yang lalu</p>
                           </div>
                           <div class="bg-white/70 backdrop-blur-sm border-l-4 border-green-500 pl-6 py-4 rounded-r-2xl shadow-lg hover:shadow-xl transition-all duration-300 fade-in-up stagger-4">
                              <p class="text-sm font-bold text-gray-900 mb-1">Rapat Orang Tua</p>
                              <p class="text-sm text-gray-600 mb-2">Undangan rapat orang tua siswa bulan ini</p>
                              <p class="text-xs text-green-600 font-medium">5 hari yang lalu</p>
                           </div>
                        </div>
                     </div>

                     <!-- Teacher Messages -->
                     <div class="fade-in-up stagger-5">
                        <h4 class="text-lg font-bold text-gray-900 mb-6 flex items-center">
                           <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                           </svg>
                           Pesan dari Guru
                        </h4>
                        <div class="space-y-4">
                           <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 fade-in-up stagger-6">
                              <p class="text-sm font-bold text-purple-900 mb-1">Bu Sari - Wali Kelas</p>
                              <p class="text-sm text-gray-700 mb-2">Anak Anda menunjukkan progress yang baik dalam matematika</p>
                              <p class="text-xs text-purple-600 font-medium">1 hari yang lalu</p>
                           </div>
                           <div class="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 fade-in-up stagger-7">
                              <p class="text-sm font-bold text-purple-900 mb-1">Pak Budi - Guru Olahraga</p>
                              <p class="text-sm text-gray-700 mb-2">Jangan lupa bawa perlengkapan olahraga besok</p>
                              <p class="text-xs text-purple-600 font-medium">3 hari yang lalu</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Contact Information -->
                  <div class="mt-12 pt-8 border-t border-purple-200/50 fade-in-up stagger-8">
                     <h4 class="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <svg class="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        Kontak Sekolah
                     </h4>
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="flex items-center bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 fade-in-up stagger-9">
                           <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                              <span class="text-white text-lg">📞</span>
                           </div>
                           <span class="font-medium text-gray-900">+62 21 12345678</span>
                        </div>
                        <div class="flex items-center bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 fade-in-up stagger-10">
                           <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                              <span class="text-white text-lg">✉️</span>
                           </div>
                           <span class="font-medium text-gray-900">info@netsa.school.id</span>
                        </div>
                        <div class="flex items-center bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100 fade-in-up stagger-1">
                           <div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3">
                              <span class="text-white text-lg">📍</span>
                           </div>
                           <span class="font-medium text-gray-900">Jl. Pendidikan No. 123, Jakarta</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>