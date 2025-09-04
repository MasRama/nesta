import { Response, Request } from "../../type"; 

class HomeController {
    
    public async index (request : Request, response : Response) { 
        // Check if user is already logged in
        if (request.cookies.auth_id) {
            const DB = require('../services/DB').default;
            const session = await DB.from("sessions").where("id", request.cookies.auth_id).first();
            
            if (session) {
                const user = await DB.from("users").where("id", session.user_id).first();
                
                // Redirect to appropriate dashboard based on role
                switch (user.role) {
                    case 'student':
                        return response.redirect("/dashboard/student");
                    case 'teacher':
                        return response.redirect("/dashboard/teacher");
                    case 'parent':
                        return response.redirect("/dashboard/parent");
                    case 'admin':
                        return response.redirect("/dashboard/admin");
                    default:
                        return response.redirect("/home");
                }
            }
        }
        
        // Show landing page for non-authenticated users
        return response.inertia("landing", {
            schoolInfo: {
                name: "NETSA - New Era Technology School Administration",
                tagline: "Mengelola Masa Depan Pendidikan dengan Teknologi",
                description: "Sistem manajemen sekolah terpadu yang menggabungkan teknologi modern untuk memberikan pengalaman pendidikan terbaik bagi siswa, guru, dan orang tua.",
                address: "Jl. Pendidikan No. 123, Jakarta",
                phone: "+62 21 12345678",
                email: "info@netsa.school.id"
            }
        });
    }
}

export default new HomeController();
