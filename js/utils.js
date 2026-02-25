export function injectToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1100';
    document.body.appendChild(container);
}

export function showToast(title, message, type = 'primary') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const id = 'toast-' + Date.now();
    const bgClass = type === 'danger' ? 'text-bg-danger' : 
                    type === 'success' ? 'text-bg-success' : 
                    type === 'warning' ? 'text-bg-warning' : 'text-bg-primary';

    const html = `
        <div id="${id}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper.firstElementChild);

    const toastEl = document.getElementById(id);
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

export function initializeBootstrapComponents() {
    if (typeof bootstrap === 'undefined') return;
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
}

export function setupGenericPagination({ items, containerId, paginationId, renderItem, itemsPerPage = 5, onRender }) {
    let currentPage = 1;
    let paginationContainer = document.getElementById(paginationId);
    
    if (!paginationContainer) return;

    // Reset container to remove existing listeners
    const newContainer = paginationContainer.cloneNode(false);
    paginationContainer.parentNode.replaceChild(newContainer, paginationContainer);
    paginationContainer = newContainer;

    const renderPage = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = items.slice(start, end);
        
        const listContainer = document.getElementById(containerId);
        if (listContainer) {
            listContainer.innerHTML = pageItems.map(item => renderItem(item)).join('');
            if (window.lucide) lucide.createIcons();
            if (onRender) onRender(pageItems);
        }
        
        renderControls(page);
    };

    const renderControls = (page) => {
        const totalPages = Math.ceil(items.length / itemsPerPage);
        let html = '';
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        // Prev
        html += `<button class="pagination-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}><i data-lucide="chevron-left" width="16" height="16"></i></button>`;
        
        // Numbers
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Next
        html += `<button class="pagination-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}><i data-lucide="chevron-right" width="16" height="16"></i></button>`;
        
        paginationContainer.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    };

    paginationContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.pagination-btn');
        if (btn && !btn.disabled && !btn.classList.contains('active')) {
            const newPage = parseInt(btn.dataset.page);
            if (newPage && newPage !== currentPage) {
                currentPage = newPage;
                renderPage(currentPage);
                document.getElementById(containerId).scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });

    renderPage(1);
}