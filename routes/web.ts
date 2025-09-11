import AuthController from "../app/controllers/AuthController";
import SchoolAuthController from "../app/controllers/SchoolAuthController";
import AttendanceController from "../app/controllers/AttendanceController";
import JournalController from "../app/controllers/JournalController";
import ExamController from "../app/controllers/ExamController";
import StudentController from "../app/controllers/StudentController";
import TeacherController from "../app/controllers/TeacherController";
import Auth from "../app/middlewares/auth"
import RoleAuth from "../app/middlewares/roleAuth";
import HomeController from "../app/controllers/HomeController";
import AssetController from "../app/controllers/AssetController";
import HyperExpress from 'hyper-express';

const Route = new HyperExpress.Router();

/**
 * Public Routes
 * These routes are accessible without authentication
 * ------------------------------------------------
 * GET  / - Home page
 */
Route.get("/", HomeController.index);

/**
 * Authentication Routes
 * Routes for handling user authentication
 * ------------------------------------------------
 * GET   /login - Login page
 * POST  /login - Process login (school auth)
 * GET   /register - Registration page
 * POST  /register - Process registration (school auth)
 * POST  /logout - Logout user
 * GET   /google/redirect - Google OAuth redirect
 * GET   /google/callback - Google OAuth callback
 */
Route.get("/login", AuthController.loginPage);
Route.post("/login", SchoolAuthController.processLogin);
Route.get("/register", AuthController.registerPage);
Route.post("/register", SchoolAuthController.processRegister);
Route.post("/logout", AuthController.logout);
Route.get("/google/redirect", AuthController.redirect);
Route.get("/google/callback", AuthController.googleCallback);

/**
 * Password Reset Routes
 * Routes for handling password reset
 * ------------------------------------------------
 * GET   /forgot-password - Forgot password page
 * POST  /forgot-password - Send reset password link
 * GET   /reset-password/:id - Reset password page
 * POST  /reset-password - Process password reset
 */
Route.get("/forgot-password", AuthController.forgotPasswordPage);
Route.post("/forgot-password", AuthController.sendResetPassword);
Route.get("/reset-password/:id", AuthController.resetPasswordPage);
Route.post("/reset-password", AuthController.resetPassword);

/**
 * Role-Based Dashboard Routes
 * These routes serve different dashboards based on user role
 * ------------------------------------------------
 * GET   /dashboard/student - Student dashboard
 * GET   /dashboard/teacher - Teacher dashboard
 * GET   /dashboard/parent - Parent dashboard
 * GET   /dashboard/admin - Admin dashboard
 */
Route.get("/dashboard/student", [Auth, RoleAuth.student()], SchoolAuthController.getDashboardData);
Route.get("/dashboard/teacher", [Auth, RoleAuth.teacher()], SchoolAuthController.getDashboardData);
Route.get("/dashboard/parent", [Auth, RoleAuth.parent()], SchoolAuthController.getDashboardData);
Route.get("/dashboard/admin", [Auth, RoleAuth.admin()], SchoolAuthController.getDashboardData);

/**
 * Attendance System Routes
 * Routes for QR code attendance management
 * ------------------------------------------------
 * POST  /api/attendance/generate-qr - Generate QR code for attendance (Teacher)
 * POST  /api/attendance/scan - Process QR code scan (Student)
 * GET   /api/attendance/class/:class_id - Get class attendance records
 * GET   /api/attendance/student/:student_id - Get student attendance history
 * GET   /api/attendance/stats/:student_id - Get attendance statistics
 * POST  /api/attendance/close/:session_id - Close attendance session
 */
Route.post("/api/attendance/generate-qr", [Auth, RoleAuth.teacher()], AttendanceController.generateQRCode);
Route.post("/api/attendance/scan", [Auth, RoleAuth.student()], AttendanceController.processScan);
Route.get("/api/attendance/class/:class_id", [Auth, RoleAuth.teacherOrAdmin()], AttendanceController.getClassAttendance);
Route.get("/api/attendance/student/:student_id", [Auth], AttendanceController.getStudentAttendance);
Route.get("/api/attendance/stats/:student_id", [Auth], AttendanceController.getAttendanceStats);
Route.post("/api/attendance/close/:session_id", [Auth, RoleAuth.teacher()], AttendanceController.closeSession);

