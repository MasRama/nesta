<script>
   import { router } from '@inertiajs/svelte';
   import { onMount } from 'svelte';
   
   export let user;
   export let classes = [];
   export let attendance = [];
   export let exams = [];
   
   let currentSection = 'overview';
   
   function navigateToSection(section) {
      currentSection = section;
   }
   
   function logout() {
      router.post('/logout');
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID');
   }
   
   function getAttendancePercentage() {
      if (attendance.length === 0) return 0;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      return Math.round((presentCount / attendance.length) * 100);
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

<style>
	/* Global Transitions */
	* {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

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

	/* Stats Card Enhancements */
	.stats-card-enhanced {
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.stats-card-enhanced::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		transition: transform 0.6s ease;
		transform: scale(0);
		z-index: 0;
	}

	.stats-card-enhanced:hover::before {
		transform: scale(1);
	}

	.stats-card-enhanced:hover {
		transform: translateY(-10px) rotate(2deg) scale(1.02);
	}

	.stats-card-enhanced:nth-child(even):hover {
		transform: translateY(-10px) rotate(-2deg) scale(1.02);
	}

	.stats-card-enhanced > * {
		position: relative;
		z-index: 1;
	}

	/* Content Card Enhancements */
	.content-card-enhanced {
		position: relative;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.content-card-enhanced::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
		transform: translateX(-100%);
		transition: transform 0.6s ease;
	}

	.content-card-enhanced:hover::after {
		transform: translateX(100%);
	}

	.content-card-enhanced:hover {
		transform: translateY(-8px) scale(1.03);
	}

	/* Table Row Enhancements */
	.table-row-enhanced {
		position: relative;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.table-row-enhanced::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		width: 0;
		background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
		transition: width 0.4s ease;
		z-index: 0;
	}

	.table-row-enhanced:hover::before {
		width: 100%;
	}

	.table-row-enhanced:hover {
		transform: translateX(8px) scale(1.01);
		box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
	}

	.table-row-enhanced > * {
		position: relative;
		z-index: 1;
	}

	/* Button Pulse Effect */
	.btn-pulse {
		position: relative;
		overflow: hidden;
	}

	.btn-pulse::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		transition: all 0.4s ease;
		transform: translate(-50%, -50%);
	}

	.btn-pulse:hover::before {
		width: 300px;
		height: 300px;
	}

	/* Loading Animation */
	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	.shimmer {
		position: relative;
		overflow: hidden;
	}

	.shimmer::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		animation: shimmer 2s infinite;
	}

	/* Fade In Animation */
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.fade-in-up {
		animation: fadeInUp 0.6s ease-out;
	}

	/* Stagger Animation */
	.stagger-1 { animation-delay: 0.1s; }
	.stagger-2 { animation-delay: 0.2s; }
	.stagger-3 { animation-delay: 0.3s; }
	.stagger-4 { animation-delay: 0.4s; }
</style>

