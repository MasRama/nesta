<script lang="ts">
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';
   import { teacherAPI, showToast } from '../../../utils/api.js';

   export let teacher: {
      id: number;
      nip: string;
      name: string;
      email: string;
      subject: string;
      phone?: string;
      status: 'active' | 'inactive';
      notes?: string;
      created_at: string;
      updated_at: string;
   };

   export let user: any;

   function editTeacher() {
      router.visit(`/admin/teachers/${teacher.id}/edit`);
   }

   async function deleteTeacher() {
      if (confirm('Apakah Anda yakin ingin menghapus guru ini?')) {
         try {
            const loadingToast = showToast.loading('Menghapus guru...');

            await teacherAPI.delete(teacher.id);

            showToast.dismiss(loadingToast);
            showToast.success('Guru berhasil dihapus');

            // Redirect to teachers list after successful deletion
            router.visit('/admin/teachers');

         } catch (error) {
            console.error('Error deleting teacher:', error);
            showToast.error('Gagal menghapus guru');
         }
      }
   }

   function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString('id-ID', {
         year: 'numeric',
         month: 'long',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
      });
   }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader 
      {user} 
      title="Detail Guru" 
      subtitle="Informasi lengkap data guru"
      showBackButton={true}
      backUrl="/admin/teachers"
   />
   
   <div class="container mx-auto px-4 py-8">
      <AdminNavigation />
      
      <!-- Detail Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
         <!-- Header -->
         <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div class="flex items-center justify-between">
               <div class="flex items-center space-x-4">
                  <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                     <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                  </div>
                  <div>
                     <h2 class="text-2xl font-bold text-white">{teacher.name}</h2>
                     <p class="text-blue-100">NIP: {teacher.nip}</p>
                  </div>
               </div>
               
               <div class="flex space-x-3">
                  <button 
                     on:click={editTeacher}
                     class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                     </svg>
                     <span>Edit</span>
                  </button>
                  
                  <button 
                     on:click={deleteTeacher}
                     class="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                     <span>Hapus</span>
                  </button>
               </div>
            </div>
         </div>
         
         <!-- Content -->
         <div class="p-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <!-- Informasi Dasar -->
               <div class="space-y-6">
                  <h3 class="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Informasi Dasar</h3>
                  
                  <div class="space-y-4">
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">NIP</label>
                        <p class="text-slate-900 font-medium">{teacher.nip}</p>
                     </div>
                     
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">Nama Lengkap</label>
                        <p class="text-slate-900 font-medium">{teacher.name}</p>
                     </div>
                     
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">Email</label>
                        <p class="text-slate-900">{teacher.email}</p>
                     </div>
                     
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">Mata Pelajaran</label>
                        <p class="text-slate-900 font-medium">{teacher.subject}</p>
                     </div>
                  </div>
               </div>
               
               <!-- Informasi Kontak & Status -->
               <div class="space-y-6">
                  <h3 class="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Kontak & Status</h3>
                  
                  <div class="space-y-4">
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">No. Telepon</label>
                        <p class="text-slate-900">{teacher.phone || '-'}</p>
                     </div>
                     
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">Status</label>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                           {teacher.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'}
                        ">
                           {teacher.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                     </div>
                     
                     <div>
                        <label class="block text-sm font-medium text-slate-600 mb-1">Catatan</label>
                        <p class="text-slate-900">{teacher.notes || '-'}</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <!-- Informasi Sistem -->
            <div class="mt-8 pt-6 border-t border-slate-200">
               <h3 class="text-lg font-semibold text-slate-800 mb-4">Informasi Sistem</h3>
               
               <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                     <label class="block text-sm font-medium text-slate-600 mb-1">Dibuat pada</label>
                     <p class="text-slate-900">{formatDate(teacher.created_at)}</p>
                  </div>
                  
                  <div>
                     <label class="block text-sm font-medium text-slate-600 mb-1">Terakhir diupdate</label>
                     <p class="text-slate-900">{formatDate(teacher.updated_at)}</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>

<style>
   :global(body) {
      font-family: 'Inter', sans-serif;
   }
</style>