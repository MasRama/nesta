<script>
   import { router } from '@inertiajs/svelte';
   import AdminHeader from '../../../Components/AdminHeader.svelte';
   import AdminNavigation from '../../../Components/AdminNavigation.svelte';
   
   export let parent;
   export let students = [];
   export let user;
   export let errors = {};
   
   let form = {
      nama: parent.nama || '',
      email: parent.email || '',
      password: '', // Leave empty for no change
      phone: parent.phone || '',
      notes: parent.notes || ''
   };
   
   let isLoading = false;
   let currentSection = 'parents';
   
   // Student management state
   let studentSearch = {
      nipd: '',
      relationship_type: 'wali',
      is_primary_contact: false,
      isSearching: false,
      foundStudent: null,
      error: null
   };
   
   let currentStudents = [...students];
   
   async function searchStudent() {
      if (!studentSearch.nipd.trim()) {
         studentSearch.error = 'NIPD harus diisi';
         return;
      }
      
      studentSearch.isSearching = true;
      studentSearch.error = null;
      studentSearch.foundStudent = null;
      
      try {
         const response = await fetch(`/api/students/search-nipd?nipd=${encodeURIComponent(studentSearch.nipd)}`);
         const data = await response.json();
         
         if (response.ok) {
            studentSearch.foundStudent = data.student;
            
            // Check if student already added
            const alreadyAdded = currentStudents.some(s => s.nipd === data.student.nipd);
            if (alreadyAdded) {
               studentSearch.error = 'Siswa sudah ditambahkan';
               studentSearch.foundStudent = null;
            }
         } else {
            studentSearch.error = data.error || 'Siswa tidak ditemukan';
         }
      } catch (error) {
         console.error('Error searching student:', error);
         studentSearch.error = 'Terjadi kesalahan saat mencari siswa';
      } finally {
         studentSearch.isSearching = false;
      }
   }
   
   async function addStudent() {
      if (!studentSearch.foundStudent) return;
      
      try {
         const response = await fetch(`/admin/parents/${parent.id}/students`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({
               nipd: studentSearch.foundStudent.nipd,
               relationship_type: studentSearch.relationship_type,
               is_primary_contact: studentSearch.is_primary_contact
            })
         });
         
         if (response.ok) {
            // Add to current list
            currentStudents = [...currentStudents, {
               ...studentSearch.foundStudent,
               relationship_type: studentSearch.relationship_type,
               is_primary_contact: studentSearch.is_primary_contact
            }];
            
            // Reset search
            studentSearch.nipd = '';
            studentSearch.foundStudent = null;
            studentSearch.relationship_type = 'wali';
            studentSearch.is_primary_contact = false;
         } else {
            const data = await response.json();
            studentSearch.error = data.error || 'Gagal menambahkan siswa';
         }
      } catch (error) {
         console.error('Error adding student:', error);
         studentSearch.error = 'Terjadi kesalahan saat menambahkan siswa';
      }
   }
   
   async function removeStudent(studentId) {
      try {
         const response = await fetch(`/admin/parents/${parent.id}/students/${studentId}`, {
            method: 'DELETE'
         });
         
         if (response.ok) {
            currentStudents = currentStudents.filter(s => s.id !== studentId);
         } else {
            const data = await response.json();
            alert(data.error || 'Gagal menghapus siswa');
         }
      } catch (error) {
         console.error('Error removing student:', error);
         alert('Terjadi kesalahan saat menghapus siswa');
      }
   }
   
   async function handleSubmit() {
      if (isLoading) return;
      
      isLoading = true;
      errors = {};
      
      // Only include password if it's not empty
      const submitData = { ...form };
      if (!submitData.password) {
         delete submitData.password;
      }
      
      router.put(`/admin/parents/${parent.id}`, submitData, {
         onSuccess: () => {
            router.visit('/admin/parents');
         },
         onError: (validationErrors) => {
            errors = validationErrors;
            console.log('Validation errors:', validationErrors);
         },
         onFinish: () => {
            isLoading = false;
         }
      });
   }
   
   function goBack() {
      router.visit('/admin/parents');
   }
   
   function handleNipdKeydown(event) {
      if (event.key === 'Enter') {
         event.preventDefault();
         searchStudent();
      }
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
   <title>Edit Wali Murid - {parent.nama} - NETSA Admin</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
   <AdminHeader {user} title="Edit Wali Murid" subtitle="Portal Manajemen NETSA" />
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
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Edit Wali Murid - {parent.nama}</h2>
            <p class="text-gray-600">Update informasi wali murid dan kelola daftar anak</p>
         </div>

         <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Basic Information Form -->
            <div class="lg:col-span-1">
               <form on:submit|preventDefault={handleSubmit}>
                  <div class="bg-white rounded-xl shadow-sm border border-gray-200 fade-in-up" style="animation-delay: 0.1s">
                     <div class="px-6 py-4 border-b border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900">Informasi Dasar</h3>
                     </div>
                     <div class="p-6 space-y-6">
                        <div>
                           <label for="nama" class="block text-sm font-medium text-gray-700 mb-2">
                              Nama Lengkap <span class="text-red-500">*</span>
                           </label>
                           <input
                              type="text"
                              id="nama"
                              bind:value={form.nama}
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                              class:border-red-500={errors.nama}
                              placeholder="Masukkan nama lengkap"
                           />
                           {#if errors.nama}
                              <p class="mt-1 text-sm text-red-600">{errors.nama}</p>
                           {/if}
                        </div>

                        <div>
                           <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                              Email <span class="text-red-500">*</span>
                           </label>
                           <input
                              type="email"
                              id="email"
                              bind:value={form.email}
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                              class:border-red-500={errors.email}
                              placeholder="contoh@email.com"
                           />
                           {#if errors.email}
                              <p class="mt-1 text-sm text-red-600">{errors.email}</p>
                           {/if}
                        </div>

                        <div>
                           <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                              Password Baru
                           </label>
                           <input
                              type="password"
                              id="password"
                              bind:value={form.password}
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                              class:border-red-500={errors.password}
                              placeholder="Kosongkan jika tidak ingin mengubah"
                           />
                           <p class="mt-1 text-sm text-gray-500">Kosongkan jika tidak ingin mengubah password</p>
                           {#if errors.password}
                              <p class="mt-1 text-sm text-red-600">{errors.password}</p>
                           {/if}
                        </div>

                        <div>
                           <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                              Nomor Telepon
                           </label>
                           <input
                              type="tel"
                              id="phone"
                              bind:value={form.phone}
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                              placeholder="08xxxxxxxxxx"
                           />
                        </div>

                        <div>
                           <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                              Catatan
                           </label>
                           <textarea
                              id="notes"
                              bind:value={form.notes}
                              rows="3"
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                              placeholder="Catatan tambahan (opsional)"
                           ></textarea>
                        </div>

                        <!-- Submit Buttons -->
                        <div class="flex justify-end gap-4 pt-4 border-t border-gray-200">
                           <button
                              type="button"
                              on:click={goBack}
                              class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                           >
                              Batal
                           </button>
                           <button
                              type="submit"
                              disabled={isLoading}
                              class="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
                           >
                              {#if isLoading}
                                 <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 Menyimpan...
                              {:else}
                                 Simpan Perubahan
                              {/if}
                           </button>
                        </div>
                     </div>
                  </div>
               </form>
            </div>

            <!-- Student Management -->
            <div class="lg:col-span-1">
               <div class="bg-white rounded-xl shadow-sm border border-gray-200 fade-in-up" style="animation-delay: 0.2s">
                  <div class="px-6 py-4 border-b border-gray-200">
                     <h3 class="text-lg font-medium text-gray-900">Manajemen Anak ({currentStudents.length})</h3>
                  </div>
                  <div class="p-6 space-y-6">
                     <!-- Add Student Form -->
                     <div class="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 class="font-medium text-gray-900">Tambah Anak Baru</h4>
                        
                        <div class="space-y-3">
                           <div>
                              <label for="nipd-search" class="block text-sm font-medium text-gray-700 mb-2">NIPD Siswa</label>
                              <div class="flex gap-2">
                                 <input
                                    type="text"
                                    id="nipd-search"
                                    bind:value={studentSearch.nipd}
                                    on:keydown={handleNipdKeydown}
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Masukkan NIPD"
                                 />
                                 <button
                                    type="button"
                                    on:click={searchStudent}
                                    disabled={studentSearch.isSearching}
                                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                 >
                                    {#if studentSearch.isSearching}
                                       <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                       </svg>
                                    {:else}
                                       Cari
                                    {/if}
                                 </button>
                              </div>
                           </div>

                           <div class="grid grid-cols-2 gap-3">
                              <div>
                                 <label for="relationship-type" class="block text-sm font-medium text-gray-700 mb-2">Hubungan</label>
                                 <select
                                    id="relationship-type"
                                    bind:value={studentSearch.relationship_type}
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                 >
                                    <option value="ayah">Ayah</option>
                                    <option value="ibu">Ibu</option>
                                    <option value="wali">Wali</option>
                                    <option value="lainnya">Lainnya</option>
                                 </select>
                              </div>

                              <div class="flex items-end">
                                 <label class="flex items-center">
                                    <input
                                       type="checkbox"
                                       bind:checked={studentSearch.is_primary_contact}
                                       class="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                    />
                                    <span class="ml-2 text-sm text-gray-700">Kontak utama</span>
                                 </label>
                              </div>
                           </div>
                        </div>

                        {#if studentSearch.error}
                           <div class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                              {studentSearch.error}
                           </div>
                        {/if}

                        {#if studentSearch.foundStudent}
                           <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div class="flex items-center justify-between">
                                 <div>
                                    <h5 class="font-medium text-green-900">{studentSearch.foundStudent.nama}</h5>
                                    <p class="text-sm text-green-700">NIPD: {studentSearch.foundStudent.nipd} | Kelas: {studentSearch.foundStudent.kelas}</p>
                                 </div>
                                 <button
                                    type="button"
                                    on:click={addStudent}
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                 >
                                    Tambahkan
                                 </button>
                              </div>
                           </div>
                        {/if}
                     </div>

                     <!-- Current Students List -->
                     <div>
                        <h4 class="font-medium text-gray-900 mb-3">Daftar Anak Saat Ini</h4>
                        {#if currentStudents.length === 0}
                           <div class="text-center py-6 text-gray-500">
                              <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/>
                              </svg>
                              <p class="text-sm">Belum ada anak terdaftar</p>
                           </div>
                        {:else}
                           <div class="space-y-3 max-h-96 overflow-y-auto">
                              {#each currentStudents as student}
                                 <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div class="flex-1">
                                       <h5 class="font-medium text-gray-900">{student.nama}</h5>
                                       <p class="text-sm text-gray-600">
                                          NIPD: {student.nipd} | Kelas: {student.kelas} | 
                                          {getRelationshipLabel(student.relationship_type)}
                                          {#if student.is_primary_contact}
                                             <span class="text-blue-600 font-medium">• Kontak Utama</span>
                                          {/if}
                                       </p>
                                    </div>
                                    <button
                                       type="button"
                                       on:click={() => removeStudent(student.id)}
                                       class="text-red-600 hover:text-red-800 transition-colors ml-3"
                                       aria-label="Hapus siswa"
                                    >
                                       <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                       </svg>
                                    </button>
                                 </div>
                              {/each}
                           </div>
                        {/if}
                     </div>
                  </div>
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
