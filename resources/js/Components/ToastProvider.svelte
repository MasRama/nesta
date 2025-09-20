<script>
   import { Toaster } from 'svelte-sonner';
</script>

<!-- Toast container with rich colors enabled -->
<Toaster
   position="top-right"
   richColors
   closeButton
   duration={3000}
   toastOptions={{
      className: 'toast-custom'
   }}
/>

<style>
   /* Enhanced toast styling with rich colors support */
   :global(.toast-custom) {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.5;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
   }

   /* Rich colors for different toast types - enhanced styling */
   :global(.toast-custom[data-type="success"]) {
      background: #10b981 !important;
      border: 1px solid #059669 !important;
      color: white !important;
   }

   :global(.toast-custom[data-type="error"]) {
      background: #ef4444 !important;
      border: 1px solid #dc2626 !important;
      color: white !important;
   }

   :global(.toast-custom[data-type="warning"]) {
      background: #f59e0b !important;
      border: 1px solid #d97706 !important;
      color: white !important;
   }

   :global(.toast-custom[data-type="info"]) {
      background: #3b82f6 !important;
      border: 1px solid #2563eb !important;
      color: white !important;
   }

   :global(.toast-custom[data-type="loading"]) {
      background: #6b7280 !important;
      border: 1px solid #4b5563 !important;
      color: white !important;
   }
</style>
