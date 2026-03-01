import { state } from '../../shared/state.js';
import { showToast } from '../../shared/utils.js';

export function setupSignupForm() {
    console.log('[Signup] setupSignupForm initialized');

    const form = document.getElementById('signupForm');
    if (!form) {
        console.log('[Signup] Form not found');
        return;
    }

    console.log('[Signup] Form found');


    const btnSendOtp = document.getElementById('btnSendOtp');
    const otpSentMsg = document.getElementById('otpSentMsg');

    if (btnSendOtp) {
        btnSendOtp.addEventListener('click', (e) => {
            e.preventDefault();
            const phone = document.getElementById('phone')?.value.trim();
            if (!phone) {
                showToast('Warning', 'Please enter your phone number first to receive OTP.', 'warning');
                return;
            }
            if (otpSentMsg) otpSentMsg.classList.remove('d-none');
            showToast('OTP Sent', 'Mock OTP (123456) has been sent to ' + phone, 'success');
        });
    }

    // Apply real-time validation helper
    import('../../shared/utils.js').then(m => {
        m.setupRealtimeValidation('signupForm');
    });

    form.addEventListener('submit', (e) => {
        console.log('[Signup] Submit triggered');
        e.preventDefault();
        e.stopPropagation();
        console.log('[Signup] Form validity:', form.checkValidity());
        if (form.checkValidity()) {
            const firstName = document.getElementById('firstName').value.trim();
            const lastName = document.getElementById('lastName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const otp = document.getElementById('otp').value.trim();
            console.log('[Signup] OTP entered:', otp);
            if (!otp || otp.length !== 6) {
                showToast('Error', 'Invalid OTP. Please enter a valid 6-digit OTP.', 'danger');
                return;
            }

            // Handle cases where backend fetch hasn't populated state yet
            const safeUsers = state.users || [];

            // Edge Case: Email or Phone exists
            const exists = safeUsers.some(u => u.profile.email === email || u.profile.phone === phone);
            if (exists) {
                showToast('Error', 'User already registered with this email or phone. Please login.', 'warning');
                return;
            }

            // Create new user object
            const newUser = {
                id: 'USR-' + (1000 + safeUsers.length + 1),
                password: 'mocked-otp-user',
                profile: {
                    fullName: `${firstName} ${lastName}`,
                    email: email,
                    phone: phone,
                    gender: "UNKNOWN",
                    dateOfBirth: "2000-01-01",
                    profileImage: `https://dummyimage.com/200x200/10B981/ffffff&text=${firstName.charAt(0)}${lastName.charAt(0)}`,
                    bio: "New user"
                },
                role: {
                    id: "ROLE-2",
                    name: "ATTENDEE",
                    permissions: ["VIEW_EVENTS", "REGISTER_EVENT", "BOOK_TICKETS", "WRITE_REVIEWS", "SAVE_EVENTS"]
                },
                accountStatus: {
                    status: "ACTIVE",
                    isEmailVerified: false,
                    isPhoneVerified: false,
                    failedLoginAttempts: 0,
                    lastLogin: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                },
                preferences: {
                    language: "en",
                    notifications: { email: true, sms: false, push: false },
                    interestedCategories: []
                },
                statistics: {
                    eventsCreated: 0,
                    eventsAttended: 0,
                    totalSpent: 0,
                    averageRatingGiven: 0
                }
            };

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...';

            const showSuccessModal = () => {
                console.log('[Signup] Preparing to show success modal');
                let modalEl = document.getElementById('signupSuccessModal');
                if (!modalEl) {
                    console.log('[Signup] Creating modal element');
                    modalEl = document.createElement('div');
                    modalEl.id = 'signupSuccessModal';
                    modalEl.className = 'modal fade';
                    modalEl.tabIndex = -1;
                    modalEl.style.zIndex = '1060'; // Ensure it's above backdrops
                    modalEl.innerHTML = `
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content border-0 shadow-lg rounded-4 text-center p-4">
                                <div class="modal-body">
                                    <i data-lucide="party-popper" class="text-primary mb-3 mx-auto" width="48" height="48"></i>
                                    <h4 class="fw-bold text-neutral-900 mb-2">Account Created!</h4>
                                    <p class="text-neutral-500 mb-0">Welcome to SyncEvent! Redirecting you to login...</p>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modalEl);
                    if (window.initIcons) window.initIcons();
                }
                if (!window.bootstrap) {
                    console.error('Bootstrap not loaded');
                    window.location.href = 'login.html'; // fallback
                    return;
                }
                const bsModal = new window.bootstrap.Modal(modalEl);

                modalEl.addEventListener('shown.bs.modal', () => {
                    setTimeout(() => {
                        console.log('[Signup] Redirecting to login page');
                        console.log('[Signup] Current URL:', window.location.href);
                        console.log('[Signup] Redirecting to:', 'login.html');
                        window.location.href = '/pages/auth/login.html';
                    }, 1500);
                }, { once: true });
                console.log('[Signup] Showing modal now');
                bsModal.show();
                modalEl.addEventListener('shown.bs.modal', () => {
                    console.log('[Signup] Modal fully visible on screen');
                });
            };
            console.log('[Signup] Sending POST request to server...');
            // POST to JSON server
            fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            })
                .then(res => {
                    console.log('[Signup] Server response received. Status:', res.status);

                    if (!res.ok) throw new Error('Server returned non-200');
                    return res.json();
                })
                .then(data => {
                    console.log('[Signup] User successfully created on server:', data);
                    if (!state.users) state.users = [];
                    state.users.push(data); // update local state
                    showSuccessModal();
                })
                .catch(err => {
                    console.warn('Signup POST failed (JSON server offline?). Mocking success for UI test.', err);
                    if (!state.users) state.users = [];
                    // Ensure we don't push duplicates
                    if (!state.users.some(u => u.profile.email === newUser.profile.email)) {
                        state.users.push(newUser);
                    }
                    showSuccessModal();
                });
        } else {
            showToast('Error', 'Please fill in all required fields correctly.', 'danger');
        }
    });

}
