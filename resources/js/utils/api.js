import axios from 'axios';
import { toast } from 'svelte-sonner';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: '/',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Add request interceptor to include CSRF token if available
api.interceptors.request.use(
    (config) => {
        // Get CSRF token from meta tag or cookie
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (token) {
            config.headers['X-CSRF-TOKEN'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for global error handling
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            const { status, data } = error.response;
            
            switch (status) {
                case 401:
                    toast.error('Sesi Anda telah berakhir. Silakan login kembali.');
                    // Redirect to login page
                    window.location.href = '/login';
                    break;
                case 403:
                    toast.error('Anda tidak memiliki akses untuk melakukan operasi ini.');
                    break;
                case 404:
                    toast.error('Data tidak ditemukan.');
                    break;
                case 422:
                    // Validation errors - will be handled by individual components
                    break;
                case 500:
                    toast.error('Terjadi kesalahan server. Silakan coba lagi.');
                    break;
                default:
                    toast.error(data?.error || 'Terjadi kesalahan yang tidak diketahui.');
            }
        } else if (error.request) {
            toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        } else {
            toast.error('Terjadi kesalahan yang tidak diketahui.');
        }
        
        return Promise.reject(error);
    }
);

// API methods for CRUD operations
export const teacherAPI = {
    // Get all teachers with pagination and search
    getAll: (params = {}) => {
        return api.get('/api/teachers', { params });
    },
    
    // Get single teacher by ID (for edit form)
    getById: (id) => {
        return api.get(`/admin/teachers/${id}/edit`);
    },
    
    // Create new teacher
    create: (data) => {
        return api.post('/admin/teachers', data);
    },
    
    // Update teacher
    update: (id, data) => {
        return api.put(`/admin/teachers/${id}`, data);
    },
    
    // Delete teacher
    delete: (id) => {
        return api.delete(`/admin/teachers/${id}`);
    }
};

// Toast notification helpers
export const showToast = {
    success: (message) => {
        toast.success(message, {
            duration: 3000,
            position: 'top-right',
            className: 'toast-custom'
        });
    },

    error: (message) => {
        toast.error(message, {
            duration: 5000,
            position: 'top-right',
            className: 'toast-custom'
        });
    },

    warning: (message) => {
        toast.warning(message, {
            duration: 4000,
            position: 'top-right',
            className: 'toast-custom'
        });
    },

    info: (message) => {
        toast.info(message, {
            duration: 3000,
            position: 'top-right',
            className: 'toast-custom'
        });
    },

    loading: (message) => {
        return toast.loading(message, {
            position: 'top-right',
            className: 'toast-custom'
        });
    },

    dismiss: (toastId) => {
        toast.dismiss(toastId);
    },

    // Promise-based toast for async operations
    promise: (promise, messages) => {
        return toast.promise(promise, {
            loading: messages.loading || 'Loading...',
            success: messages.success || 'Success!',
            error: messages.error || 'Error occurred',
            position: 'top-right',
            className: 'toast-custom'
        });
    }
};

// Error handling utility
export const handleAPIError = (error, defaultMessage = 'Terjadi kesalahan') => {
    console.error('API Error:', error);

    if (error.response?.status === 400 && error.response?.data?.errors) {
        // Validation errors
        const errors = error.response.data.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
        }, {});

        showToast.error('Data tidak valid. Periksa form kembali.');
        return { type: 'validation', errors };
    } else if (error.response?.data?.error) {
        // Server error with message
        showToast.error(error.response.data.error);
        return { type: 'server', message: error.response.data.error };
    } else if (error.response?.status === 401) {
        // Unauthorized - handled by interceptor
        return { type: 'unauthorized' };
    } else if (error.response?.status === 403) {
        // Forbidden - handled by interceptor
        return { type: 'forbidden' };
    } else if (error.response?.status === 404) {
        // Not found - handled by interceptor
        return { type: 'not_found' };
    } else {
        // Generic error
        showToast.error(defaultMessage);
        return { type: 'generic', message: defaultMessage };
    }
};

export default api;
