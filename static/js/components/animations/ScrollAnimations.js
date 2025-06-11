import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

/**
 * ScrollSlideIn - Component that slides in from the side as it enters the viewport
 * 
 * Usage:
 * <ScrollSlideIn direction="left" distance={100}>
 *   <h2>This content will slide in from the left</h2>
 * </ScrollSlideIn>
 */
class ScrollSlideIn extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      inView: false
    };
  }
  
  componentDidMount() {
    // Check for Intersection Observer API
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.setState({ inView: true });
              // Once element has animated in, stop observing
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 } // Trigger when 10% of the element is visible
      );
      
      if (this.ref.current) {
        this.observer.observe(this.ref.current);
      }
    } else {
      // Fallback for browsers that don't support Intersection Observer
      this.setState({ inView: true });
    }
  }
  
  componentWillUnmount() {
    if (this.observer && this.ref.current) {
      this.observer.unobserve(this.ref.current);
    }
  }
  
  render() {
    const { 
      children, 
      direction = 'left', 
      distance = 100,
      duration = 0.8,
      delay = 0,
      className = '',
      ...props 
    } = this.props;
    
    // Calculate initial position based on direction
    const getInitialX = () => {
      if (direction === 'left') return -distance;
      if (direction === 'right') return distance;
      return 0;
    };
    
    const getInitialY = () => {
      if (direction === 'top') return -distance;
      if (direction === 'bottom') return distance;
      return 0;
    };
    
    return (
      <motion.div
        ref={this.ref}
        className={`scroll-slide ${className}`}
        initial={{ 
          opacity: 0,
          x: getInitialX(),
          y: getInitialY()
        }}
        animate={this.state.inView ? { 
          opacity: 1,
          x: 0,
          y: 0
        } : {}}
        transition={{
          type: 'spring',
          stiffness: 50,
          damping: 20,
          delay: delay,
          duration: duration
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
}

/**
 * ScrollFadeIn - Simple component that fades in as it enters the viewport
 * 
 * Usage:
 * <ScrollFadeIn delay={0.2}>
 *   <p>This content will fade in</p>
 * </ScrollFadeIn>
 */
class ScrollFadeIn extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      inView: false
    };
  }
  
  componentDidMount() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.setState({ inView: true });
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      
      if (this.ref.current) {
        this.observer.observe(this.ref.current);
      }
    } else {
      this.setState({ inView: true });
    }
  }
  
  componentWillUnmount() {
    if (this.observer && this.ref.current) {
      this.observer.unobserve(this.ref.current);
    }
  }
  
  render() {
    const { 
      children, 
      duration = 0.8,
      delay = 0,
      className = '',
      ...props 
    } = this.props;
    
    return (
      <motion.div
        ref={this.ref}
        className={`scroll-fade ${className}`}
        initial={{ opacity: 0 }}
        animate={this.state.inView ? { opacity: 1 } : {}}
        transition={{
          duration: duration,
          delay: delay,
          ease: 'easeOut'
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
}

/**
 * ScrollScale - Component that scales up as it enters the viewport
 * 
 * Usage:
 * <ScrollScale initialScale={0.8}>
 *   <div>This content will scale up</div>
 * </ScrollScale>
 */
class ScrollScale extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      inView: false
    };
  }
  
  componentDidMount() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.setState({ inView: true });
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      
      if (this.ref.current) {
        this.observer.observe(this.ref.current);
      }
    } else {
      this.setState({ inView: true });
    }
  }
  
  componentWillUnmount() {
    if (this.observer && this.ref.current) {
      this.observer.unobserve(this.ref.current);
    }
  }
  
  render() {
    const { 
      children, 
      initialScale = 0.8,
      duration = 0.8,
      delay = 0,
      className = '',
      ...props 
    } = this.props;
    
    return (
      <motion.div
        ref={this.ref}
        className={`scroll-scale ${className}`}
        initial={{ 
          opacity: 0,
          scale: initialScale
        }}
        animate={this.state.inView ? { 
          opacity: 1,
          scale: 1
        } : {}}
        transition={{
          type: 'spring',
          stiffness: 60,
          damping: 20,
          delay: delay,
          duration: duration
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
}

export { ScrollSlideIn, ScrollFadeIn, ScrollScale }; 