/* React Integration File
 * This file sets up React components within the existing application.
 */

// Import React and ReactDOM
import React from 'react';
import ReactDOM from 'react-dom';

// Import our animation showcase
import AnimationShowcase from './components/AnimationShowcase';

// DOM Ready function
document.addEventListener('DOMContentLoaded', function() {
  // Mount React components once DOM is fully loaded
  mountReactComponents();
});

/**
 * Mount React components to designated containers in the DOM
 */
function mountReactComponents() {
  // Animation showcase container
  const showcaseContainer = document.getElementById('animation-showcase');
  if (showcaseContainer) {
    ReactDOM.render(
      <AnimationShowcase />,
      showcaseContainer
    );
  }
  
  // Any other React component mounts can be added here
}

/**
 * This function can be called from the main application to mount a specific component
 */
window.mountReactComponent = function(containerId, componentType, props = {}) {
  const container = document.getElementById(containerId);
  if (!container) return false;
  
  switch (componentType) {
    case 'animation-showcase':
      ReactDOM.render(<AnimationShowcase {...props} />, container);
      break;
      
    // Add more component types as needed
      
    default:
      console.warn(`Unknown component type: ${componentType}`);
      return false;
  }
  
  return true;
};

// Export the components for potential direct usage in other files
export { AnimationShowcase }; 