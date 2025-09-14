<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';

   export let parent;
   export let students = [];
   export let user;
   
   let currentSection = 'parents';
   
   function goBack() {
      router.visit('/admin/parents');
   }
   
   function editParent() {
      router.visit(`/admin/parents/${parent.id}/edit`);
   }
   
   function deleteParent() {
      if (confirm(`Apakah Anda yakin ingin menghapus wali murid "${parent.nama}"?`)) {
         router.delete(`/admin/parents/${parent.id}`, {
            onSuccess: () => {
               router.visit('/admin/parents');
            }
         });
      }
   }
   
   function formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString('id-ID', {
         year: 'numeric',
         month: 'long',
         day: 'numeric'
      });
   }
   
   function getRelationshipLabel(type) {
      const labels = {
         'ayah': 'Ayah',
         'ibu': 'Ibu',
         'wali': 'Wali',
         'lainnya': 'Lainnya'
      };
      return labels[type] || type;
   }
</script>

<svelte:head>
   <title>Detail Wali Murid - {parent.nama} - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Detail Wali Murid" subtitle="Portal Manajemen NETSA" />
   <AdminNavigation {currentSection} />

   <!-- Main Content -->
   <main class="max-w-6xl mx-auto py-8 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
         <!-- Header -->
         <div class="mb-8 fade-in-up">
            <div class="flex items-center gap-4 mb-4">
               <button
                  on:click={goBack}
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
               >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  Kembali
               </button>
            </div>
            <div class="flex items-center justify-between">
               <div>
                  <h2 class="text-3xl font-bold text-gray-900 mb-2">{parent.nama}</h2>
                  <p class="text-gray-600">Detail informasi wali murid</p>
               </div>
               <div class="flex gap-3">
                  <button
                     on:click={editParent}
                     class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                     <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                     </svg>
                     Edit
                  </button>
                  <button
                     on:click={deleteParent}
                     class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                     <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                     </svg>
                     Hapus
                  </button>
               </div>
            </div>
         </div>

         <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Parent Information -->
            <div class="lg:col-span-2">
               <div class="bg-white rounded-xl shadow-sm border border-gray-200 fade-in-up" style="animation-delay: 0.1s">
                  <div class="px-6 py-4 border-b border-gray-200">
                     <h3 class="text-lg font-medium text-gray-900">Informasi Wali Murid</h3>
                  </div>
                  <div class="p-6">
                     <dl class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Nama Lengkap</dt>
                           <dd class="mt-1 text-sm text-gray-900 font-medium">{parent.nama}</dd>
                        </div>
                        
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Email</dt>
                           <dd class="mt-1 text-sm text-gray-900">{parent.email}</dd>
                        </div>
                        
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Nomor Telepon</dt>
                           <dd class="mt-1 text-sm text-gray-900">{parent.phone || '-'}</dd>
                        </div>
                        
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Status</dt>
                           <dd class="mt-1">
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {parent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                 {parent.is_active ? 'Aktif' : 'Tidak Aktif'}
                              </span>
                           </dd>
                        </div>
                        
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Tanggal Dibuat</dt>
                           <dd class="mt-1 text-sm text-gray-900">{formatDate(parent.created_at)}</dd>
                        </div>
                        
                        <div>
                           <dt class="text-sm font-medium text-gray-500">Terakhir Diupdate</dt>
                           <dd class="mt-1 text-sm text-gray-900">{formatDate(parent.updated_at)}</dd>
                        </div>
                        
                        {#if parent.notes}
                           <div class="md:col-span-2">
                              <dt class="text-sm font-medium text-gray-500">Catatan</dt>
                              <dd class="mt-1 text-sm text-gray-900">{parent.notes}</dd>
                           </div>
                        {/if}
                     </dl>
                  </div>
               </div>
            </div>

            <!-- Statistics -->
            <div class="lg:col-span-1">
               <div class="bg-white rounded-xl shadow-sm border border-gray-200 fade-in-up" style="animation-delay: 0.2s">
                  <div class="px-6 py-4 border-b border-gray-200">
                     <h3 class="text-lg font-medium text-gray-900">Statistik</h3>
                  </div>
                  <div class="p-6">
                     <div class="space-y-4">
                        <div class="text-center">
                           <div class="text-3xl font-bold text-blue-600">{students.length}</div>
                           <div class="text-sm text-gray-500">Total Anak</div>
                        </div>
                        
                        <div class="border-t border-gray-200 pt-4">
                           <div class="text-center">
                              <div class="text-xl font-semibold text-green-600">
                                 {students.filter(s => s.is_primary_contact).length}
                              </div>
                              <div class="text-sm text-gray-500">Kontak Utama</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <!-- Students List -->
         <div class="mt-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 fade-in-up" style="animation-delay: 0.3s">
               <div class="px-6 py-4 border-b border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900">Daftar Anak ({students.length})</h3>
               </div>
               <div class="p-6">
                  {#if students.length === 0}
                     <div class="text-center py-8">
                        <svg class="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                        </svg>
                        <h4 class="text-lg font-medium text-gray-900 mb-2">Belum ada anak terdaftar</h4>
                        <p class="text-gray-500">Wali murid ini belum memiliki anak yang terdaftar dalam sistem.</p>
                     </div>
                  {:else}
                     <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {#each students as student, index}
                           <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" style="animation-delay: {index * 0.1}s">
                              <div class="flex items-start justify-between mb-3">
                                 <div class="flex-1">
                                    <h4 class="font-medium text-gray-900">{student.nama}</h4>
                                    <p class="text-sm text-gray-600">NIPD: {student.nipd}</p>
                                 </div>
                                 {#if student.is_primary_contact}
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                       Kontak Utama
                                    </span>
                                 {/if}
                              </div>
                              
                              <div class="space-y-2 text-sm">
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Kelas:</span>
                                    <span class="font-medium">{student.kelas}</span>
                                 </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Hubungan:</span>
                                    <span class="font-medium">{getRelationshipLabel(student.relationship_type)}</span>
                                 </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Jenis Kelamin:</span>
                                    <span class="font-medium">{student.jenis_kelamin}</span>
                                 </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Tempat Lahir:</span>
                                    <span class="font-medium">{student.tempat_lahir}</span>
                                 </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Tanggal Lahir:</span>
                                    <span class="font-medium">{new Date(student.tanggal_lahir).toLocaleDateString('id-ID')}</span>
                                 </div>
                                 <div class="flex justify-between">
                                    <span class="text-gray-500">Agama:</span>
                                    <span class="font-medium">{student.agama}</span>
                                 </div>
                              </div>
                           </div>
                        {/each}
                     </div>
                  {/if}
               </div>
            </div>
         </div>
      </div>
   </main>
</div>

<style>
   .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
   }

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
</style>