/**
 * Journal Management Routes
 * Routes for teacher journal creation and management
 * ------------------------------------------------
 * GET   /journal/create - Journal creation form (Teacher)
 * POST  /journal - Create new journal (Teacher)
 * GET   /journal/:journal_id/edit - Journal edit form (Teacher)
 * PUT   /journal/:journal_id - Update journal (Teacher)
 * POST  /journal/:journal_id/upload - Upload media files (Teacher)
 * GET   /api/journal/teacher/:teacher_id - Get teacher's journals
 * GET   /api/journal/class/:class_id - Get class journals
 * POST  /api/journal/:journal_id/publish - Publish journal (Teacher)
 * DELETE /api/journal/:journal_id - Delete journal (Teacher)
 * GET   /api/journal/search - Search journals
 */
Route.get("/journal/create", [Auth, RoleAuth.teacher()], JournalController.createPage);
Route.post("/journal", [Auth, RoleAuth.teacher()], JournalController.create);
Route.get("/journal/:journal_id/edit", [Auth, RoleAuth.teacher()], JournalController.editPage);
Route.put("/journal/:journal_id", [Auth, RoleAuth.teacher()], JournalController.update);
Route.post("/journal/:journal_id/upload", [Auth, RoleAuth.teacher()], JournalController.uploadMedia);
Route.get("/api/journal/teacher/:teacher_id", [Auth], JournalController.getTeacherJournals);
Route.get("/api/journal/class/:class_id", [Auth], JournalController.getClassJournals);
Route.post("/api/journal/:journal_id/publish", [Auth, RoleAuth.teacher()], JournalController.publish);
Route.delete("/api/journal/:journal_id", [Auth, RoleAuth.teacher()], JournalController.delete);
Route.get("/api/journal/search", [Auth], JournalController.search);

/**
 * Exam Management Routes
 * Routes for exam creation, management, and taking
 * ------------------------------------------------
 * GET   /exam/create - Exam creation form (Teacher)
 * POST  /exam/import-excel - Import questions from Excel (Teacher)
 * GET   /exam/template - Download Excel template
 * POST  /exam/:exam_id/start - Start exam attempt (Student)
 * POST  /exam/attempt/:attempt_id/answer - Submit answer (Student)
 * POST  /exam/attempt/:attempt_id/submit - Submit complete exam (Student)
 * GET   /exam/:exam_id/results - Get exam results (Teacher)
 * GET   /api/exam/student/:student_id? - Get student's exams
 * POST  /api/exam/:exam_id/activate - Activate exam (Teacher)
 * GET   /api/exam/:exam_id - Get exam details
 * GET   /api/exam/teacher/:teacher_id? - Get teacher's exams
 */
Route.get("/exam/create", [Auth, RoleAuth.teacher()], ExamController.createPage);
Route.post("/exam/import-excel", [Auth, RoleAuth.teacher()], ExamController.importExcel);
Route.get("/exam/template", [Auth, RoleAuth.teacher()], ExamController.downloadTemplate);
Route.post("/exam/:exam_id/start", [Auth, RoleAuth.student()], ExamController.startAttempt);
Route.post("/exam/attempt/:attempt_id/answer", [Auth, RoleAuth.student()], ExamController.submitAnswer);
Route.post("/exam/attempt/:attempt_id/submit", [Auth, RoleAuth.student()], ExamController.submitExam);
Route.get("/exam/:exam_id/results", [Auth, RoleAuth.teacherOrAdmin()], ExamController.getResults);
Route.get("/api/exam/student/:student_id?", [Auth], ExamController.getStudentExams);
Route.post("/api/exam/:exam_id/activate", [Auth, RoleAuth.teacher()], ExamController.activateExam);
Route.get("/api/exam/:exam_id", [Auth], ExamController.getExamDetails);
Route.get("/api/exam/teacher/:teacher_id?", [Auth], ExamController.getTeacherExams);

/**
 * Legacy Protected Routes
 * These routes are maintained for backward compatibility
 * ------------------------------------------------
 * GET   /home - User dashboard (redirects to role-based dashboard)
 * GET   /profile - User profile
 * POST  /change-profile - Update profile
 * POST  /change-password - Change password
 * DELETE /users - Delete users (admin only)
 */
Route.get("/home", [Auth], AuthController.homePage);
Route.get("/profile", [Auth], AuthController.profilePage);
Route.post("/change-profile", [Auth], AuthController.changeProfile);
Route.post("/change-password", [Auth], AuthController.changePassword);
Route.delete("/users", [Auth], AuthController.deleteUsers);

