import React from 'react';
import { motion } from 'framer-motion';

/**
 * InteractiveButton - A button component with sophisticated hover and tap animations
 * 
 * Usage:
 * <InteractiveButton onClick={handleClick} bgColor="linear-gradient(...)">
 *   Click Me
 * </InteractiveButton>
 */
class InteractiveButton extends React.Component {
  render() {
    const { 
      children, 
      bgColor = 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
      onClick,
      className = '',
      ...props 
    } = this.props;
    
    return (
      <motion.button
        className={`interactive-button ${className}`}
        style={{
          background: bgColor,
          cursor: 'pointer',
          padding: '1rem 2rem',
          borderRadius: '0.5rem',
          color: 'white',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          willChange: 'transform, box-shadow',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit'
        }}
        onClick={onClick}
        whileHover={{
          scale: 1.05,
          y: -2,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 10
        }}
        whileTap={{
          scale: 0.98,
          boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { 
            duration: 0.3,
            ease: 'easeOut'
          } 
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
}

/**
 * InteractiveCard - A card component with advanced hover effects
 * 
 * Usage:
 * <InteractiveCard isHighlighted={true} onClick={handleCardClick}>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </InteractiveCard>
 */
class InteractiveCard extends React.Component {
  render() {
    const { 
      children, 
      isHighlighted = false, 
      onClick,
      className = '',
      ...props 
    } = this.props;
    
    return (
      <motion.div
        className={`interactive-card ${className}`}
        onClick={onClick}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: '1rem',
          padding: '1.5rem',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isHighlighted ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.1)',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden'
        }}
        whileHover={{
          scale: 1.02,
          y: -5,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 20,
        }}
        whileTap={onClick ? {
          scale: 0.99,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        } : undefined}
        layout
        {...props}
      >
        {/* Optional highlight visual effect */}
        {isHighlighted && (
          <motion.div
            className="highlight-bar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)'
            }}
            layoutId="highlightBar"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        {children}
      </motion.div>
    );
  }
}

export { InteractiveButton, InteractiveCard }; 