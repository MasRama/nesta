"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlsx_1 = __importDefault(require("xlsx"));
const crypto_1 = require("crypto");
class ExcelService {
    async parseExamQuestions(fileBuffer) {
        try {
            const workbook = xlsx_1.default.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx_1.default.utils.sheet_to_json(sheet, { header: 1 });
            const questions = [];
            const metadata = {};
            let startRow = 1;
            if (data[0] && typeof data[0][0] === 'string' && data[0][0].toLowerCase().includes('title')) {
                metadata.title = data[0][1];
                startRow++;
            }
            if (data[1] && typeof data[1][0] === 'string' && data[1][0].toLowerCase().includes('description')) {
                metadata.description = data[1][1];
                startRow++;
            }
            if (data[2] && typeof data[2][0] === 'string' && data[2][0].toLowerCase().includes('duration')) {
                metadata.duration_minutes = parseInt(data[2][1]) || 60;
                startRow++;
            }
            if (data[startRow] && typeof data[startRow][0] === 'string' &&
                data[startRow][0].toLowerCase().includes('question')) {
                startRow++;
            }
            for (let i = startRow; i < data.length; i++) {
                const row = data[i];
                if (!row || !row[0])
                    continue;
                const questionText = row[0]?.toString().trim();
                if (!questionText)
                    continue;
                const options = [
                    row[1]?.toString().trim() || '',
                    row[2]?.toString().trim() || '',
                    row[3]?.toString().trim() || '',
                    row[4]?.toString().trim() || ''
                ].filter(option => option !== '');
                if (options.length < 2) {
                    throw new Error(`Question at row ${i + 1} must have at least 2 options`);
                }
                const correctAnswerStr = row[5]?.toString().trim().toUpperCase();
                let correctAnswerIndex = -1;
                switch (correctAnswerStr) {
                    case 'A':
                        correctAnswerIndex = 0;
                        break;
                    case 'B':
                        correctAnswerIndex = 1;
                        break;
                    case 'C':
                        correctAnswerIndex = 2;
                        break;
                    case 'D':
                        correctAnswerIndex = 3;
                        break;
                    default:
                        const numAnswer = parseInt(correctAnswerStr);
                        if (numAnswer >= 1 && numAnswer <= options.length) {
                            correctAnswerIndex = numAnswer - 1;
                        }
                }
                if (correctAnswerIndex === -1 || correctAnswerIndex >= options.length) {
                    throw new Error(`Invalid correct answer for question at row ${i + 1}: ${correctAnswerStr}`);
                }
                const points = parseFloat(row[6]?.toString()) || 1.0;
                const explanation = row[7]?.toString().trim() || '';
                questions.push({
                    id: (0, crypto_1.randomUUID)(),
                    question_text: questionText,
                    options,
                    correct_answer_index: correctAnswerIndex,
                    points,
                    explanation: explanation || undefined
                });
            }
            if (questions.length === 0) {
                throw new Error('No valid questions found in Excel file');
            }
            return { questions, metadata };
        }
        catch (error) {
            console.error('Error parsing Excel file:', error);
            throw new Error(`Failed to parse Excel file: ${error.message}`);
        }
    }
    validateQuestionFormat(questions) {
        const errors = [];
        questions.forEach((question, index) => {
            if (!question.question_text || question.question_text.trim() === '') {
                errors.push(`Question ${index + 1}: Question text is required`);
            }
            if (!Array.isArray(question.options) || question.options.length < 2) {
                errors.push(`Question ${index + 1}: At least 2 options are required`);
            }
            if (question.correct_answer_index < 0 ||
                question.correct_answer_index >= question.options.length) {
                errors.push(`Question ${index + 1}: Invalid correct answer index`);
            }
            if (question.points && (isNaN(question.points) || question.points <= 0)) {
                errors.push(`Question ${index + 1}: Points must be a positive number`);
            }
        });
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    generateExamTemplate() {
        const wb = xlsx_1.default.utils.book_new();
        const sampleData = [
            ['Title:', 'Sample Math Quiz'],
            ['Description:', 'Basic arithmetic questions'],
            ['Duration (minutes):', '30'],
            [''],
            ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Points', 'Explanation'],
            [
                'What is 2 + 2?',
                '3',
                '4',
                '5',
                '6',
                'B',
                '1',
                'Basic addition: 2 + 2 = 4'
            ],
            [
                'What is 5 × 3?',
                '15',
                '13',
                '18',
                '12',
                'A',
                '2',
                'Multiplication: 5 × 3 = 15'
            ],
            [
                'What is the square root of 16?',
                '2',
                '4',
                '6',
                '8',
                'B',
                '1',
                'Square root of 16 is 4'
            ]
        ];
        const ws = xlsx_1.default.utils.aoa_to_sheet(sampleData);
        ws['!cols'] = [
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 12 },
            { wch: 8 },
            { wch: 25 }
        ];
        xlsx_1.default.utils.book_append_sheet(wb, ws, 'Questions');
        return xlsx_1.default.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
    async parseAttendanceData(fileBuffer) {
        try {
            const workbook = xlsx_1.default.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx_1.default.utils.sheet_to_json(sheet);
            return data.map((row) => ({
                student_id: row['Student ID'] || row['student_id'],
                student_name: row['Student Name'] || row['student_name'],
                date: row['Date'] || row['date'],
                status: row['Status'] || row['status'] || 'present'
            }));
        }
        catch (error) {
            throw new Error(`Failed to parse attendance data: ${error.message}`);
        }
    }
    async exportAttendanceReport(attendanceData, className, dateRange) {
        const wb = xlsx_1.default.utils.book_new();
        const exportData = attendanceData.map(record => ({
            'Student ID': record.student_number || record.student_id,
            'Student Name': record.student_name,
            'Date': record.attendance_date,
            'Status': record.status,
            'Scanned At': record.scanned_at || '-',
            'Class': className
        }));
        const ws = xlsx_1.default.utils.json_to_sheet(exportData);
        xlsx_1.default.utils.sheet_add_aoa(ws, [
            [`Attendance Report - ${className}`],
            [`Period: ${dateRange}`],
            ['']
        ], { origin: 'A1' });
        ws['!cols'] = [
            { wch: 12 },
            { wch: 20 },
            { wch: 12 },
            { wch: 10 },
            { wch: 15 },
            { wch: 15 }
        ];
        xlsx_1.default.utils.book_append_sheet(wb, ws, 'Attendance');
        return xlsx_1.default.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }
}
exports.default = new ExcelService();
//# sourceMappingURL=ExcelService.js.map