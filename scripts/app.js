import { setGlobalData } from './shared/state.js';
import { injectToastContainer, initializeBootstrapComponents, injectSignOutModal } from './shared/utils.js';
import { injectComponents } from './components/navbar.js';

// Safe Lucide initializer
window.initIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('SyncEvent App Initialized');

    // 1. Fetch Data from API Endpoints
    Promise.all([
        fetch('http://localhost:3000/users').then(res => res.json()),
        fetch('http://localhost:3000/events').then(res => res.json()),
        fetch('http://localhost:3000/registrations').then(res => res.json()),
        fetch('http://localhost:3000/payments').then(res => res.json())
    ])
        .then(([users, events, registrations, payments]) => {
            const data = { users, events, registrations, payments };
            setGlobalData(data);

            // Dispatch custom event when data is loaded so specific scripts can react
            document.dispatchEvent(new CustomEvent('dataLoaded', { detail: data }));
        })
        .catch(err => console.log('API fetch error:', err));

    // Dynamic Imports Based on Path
    const path = window.location.pathname;

    // About/Contact
    if (path.includes('/about/contact')) {
        const { setupContactForm } = await import('./features/about/about.js');
        setupContactForm();
    }

    // Auth
    if (path.includes('/auth/login')) {
        const { setupLoginForm } = await import('./features/auth/login.js');
        setupLoginForm();
    } else if (path.includes('/auth/signup')) {
        const { setupSignupForm } = await import('./features/auth/signup.js');
        setupSignupForm();
    }

    // Organizer
    if (path.includes('/organizer/signup')) {
        const { setupOrganizerForm, setupFileUploads } = await import('./features/organizer/organizer.js');
        setupOrganizerForm();
        setupFileUploads();
    }

    // Events
    if (path.includes('/events') && !path.includes('details') && !path.includes('booking')) {
        const { initializeEvents, setupGlobalInteractions } = await import('./features/events/events.js');
        // Initialize once data loads
        document.addEventListener('dataLoaded', () => {
            initializeEvents();
        });
        setupGlobalInteractions();
    } else if (path.includes('/events/details')) {
        const { initializeDetails } = await import('./features/events/details.js');
        document.addEventListener('dataLoaded', () => {
            initializeDetails();
        });
    } else if (path.includes('/events/booking')) {
        const { initBookingPage } = await import('./features/events/booking.js');
        document.addEventListener('dataLoaded', () => {
            initBookingPage();
        });
    }

    // Index (Homepage includes featured events)
    if (path === '/' || path.endsWith('/index.html') || path === '') {
        const { initializeEvents } = await import('./features/events/events.js');
        document.addEventListener('dataLoaded', () => {
            initializeEvents();
        });
    }

    // Profile
    if (path.includes('/profile')) {
        const { initProfilePage } = await import('./features/profile/profile.js');
        document.addEventListener('dataLoaded', () => {
            initProfilePage();
        });
    }

    // Globals
    injectComponents();
    injectToastContainer();
    injectSignOutModal();
    window.initIcons();
    initializeBootstrapComponents();
});