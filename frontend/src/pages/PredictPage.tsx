import PricePredictor from "@/components/PricePredictor";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";

const PredictPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="py-16 px-4">
        <PricePredictor />
      </main>

      {/* Floating Chat Icon */}
      <Link to="/chat">
        <Button
          size="icon"
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </Link>
    </div>
  );
};

export default PredictPage;