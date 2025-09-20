import { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
    // Clear existing data in reverse order of dependencies
    await knex('teacher_subjects').del();
    await knex('subject_classes').del();
    await knex('subjects').del();
    await knex('teachers').del();
    await knex('users').del();

    console.log('🗑️  Cleared existing data');

    // Define UUIDs for consistent relationships
    const adminUserId = '550e8400-e29b-41d4-a716-446655440001';
    const teacherUserId = '550e8400-e29b-41d4-a716-446655440002';
    const teacherId = '550e8400-e29b-41d4-a716-446655440003';
    
    const subjectMtkId = '550e8400-e29b-41d4-a716-446655440004';
    const subjectIpaId = '550e8400-e29b-41d4-a716-446655440005';
    const subjectIpsId = '550e8400-e29b-41d4-a716-446655440006';

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const teacherPassword = await bcrypt.hash('guru123', 10);

    const now = Date.now();

    // 1. Insert Admin User
    await knex('users').insert({
        id: adminUserId,
        name: 'Administrator',
        email: 'admin@sekolah.com',
        phone: '081234567890',
        is_verified: true,
        is_admin: true,
        password: adminPassword,
        remember_me_token: null,
        membership_date: new Date(),
        created_at: now,
        updated_at: now
    });

    console.log('✅ Admin user created: admin@sekolah.com / admin123');

    // 2. Insert Teacher User
    await knex('users').insert({
        id: teacherUserId,
        name: 'Budi Santoso',
        email: 'budi.santoso@sekolah.com',
        phone: '081234567891',
        is_verified: true,
        is_admin: false,
        password: teacherPassword,
        remember_me_token: null,
        membership_date: new Date(),
        created_at: now,
        updated_at: now
    });

    console.log('✅ Teacher user created: budi.santoso@sekolah.com / guru123');

    // 3. Insert Teacher Data
    await knex('teachers').insert({
        id: teacherId,
        nip: '196801011990031001',
        nama: 'Budi Santoso, S.Pd',
        email: 'budi.santoso@sekolah.com',
        password: teacherPassword,
        phone: '081234567891',
        user_id: teacherUserId,
        is_active: true,
        notes: 'Guru senior dengan pengalaman 20 tahun',
        created_at: now,
        updated_at: now
    });

    console.log('✅ Teacher data created: Budi Santoso, S.Pd');

    // 4. Insert Subjects
    const subjects = [
        {
            id: subjectMtkId,
            kode: 'MTK',
            nama: 'Matematika',
            deskripsi: 'Mata pelajaran Matematika untuk tingkat SMP yang mencakup aljabar, geometri, dan statistika dasar',
            is_active: true,
            notes: 'Mata pelajaran wajib untuk semua tingkat',
            created_at: now,
            updated_at: now
        },
        {
            id: subjectIpaId,
            kode: 'IPA',
            nama: 'Ilmu Pengetahuan Alam',
            deskripsi: 'Mata pelajaran IPA yang mencakup fisika, kimia, dan biologi untuk tingkat SMP',
            is_active: true,
            notes: 'Mata pelajaran wajib dengan praktikum laboratorium',
            created_at: now,
            updated_at: now
        },
        {
            id: subjectIpsId,
            kode: 'IPS',
            nama: 'Ilmu Pengetahuan Sosial',
            deskripsi: 'Mata pelajaran IPS yang mencakup sejarah, geografi, ekonomi, dan sosiologi',
            is_active: true,
            notes: 'Mata pelajaran wajib untuk pemahaman sosial dan budaya',
            created_at: now,
            updated_at: now
        }
    ];

    await knex('subjects').insert(subjects);
    console.log('✅ Subjects created: MTK, IPA, IPS');

    // 5. Assign Teacher to Subjects (Teacher mengajar semua mata pelajaran)
    const teacherSubjects = [
        {
            id: '550e8400-e29b-41d4-a716-446655440007',
            teacher_id: teacherId,
            subject_id: subjectMtkId,
            is_active: true,
            created_at: now,
            updated_at: now
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440008',
            teacher_id: teacherId,
            subject_id: subjectIpaId,
            is_active: true,
            created_at: now,
            updated_at: now
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440009',
            teacher_id: teacherId,
            subject_id: subjectIpsId,
            is_active: true,
            created_at: now,
            updated_at: now
        }
    ];

    await knex('teacher_subjects').insert(teacherSubjects);
    console.log('✅ Teacher assigned to all subjects');

    console.log('\n🎉 Seeder completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👨‍💼 Admin: admin@sekolah.com / admin123');
    console.log('👨‍🏫 Teacher: budi.santoso@sekolah.com / guru123');
    console.log('\n📚 Subjects created: MTK, IPA, IPS');
    console.log('🔗 Teacher is assigned to all subjects');
}
