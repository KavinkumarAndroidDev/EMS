import { state } from './state.js';
import { showToast, setupGenericPagination } from './utils.js';

export function initProfilePage() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);

    // Populate Sidebar
    const initials = user.profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebar-avatar').textContent = initials;
    document.getElementById('sidebar-name').textContent = user.profile.fullName;
    document.getElementById('sidebar-email').textContent = user.profile.email;

    // Populate Profile Settings View
    document.getElementById('profile-settings-avatar').src = user.profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile.fullName)}&background=17B978&color=fff`;
    document.getElementById('profile-settings-name').textContent = user.profile.fullName;
    document.getElementById('profile-settings-email-display').textContent = user.profile.email;

    document.getElementById('profile-email').value = user.profile.email;
    document.getElementById('profile-phone').value = user.profile.phone || '';
    document.getElementById('profile-fullname').value = user.profile.fullName;
    document.getElementById('profile-dob').value = user.profile.dateOfBirth || '';
    if (user.profile.gender) document.getElementById('profile-gender').value = user.profile.gender;

    // Sidebar Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;

            navLinks.forEach(l => {
                l.classList.remove('active-nav-item', 'text-primary');
                l.classList.add('text-neutral-900', 'hover-bg-neutral-50');
            });
            link.classList.add('active-nav-item', 'text-primary');
            link.classList.remove('text-neutral-900', 'hover-bg-neutral-50');

            ['overview', 'profile', 'registrations', 'past-events', 'payments'].forEach(s => {
                document.getElementById(`view-${s}`)?.classList.add('d-none');
            });

            if (section === 'overview') document.getElementById('view-overview').classList.remove('d-none');
            if (section === 'profile') document.getElementById('view-profile').classList.remove('d-none');
            if (section === 'registrations') renderRegistrations();
            if (section === 'past-events') renderPastEvents();
            if (section === 'payments') renderPayments();
        });
    });

    // Logout handlers
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', () => {
            const modalEl = document.getElementById('signOutModal');
            if (modalEl) new bootstrap.Modal(modalEl).show();
        });
    }

    const confirmSignOutBtn = document.getElementById('confirmSignOutBtn');
    if (confirmSignOutBtn) {
        confirmSignOutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }

    // Populate Upcoming Events
    const container = document.getElementById('profile-upcoming-events');
    if (container && state.events) {
        const events = state.events.slice(0, 2);
        container.innerHTML = events.map(event => {
            const date = new Date(event.schedule.startDateTime);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const minPrice = Math.min(...event.tickets.map(t => t.price));
            return `
                <div class="card-custom p-3">
                    <div class="d-flex gap-3">
                        <img src="${event.media.thumbnail}" class="rounded-3 object-fit-cover" style="width: 120px; height: 80px;" alt="${event.title}">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="fw-bold mb-1">${event.title}</h6>
                                    <div class="small text-neutral-400 mb-2">
                                        <i data-lucide="calendar" width="14" class="me-1"></i> ${dateStr} • ${event.venue.address.city}
                                    </div>
                                </div>
                                <a href="events/event-details.html?id=${event.id}" class="btn btn-outline-primary btn-sm rounded-pill">View</a>
                            </div>
                            <div class="d-flex align-items-center justify-content-between mt-1">
                                <div class="small text-neutral-600">1 Ticket • Standard</div>
                                <div class="fw-bold text-primary">₹${minPrice}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Populate Recent Payments (overview widget)
    const paymentsContainer = document.getElementById('profile-recent-payments');
    if (paymentsContainer && state.payments) {
        const recentPayments = state.payments.filter(p => p.userId === user.id).slice(0, 4);
        paymentsContainer.innerHTML = recentPayments.map(pay => {
            let badgeClass = '';
            if (pay.status === 'Confirmed') badgeClass = 'border-success text-success';
            else if (pay.status === 'Refunded') badgeClass = 'border-warning text-warning';
            else if (pay.status === 'Failed') badgeClass = 'border-danger text-danger';

            return `
            <div class="col-md-6">
                <div class="card-custom p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <div class="fw-bold text-truncate" style="max-width: 150px;">${pay.eventTitle}</div>
                            <div class="small text-neutral-400">Order #${pay.id.split('-')[1]}</div>
                        </div>
                        <span class="badge bg-transparent border ${badgeClass} rounded-pill px-3">${pay.status}</span>
                    </div>
                    <div class="fw-bold">₹${pay.amount}</div>
                </div>
            </div>`;
        }).join('');
    }

    // Profile Update Handler
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast('Success', 'Profile updated successfully!', 'success');
        });
    }

    // Change Password Logic
    const cpNewPass = document.getElementById('cpNewPassword');
    const cpConfirmPass = document.getElementById('cpConfirmPassword');

    if (cpNewPass && cpConfirmPass) {
        cpNewPass.addEventListener('input', () => {
            const val = cpNewPass.value;
            const hasLength = val.length >= 8;
            const hasUpper = /[A-Z]/.test(val);
            const hasNumber = /[0-9]/.test(val);

            const updateReq = (id, valid) => {
                const el = document.getElementById(id);
                if (!el) return;
                if (valid) { el.classList.remove('text-neutral-400'); el.classList.add('text-success'); }
                else { el.classList.remove('text-success'); el.classList.add('text-neutral-400'); }
            };
            updateReq('cp-req-length', hasLength);
            updateReq('cp-req-upper', hasUpper);
            updateReq('cp-req-number', hasNumber);

            let strength = 0;
            if (hasLength) strength += 33;
            if (hasUpper) strength += 33;
            if (hasNumber) strength += 34;

            const bar = document.querySelector('#cpPasswordStrength .progress-bar');
            if (bar) {
                bar.style.width = strength + '%';
                if (strength < 50) bar.className = 'progress-bar bg-danger';
                else if (strength < 100) bar.className = 'progress-bar bg-warning';
                else bar.className = 'progress-bar bg-success';
            }
        });

        cpConfirmPass.addEventListener('input', () => {
            cpConfirmPass.setCustomValidity(
                cpConfirmPass.value && cpNewPass.value !== cpConfirmPass.value ? "Passwords do not match" : ""
            );
        });

        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const form = e.target;
                if (form.checkValidity()) {
                    const modalEl = document.getElementById('changePasswordModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    form.reset();
                    showToast('Success', 'Password changed successfully.', 'success');
                }
                form.classList.add('was-validated');
            });
        }
    }

    if (window.lucide) lucide.createIcons();
}

