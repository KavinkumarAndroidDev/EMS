import { showToast } from './utils.js';

export function updateNavbar() {
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const path = window.location.pathname;
    const isEventsPage = path.includes('events.html');
    const isHtmlDir = path.includes('/html/');
    const isLoginPage = path.includes('login.html');

    // Login Page Warning
    if (isLoginPage && user) {
        showToast('Notice', 'You are already logged in. Logging in again will start a new session.', 'info');
    }

    const headerRight = document.querySelector('.header-right');
    const headerCenter = document.querySelector('.header-center');
    
    if (!headerRight) return;

    if (user) {
        // Logged In State
        const initials = user.profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const firstName = user.profile.fullName.split(' ')[0];

        const notificationsLink = isHtmlDir ? 'notifications.html' : 'html/notifications.html';
        
        let profileLink = 'html/profile.html';
        if (path.includes('/html/events/')) {
            profileLink = '../../html/profile.html';
        } else if (path.includes('/html/')) {
            profileLink = 'profile.html';
        }

        // 1. Update Header Right (User Profile)
        headerRight.innerHTML = `
            <a href="${notificationsLink}" class="icon-circle btn p-0 me-2 text-decoration-none d-inline-flex align-items-center justify-content-center">
                <i data-lucide="bell" width="20" height="20"></i>
            </a>
            
            <div class="dropdown d-inline-block">
                <div class="d-flex align-items-center gap-2 cursor-pointer" data-bs-toggle="dropdown" aria-expanded="false" style="cursor: pointer;">
                    <span class="avatar-circle">${initials}</span>
                    <span class="welcome-text d-none d-sm-inline-block">Welcome, ${firstName}</span>
                </div>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="${profileLink}">My Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" id="logoutBtn">Logout</button></li>
                </ul>
            </div>
        `;

        document.querySelector('.site-header').classList.remove('search-variant');

        // Attach Logout Listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const modalEl = document.getElementById('signOutModal');
                if (modalEl) new bootstrap.Modal(modalEl).show();
            });
        }

    } else {
        // Guest State
        const loginPath = path.includes('/html/') ? 'login.html' : 'html/login.html';
        const signupPath = path.includes('/html/') ? 'signup.html' : 'html/signup.html';
        
        headerRight.innerHTML = `
            <div id="guestState" class="auth-state">
                <a href="${loginPath}" class="btn btn-text">Login</a>
                <a href="${signupPath}" class="btn btn-primary">
                    <span>Signup</span>
                    <i data-lucide="arrow-right" class="btn-icon"></i>
                </a>
            </div>
        `;
    }
    
    // Location Selector Logic
    const locationDropdown = document.querySelector('.header-center .dropdown-toggle');
    if (locationDropdown) {
        const locationItems = document.querySelectorAll('.header-center .dropdown-item');
        locationItems.forEach(item => {
            item.addEventListener('click', (e) => {
                locationDropdown.innerText = e.target.innerText;
            });
        });
    }

    if (window.lucide) lucide.createIcons();
}