import DB from "../services/DB";
import { Request, Response } from "../../type";

export default async (request : Request, response : Response) => {
     
   if(request.cookies.auth_id) { 
       const session = await DB.from("sessions").where("id", request.cookies.auth_id).first();

       if(session) {
           // Check if this is a student session
           if(session.student_id) {
               const student = await DB.from("students")
                   .where("id", session.student_id)
                   .select(["id", "nipd", "nama", "kelas", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama", "is_active"])
                   .first();
               
               if(student && student.is_active) {
                   request.user = {
                       id: student.id,
                       name: student.nama,
                       email: `${student.nipd}@spensagi.id`,
                       role: 'student',
                       nipd: student.nipd,
                       kelas: student.kelas,
                       student_data: student
                   };

                   request.share = {
                       "user": request.user,
                   }
               } else {
                   response.cookie("auth_id", "", 0).redirect("/login");
               }
           } 
           // This is a regular user session
           else if(session.user_id) {
               const user = await DB.from("users")
                   .where("id", session.user_id)
                   .select(["id", "name", "email", "phone", "is_admin", "is_verified", "role", "student_id", "teacher_id", "profile_image"])
                   .first();
               
               if(user) {
                   request.user = user;

                   request.share = {
                       "user": request.user,
                   }
               } else {
                   response.cookie("auth_id", "", 0).redirect("/login");
               }
           } else {
               response.cookie("auth_id", "", 0).redirect("/login");
           }
       } else { 
           response.cookie("auth_id", "", 0).redirect("/login");
       }
      
   } else { 
       response.cookie("auth_id", "", 0).redirect("/login");
   }
}