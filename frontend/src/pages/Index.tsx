import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-pepper-plantation.jpg";
import Navigation from "@/components/Navigation";
import LiveMarketCard from "@/components/LiveMarketCard";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      {/* Full-Screen Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in drop-shadow-2xl">
            Black Pepper Price Prediction Portal
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-2xl mx-auto animate-fade-in drop-shadow-lg" style={{ animationDelay: "0.1s" }}>
            Harnessing AI to forecast market prices for growers in Karnataka.
          </p>
          <Link to="/predict">
            <Button 
              size="lg" 
              className="text-lg px-12 py-7 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-transform animate-fade-in" 
              style={{ animationDelay: "0.2s" }}
            >
              Predict Prices
            </Button>
          </Link>
        </div>
      </section>

      {/* Live Market Snapshot Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Live Market Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <LiveMarketCard region="Madikeri" />
            <LiveMarketCard region="Sirsi" />
            <LiveMarketCard region="Chikkamagaluru" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;