/**
 * Student Management Routes (Admin Only)
 * These routes handle CRUD operations for student data
 * ------------------------------------------------
 * GET    /admin/students - List all students with pagination and filters
 * GET    /admin/students/create - Show create student form
 * POST   /admin/students - Store new student
 * GET    /admin/students/:id - Show student detail
 * GET    /admin/students/:id/edit - Show edit student form
 * PUT    /admin/students/:id - Update student
 * DELETE /admin/students/:id - Delete student (soft delete)
 *
 * CSV Import/Export Routes:
 * POST   /admin/students/import-csv - Import students from CSV
 * GET    /admin/students/export-csv - Export students to CSV
 * GET    /admin/students/template-csv - Download CSV template
 *
 * API Routes:
 * GET    /api/students - Get students data (AJAX)
 */
Route.get("/admin/students", [Auth, RoleAuth.admin()], StudentController.index);
Route.get("/admin/students/create", [Auth, RoleAuth.admin()], StudentController.create);
Route.post("/admin/students", [Auth, RoleAuth.admin()], StudentController.store);
Route.get("/admin/students/:id", [Auth, RoleAuth.admin()], StudentController.show);
Route.get("/admin/students/:id/edit", [Auth, RoleAuth.admin()], StudentController.edit);
Route.put("/admin/students/:id", [Auth, RoleAuth.admin()], StudentController.update);
Route.delete("/admin/students/:id", [Auth, RoleAuth.admin()], StudentController.destroy);

// CSV Import/Export Routes
Route.post("/admin/students/import-csv", [Auth, RoleAuth.admin()], StudentController.importCSV);
Route.get("/admin/students/export-csv", [Auth, RoleAuth.admin()], StudentController.exportCSV);
Route.get("/admin/students/template-csv", [Auth, RoleAuth.admin()], StudentController.downloadTemplate);

// API Routes
Route.get("/api/students", [Auth, RoleAuth.admin()], StudentController.getStudentsAPI);

/**
 * Teacher Management Routes (Admin Only)
 * Routes for managing teachers in admin panel
 * ------------------------------------------------
 * GET    /admin/teachers - List all teachers
 * GET    /admin/teachers/create - Show create teacher form
 * POST   /admin/teachers - Store new teacher
 * GET    /admin/teachers/:id - Show teacher details
 * GET    /admin/teachers/:id/edit - Show edit teacher form
 * PUT    /admin/teachers/:id - Update teacher
 * DELETE /admin/teachers/:id - Delete teacher
 */
Route.get("/admin/teachers", [Auth, RoleAuth.admin()], TeacherController.index);
Route.get("/admin/teachers/create", [Auth, RoleAuth.admin()], TeacherController.create);
Route.post("/admin/teachers", [Auth, RoleAuth.admin()], TeacherController.store);
Route.get("/admin/teachers/:id", [Auth, RoleAuth.admin()], TeacherController.show);
Route.get("/admin/teachers/:id/edit", [Auth, RoleAuth.admin()], TeacherController.edit);
Route.put("/admin/teachers/:id", [Auth, RoleAuth.admin()], TeacherController.update);
Route.delete("/admin/teachers/:id", [Auth, RoleAuth.admin()], TeacherController.destroy);

/**
 * API Routes for Teachers
 * API endpoints for teacher data
 * ------------------------------------------------
 * GET  /api/teachers - Get teachers data (AJAX)
 */
Route.get("/api/teachers", [Auth, RoleAuth.admin()], TeacherController.getTeachersAPI);

/**
 * Static Asset Handling Routes
 *
 * 1. Dist Assets (/assets/:file)
 * Serves compiled and bundled assets from the dist/assets directory
 * - Handles JavaScript files (*.js) with proper content type
 * - Handles CSS files (*.css) with proper content type
 * - Implements in-memory caching for better performance
 * - Sets long-term browser cache headers (1 year)
 * Example URLs:
 * - /assets/app.1234abc.js
 * - /assets/main.5678def.css
 */
Route.get("/assets/:file", AssetController.distFolder);

/**
 * 2. Public Assets (/*) - Catch-all Route
 * Serves static files from the public directory
 * - Must be the LAST route in the file
 * - Only serves files with allowed extensions
 * - Returns 404 for paths without extensions
 * - Implements security checks against unauthorized access
 * 
 * Allowed file types:
 * - Images: .ico, .png, .jpeg, .jpg, .gif, .svg
 * - Documents: .txt, .pdf
 * - Fonts: .woff, .woff2, .ttf, .eot
 * - Media: .mp4, .webm, .mp3, .wav
 * - Web: .css, .js
 * 
 * Example URLs:
 * - /images/logo.png
 * - /documents/terms.pdf
 * - /fonts/roboto.woff2
 */
Route.get("/*", AssetController.publicFolder);

export default Route;