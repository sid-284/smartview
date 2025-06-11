import React from 'react';
import { motion } from 'framer-motion';

/**
 * MotionPath - Component that animates an element along a defined SVG path
 * 
 * Usage:
 * <MotionPath 
 *   pathData="M0,100 C50,0 150,0 200,100 C250,200 300,200 350,100"
 *   showPath={true}
 * >
 *   <div className="custom-element">✨</div>
 * </MotionPath>
 */
class MotionPath extends React.Component {
  render() {
    const { 
      pathData,
      children,
      duration = 5,
      showPath = false,
      repeat = true,
      elementSize = '40px',
      className = '',
      ...props 
    } = this.props;

    return (
      <div 
        className={`motion-path-container ${className}`}
        style={{ 
          width: '100%', 
          height: '400px', 
          position: 'relative',
          overflow: 'hidden' 
        }}
        {...props}
      >
        <svg
          viewBox="0 0 1000 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* The visible path (optional) */}
          {showPath && (
            <path
              d={pathData}
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="2"
              strokeDasharray="5 5"
              fill="none"
            />
          )}
          
          {/* The element that moves along the path */}
          <motion.g
            initial={{ offsetDistance: "0%" }}
            animate={{ 
              offsetDistance: "100%"
            }}
            transition={{
              duration: duration,
              ease: "easeInOut",
              repeat: repeat ? Infinity : 0,
              repeatType: "loop"
            }}
            style={{ 
              offsetPath: `path("${pathData}")`,
              offsetRotate: "auto"
            }}
          >
            {/* Wrapper for the animated element */}
            <foreignObject
              width={elementSize}
              height={elementSize}
              x={`-${parseInt(elementSize) / 2}px`}
              y={`-${parseInt(elementSize) / 2}px`}
              style={{ overflow: 'visible' }}
            >
              <div style={{ width: '100%', height: '100%' }}>
                {children || (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
                  }} />
                )}
              </div>
            </foreignObject>
          </motion.g>
        </svg>
      </div>
    );
  }
}

/**
 * Predefined path examples
 */
const paths = {
  // Wavy horizontal path
  wave: "M 0,200 C 100,100 200,300 300,200 C 400,100 500,300 600,200 C 700,100 800,300 900,200",
  
  // Infinity symbol path
  infinity: "M 250,200 C 350,100 450,100 550,200 C 650,300 750,300 850,200 C 750,100 650,100 550,200 C 450,300 350,300 250,200 Z",
  
  // Circular path
  circle: "M 500,100 A 100,100 0 1,1 500,101 Z",
  
  // Zig-zag path
  zigzag: "M 100,200 L 200,100 L 300,200 L 400,100 L 500,200 L 600,100 L 700,200 L 800,100 L 900,200"
};

export { MotionPath, paths }; 