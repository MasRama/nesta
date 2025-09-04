/**
 * NETSA School Management System - Database Seeder
 * This file creates dummy data for prototyping and testing
 */

import DB from "./app/services/DB";
import Authenticate from "./app/services/Authenticate";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

class DatabaseSeeder {
   async run() {
      console.log("🌱 Starting NETSA database seeding...");
      
      try {
         // Clear existing data (be careful in production!)
         await this.clearData();
         
         // Seed data in order
         const users = await this.seedUsers();
         const classes = await this.seedClasses(users);
         await this.seedStudentClasses(users, classes);
         await this.seedParentStudentRelations(users);
         await this.seedAttendanceSessions(classes, users);
         await this.seedAttendanceRecords(users, classes);
         await this.seedTeacherJournals(users, classes);
         await this.seedExams(users, classes);
         
         console.log("✅ Database seeding completed successfully!");
         console.log("\n📋 Login Credentials:");
         console.log("👨‍🎓 Student: student1@netsa.school / password123");
         console.log("👨‍🏫 Teacher: teacher1@netsa.school / password123");
         console.log("👨‍👩‍👧‍👦 Parent: parent1@netsa.school / password123");
         console.log("👑 Admin: admin@netsa.school / password123");
         
      } catch (error) {
         console.error("❌ Error seeding database:", error);
         throw error;
      }
   }

   async clearData() {
      console.log("🧹 Clearing existing data...");
      
      const tables = [
         'exam_attempts',
         'exam_questions', 
         'exams',
         'teacher_journals',
         'attendance_records',
         'attendance_sessions',
         'parent_student_relations',
         'student_classes',
         'classes',
         'sessions',
         'email_verification_tokens',
         'password_reset_tokens',
         'users'
      ];
      
      for (const table of tables) {
         await DB.from(table).delete();
      }
   }

