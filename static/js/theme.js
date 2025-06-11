// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const themeIcon = themeToggle.querySelector('i');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        body.setAttribute('data-theme', 'light');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        body.setAttribute('data-theme', 'dark');
    }
    
    // Toggle theme on click
    themeToggle.addEventListener('click', function() {
        const currentTheme = body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        body.setAttribute('data-theme', newTheme);
        
        // Update icon
        if (newTheme === 'light') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'dark');
        }
        
        // Add transition effect
        gsap.to(body, {
            backgroundColor: getComputedStyle(body).backgroundColor,
            duration: 0.3,
            ease: "power2.inOut"
        });
    });
    
    // Page Navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page-section');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // Update active tab
            navTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show target page
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `${targetPage}-page`) {
                    page.classList.add('active');
                    
                    // Add animation
                    gsap.fromTo(page, 
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
                    );
                }
            });
        });
    });
});

// Function to show analysis page
function showAnalysisPage() {
    // Update active tab
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-page') === 'analysis') {
            tab.classList.add('active');
        }
    });
    
    // Show analysis page
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === 'analysis-page') {
            page.classList.add('active');
            
            // Copy product name to analysis page
            const productName = document.getElementById('productNameResult').textContent;
            document.getElementById('analysisProductName').textContent = productName;
            
            // Add animation
            gsap.fromTo(page, 
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    });
}

// Function to go back to search page
function backToSearch() {
    // Update active tab
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-page') === 'search') {
            tab.classList.add('active');
        }
    });
    
    // Show search page
    const pages = document.querySelectorAll('.page-section');
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === 'search-page') {
            page.classList.add('active');
            
            // Add animation
            gsap.fromTo(page, 
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
            );
        }
    });
}

// Update the original compareProducts function to navigate to comparison page
const originalCompareProducts = window.compareProducts;
if (typeof originalCompareProducts === 'function') {
    window.compareProducts = function() {
        // Call the original function
        const result = originalCompareProducts();
        
        // Update active tab
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-page') === 'comparison') {
                tab.classList.add('active');
            }
        });
        
        // Show comparison page
        const pages = document.querySelectorAll('.page-section');
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === 'comparison-page') {
                page.classList.add('active');
                
                // Add animation
                gsap.fromTo(page, 
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
                );
            }
        });
        
        return result;
    };
}