<svelte:head>
   <title>Dashboard Siswa - NETSA</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
               <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
               </div>
               <div>
                  <h1 class="text-2xl font-bold text-white">Dashboard Siswa</h1>
                  <p class="text-blue-100 text-sm">Portal Akademik NETSA</p>
               </div>
            </div>
            <div class="flex items-center space-x-6">
               <div class="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <span class="text-white font-medium">Selamat datang, {user.name}</span>
               </div>
               <div class="flex items-center space-x-3">
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

   <!-- Modern Material Design Navigation -->
   <nav class="bg-white/90 backdrop-blur-md border-b border-blue-200/30 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex space-x-2 py-4">
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'overview'}
               class:from-blue-600={currentSection === 'overview'}
               class:to-indigo-600={currentSection === 'overview'}
               class:text-white={currentSection === 'overview'}
               class:shadow-lg={currentSection === 'overview'}
               class:bg-gray-100={currentSection !== 'overview'}
               class:text-gray-700={currentSection !== 'overview'}
               class:hover:bg-gray-200={currentSection !== 'overview'}
               on:click={() => navigateToSection('overview')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                  <span>Ringkasan</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'attendance'}
               class:from-green-600={currentSection === 'attendance'}
               class:to-emerald-600={currentSection === 'attendance'}
               class:text-white={currentSection === 'attendance'}
               class:shadow-lg={currentSection === 'attendance'}
               class:bg-gray-100={currentSection !== 'attendance'}
               class:text-gray-700={currentSection !== 'attendance'}
               class:hover:bg-gray-200={currentSection !== 'attendance'}
               on:click={() => navigateToSection('attendance')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Kehadiran</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'exams'}
               class:from-yellow-600={currentSection === 'exams'}
               class:to-orange-600={currentSection === 'exams'}
               class:text-white={currentSection === 'exams'}
               class:shadow-lg={currentSection === 'exams'}
               class:bg-gray-100={currentSection !== 'exams'}
               class:text-gray-700={currentSection !== 'exams'}
               class:hover:bg-gray-200={currentSection !== 'exams'}
               on:click={() => navigateToSection('exams')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  </svg>
                  <span>Ujian</span>
               </div>
            </button>
            <button 
               class="px-6 py-3 rounded-xl font-medium text-sm nav-btn-enhanced"
               class:bg-gradient-to-r={currentSection === 'classes'}
               class:from-purple-600={currentSection === 'classes'}
               class:to-pink-600={currentSection === 'classes'}
               class:text-white={currentSection === 'classes'}
               class:shadow-lg={currentSection === 'classes'}
               class:bg-gray-100={currentSection !== 'classes'}
               class:text-gray-700={currentSection !== 'classes'}
               class:hover:bg-gray-200={currentSection !== 'classes'}
               on:click={() => navigateToSection('classes')}
            >
               <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span>Kelas</span>
               </div>
            </button>
         </div>
      </div>
   </nav>

   <!-- Main Content -->
   <main class="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
      {#if currentSection === 'overview'}
         <!-- Overview Section -->
         <div class="px-4 py-8 sm:px-0">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
               <!-- Modern Material Design Stats Cards -->
               <div class="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-1">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Total Kelas</h3>
                           <p class="text-3xl font-bold text-white">{classes.length}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="group bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-2">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Kehadiran</h3>
                           <p class="text-3xl font-bold text-white">{getAttendancePercentage()}%</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="group bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-3">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">Ujian Mendatang</h3>
                           <p class="text-3xl font-bold text-white">{exams.length}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl stats-card-enhanced overflow-hidden relative fade-in-up stagger-4">
                  <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div class="relative p-6">
                     <div class="flex items-center justify-between">
                        <div class="flex-1">
                           <div class="flex items-center space-x-3 mb-3">
                              <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                 <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                 </svg>
                              </div>
                           </div>
                           <h3 class="text-white/80 text-sm font-medium mb-1">ID Siswa</h3>
                           <p class="text-3xl font-bold text-white">{user.student_id || '-'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <!-- Recent Attendance -->
               <div class="bg-gradient-to-br from-white to-blue-50/80 shadow-xl rounded-2xl border border-blue-200/40 hover:shadow-2xl content-card-enhanced">
                  <div class="px-8 py-10">
                     <div class="flex items-center mb-10">
                        <div class="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                           </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 ml-4 tracking-tight">Kehadiran Terbaru</h3>
                     </div>
                     <div class="space-y-4">
                        {#each attendance.slice(0, 5) as item}
                           <div class="flex justify-between items-center p-4 bg-white/70 rounded-xl border border-blue-100/30 hover:bg-white/90 transition-all duration-200">
                              <div>
                                 <p class="text-sm font-semibold text-gray-800">{item.class_name}</p>
                                 <p class="text-sm text-gray-600">{formatDate(item.attendance_date)}</p>
                              </div>
                              <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm {getStatusColor(item.status)}">
                                 {item.status}
                              </span>
                           </div>
                        {:else}
                           <div class="text-center py-8">
                              <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                 <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                 </svg>
                              </div>
                              <p class="text-sm text-gray-500">Belum ada data kehadiran</p>
                           </div>
                        {/each}
                     </div>
                  </div>
               </div>

               <!-- Upcoming Exams -->
               <div class="bg-gradient-to-br from-white to-indigo-50/80 shadow-xl rounded-2xl border border-indigo-200/40 hover:shadow-2xl content-card-enhanced">
                  <div class="px-8 py-10">
                     <div class="flex items-center mb-6">
                        <div class="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                           <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                           </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 ml-4 tracking-tight">Ujian Mendatang</h3>
                     </div>
                     <div class="space-y-4">
                        {#each exams.slice(0, 5) as exam}
                           <div class="p-4 bg-white/70 rounded-xl border border-purple-100/30 hover:bg-white/90 transition-all duration-200">
                              <div class="border-l-4 border-gradient-to-b from-purple-400 to-purple-600 pl-4">
                                 <div class="flex justify-between">
                                    <div>
                                       <p class="text-sm font-semibold text-gray-800">{exam.title}</p>
                                       <p class="text-sm text-gray-600">Durasi: {exam.duration_minutes} menit</p>
                                    </div>
                                    <div class="text-right">
                                       <p class="text-sm font-medium text-gray-800">{formatDate(exam.start_time)}</p>
                                       <p class="text-xs text-gray-500">{new Date(exam.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        {:else}
                           <div class="text-center py-8">
                              <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                 <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                 </svg>
                              </div>
                              <p class="text-sm text-gray-500">Tidak ada ujian mendatang</p>
                           </div>
                        {/each}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'attendance'}
         <!-- Attendance Section -->
         <div class="px-4 py-8 sm:px-0">
            <div class="bg-gradient-to-br from-white to-emerald-50/80 shadow-xl rounded-2xl border border-emerald-200/40">
               <div class="px-6 py-8">
                  <div class="flex items-center mb-8">
                     <div class="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold text-gray-800 ml-4 tracking-tight">Riwayat Kehadiran</h3>
                  </div>
                  
                  <!-- Attendance Summary -->
                  <div class="mb-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                     <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div class="text-center p-4 bg-white/70 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                           <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                           </div>
                           <div class="text-2xl font-bold text-green-600">{attendance.filter(a => a.status === 'present').length}</div>
                           <div class="text-sm font-medium text-gray-600">Hadir</div>
                        </div>
                        <div class="text-center p-4 bg-white/70 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                           <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center">
                              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                           </div>
                           <div class="text-2xl font-bold text-red-600">{attendance.filter(a => a.status === 'absent').length}</div>
                           <div class="text-sm font-medium text-gray-600">Tidak Hadir</div>
                        </div>
                        <div class="text-center p-4 bg-white/70 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                           <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                           </div>
                           <div class="text-2xl font-bold text-yellow-600">{attendance.filter(a => a.status === 'late').length}</div>
                           <div class="text-sm font-medium text-gray-600">Terlambat</div>
                        </div>
                        <div class="text-center p-4 bg-white/70 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                           <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                              </svg>
                           </div>
                           <div class="text-2xl font-bold text-blue-600">{getAttendancePercentage()}%</div>
                           <div class="text-sm font-medium text-gray-600">Persentase</div>
                        </div>
                     </div>
                  </div>

                  <!-- Attendance List -->
                  <div class="overflow-hidden shadow-xl ring-1 ring-blue-200/50 rounded-2xl bg-white/50 backdrop-blur-sm">
                     <table class="min-w-full divide-y divide-blue-200/30">
                        <thead class="bg-gradient-to-r from-blue-50 to-indigo-50">
                           <tr>
                              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tanggal</th>
                              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Kelas</th>
                              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                              <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Waktu Scan</th>
                           </tr>
                        </thead>
                        <tbody class="bg-white/70 divide-y divide-blue-100/50">
                           {#each attendance as item}
                              <tr class="table-row-enhanced">
                                 <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{formatDate(item.attendance_date)}</td>
                                 <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{item.class_name}</td>
                                 <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm {getStatusColor(item.status)}">
                                       {item.status}
                                    </span>
                                 </td>
                                 <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {item.scanned_at ? new Date(item.scanned_at).toLocaleString('id-ID') : '-'}
                                 </td>
                              </tr>
                           {:else}
                              <tr>
                                 <td colspan="4" class="px-6 py-8 text-center">
                                    <div class="flex flex-col items-center">
                                       <div class="w-16 h-16 mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                          </svg>
                                       </div>
                                       <p class="text-sm text-gray-500">Belum ada data kehadiran</p>
                                    </div>
                                 </td>
                              </tr>
                           {/each}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'exams'}
         <!-- Exams Section -->
         <div class="px-4 py-8 sm:px-0">
            <div class="bg-gradient-to-br from-white to-amber-50/80 shadow-xl rounded-2xl border border-amber-200/40">
               <div class="px-6 py-8">
                  <div class="flex items-center mb-8">
                     <div class="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold text-gray-800 ml-4 tracking-tight">Ujian</h3>
                  </div>
                  
                  <div class="space-y-8">
                     {#each exams as exam}
                        <div class="bg-white/70 border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl content-card-enhanced">
                           <div class="flex justify-between items-start">
                              <div class="flex-1">
                                 <h4 class="text-xl font-bold text-gray-800 mb-2">{exam.title}</h4>
                                 <p class="text-sm text-gray-600 mb-4">{exam.description || 'Tidak ada deskripsi'}</p>
                                 <div class="flex items-center space-x-6 text-sm text-gray-600">
                                    <div class="flex items-center space-x-2">
                                       <div class="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                          </svg>
                                       </div>
                                       <span class="font-medium">{exam.duration_minutes} menit</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                       <div class="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                          </svg>
                                       </div>
                                       <span class="font-medium">{formatDate(exam.start_time)}</span>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                       <div class="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                          </svg>
                                       </div>
                                       <span class="font-medium">{new Date(exam.start_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                                    </div>
                                 </div>
                              </div>
                              <div class="ml-6">
                                 {#if exam.status === 'active' && new Date() >= new Date(exam.start_time) && new Date() <= new Date(exam.end_time)}
                                    <button class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl btn-pulse">
                                       Mulai Ujian
                                    </button>
                                 {:else if exam.attempt_status === 'submitted'}
                                    <div class="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                                       <div class="text-2xl font-bold text-green-600">{exam.percentage}%</div>
                                       <div class="text-xs font-medium text-green-700">Selesai</div>
                                    </div>
                                 {:else if new Date() < new Date(exam.start_time)}
                                    <span class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300">
                                       Menunggu
                                    </span>
                                 {:else}
                                    <span class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
                                       Berakhir
                                    </span>
                                 {/if}
                              </div>
                           </div>
                        </div>
                     {:else}
                        <div class="text-center py-12">
                           <div class="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                              </svg>
                           </div>
                           <p class="text-lg font-medium text-gray-500">Tidak ada ujian tersedia</p>
                        </div>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}

      {#if currentSection === 'classes'}
         <!-- Classes Section -->
         <div class="px-4 py-8 sm:px-0">
            <div class="bg-gradient-to-br from-white to-indigo-50/80 shadow-xl rounded-2xl border border-indigo-200/40">
               <div class="px-6 py-8">
                  <div class="flex items-center mb-8">
                     <div class="p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                     </div>
                     <h3 class="text-2xl font-bold text-gray-800 ml-4 tracking-tight">Kelas Saya</h3>
                  </div>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                     {#each classes as cls}
                        <div class="bg-white/70 border border-indigo-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl content-card-enhanced">
                           <div class="flex items-center justify-between mb-6">
                              <div class="flex items-center space-x-3">
                                 <div class="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                    </svg>
                                 </div>
                                 <h4 class="text-lg font-bold text-gray-800">{cls.name}</h4>
                              </div>
                              <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                                 {cls.grade_level}
                              </span>
                           </div>
                           <p class="text-sm text-gray-600 mb-6 leading-relaxed">{cls.description || 'Tidak ada deskripsi'}</p>
                           <div class="space-y-4">
                              <div class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                                 <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                                       <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                       </svg>
                                    </div>
                                    <span class="text-sm font-medium text-gray-600">Tahun Akademik</span>
                                 </div>
                                 <span class="text-sm font-bold text-gray-800">{cls.academic_year}</span>
                              </div>
                              <div class="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                                 <div class="flex items-center space-x-2">
                                    <div class="w-6 h-6 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                                       <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                       </svg>
                                    </div>
                                    <span class="text-sm font-medium text-gray-600">Maks. Siswa</span>
                                 </div>
                                 <span class="text-sm font-bold text-gray-800">{cls.max_students}</span>
                              </div>
                           </div>
                        </div>
                     {:else}
                        <div class="col-span-full text-center py-12">
                           <div class="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                              </svg>
                           </div>
                           <p class="text-lg font-medium text-gray-500">Anda belum terdaftar di kelas manapun</p>
                        </div>
                     {/each}
                  </div>
               </div>
            </div>
         </div>
      {/if}
   </main>
</div>