   async seedUsers() {
      console.log("👥 Seeding users...");
      
      const users = [
         // Admin
         {
            id: randomUUID(),
            name: "Administrator NETSA",
            email: "admin@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "admin",
            is_admin: true,
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         
         // Teachers
         {
            id: randomUUID(),
            name: "Bu Sari Wijaya",
            email: "teacher1@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "teacher",
            teacher_id: "TCH001",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            name: "Pak Budi Santoso",
            email: "teacher2@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "teacher",
            teacher_id: "TCH002",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         
         // Students
         {
            id: randomUUID(),
            name: "Ahmad Fauzi",
            email: "student1@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "student",
            student_id: "STD001",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            name: "Siti Nurhaliza",
            email: "student2@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "student",
            student_id: "STD002",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            name: "Rizky Pratama",
            email: "student3@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "student",
            student_id: "STD003",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         
         // Parents
         {
            id: randomUUID(),
            name: "Ibu Dewi Sartika",
            email: "parent1@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "parent",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            name: "Bapak Andi Wijaya",
            email: "parent2@netsa.school",
            password: await Authenticate.hash("password123"),
            role: "parent",
            is_verified: true,
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         }
      ];
      
      await DB.table("users").insert(users);
      return users;
   }

   async seedClasses(users) {
      console.log("🏫 Seeding classes...");
      
      const teachers = users.filter(u => u.role === 'teacher');
      
      const classes = [
         {
            id: randomUUID(),
            name: "Kelas 10 IPA 1",
            grade_level: "10",
            academic_year: "2024/2025",
            teacher_id: teachers[0].id,
            description: "Kelas 10 IPA dengan fokus pada Matematika dan Sains",
            max_students: 30,
            schedule: JSON.stringify({
               monday: ["08:00-09:30", "10:00-11:30"],
               tuesday: ["08:00-09:30", "10:00-11:30"],
               wednesday: ["08:00-09:30"],
               thursday: ["08:00-09:30", "10:00-11:30"],
               friday: ["08:00-09:30"]
            }),
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            name: "Kelas 11 IPS 1",
            grade_level: "11",
            academic_year: "2024/2025",
            teacher_id: teachers[1].id,
            description: "Kelas 11 IPS dengan fokus pada Sosial dan Budaya",
            max_students: 28,
            schedule: JSON.stringify({
               monday: ["13:00-14:30", "15:00-16:30"],
               tuesday: ["13:00-14:30"],
               wednesday: ["13:00-14:30", "15:00-16:30"],
               thursday: ["13:00-14:30"],
               friday: ["13:00-14:30", "15:00-16:30"]
            }),
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            name: "Kelas 12 IPA 2",
            grade_level: "12",
            academic_year: "2024/2025",
            teacher_id: teachers[0].id,
            description: "Kelas 12 IPA persiapan ujian nasional",
            max_students: 25,
            schedule: JSON.stringify({
               monday: ["07:00-08:30"],
               tuesday: ["07:00-08:30", "09:00-10:30"],
               wednesday: ["07:00-08:30"],
               thursday: ["07:00-08:30", "09:00-10:30"],
               friday: ["07:00-08:30"]
            }),
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         }
      ];
      
      await DB.table("classes").insert(classes);
      return classes;
   }

   async seedStudentClasses(users, classes) {
      console.log("📚 Seeding student-class relationships...");
      
      const students = users.filter(u => u.role === 'student');
      
      const studentClasses = [
         {
            id: randomUUID(),
            student_id: students[0].id,
            class_id: classes[0].id,
            enrollment_date: dayjs().subtract(3, 'months').format('YYYY-MM-DD'),
            is_active: true,
            created_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            student_id: students[1].id,
            class_id: classes[0].id,
            enrollment_date: dayjs().subtract(3, 'months').format('YYYY-MM-DD'),
            is_active: true,
            created_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            student_id: students[2].id,
            class_id: classes[1].id,
            enrollment_date: dayjs().subtract(2, 'months').format('YYYY-MM-DD'),
            is_active: true,
            created_at: dayjs().valueOf()
         }
      ];
      
      await DB.table("student_classes").insert(studentClasses);
   }

   async seedParentStudentRelations(users) {
      console.log("👨‍👩‍👧‍👦 Seeding parent-student relationships...");
      
      const students = users.filter(u => u.role === 'student');
      const parents = users.filter(u => u.role === 'parent');
      
      const relations = [
         {
            id: randomUUID(),
            parent_id: parents[0].id,
            student_id: students[0].id,
            relationship: "mother",
            is_primary_contact: true,
            created_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            parent_id: parents[1].id,
            student_id: students[1].id,
            relationship: "father",
            is_primary_contact: true,
            created_at: dayjs().valueOf()
         },
         {
            id: randomUUID(),
            parent_id: parents[0].id,
            student_id: students[2].id,
            relationship: "mother",
            is_primary_contact: false,
            created_at: dayjs().valueOf()
         }
      ];
      
      await DB.table("parent_student_relations").insert(relations);
   }

   async seedAttendanceSessions(classes, users) {
      console.log("📅 Seeding attendance sessions...");
      
      const sessions = [];
      const teachers = users.filter(u => u.role === 'teacher');
      
      // Create sessions for the past 30 days
      for (let i = 0; i < 30; i++) {
         const date = dayjs().subtract(i, 'days');
         
         // Skip weekends
         if (date.day() === 0 || date.day() === 6) continue;
         
         for (const cls of classes) {
            sessions.push({
               id: randomUUID(),
               class_id: cls.id,
               teacher_id: cls.teacher_id,
               attendance_date: date.format('YYYY-MM-DD'),
               qr_token: randomUUID(),
               starts_at: date.hour(8).minute(0).toDate(),
               expires_at: date.hour(8).minute(30).toDate(),
               is_active: false,
               notes: i === 0 ? "Session hari ini" : null,
               created_at: dayjs().valueOf(),
               updated_at: dayjs().valueOf()
            });
         }
      }
      
      await DB.table("attendance_sessions").insert(sessions);
      return sessions;
   }

   async seedAttendanceRecords(users, classes) {
      console.log("✅ Seeding attendance records...");
      
      const students = users.filter(u => u.role === 'student');
      const sessions = await DB.from("attendance_sessions").select("*");
      
      const records = [];
      
      for (const session of sessions) {
         // Get students for this class
         const classStudents = await DB.from("student_classes")
            .join("users", "student_classes.student_id", "users.id")
            .where("student_classes.class_id", session.class_id)
            .where("student_classes.is_active", true)
            .select("users.*");
         
         for (const student of classStudents) {
            // Randomly assign attendance status (80% present, 15% late, 5% absent)
            const rand = Math.random();
            let status = 'present';
            if (rand > 0.95) status = 'absent';
            else if (rand > 0.80) status = 'late';
            
            records.push({
               id: randomUUID(),
               attendance_session_id: session.id,
               student_id: student.id,
               status: status,
               scanned_at: status !== 'absent' ? dayjs(session.starts_at).add(Math.random() * 15, 'minutes').toDate() : null,
               notes: status === 'absent' ? 'Tidak hadir tanpa keterangan' : null,
               created_at: dayjs().valueOf(),
               updated_at: dayjs().valueOf()
            });
         }
      }
      
      await DB.table("attendance_records").insert(records);
   }

   async seedTeacherJournals(users, classes) {
      console.log("📖 Seeding teacher journals...");
      
      const teachers = users.filter(u => u.role === 'teacher');
      const journals = [];
      
      const journalTitles = [
         "Pembelajaran Matematika - Aljabar Linear",
         "Diskusi Kelompok tentang Sejarah Indonesia",
         "Praktikum Fisika - Hukum Newton",
         "Analisis Teks Bahasa Indonesia",
         "Pembelajaran Kimia - Reaksi Redoks",
         "Presentasi Proyek Biologi",
         "Review Materi Ujian Tengah Semester",
         "Kegiatan Pembelajaran Interaktif"
      ];

      const journalContents = [
         "Hari ini kita membahas konsep dasar aljabar linear. Siswa terlihat antusias dan aktif bertanya.",
         "Diskusi berjalan dengan baik, semua siswa berpartisipasi aktif dalam membahas peristiwa sejarah.",
         "Praktikum berlangsung lancar, siswa berhasil memahami aplikasi hukum Newton dalam kehidupan sehari-hari.",
         "Analisis teks berjalan dengan baik, siswa menunjukkan pemahaman yang baik terhadap struktur teks.",
         "Pembelajaran reaksi redoks cukup menantang, beberapa siswa memerlukan penjelasan tambahan.",
         "Presentasi proyek biologi sangat menarik, kreativitas siswa patut diapresiasi.",
         "Review materi berjalan sistematis, siswa terlihat siap menghadapi ujian.",
         "Metode pembelajaran interaktif terbukti efektif meningkatkan partisipasi siswa."
      ];
      
      for (let i = 0; i < 20; i++) {
         const teacher = teachers[Math.floor(Math.random() * teachers.length)];
         const teacherClasses = classes.filter(c => c.teacher_id === teacher.id);
         const selectedClass = teacherClasses[Math.floor(Math.random() * teacherClasses.length)];
         
         const titleIndex = Math.floor(Math.random() * journalTitles.length);
         
         journals.push({
            id: randomUUID(),
            teacher_id: teacher.id,
            class_id: selectedClass.id,
            title: journalTitles[titleIndex],
            content: journalContents[titleIndex],
            media_files: JSON.stringify([]),
            journal_date: dayjs().subtract(Math.floor(Math.random() * 30), 'days').format('YYYY-MM-DD'),
            status: Math.random() > 0.2 ? 'published' : 'draft',
            tags: JSON.stringify(['pembelajaran', 'interaktif', 'diskusi']),
            created_at: dayjs().valueOf(),
            updated_at: dayjs().valueOf()
         });
      }
      
      await DB.table("teacher_journals").insert(journals);
   }

   async seedExams(users, classes) {
      console.log("📋 Seeding exams...");
      
      const teachers = users.filter(u => u.role === 'teacher');
      const exams = [];
      const examQuestions = [];
      
      for (const teacher of teachers) {
         const teacherClasses = classes.filter(c => c.teacher_id === teacher.id);
         
         for (const cls of teacherClasses) {
            // Create 2-3 exams per class
            for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
               const examId = randomUUID();
               const startTime = dayjs().add(Math.floor(Math.random() * 30) + 1, 'days').hour(8 + i * 2).minute(0);
               
               exams.push({
                  id: examId,
                  teacher_id: teacher.id,
                  class_id: cls.id,
                  title: `Ujian ${cls.name} - ${i === 0 ? 'UTS' : i === 1 ? 'UAS' : 'Quiz'}`,
                  description: `Ujian ${i === 0 ? 'Tengah' : i === 1 ? 'Akhir' : 'Harian'} Semester untuk kelas ${cls.name}`,
                  duration_minutes: i === 2 ? 30 : 90,
                  randomize_questions: true,
                  randomize_options: true,
                  start_time: startTime.toDate(),
                  end_time: startTime.add(2, 'hours').toDate(),
                  status: Math.random() > 0.5 ? 'active' : 'draft',
                  max_attempts: 1,
                  pass_score: 70.0,
                  created_at: dayjs().valueOf(),
                  updated_at: dayjs().valueOf()
               });
               
               // Create sample questions for each exam
               const sampleQuestions = [
                  {
                     question_text: "Apa hasil dari 2 + 2?",
                     options: ["3", "4", "5", "6"],
                     correct_answer_index: 1,
                     points: 10
                  },
                  {
                     question_text: "Siapa presiden pertama Indonesia?",
                     options: ["Soekarno", "Soeharto", "Habibie", "Megawati"],
                     correct_answer_index: 0,
                     points: 10
                  },
                  {
                     question_text: "Apa rumus luas lingkaran?",
                     options: ["π × r", "π × r²", "2 × π × r", "π × d"],
                     correct_answer_index: 1,
                     points: 15
                  },
                  {
                     question_text: "Apa ibu kota Indonesia?",
                     options: ["Bandung", "Surabaya", "Jakarta", "Medan"],
                     correct_answer_index: 2,
                     points: 5
                  }
               ];
               
               sampleQuestions.forEach((q, index) => {
                  examQuestions.push({
                     id: randomUUID(),
                     exam_id: examId,
                     question_text: q.question_text,
                     options: JSON.stringify(q.options),
                     correct_answer_index: q.correct_answer_index,
                     points: q.points,
                     order_index: index,
                     explanation: "Penjelasan akan ditambahkan oleh guru",
                     created_at: dayjs().valueOf()
                  });
               });
            }
         }
      }
      
      await DB.table("exams").insert(exams);
      await DB.table("exam_questions").insert(examQuestions);
   }
}

// Run the seeder
const seeder = new DatabaseSeeder();
seeder.run()
   .then(() => {
      console.log("🎉 Seeding complete!");
      process.exit(0);
   })
   .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
   });