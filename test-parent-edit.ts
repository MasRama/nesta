/**
 * Test script untuk menguji fungsionalitas edit wali murid
 * Menguji apakah password kosong tidak memicu error validasi
 */

import DB from "./app/services/DB";
import ParentService from "./app/services/ParentService";
import { pbkdf2Sync } from "crypto";

class ParentEditTest {
    async run() {
        console.log("🧪 Testing Parent Edit Functionality...\n");
        
        try {
            // Pastikan ada data parent untuk testing
            await this.ensureTestData();
            
            // Test 1: Edit dengan password kosong
            await this.testEditWithEmptyPassword();
            
            // Test 2: Edit dengan password diisi
            await this.testEditWithNewPassword();
            
            // Test 3: Validasi password kurang dari 6 karakter
            await this.testPasswordValidation();
            
            console.log("\n✅ All parent edit tests passed!");
            
        } catch (error) {
            console.error("\n❌ Test failed:", error);
            throw error;
        }
    }
    
    async ensureTestData() {
        console.log("📋 Ensuring test data exists...");
        
        // Cek apakah ada parent di database
        const existingParent = await DB.from('parents').first();
        
        if (!existingParent) {
            // Buat parent test jika belum ada
            const testParent = {
                nama: "Test Parent",
                email: "test.parent@netsa.school",
                password: "password123",
                phone: "081234567890",
                notes: "Test parent for edit functionality"
            };
            
            await ParentService.createParent(testParent);
            console.log("   ✓ Test parent created");
        } else {
            console.log("   ✓ Test parent already exists");
        }
    }
    
    async testEditWithEmptyPassword() {
        console.log("\n🔐 Test 1: Edit dengan password kosong...");

        // Ambil parent pertama
        const parent = await DB.from('parents').first();
        const originalPassword = parent.password;

        // Data update tanpa password (simulasi data dari frontend)
        const updateData: any = {
            nama: "Updated Parent Name",
            email: parent.email,
            phone: "081999888777",
            notes: "Updated notes without password change"
            // password tidak ada atau kosong
        };

        // Test logika controller - simulasi penghapusan password kosong
        const validationData = { ...updateData };
        console.log("   📝 Data sebelum filter:", JSON.stringify(validationData, null, 2));

        if (!updateData.password || updateData.password?.trim() === '') {
            delete validationData.password;
            console.log("   🗑️  Password dihapus dari validationData");
        }

        console.log("   📝 Data setelah filter:", JSON.stringify(validationData, null, 2));

        // Test validasi setelah password dihapus - seharusnya tidak ada error
        const errors = ParentService.validateParentData(validationData);

        if (errors.length > 0) {
            throw new Error(`Validation failed after removing empty password: ${JSON.stringify(errors)}`);
        }

        console.log("   ✓ Validasi berhasil setelah password kosong dihapus");

        // Test update - gunakan data asli (dengan password kosong)
        await ParentService.updateParent(parent.id, updateData);

        // Verifikasi update berhasil
        const updatedParent = await DB.from('parents').where('id', parent.id).first();

        if (updatedParent.nama !== updateData.nama) {
            throw new Error("Name update failed");
        }

        if (updatedParent.phone !== updateData.phone) {
            throw new Error("Phone update failed");
        }

        if (updatedParent.password !== originalPassword) {
            throw new Error("Password was changed when it should not have been");
        }

        console.log("   ✓ Edit dengan password kosong berhasil");
        console.log(`   ✓ Nama diupdate: ${updatedParent.nama}`);
        console.log(`   ✓ Phone diupdate: ${updatedParent.phone}`);
        console.log("   ✓ Password tidak berubah");
    }
    
    async testEditWithNewPassword() {
        console.log("\n🔑 Test 2: Edit dengan password baru...");

        const parent = await DB.from('parents').first();
        const originalPassword = parent.password;

        // Data update dengan password baru
        const updateData: any = {
            nama: parent.nama,
            email: parent.email,
            password: "newpassword123",
            phone: parent.phone,
            notes: "Updated with new password"
        };

        // Test logika controller - password tidak dihapus karena ada isinya
        const validationData = { ...updateData };
        if (!updateData.password || updateData.password?.trim() === '') {
            delete validationData.password;
        }

        // Test validasi - seharusnya tidak ada error
        const errors = ParentService.validateParentData(validationData);

        if (errors.length > 0) {
            throw new Error(`Validation failed for new password: ${JSON.stringify(errors)}`);
        }

        // Test update
        await ParentService.updateParent(parent.id, updateData);

        // Verifikasi update berhasil
        const updatedParent = await DB.from('parents').where('id', parent.id).first();

        if (updatedParent.password === originalPassword) {
            throw new Error("Password was not changed when it should have been");
        }

        // Verifikasi password di-hash dengan benar
        const expectedHash = pbkdf2Sync("newpassword123", 'salt', 1000, 64, 'sha512').toString('hex');
        if (updatedParent.password !== expectedHash) {
            throw new Error("Password was not hashed correctly");
        }

        console.log("   ✓ Edit dengan password baru berhasil");
        console.log("   ✓ Password berhasil diupdate dan di-hash");
    }
    
    async testPasswordValidation() {
        console.log("\n⚠️  Test 3: Validasi password kurang dari 6 karakter...");
        
        const parent = await DB.from('parents').first();
        
        // Data dengan password kurang dari 6 karakter
        const invalidData = {
            nama: parent.nama,
            email: parent.email,
            password: "123", // Kurang dari 6 karakter
            phone: parent.phone
        };
        
        // Test validasi - seharusnya ada error
        const errors = ParentService.validateParentData(invalidData);
        
        if (errors.length === 0) {
            throw new Error("Validation should have failed for password < 6 characters");
        }
        
        const passwordError = errors.find(e => e.field === 'password');
        if (!passwordError) {
            throw new Error("Password validation error not found");
        }
        
        if (!passwordError.message.includes('minimal 6 karakter')) {
            throw new Error("Password error message incorrect");
        }
        
        console.log("   ✓ Validasi password kurang dari 6 karakter berhasil");
        console.log(`   ✓ Error message: ${passwordError.message}`);
    }
}

// Run the test
const test = new ParentEditTest();
test.run()
    .then(() => {
        console.log("\n🎯 Parent edit test completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n💥 Parent edit test failed:", error);
        process.exit(1);
    });
