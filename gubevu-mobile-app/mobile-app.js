// Gubevu Mobile App - Mobile Specific JavaScript
// This file contains functions specific to mobile interface

// =============================================
// NAVIGATION FUNCTIONS
// =============================================

// Navigate to page with transition
function navigateTo(page) {
    // Add fade-out animation to body
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        window.location.href = page;
    }, 300);
}

// Go back to previous page
function goBack() {
    // Add fade-out animation to body
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        window.history.back();
    }, 300);
}

// =============================================
// FORM VALIDATION
// =============================================

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (South African format)
function validatePhone(phone) {
    const re = /^(\+27|0)[1-9][0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Validate required fields
function validateRequired(fields) {
    for (const field of fields) {
        if (!field.value || field.value.trim() === '') {
            field.classList.add('error');
            return false;
        }
        field.classList.remove('error');
    }
    return true;
}

// Show error message
function showError(message, elementId = 'error-message') {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.opacity = '1';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 300);
        }, 5000);
    } else {
        alert(message);
    }
}

// Show success message
function showSuccess(message, elementId = 'success-message') {
    const successDiv = document.getElementById(elementId);
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.style.opacity = '1';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            successDiv.style.opacity = '0';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

// =============================================
// ITEMS MANAGEMENT
// =============================================

// Add item to list
function addItemToList(item, listElementId = 'items-list') {
    const list = document.getElementById(listElementId);
    if (!list) return;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-card';
    itemDiv.innerHTML = `
        <div class="item-info">
            <h4>${item.description}</h4>
            <p>Qty: ${item.quantity} × R ${item.price.toFixed(2)}</p>
            <p>Total: R ${item.total.toFixed(2)} (VAT: R ${item.vat.toFixed(2)})</p>
        </div>
        <div class="item-actions">
            <button onclick="removeItem(this, '${item.id}')" class="btn btn-small btn-outline">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    list.appendChild(itemDiv);
}

// Remove item from list
function removeItem(button, itemId) {
    const itemCard = button.closest('.item-card');
    if (itemCard) {
        itemCard.style.opacity = '0';
        itemCard.style.transform = 'translateX(-20px)';
        itemCard.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            itemCard.remove();
            
            // Remove from session data
            const sessionData = GubevuData.getSessionData();
            if (sessionData.items) {
                sessionData.items = sessionData.items.filter(item => item.id !== itemId);
                GubevuData.saveSessionData(sessionData);
            }
            
            // Update totals if function exists
            if (typeof updateItemTotals === 'function') {
                updateItemTotals();
            }
        }, 300);
    }
}

// Calculate item totals
function calculateItemTotal(price, quantity) {
    const subtotal = price * quantity;
    const vat = subtotal * 0.15;
    const total = subtotal + vat;
    
    return {
        subtotal,
        vat,
        total
    };
}

// =============================================
// SESSION MANAGEMENT
// =============================================

// Save form data to session
function saveFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Merge with existing session data
    const existingData = GubevuData.getSessionData();
    const mergedData = { ...existingData, ...data };
    
    GubevuData.saveSessionData(mergedData);
    
    return mergedData;
}

// Load form data from session
function loadFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const sessionData = GubevuData.getSessionData();
    
    for (const field of form.elements) {
        if (field.name && sessionData[field.name] !== undefined) {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = sessionData[field.name];
            } else {
                field.value = sessionData[field.name];
            }
        }
    }
}

// Clear current session
function clearCurrentSession() {
    GubevuData.clearSessionData();
    showSuccess('Session cleared');
}

// =============================================
// INVOICE PREVIEW
// =============================================

// Generate invoice preview
function generateInvoicePreview() {
    const sessionData = GubevuData.getSessionData();
    
    // Check if we have minimum data
    if (!sessionData.clientName || !sessionData.items || sessionData.items.length === 0) {
        showError('Please complete client information and add at least one item');
        return null;
    }
    
    // Generate invoice data
    const invoiceId = sessionData.invoiceId || GubevuData.generateId('INV');
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days due
    
    const invoiceData = {
        id: invoiceId,
        type: sessionData.invoiceType || 'invoice',
        date: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: sessionData.status || 'draft',
        client: {
            name: sessionData.clientName,
            address: sessionData.clientAddress,
            phone: sessionData.clientPhone,
            email: sessionData.clientEmail
        },
        items: sessionData.items || [],
        totals: GubevuData.calculateOverallTotals(sessionData.items || []),
        notes: sessionData.notes || 'Thank you for your business!\nPayment due within 30 days.'
    };
    
    return invoiceData;
}

// Save invoice from preview
function saveInvoiceFromPreview() {
    const invoiceData = generateInvoicePreview();
    if (!invoiceData) return;
    
    const result = GubevuData.saveInvoice(invoiceData);
    
    if (result.success) {
        // Clear session data
        GubevuData.clearSessionData();
        
        // Redirect to saved invoices
        setTimeout(() => {
            navigateTo('06-saved-invoices.html?status=all');
        }, 1000);
        
        return result;
    } else {
        showError('Failed to save invoice: ' + result.error);
        return null;
    }
}

// =============================================
// UI ENHANCEMENTS
// =============================================

// Format currency (South African Rand)
function formatCurrency(amount) {
    return 'R ' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Toggle visibility
function toggleVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element.style.display === 'none') {
            element.style.display = 'block';
            setTimeout(() => {
                element.style.opacity = '1';
            }, 10);
        } else {
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.display = 'none';
            }, 300);
        }
    }
}

// Show loading spinner
function showLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    button.disabled = true;
    return originalText;
}

// Hide loading spinner
function hideLoading(button, originalText) {
    button.innerHTML = originalText;
    button.disabled = false;
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('Copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// =============================================
// MOBILE-SPECIFIC FEATURES
// =============================================

// Handle touch events for better mobile experience
function initTouchEvents() {
    // Prevent double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Add touch feedback to buttons
    document.addEventListener('touchstart', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            e.target.style.transform = 'scale(0.98)';
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            e.target.style.transform = '';
        }
    }, { passive: true });
}

// Check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Handle back button (Android)
function initBackButton() {
    if (window.history && window.history.pushState) {
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', () => {
            // Handle back button press
            if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
                window.history.back();
            } else {
                window.history.pushState(null, null, window.location.href);
            }
        });
    }
}

// =============================================
// INITIALIZATION
// =============================================

// Initialize mobile app
function initMobileApp() {
    // Initialize touch events
    initTouchEvents();
    
    // Check if GubevuData is available
    if (typeof GubevuData === 'undefined') {
        console.error('GubevuData is not loaded. Make sure shared-data.js is included.');
        return;
    }
    
    // Set current page title
    document.addEventListener('DOMContentLoaded', () => {
        // Add fade-in animation
        document.body.style.opacity = '0';
        setTimeout(() => {
            document.body.style.opacity = '1';
            document.body.style.transition = 'opacity 0.3s ease';
        }, 100);
        
        // Check if user is logged in (for protected pages)
        const protectedPages = ['02-dashboard.html', '03-client.html', '04-items.html', '05-preview.html', '06-saved-invoices.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            const currentUser = GubevuData.getCurrentUser();
            if (!currentUser) {
                // Redirect to login
                window.location.href = '01-login.html';
            }
        }
    });
}

// Make functions available globally
window.MobileApp = {
    // Navigation
    navigateTo,
    goBack,
    
    // Form Validation
    validateEmail,
    validatePhone,
    validateRequired,
    showError,
    showSuccess,
    
    // Items Management
    addItemToList,
    removeItem,
    calculateItemTotal,
    
    // Session Management
    saveFormData,
    loadFormData,
    clearCurrentSession,
    
    // Invoice Preview
    generateInvoicePreview,
    saveInvoiceFromPreview,
    
    // UI Enhancements
    formatCurrency,
    formatDate,
    toggleVisibility,
    showLoading,
    hideLoading,
    copyToClipboard,
    
    // Mobile Features
    initTouchEvents,
    isMobileDevice,
    initBackButton,
    
    // Initialization
    initMobileApp
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    initMobileApp();
});
