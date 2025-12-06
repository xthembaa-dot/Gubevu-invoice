// app.js - Shared JavaScript for mobile app

// Navigation functions
function goTo(page) {
    window.location.href = page;
}

function goBack() {
    window.history.back();
}

// Format currency
function formatCurrency(amount) {
    return 'R ' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Generate document numbers
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = localStorage.getItem('invoiceCount') || 0;
    const nextCount = parseInt(count) + 1;
    localStorage.setItem('invoiceCount', nextCount);
    return `INV-${year}${month}${nextCount.toString().padStart(3, '0')}`;
}

function generateQuoteNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = localStorage.getItem('quoteCount') || 0;
    const nextCount = parseInt(count) + 1;
    localStorage.setItem('quoteCount', nextCount);
    return `QUO-${year}${month}${nextCount.toString().padStart(3, '0')}`;
}

// Calculate totals from items
function calculateTotals(items) {
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.total;
    });
    const vat = subtotal * 0.15;
    const total = subtotal + vat;
    
    return {
        subtotal: subtotal,
        vat: vat,
        total: total
    };
}

// Database functions (localStorage)
const GubevuDB = {
    // Save invoice
    saveInvoice(invoice) {
        let invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        invoices.push(invoice);
        localStorage.setItem('invoices', JSON.stringify(invoices));
        return invoice;
    },
    
    // Save quote
    saveQuote(quote) {
        let quotes = JSON.parse(localStorage.getItem('quotes') || '[]');
        quotes.push(quote);
        localStorage.setItem('quotes', JSON.stringify(quotes));
        return quote;
    },
    
    // Get all invoices
    getInvoices() {
        return JSON.parse(localStorage.getItem('invoices') || '[]');
    },
    
    // Get all quotes
    getQuotes() {
        return JSON.parse(localStorage.getItem('quotes') || '[]');
    },
    
    // Get invoices by status
    getInvoicesByStatus(status) {
        const invoices = this.getInvoices();
        return invoices.filter(inv => inv.status === status);
    },
    
    // Get quotes by status
    getQuotesByStatus(status) {
        const quotes = this.getQuotes();
        return quotes.filter(quo => quo.status === status);
    },
    
    // Update invoice status
    updateInvoiceStatus(invoiceId, newStatus) {
        let invoices = this.getInvoices();
        invoices = invoices.map(inv => {
            if (inv.id === invoiceId) {
                return { ...inv, status: newStatus };
            }
            return inv;
        });
        localStorage.setItem('invoices', JSON.stringify(invoices));
    },
    
    // Update quote status
    updateQuoteStatus(quoteId, newStatus) {
        let quotes = this.getQuotes();
        quotes = quotes.map(quo => {
            if (quo.id === quoteId) {
                return { ...quo, status: newStatus };
            }
            return quo;
        });
        localStorage.setItem('quotes', JSON.stringify(quotes));
    },
    
    // Convert quote to invoice
    convertQuoteToInvoice(quoteId) {
        const quotes = this.getQuotes();
        const quote = quotes.find(q => q.id === quoteId);
        
        if (!quote) return null;
        
        const invoice = {
            ...quote,
            id: Date.now(),
            type: 'invoice',
            status: 'draft',
            number: generateInvoiceNumber(),
            originalQuoteId: quoteId,
            convertedDate: new Date().toISOString()
        };
        
        // Mark quote as converted
        this.updateQuoteStatus(quoteId, 'converted');
        
        // Save invoice
        this.saveInvoice(invoice);
        
        return invoice;
    },
    
    // Clear current session data
    clearCurrentSession() {
        localStorage.removeItem('currentClient');
        localStorage.removeItem('currentItems');
    }
};

// Initialize on first load
function initApp() {
    // Set up default data if not exists
    if (!localStorage.getItem('invoiceCount')) {
        localStorage.setItem('invoiceCount', '0');
    }
    
    if (!localStorage.getItem('quoteCount')) {
        localStorage.setItem('quoteCount', '0');
    }
    
    // Create empty arrays for storage if not exist
    if (!localStorage.getItem('invoices')) {
        localStorage.setItem('invoices', '[]');
    }
    
    if (!localStorage.getItem('quotes')) {
        localStorage.setItem('quotes', '[]');
    }
    
    if (!localStorage.getItem('drafts')) {
        localStorage.setItem('drafts', '[]');
    }
    
    if (!localStorage.getItem('sentInvoices')) {
        localStorage.setItem('sentInvoices', '[]');
    }
    
    if (!localStorage.getItem('paidInvoices')) {
        localStorage.setItem('paidInvoices', '[]');
    }
}

// Run initialization
initApp();