// ─── Registrations ────────────────────────────────────────────────

function renderRegistrations() {
    const view = document.getElementById('view-registrations');
    if (!view) return;
    view.classList.remove('d-none');

    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user ? user.id : null;

    // Filter for active registrations (future events or not completed)
    const registrations = state.registrations.filter(r => r.userId === userId && r.status !== 'COMPLETED' && r.status !== 'CANCELLED');

    setupGenericPagination({
        items: registrations,
        containerId: 'registrations-list',
        paginationId: 'registrations-pagination',
        itemsPerPage: 5,
        renderItem: (reg) => {
            const date = new Date(reg.date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' • ' +
                date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const isCancelled = reg.status === 'CANCELLED';
            return `
            <div class="card-custom p-3 registration-card ${isCancelled ? 'cancelled' : ''}">
                <div class="d-flex gap-3">
                    <img src="${reg.img}" class="rounded-3 object-fit-cover d-none d-sm-block" style="width: 120px; height: 90px;" alt="${reg.eventName}">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="fw-bold mb-1 text-neutral-900">${reg.eventName}</h6>
                                <div class="small text-neutral-400 mb-1"><i data-lucide="calendar" width="14" class="me-1"></i> ${dateStr}</div>
                                <div class="small text-neutral-400"><i data-lucide="map-pin" width="14" class="me-1"></i> ${reg.location}</div>
                            </div>
                            ${isCancelled
                                ? `<span class="badge bg-danger-subtle text-danger rounded-pill px-3">Cancelled</span>`
                                : `<button class="btn btn-outline-danger btn-sm rounded-pill px-3 btn-cancel-reg" data-id="${reg.id}">Cancel</button>`
                            }
                        </div>
                        <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-neutral-100">
                            <div class="small text-neutral-600">${reg.quantity} x ${reg.ticketType}</div>
                            <div class="fw-bold text-primary">₹${reg.price}</div>
                        </div>
                    </div>
                </div>
            </div>`;
        },
        onRender: () => {
            document.querySelectorAll('.btn-cancel-reg').forEach(btn => {
                btn.addEventListener('click', () => {
                    const reg = state.registrations.find(r => r.id === btn.dataset.id);
                    if (reg) openCancelModal(reg);
                });
            });
        }
    });
}

function openCancelModal(reg) {
    const modalEl = document.getElementById('cancelBookingModal');
    const modal = new bootstrap.Modal(modalEl);

    document.getElementById('cancel-event-name').textContent = reg.eventName;
    document.getElementById('cancel-original-price').textContent = `₹${reg.price}`;
    const fee = Math.round(reg.price * 0.20);
    const refund = reg.price - fee;
    document.getElementById('cancel-fee').textContent = `-₹${fee}`;
    document.getElementById('cancel-refund').textContent = `₹${refund}`;

    const confirmBtn = document.getElementById('confirmCancelBtn');
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', () => {
        reg.status = 'CANCELLED';
        modal.hide();
        showToast('Success', 'Booking cancelled successfully.', 'success');
        renderRegistrations();
    });
    modal.show();
}

