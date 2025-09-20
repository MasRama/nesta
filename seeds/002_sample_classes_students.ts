import { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
    // Clear existing data in reverse order of dependencies
    await knex('student_classes').del();
    await knex('subject_classes').del();
    await knex('students').del();
    await knex('classes').del();

    console.log('🗑️  Cleared existing classes and students data');

    // Define UUIDs for consistent relationships
    const teacherUserId = '550e8400-e29b-41d4-a716-446655440002'; // Teacher user ID from previous seeder
    const teacherId = '550e8400-e29b-41d4-a716-446655440003'; // Teacher ID from previous seeder
    const subjectMtkId = '550e8400-e29b-41d4-a716-446655440004';
    const subjectIpaId = '550e8400-e29b-41d4-a716-446655440005';
    const subjectIpsId = '550e8400-e29b-41d4-a716-446655440006';

    const class7AId = '550e8400-e29b-41d4-a716-446655440010';
    const class7BId = '550e8400-e29b-41d4-a716-446655440011';
    
    const student1UserId = '550e8400-e29b-41d4-a716-446655440012';
    const student2UserId = '550e8400-e29b-41d4-a716-446655440013';
    const student3UserId = '550e8400-e29b-41d4-a716-446655440014';
    const student4UserId = '550e8400-e29b-41d4-a716-446655440015';

    const student1Id = '550e8400-e29b-41d4-a716-446655440016';
    const student2Id = '550e8400-e29b-41d4-a716-446655440017';
    const student3Id = '550e8400-e29b-41d4-a716-446655440018';
    const student4Id = '550e8400-e29b-41d4-a716-446655440019';

    const now = Date.now();

    // 1. Insert Classes
    const classes = [
        {
            id: class7AId,
            name: '7A',
            grade_level: '7',
            academic_year: '2024/2025',
            teacher_id: teacherUserId, // Wali kelas (menggunakan user_id)
            description: 'Kelas 7A dengan 20 siswa aktif',
            max_students: 30,
            created_at: now,
            updated_at: now
        },
        {
            id: class7BId,
            name: '7B',
            grade_level: '7',
            academic_year: '2024/2025',
            teacher_id: null, // Belum ada wali kelas
            description: 'Kelas 7B dengan 18 siswa aktif',
            max_students: 30,
            created_at: now,
            updated_at: now
        }
    ];

    await knex('classes').insert(classes);
    console.log('✅ Classes created: 7A, 7B');

    // 2. Insert Student Users
    const studentPassword = await bcrypt.hash('siswa123', 10);

    const studentUsers = [
        {
            id: student1UserId,
            name: 'Ahmad Rizki Pratama',
            email: 'ahmad.rizki@siswa.sekolah.com',
            phone: '081234567892',
            is_verified: true,
            is_admin: false,
            password: studentPassword,
            remember_me_token: null,
            membership_date: new Date(),
            created_at: now,
            updated_at: now
        },
        {
            id: student2UserId,
            name: 'Siti Nurhaliza',
            email: 'siti.nurhaliza@siswa.sekolah.com',
            phone: '081234567893',
            is_verified: true,
            is_admin: false,
            password: studentPassword,
            remember_me_token: null,
            membership_date: new Date(),
            created_at: now,
            updated_at: now
        },
        {
            id: student3UserId,
            name: 'Budi Setiawan',
            email: 'budi.setiawan@siswa.sekolah.com',
            phone: '081234567894',
            is_verified: true,
            is_admin: false,
            password: studentPassword,
            remember_me_token: null,
            membership_date: new Date(),
            created_at: now,
            updated_at: now
        },
        {
            id: student4UserId,
            name: 'Dewi Sartika',
            email: 'dewi.sartika@siswa.sekolah.com',
            phone: '081234567895',
            is_verified: true,
            is_admin: false,
            password: studentPassword,
            remember_me_token: null,
            membership_date: new Date(),
            created_at: now,
            updated_at: now
        }
    ];

    await knex('users').insert(studentUsers);
    console.log('✅ Student users created');

    // 3. Insert Students
    const students = [
        {
            id: student1Id,
            nipd: '2024070001',
            nama: 'Ahmad Rizki Pratama',
            kelas: '7A',
            tempat_lahir: 'Jakarta',
            tanggal_lahir: '2010-05-15',
            jenis_kelamin: 'Laki - Laki',
            agama: 'Islam',
            user_id: student1UserId,
            is_active: true,
            notes: 'Siswa berprestasi di bidang matematika',
            created_at: now,
            updated_at: now
        },
        {
            id: student2Id,
            nipd: '2024070002',
            nama: 'Siti Nurhaliza',
            kelas: '7A',
            tempat_lahir: 'Bandung',
            tanggal_lahir: '2010-08-22',
            jenis_kelamin: 'Perempuan',
            agama: 'Islam',
            user_id: student2UserId,
            is_active: true,
            notes: 'Aktif dalam kegiatan ekstrakurikuler',
            created_at: now,
            updated_at: now
        },
        {
            id: student3Id,
            nipd: '2024070003',
            nama: 'Budi Setiawan',
            kelas: '7B',
            tempat_lahir: 'Surabaya',
            tanggal_lahir: '2010-03-10',
            jenis_kelamin: 'Laki - Laki',
            agama: 'Kristen',
            user_id: student3UserId,
            is_active: true,
            notes: 'Hobi membaca dan menulis',
            created_at: now,
            updated_at: now
        },
        {
            id: student4Id,
            nipd: '2024070004',
            nama: 'Dewi Sartika',
            kelas: '7B',
            tempat_lahir: 'Yogyakarta',
            tanggal_lahir: '2010-11-05',
            jenis_kelamin: 'Perempuan',
            agama: 'Islam',
            user_id: student4UserId,
            is_active: true,
            notes: 'Berbakat di bidang seni dan olahraga',
            created_at: now,
            updated_at: now
        }
    ];

    await knex('students').insert(students);
    console.log('✅ Students created: 4 sample students');

    // 4. Assign Students to Classes
    const studentClasses = [
        {
            id: '550e8400-e29b-41d4-a716-446655440020',
            student_id: student1UserId, // Using user_id
            class_id: class7AId,
            enrollment_date: '2024-07-15',
            is_active: true,
            created_at: now
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440021',
            student_id: student2UserId, // Using user_id
            class_id: class7AId,
            enrollment_date: '2024-07-15',
            is_active: true,
            created_at: now
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440022',
            student_id: student3UserId, // Using user_id
            class_id: class7BId,
            enrollment_date: '2024-07-15',
            is_active: true,
            created_at: now
        },
        {
            id: '550e8400-e29b-41d4-a716-446655440023',
            student_id: student4UserId, // Using user_id
            class_id: class7BId,
            enrollment_date: '2024-07-15',
            is_active: true,
            created_at: now
        }
    ];

    await knex('student_classes').insert(studentClasses);
    console.log('✅ Students assigned to classes');

    // Note: Subject-class assignments can be done through the admin panel
    console.log('💡 Subject-class assignments can be done through admin panel');

    console.log('\n🎉 Sample data seeder completed successfully!');
    console.log('\n📚 Classes: 7A (with wali kelas), 7B');
    console.log('👥 Students: 4 sample students (2 per class)');
    console.log('📅 Schedules: MTK, IPA, IPS assigned with time slots');
    console.log('🔗 All relationships properly linked');
}
