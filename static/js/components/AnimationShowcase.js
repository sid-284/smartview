import React from 'react';
import { 
  StaggeredItemList,
  InteractiveButton,
  InteractiveCard,
  ScrollSlideIn,
  ScrollFadeIn,
  ScrollScale,
  MotionPath,
  paths
} from './animations';

// Sample data for demonstration
const sampleProducts = [
  { id: 1, title: 'Premium Headphones', description: 'Noise-cancelling with 20-hour battery life', price: '$299' },
  { id: 2, title: 'Smartphone Case', description: 'Military-grade drop protection', price: '$49' },
  { id: 3, title: 'Wireless Charger', description: 'Fast charging for all Qi-enabled devices', price: '$79' },
  { id: 4, title: 'Bluetooth Speaker', description: 'Waterproof with 360° sound', price: '$129' },
  { id: 5, title: 'Smart Watch', description: 'Fitness tracking and notifications', price: '$199' },
];

class AnimationShowcase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedCard: null,
      showProducts: false
    };
  }
  
  toggleProducts = () => {
    this.setState({ showProducts: !this.state.showProducts });
  }
  
  selectCard = (id) => {
    this.setState({ 
      selectedCard: this.state.selectedCard === id ? null : id 
    });
  }
  
  render() {
    return (
      <div className="animation-showcase">
        {/* Hero Section */}
        <section className="hero-section py-16">
          <div className="container mx-auto px-4 text-center">
            <ScrollFadeIn>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Animation <span className="text-gradient">Showcase</span>
              </h1>
            </ScrollFadeIn>
            
            <ScrollFadeIn delay={0.2}>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Explore our collection of sophisticated animations built with Framer Motion
              </p>
            </ScrollFadeIn>
            
            <ScrollScale delay={0.4}>
              <InteractiveButton onClick={this.toggleProducts}>
                {this.state.showProducts ? 'Hide Products' : 'Show Products'}
              </InteractiveButton>
            </ScrollScale>
          </div>
        </section>
        
        {/* Staggered Animation Section */}
        <section className="py-16 bg-features">
          <div className="container mx-auto px-4">
            <ScrollSlideIn direction="left">
              <h2 className="text-3xl font-bold mb-8">Staggered Product List</h2>
            </ScrollSlideIn>
            
            {this.state.showProducts && (
              <StaggeredItemList
                items={sampleProducts}
                className="max-w-3xl mx-auto"
                renderItem={(item) => (
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-300">{item.description}</p>
                    </div>
                    <div className="font-bold text-xl text-blue-400">
                      {item.price}
                    </div>
                  </div>
                )}
              />
            )}
            
            {!this.state.showProducts && (
              <div className="text-center text-gray-400">
                Click the button above to show product items with staggered animation
              </div>
            )}
          </div>
        </section>
        
        {/* Interactive Cards Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <ScrollSlideIn direction="right">
              <h2 className="text-3xl font-bold mb-8">Interactive Cards</h2>
            </ScrollSlideIn>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {sampleProducts.map((product, index) => (
                <ScrollFadeIn key={product.id} delay={index * 0.1}>
                  <InteractiveCard
                    onClick={() => this.selectCard(product.id)}
                    isHighlighted={product.id === this.state.selectedCard}
                  >
                    <h3 className="font-semibold mb-2">{product.title}</h3>
                    <p className="text-gray-300 mb-4">{product.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-bold">{product.price}</span>
                      <InteractiveButton
                        className="px-3 py-2 text-sm"
                        bgColor="linear-gradient(135deg, #10b981, #14b8a6)"
                      >
                        Add to Cart
                      </InteractiveButton>
                    </div>
                  </InteractiveCard>
                </ScrollFadeIn>
              ))}
            </div>
          </div>
        </section>
        
        {/* Motion Path Section */}
        <section className="py-16 bg-features">
          <div className="container mx-auto px-4">
            <ScrollSlideIn direction="left">
              <h2 className="text-3xl font-bold mb-8">Motion Path Animation</h2>
            </ScrollSlideIn>
            
            <div className="mt-8">
              <ScrollFadeIn>
                <MotionPath
                  pathData={paths.wave}
                  showPath={true}
                  duration={8}
                >
                  <div className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
                    ✨
                  </div>
                </MotionPath>
              </ScrollFadeIn>
            </div>
            
            <div className="mt-12">
              <ScrollSlideIn direction="right" delay={0.3}>
                <h3 className="text-2xl font-semibold mb-4">Infinity Path</h3>
              </ScrollSlideIn>
              
              <ScrollFadeIn delay={0.4}>
                <MotionPath
                  pathData={paths.infinity}
                  showPath={true}
                  duration={6}
                >
                  <div className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-pink-500 to-red-600 text-white text-xl">
                    🔄
                  </div>
                </MotionPath>
              </ScrollFadeIn>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default AnimationShowcase; 