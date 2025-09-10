<script>
   import { router } from '@inertiajs/svelte';
   
   export let student;
   export let user;
   
   function goBack() {
      router.visit('/admin/students');
   }
   
   function editStudent() {
      router.visit(`/admin/students/${student.id}/edit`);
   }
   
   function deleteStudent() {
      if (confirm(`Apakah Anda yakin ingin menghapus siswa "${student.nama}"?`)) {
         router.delete(`/admin/students/${student.id}`, {
            onSuccess: () => {
               router.visit('/admin/students');
            }
         });
      }
   }
   
   function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   }
   
   function logout() {
      router.post('/logout');
   }
</script>

<svelte:head>
   <title>Detail Siswa: {student.nama} - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
   <!-- Header -->
   <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div class="flex justify-between items-center py-4">
            <div class="flex items-center space-x-4">
               <button 
                  on:click={goBack}
                  class="text-gray-600 hover:text-gray-900 transition-colors"
               >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
               </button>
               <h1 class="text-2xl font-bold text-gray-900">Detail Siswa</h1>
            </div>
            <div class="flex items-center space-x-4">
               <span class="text-sm text-gray-600">Selamat datang, {user.name}</span>
               <button 
                  on:click={logout}
                  class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
               >
                  Logout
               </button>
            </div>
         </div>
      </div>
   </header>

   <!-- Main Content -->
   <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
         <!-- Student Header -->
         <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div class="flex items-center space-x-4">
               <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
               </div>
               <div class="text-white">
                  <h2 class="text-3xl font-bold">{student.nama}</h2>
                  <p class="text-blue-100">NIPD: {student.nipd}</p>
                  <p class="text-blue-100">Kelas: {student.kelas}</p>
               </div>
            </div>
         </div>

         <!-- Student Details -->
         <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="space-y-4">
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">NIPD</label>
                     <p class="text-lg text-gray-900">{student.nipd}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Nama Lengkap</label>
                     <p class="text-lg text-gray-900">{student.nama}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Kelas</label>
                     <p class="text-lg text-gray-900">{student.kelas}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Tempat Lahir</label>
                     <p class="text-lg text-gray-900">{student.tempat_lahir}</p>
                  </div>
               </div>
               
               <div class="space-y-4">
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Tanggal Lahir</label>
                     <p class="text-lg text-gray-900">{formatDate(student.tanggal_lahir)}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Jenis Kelamin</label>
                     <p class="text-lg text-gray-900">{student.jenis_kelamin}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Agama</label>
                     <p class="text-lg text-gray-900">{student.agama}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-gray-500 mb-1">Status</label>
                     <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {student.is_active ? 'Aktif' : 'Tidak Aktif'}
                     </span>
                  </div>
               </div>
            </div>
            
            <!-- Metadata -->
            <div class="mt-8 pt-6 border-t border-gray-200">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                     <span class="font-medium">Dibuat pada:</span>
                     {formatDate(new Date(student.created_at).toISOString())}
                  </div>
                  <div>
                     <span class="font-medium">Terakhir diperbarui:</span>
                     {formatDate(new Date(student.updated_at).toISOString())}
                  </div>
               </div>
            </div>
         </div>

         <!-- Action Buttons -->
         <div class="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
               on:click={goBack}
               class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
               Kembali
            </button>
            <button
               on:click={editStudent}
               class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
               Edit
            </button>
            <button
               on:click={deleteStudent}
               class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
               Hapus
            </button>
         </div>
      </div>
   </main>
</div>
