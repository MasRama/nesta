"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("./app/services/DB"));
const ParentService_1 = __importDefault(require("./app/services/ParentService"));
const crypto_1 = require("crypto");
class ParentEditTest {
    async run() {
        console.log("🧪 Testing Parent Edit Functionality...\n");
        try {
            await this.ensureTestData();
            await this.testEditWithEmptyPassword();
            await this.testEditWithNewPassword();
            await this.testPasswordValidation();
            console.log("\n✅ All parent edit tests passed!");
        }
        catch (error) {
            console.error("\n❌ Test failed:", error);
            throw error;
        }
    }
    async ensureTestData() {
        console.log("📋 Ensuring test data exists...");
        const existingParent = await DB_1.default.from('parents').first();
        if (!existingParent) {
            const testParent = {
                nama: "Test Parent",
                email: "test.parent@netsa.school",
                password: "password123",
                phone: "081234567890",
                notes: "Test parent for edit functionality"
            };
            await ParentService_1.default.createParent(testParent);
            console.log("   ✓ Test parent created");
        }
        else {
            console.log("   ✓ Test parent already exists");
        }
    }
    async testEditWithEmptyPassword() {
        console.log("\n🔐 Test 1: Edit dengan password kosong...");
        const parent = await DB_1.default.from('parents').first();
        const originalPassword = parent.password;
        const updateData = {
            nama: "Updated Parent Name",
            email: parent.email,
            phone: "081999888777",
            notes: "Updated notes without password change"
        };
        const validationData = { ...updateData };
        console.log("   📝 Data sebelum filter:", JSON.stringify(validationData, null, 2));
        if (!updateData.password || updateData.password?.trim() === '') {
            delete validationData.password;
            console.log("   🗑️  Password dihapus dari validationData");
        }
        console.log("   📝 Data setelah filter:", JSON.stringify(validationData, null, 2));
        const errors = ParentService_1.default.validateParentData(validationData);
        if (errors.length > 0) {
            throw new Error(`Validation failed after removing empty password: ${JSON.stringify(errors)}`);
        }
        console.log("   ✓ Validasi berhasil setelah password kosong dihapus");
        await ParentService_1.default.updateParent(parent.id, updateData);
        const updatedParent = await DB_1.default.from('parents').where('id', parent.id).first();
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
        const parent = await DB_1.default.from('parents').first();
        const originalPassword = parent.password;
        const updateData = {
            nama: parent.nama,
            email: parent.email,
            password: "newpassword123",
            phone: parent.phone,
            notes: "Updated with new password"
        };
        const validationData = { ...updateData };
        if (!updateData.password || updateData.password?.trim() === '') {
            delete validationData.password;
        }
        const errors = ParentService_1.default.validateParentData(validationData);
        if (errors.length > 0) {
            throw new Error(`Validation failed for new password: ${JSON.stringify(errors)}`);
        }
        await ParentService_1.default.updateParent(parent.id, updateData);
        const updatedParent = await DB_1.default.from('parents').where('id', parent.id).first();
        if (updatedParent.password === originalPassword) {
            throw new Error("Password was not changed when it should have been");
        }
        const expectedHash = (0, crypto_1.pbkdf2Sync)("newpassword123", 'salt', 1000, 64, 'sha512').toString('hex');
        if (updatedParent.password !== expectedHash) {
            throw new Error("Password was not hashed correctly");
        }
        console.log("   ✓ Edit dengan password baru berhasil");
        console.log("   ✓ Password berhasil diupdate dan di-hash");
    }
    async testPasswordValidation() {
        console.log("\n⚠️  Test 3: Validasi password kurang dari 6 karakter...");
        const parent = await DB_1.default.from('parents').first();
        const invalidData = {
            nama: parent.nama,
            email: parent.email,
            password: "123",
            phone: parent.phone
        };
        const errors = ParentService_1.default.validateParentData(invalidData);
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
//# sourceMappingURL=test-parent-edit.js.map