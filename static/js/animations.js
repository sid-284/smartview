/**
 * SmartView Animations
 * This file handles animation-related functionality:
 * GSAP-powered page transitions
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page transitions only
  const pageTransitions = new PageTransitionManager();
  
  // Make it accessible globally for debugging
  window.smartViewAnimations = {
    pageTransitions
  };
});

/**
 * Page Transition Manager
 * Manages smooth transitions between pages using GSAP
 */
class PageTransitionManager {
  constructor() {
    // Cache DOM elements
    this.overlay = document.querySelector('.page-transition-overlay');
    this.contentContainer = document.getElementById('content-container');
    
    // Configuration options
    this.config = {
      duration: 0.8,
      ease: 'power2.inOut',
      slideOffset: 30
    };
    
    // Initialize
    this.init();
  }
  
  init() {
    // Override default page switching function
    this.overrideShowPage();
    
    // Set up initial page state
    this.setupInitialPage();
    }
    
  setupInitialPage() {
    // Find the current visible page
    const visiblePage = document.querySelector('#welcome-page:not(.hidden), #analyzer-page:not(.hidden), #comparison-page:not(.hidden)');
    
    if (visiblePage) {
      // Make sure it's visible with initial animation
      gsap.to(visiblePage, {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }
  
  overrideShowPage() {
    // Store the original showPage function
    const originalShowPage = window.showPage;
    
    // Replace with our animated version
    window.showPage = (pageId) => {
      // Get current visible page
      const visiblePage = document.querySelector('#welcome-page:not(.hidden), #analyzer-page:not(.hidden), #comparison-page:not(.hidden)');
      const targetPage = document.getElementById(`${pageId}-page`);
      
      if (!targetPage || (visiblePage && visiblePage.id === targetPage.id)) {
        return; // Target page doesn't exist or is already visible
      }
      
      // Perform animated transition
      this.animatePageTransition(visiblePage, targetPage);
    };
  }
  
  animatePageTransition(fromPage, toPage) {
    // 1. Create a timeline for the transition
    const tl = gsap.timeline();
    
    // 2. Fade out current page
    tl.to(fromPage, {
      opacity: 0,
      x: -this.config.slideOffset,
      duration: this.config.duration / 2,
      ease: this.config.ease,
      onComplete: () => {
        // Hide the old page when animation is done
        fromPage.classList.add('hidden');
      }
    });
    
    // 3. Slide in the overlay
    tl.to(this.overlay, { 
      x: '0%', 
      duration: this.config.duration,
      ease: this.config.ease
    }, '-=0.3');
    
    // 4. Prepare the new page
    tl.add(() => {
      // Show the new page but keep it transparent
      toPage.classList.remove('hidden');
      gsap.set(toPage, {
        opacity: 0,
        x: this.config.slideOffset
      });
    });
    
    // 5. Slide out the overlay
    tl.to(this.overlay, {
      x: '100%',
      duration: this.config.duration,
      ease: this.config.ease
    });
    
    // 6. Fade in the new page
    tl.to(toPage, {
      opacity: 1,
      x: 0,
      duration: this.config.duration,
      ease: this.config.ease
    }, '-=0.5');
    
    // 7. Animate individual elements within the new page (optional)
    tl.add(() => {
      // Animate cards with staggered effect if they exist in the new page
      const cards = toPage.querySelectorAll('.glass-panel, .feature-card, .testimonial-card');
      if (cards.length > 0) {
        gsap.from(cards, {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power1.out'
        });
      }
    }, '-=0.2');
  }
}

// Helper: Linear interpolation function
function lerp(start, end, factor) {
  return start * (1 - factor) + end * factor;
} 