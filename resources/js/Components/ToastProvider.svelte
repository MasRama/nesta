<script>
   import { Toaster } from 'svelte-sonner';
</script>

<!-- Toast container with custom styling -->
<Toaster 
   position="top-right"
   richColors
   closeButton
   duration={3000}
   toastOptions={{
      style: 'background: white; color: #374151; border: 1px solid #e5e7eb; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);',
      className: 'toast-custom'
   }}
/>

<style>
   :global(.toast-custom) {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
   }
   
   :global(.toast-custom[data-type="success"]) {
      background: #f0fdf4 !important;
      border-color: #bbf7d0 !important;
      color: #166534 !important;
   }
   
   :global(.toast-custom[data-type="error"]) {
      background: #fef2f2 !important;
      border-color: #fecaca !important;
      color: #dc2626 !important;
   }

   :global(.toast-custom[data-type="warning"]) {
      background: #fffbeb !important;
      border-color: #fed7aa !important;
      color: #d97706 !important;
   }

   :global(.toast-custom[data-type="info"]) {
      background: #eff6ff !important;
      border-color: #bfdbfe !important;
      color: #1d4ed8 !important;
   }
   
   :global(.toast-custom[data-type="loading"]) {
      background: #f9fafb !important;
      border-color: #e5e7eb !important;
      color: #374151 !important;
   }
</style>
