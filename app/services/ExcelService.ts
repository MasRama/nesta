/**
 * Excel Service
 * Handles Excel file parsing for exam questions and other school data
 */

import XLSX from 'xlsx';
import { randomUUID } from "crypto";

interface ExamQuestion {
   id: string;
   question_text: string;
   options: string[];
   correct_answer_index: number;
   points: number;
   explanation?: string;
}

interface ParsedExamData {
   questions: ExamQuestion[];
   metadata: {
      title?: string;
      description?: string;
      duration_minutes?: number;
   };
}

class ExcelService {
   /**
    * Parse Excel file to extract exam questions
    * Expected format:
    * Column A: Question Text
    * Column B: Option A
    * Column C: Option B
    * Column D: Option C
    * Column E: Option D
    * Column F: Correct Answer (A, B, C, or D)
    * Column G: Points (optional, defaults to 1)
    * Column H: Explanation (optional)
    */
   async parseExamQuestions(fileBuffer: Buffer): Promise<ParsedExamData> {
      try {
         const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
         const sheetName = workbook.SheetNames[0];
         const sheet = workbook.Sheets[sheetName];
         
         // Convert sheet to JSON
         const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
         
         // Skip header row and process questions
         const questions: ExamQuestion[] = [];
         const metadata: any = {};
         
         // Check if first few rows contain metadata
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
            metadata.duration_minutes = parseInt(data[2][1] as string) || 60;
            startRow++;
         }
         
         // Skip header row if it contains column names
         if (data[startRow] && typeof data[startRow][0] === 'string' && 
             data[startRow][0].toLowerCase().includes('question')) {
            startRow++;
         }

         for (let i = startRow; i < data.length; i++) {
            const row = data[i] as any[];
            
            // Skip empty rows
            if (!row || !row[0]) continue;
            
            const questionText = row[0]?.toString().trim();
            if (!questionText) continue;
            
            const options = [
               row[1]?.toString().trim() || '',
               row[2]?.toString().trim() || '',
               row[3]?.toString().trim() || '',
               row[4]?.toString().trim() || ''
            ].filter(option => option !== '');
            
            // At least 2 options required
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
                  // Try to parse as number (1-based index)
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
               id: randomUUID(),
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
         
      } catch (error) {
         console.error('Error parsing Excel file:', error);
         throw new Error(`Failed to parse Excel file: ${error.message}`);
      }
   }

   /**
    * Validate question format
    */
   validateQuestionFormat(questions: any[]): { isValid: boolean; errors: string[] } {
      const errors: string[] = [];
      
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

   /**
    * Generate Excel template for exam questions
    */
   generateExamTemplate(): Buffer {
      const wb = XLSX.utils.book_new();
      
      // Create sample data
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
      
      const ws = XLSX.utils.aoa_to_sheet(sampleData);
      
      // Set column widths
      ws['!cols'] = [
         { wch: 30 }, // Question
         { wch: 15 }, // Option A
         { wch: 15 }, // Option B
         { wch: 15 }, // Option C
         { wch: 15 }, // Option D
         { wch: 12 }, // Correct Answer
         { wch: 8 },  // Points
         { wch: 25 }  // Explanation
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Questions');
      
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
   }

   /**
    * Parse attendance data from Excel
    */
   async parseAttendanceData(fileBuffer: Buffer): Promise<any[]> {
      try {
         const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
         const sheetName = workbook.SheetNames[0];
         const sheet = workbook.Sheets[sheetName];
         
         const data = XLSX.utils.sheet_to_json(sheet);
         
         return data.map((row: any) => ({
            student_id: row['Student ID'] || row['student_id'],
            student_name: row['Student Name'] || row['student_name'],
            date: row['Date'] || row['date'],
            status: row['Status'] || row['status'] || 'present'
         }));
         
      } catch (error) {
         throw new Error(`Failed to parse attendance data: ${error.message}`);
      }
   }

   /**
    * Export attendance report to Excel
    */
   async exportAttendanceReport(attendanceData: any[], className: string, dateRange: string): Promise<Buffer> {
      const wb = XLSX.utils.book_new();
      
      // Prepare data for export
      const exportData = attendanceData.map(record => ({
         'Student ID': record.student_number || record.student_id,
         'Student Name': record.student_name,
         'Date': record.attendance_date,
         'Status': record.status,
         'Scanned At': record.scanned_at || '-',
         'Class': className
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add title row
      XLSX.utils.sheet_add_aoa(ws, [
         [`Attendance Report - ${className}`],
         [`Period: ${dateRange}`],
         ['']
      ], { origin: 'A1' });
      
      // Set column widths
      ws['!cols'] = [
         { wch: 12 }, // Student ID
         { wch: 20 }, // Student Name
         { wch: 12 }, // Date
         { wch: 10 }, // Status
         { wch: 15 }, // Scanned At
         { wch: 15 }  // Class
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
   }
}

export default new ExcelService();