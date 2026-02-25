import { state } from './state.js';

export function initBookingPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId || !state.events) return;

    const event = state.events.find(e => e.id === eventId);
    if (!event) return;

    // Populate Header Info
    document.getElementById('booking-event-title').textContent = event.title;
    const date = new Date(event.schedule.startDateTime);
    document.getElementById('booking-event-date').textContent =
        date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) + ' • ' + event.venue.name;
    document.getElementById('summary-event-title').textContent = event.title;
    document.getElementById('summary-event-date').textContent =
        date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
        date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Update Summary Image
    const summaryImg = document.getElementById('summary-event-image');
    if (summaryImg) {
        // Use a slight timeout to ensure DOM is ready if needed, or just set directly
        summaryImg.setAttribute('src', event.media.thumbnail);
        summaryImg.setAttribute('alt', event.title);
        summaryImg.style.objectFit = 'cover';
    }

    // Render Tickets
    const container = document.getElementById('tickets-container');
    const cart = {};

    event.tickets.forEach(ticket => {
        const card = document.createElement('div');
        card.className = 'card-custom';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h4 class="fw-bold text-neutral-900 mb-1">${ticket.type.replace('_', ' ')}</h4>
                    <div class="fs-5 fw-bold text-primary">₹${ticket.price}</div>
                </div>
                <div class="ticket-action" data-id="${ticket.id}" data-price="${ticket.price}">
                    <button class="btn btn-outline-primary rounded-pill px-4 btn-add">Add</button>
                    <div class="quantity-control d-none">
                        <button class="quantity-btn btn-minus"><i data-lucide="minus" width="16"></i></button>
                        <span class="fw-bold mx-2 count">0</span>
                        <button class="quantity-btn btn-plus"><i data-lucide="plus" width="16"></i></button>
                    </div>
                </div>
            </div>
            <hr class="border-neutral-100 my-3">
            <ul class="list-unstyled mb-0 text-neutral-400 small">
                ${ticket.benefits.map(b => `<li class="mb-1"><i data-lucide="check" width="14" class="me-2 text-success"></i>${b}</li>`).join('')}
            </ul>
        `;
        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();

    // Event Delegation for Ticket Actions
    container.addEventListener('click', (e) => {
        const actionDiv = e.target.closest('.ticket-action');
        if (!actionDiv) return;

        const id = actionDiv.dataset.id;
        const btnAdd = actionDiv.querySelector('.btn-add');
        const qtyControl = actionDiv.querySelector('.quantity-control');
        const countSpan = actionDiv.querySelector('.count');
        const card = actionDiv.closest('.card-custom');

        if (e.target.closest('.btn-add')) {
            cart[id] = 1;
            card.classList.add('selected');
            btnAdd.classList.add('d-none');
            qtyControl.classList.remove('d-none');
            countSpan.textContent = 1;
        } else if (e.target.closest('.btn-plus')) {
            cart[id] = (cart[id] || 0) + 1;
            countSpan.textContent = cart[id];
        } else if (e.target.closest('.btn-minus')) {
            cart[id] = (cart[id] || 0) - 1;
            if (cart[id] <= 0) {
                delete cart[id];
                btnAdd.classList.remove('d-none');
                qtyControl.classList.add('d-none');
                card.classList.remove('selected');
            } else {
                countSpan.textContent = cart[id];
            }
        }
        updateSummary(cart, event.tickets);
    });

    // Update Sticky Summary
    function updateSummary(cart, tickets) {
        let total = 0;
        let count = 0;
        Object.keys(cart).forEach(id => {
            const ticket = tickets.find(t => t.id === id);
            if (ticket) {
                total += ticket.price * cart[id];
                count += cart[id];
            }
        });

        const sticky = document.getElementById('sticky-summary');
        if (count > 0) {
            sticky.classList.add('visible');
            document.getElementById('sticky-total').textContent = `₹${total}`;
            document.getElementById('sticky-count').textContent = `${count} Ticket${count > 1 ? 's' : ''}`;
            document.getElementById('pay-btn-amount').textContent = `₹${total}`;
            document.getElementById('summary-total').textContent = `₹${total}`;
        } else {
            sticky.classList.remove('visible');
        }
    }

    // Proceed to Payment
    const proceedBtn = document.getElementById('btn-proceed');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            document.getElementById('step-select-tickets').classList.add('d-none');
            document.getElementById('step-payment').classList.remove('d-none');
            document.getElementById('sticky-summary').classList.remove('visible');

            document.getElementById('step1-indicator').classList.remove('active');
            document.getElementById('step2-indicator').classList.add('active');

            // Render booking summary items
            const summaryContainer = document.getElementById('booking-summary-items');
            summaryContainer.innerHTML = '';
            Object.keys(cart).forEach(id => {
                const ticket = event.tickets.find(t => t.id === id);
                const qty = cart[id];
                summaryContainer.innerHTML += `
                    <div class="d-flex justify-content-between small">
                        <span class="text-neutral-600">${qty} x ${ticket.type}</span>
                        <span class="fw-medium">₹${ticket.price * qty}</span>
                    </div>
                `;
            });
        });
    }

    // Payment Option Selection Logic
    const paymentOptions = document.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Reset all options
            paymentOptions.forEach(opt => {
                opt.classList.remove('border-primary', 'bg-primary-subtle');
                const radio = opt.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });
            // Select clicked option
            option.classList.add('border-primary', 'bg-primary-subtle');
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    // Handle Payment
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-pay-now');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';

            setTimeout(() => {
                const modal = new bootstrap.Modal(document.getElementById('successModal'));
                modal.show();
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        });
    }
}
