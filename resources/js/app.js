import { createInertiaApp } from '@inertiajs/svelte'
import { mount } from 'svelte'
import ToastProvider from './Components/ToastProvider.svelte'

// Mount ToastProvider globally
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-provider';
document.body.appendChild(toastContainer);
mount(ToastProvider, { target: toastContainer });

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./Pages/**/*.svelte', { eager: true })
    return pages[`./Pages/${name}.svelte`]
  },
  setup({ el, App, props }) {
    el.classList.add('min-h-screen');
    mount(App, { target: el, props })
  },
})

// Ensure light mode is always active
document.documentElement.classList.remove('dark');