// ─── Past Events ──────────────────────────────────────────────────

function renderPastEvents() {
    const view = document.getElementById('view-past-events');
    if (!view) return;
    view.classList.remove('d-none');

    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user ? user.id : null;

    // Filter for past events
    const pastEvents = state.registrations.filter(r => r.userId === userId && (r.status === 'COMPLETED' || r.status === 'CANCELLED'));

    setupGenericPagination({
        items: pastEvents,
        containerId: 'past-events-list',
        paginationId: 'past-events-pagination',
        itemsPerPage: 5,
        renderItem: (evt) => {
            const date = new Date(evt.date);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return `
            <div class="card-custom p-3 bg-neutral-50 border-neutral-100">
                <div class="d-flex gap-3">
                    <img src="${evt.img}" class="rounded-3 object-fit-cover d-none d-sm-block" style="width: 120px; height: 90px; filter: grayscale(100%);" alt="${evt.eventName}">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="fw-bold mb-1 text-neutral-900">${evt.eventName}</h6>
                                <div class="small text-neutral-400 mb-1"><i data-lucide="calendar" width="14" class="me-1"></i> ${dateStr}</div>
                                <div class="small text-neutral-400"><i data-lucide="map-pin" width="14" class="me-1"></i> ${evt.location}</div>
                            </div>
                            ${evt.feedbackSubmitted
                                ? `<div class="d-flex align-items-center gap-1 text-success small fw-medium bg-white px-3 py-1 rounded-pill border border-neutral-100"><i data-lucide="check-circle" width="14"></i> Rated: ${'★'.repeat(evt.rating)}</div>`
                                : `<button class="btn btn-outline-primary btn-sm rounded-pill px-3 btn-feedback" data-id="${evt.id}">Submit Feedback</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>`;
        },
        onRender: () => {
            document.querySelectorAll('.btn-feedback').forEach(btn => {
                btn.addEventListener('click', () => {
                    const evt = state.registrations.find(e => e.id === btn.dataset.id);
                    if (evt) openFeedbackModal(evt);
                });
            });
        }
    });
}

function openFeedbackModal(evt) {
    const modalEl = document.getElementById('feedbackModal');
    const modal = new bootstrap.Modal(modalEl);
    document.getElementById('feedback-event-name').textContent = evt.eventName;

    const oldBtn = document.getElementById('submitFeedbackBtn');
    const submitBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(submitBtn, oldBtn);
    submitBtn.disabled = true;

    let selectedRating = 0;
    const options = document.querySelectorAll('.emoji-option');
    options.forEach(opt => {
        opt.classList.remove('selected');
        opt.onclick = () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedRating = parseInt(opt.dataset.value);
            submitBtn.disabled = false;
        };
    });

    submitBtn.addEventListener('click', () => {
        evt.feedbackSubmitted = true;
        evt.rating = selectedRating;
        modal.hide();
        showToast('Thank You', 'Your feedback has been submitted.', 'success');
        renderPastEvents();
    });
    modal.show();
}

// ─── Payments ─────────────────────────────────────────────────────

function renderPayments() {
    const view = document.getElementById('view-payments');
    if (!view) return;
    view.classList.remove('d-none');

    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user ? user.id : null;

    const payments = state.payments.filter(p => p.userId === userId);

    setupGenericPagination({
        items: payments,
        containerId: 'payments-list',
        paginationId: 'payments-pagination',
        itemsPerPage: 5,
        renderItem: (pay) => {
            const date = new Date(pay.date);
            const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            let badgeClass = '';
            if (pay.status === 'Confirmed') badgeClass = 'border-success text-success';
            else if (pay.status === 'Refunded') badgeClass = 'border-warning text-warning';
            else if (pay.status === 'Failed') badgeClass = 'border-danger text-danger';

            return `
            <div class="card-custom p-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex flex-column gap-1">
                        <h5 class="fw-semibold text-neutral-900 mb-1">${pay.eventTitle}</h5>
                        <div class="small text-neutral-600">${dateStr}</div>
                        <div class="small text-neutral-600">${pay.tickets}</div>
                        <div class="fw-medium text-neutral-900 mt-1">${pay.method}</div>
                    </div>
                    <div class="text-end">
                        <div class="fs-5 fw-semibold text-neutral-900 mb-3">₹${pay.amount}</div>
                        <span class="badge rounded-pill bg-transparent border ${badgeClass} px-3 py-2 fw-medium" style="font-size: 0.875rem;">
                            ${pay.status}
                        </span>
                    </div>
                </div>
            </div>`;
        }
    });
}
