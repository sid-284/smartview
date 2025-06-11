import React from 'react';
import { motion } from 'framer-motion';

/**
 * StaggeredItemList - Component that renders a list of items with staggered entrance animations
 * 
 * Usage:
 * <StaggeredItemList 
 *   items={products} 
 *   renderItem={(item, index) => (
 *     <div>
 *       <h3>{item.title}</h3>
 *       <p>{item.description}</p>
 *     </div>
 *   )}
 * />
 */

// Animation variants for container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  }
};

// Animation variants for individual items
const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    rotate: -1
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 20,
      mass: 1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { 
      duration: 0.3,
      ease: 'easeInOut'
    }
  }
};

class StaggeredItemList extends React.Component {
  render() {
    const { items = [], renderItem, className = '', ...props } = this.props;
    
    return (
      <motion.ul
        className={`staggered-list ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        {...props}
      >
        {items.map((item, index) => (
          <motion.li
            key={item.id || index}
            className="staggered-item"
            variants={itemVariants}
            layout
          >
            {renderItem ? renderItem(item, index) : (
              <div>
                <h3>{item.title || `Item ${index + 1}`}</h3>
                <p>{item.description || 'No description available'}</p>
              </div>
            )}
          </motion.li>
        ))}
      </motion.ul>
    );
  }
}

export default StaggeredItemList; 