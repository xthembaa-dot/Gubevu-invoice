// Shared Data Functions for Gubevu Electrical
// This file handles data storage and retrieval for both desktop and mobile

// =============================================
// INVOICE DATA FUNCTIONS
// =============================================

// Generate unique ID for invoices/quotes
function generateId(type = 'INV') {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random}`;
}

// Calculate totals for items
function calculateItemTotals(items) {
    return items.map(item => {
        const subtotal = item.price * item.quantity;
        const vat = subtotal * 0.15; // 15% VAT
        const total = subtotal + vat;
        return {
            ...item,
            subtotal,
            vat,
            total
        };
    });
}

// Calculate overall totals
function calculateOverallTotals(items) {
    const itemsWithTotals = calculateItemTotals(items);
    
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
    const vat = itemsWithTotals.reduce((sum, item) => sum + item.vat, 0);
    const total = subtotal + vat;
    
    return {
        subtotal,
        vat,
        total,
        items: itemsWithTotals
    };
}

// Save invoice to localStorage
function saveInvoice(invoiceData) {
    try {
        // Ensure we have an ID
        if (!invoiceData.id) {
            invoiceData.id = generateId(invoiceData.type === 'quote' ? 'QUO' : 'INV');
        }
        
        // Set created/modified dates
        if (!invoiceData.created) {
            invoiceData.created = new Date().toISOString();
        }
        invoiceData.modified = new Date().toISOString();
        
        // Get existing invoices
        const invoices = JSON.parse(localStorage.getItem('gubevu_invoices')) || [];
        
        // Check if invoice already exists
        const existingIndex = invoices.findIndex(inv => inv.id === invoiceData.id);
        
        if (existingIndex >= 0) {
            // Update existing
            invoices[existingIndex] = invoiceData;
        } else {
            // Add new
            invoices.push(invoiceData);
        }
        
        // Save back to localStorage
        localStorage.setItem('gubevu_invoices', JSON.stringify(invoices));
        
        return {
            success: true,
            id: invoiceData.id,
            message: 'Invoice saved successfully'
        };
    } catch (error) {
        console.error('Error saving invoice:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Load invoice by ID
function loadInvoice(id) {
    try {
        const invoices = JSON.parse(localStorage.getItem('gubevu_invoices')) || [];
        return invoices.find(inv => inv.id === id) || null;
    } catch (error) {
        console.error('Error loading invoice:', error);
        return null;
    }
}

// Load all invoices
function loadAllInvoices() {
    try {
        return JSON.parse(localStorage.getItem('gubevu_invoices')) || [];
    } catch (error) {
        console.error('Error loading invoices:', error);
        return [];
    }
}

// Load invoices by status
function loadInvoicesByStatus(status) {
    const invoices = loadAllInvoices();
    if (status === 'all') return invoices;
    return invoices.filter(inv => inv.status === status && inv.type !== 'quote');
}

// Load quotes by status
function loadQuotesByStatus(status) {
    const invoices = loadAllInvoices();
    if (status === 'all') return invoices.filter(inv => inv.type === 'quote');
    return invoices.filter(inv => inv.status === status && inv.type === 'quote');
}

// Update invoice status
function updateInvoiceStatus(id, status) {
    try {
        const invoices = JSON.parse(localStorage.getItem('gubevu_invoices')) || [];
        const invoiceIndex = invoices.findIndex(inv => inv.id === id);
        
        if (invoiceIndex >= 0) {
            invoices[invoiceIndex].status = status;
            invoices[invoiceIndex].modified = new Date().toISOString();
            
            // If marking as paid, set paid date
            if (status === 'paid') {
                invoices[invoiceIndex].paidDate = new Date().toISOString();
            }
            
            // If marking as sent, set sent date
            if (status === 'sent') {
                invoices[invoiceIndex].sentDate = new Date().toISOString();
            }
            
            localStorage.setItem('gubevu_invoices', JSON.stringify(invoices));
            return { success: true };
        }
        
        return { success: false, error: 'Invoice not found' };
    } catch (error) {
        console.error('Error updating invoice status:', error);
        return { success: false, error: error.message };
    }
}

// Delete invoice
function deleteInvoice(id) {
    try {
        const invoices = JSON.parse(localStorage.getItem('gubevu_invoices')) || [];
        const filteredInvoices = invoices.filter(inv => inv.id !== id);
        localStorage.setItem('gubevu_invoices', JSON.stringify(filteredInvoices));
        return { success: true };
    } catch (error) {
        console.error('Error deleting invoice:', error);
        return { success: false, error: error.message };
    }
}

// Convert quote to invoice
function convertQuoteToInvoice(quoteId) {
    try {
        const quote = loadInvoice(quoteId);
        if (!quote || quote.type !== 'quote') {
            return { success: false, error: 'Quote not found' };
        }
        
        // Create invoice from quote
        const invoice = {
            ...quote,
            id: generateId('INV'),
            type: 'invoice',
            originalQuote: quoteId,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        // Save the new invoice
        const result = saveInvoice(invoice);
        
        // Update quote status to converted
        updateInvoiceStatus(quoteId, 'converted');
        
        return {
            success: true,
            invoiceId: invoice.id,
            quoteId: quoteId
        };
    } catch (error) {
        console.error('Error converting quote:', error);
        return { success: false, error: error.message };
    }
}

// Get statistics
function getInvoiceStats() {
    const invoices = loadAllInvoices();
    const regularInvoices = invoices.filter(inv => inv.type !== 'quote');
    const quotes = invoices.filter(inv => inv.type === 'quote');
    
    return {
        total: invoices.length,
        invoices: regularInvoices.length,
        quotes: quotes.length,
        drafts: regularInvoices.filter(inv => inv.status === 'draft').length,
        sent: regularInvoices.filter(inv => inv.status === 'sent').length,
        paid: regularInvoices.filter(inv => inv.status === 'paid').length,
        outstanding: regularInvoices.filter(inv => inv.status === 'outstanding').length
    };
}

// =============================================
// USER DATA FUNCTIONS
// =============================================

// Save current user
function setCurrentUser(username) {
    localStorage.setItem('gubevu_current_user', username);
}

// Get current user
function getCurrentUser() {
    return localStorage.getItem('gubevu_current_user') || 'User';
}

// Clear current user (logout)
function clearCurrentUser() {
    localStorage.removeItem('gubevu_current_user');
}

// =============================================
// SESSION DATA FUNCTIONS
// =============================================

// Save current session data (for multi-step forms)
function saveSessionData(data) {
    sessionStorage.setItem('gubevu_session_data', JSON.stringify(data));
}

// Get session data
function getSessionData() {
    const data = sessionStorage.getItem('gubevu_session_data');
    return data ? JSON.parse(data) : {};
}

// Clear session data
function clearSessionData() {
    sessionStorage.removeItem('gubevu_session_data');
}

// =============================================
// EXPORT FUNCTIONS FOR USE IN OTHER FILES
// =============================================

// Make functions available globally
window.GubevuData = {
    // Invoice functions
    generateId,
    calculateItemTotals,
    calculateOverallTotals,
    saveInvoice,
    loadInvoice,
    loadAllInvoices,
    loadInvoicesByStatus,
    loadQuotesByStatus,
    updateInvoiceStatus,
    deleteInvoice,
    convertQuoteToInvoice,
    getInvoiceStats,
    
    // User functions
    setCurrentUser,
    getCurrentUser,
    clearCurrentUser,
    
    // Session functions
    saveSessionData,
    getSessionData,
    clearSessionData
};
