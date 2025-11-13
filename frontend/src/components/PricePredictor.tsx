// frontend/src/components/PricePredictor.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import PriceChart from "./PriceChart";

const API_URL = "https://pepper-price-project.onrender.com"; // Ensure this matches your backend URL

interface PredictionResult {
  region: string;
  target_date: string;
  predicted_price: number;
}

const PricePredictor = () => {
  const [region, setRegion] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  // We need historical data to show the context in the chart
  const [historicalContext, setHistoricalContext] = useState<any[]>([]);

  const handlePredict = async () => {
    if (!region || !date) {
      toast.error("Please select both a region and a date");
      return;
    }

    setLoading(true);
    setPrediction(null);

    try {
      // 1. Get the prediction
      const predResponse = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, date }),
      });

      if (!predResponse.ok) {
        const errorData = await predResponse.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const predData = await predResponse.json();

      // 2. Get historical data for the chart context (last 30 days)
      const histResponse = await fetch(`${API_URL}/historical-data?region=${region}&days=30`);
      let histData = [];
      if (histResponse.ok) {
        const rawHist = await histResponse.json();
        // Transform for the chart
        histData = rawHist.map((d: any) => ({ date: d.Date, price: d.Price }));
      }

      setHistoricalContext(histData);
      setPrediction(predData);
      toast.success("Prediction successful!");

    } catch (error) {
      console.error("Prediction error:", error);
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Calculate max date (5 days from today) for the calendar input
  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-primary">
            Pepper Price Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Input Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="region">Select Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="region" className="h-12 text-lg">
                  <SelectValue placeholder="Choose a region..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="madikeri">Madikeri</SelectItem>
                  <SelectItem value="sirsi">Sirsi</SelectItem>
                  <SelectItem value="chikkamagaluru">Chikkamagaluru</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <Input
                id="date"
                type="date"
                className="h-12 text-lg"
                min={getMinDate()}
                max={getMaxDate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground text-right">
                (Max 5 days ahead)
              </p>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full text-lg py-6" 
            onClick={handlePredict}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Analyzing Market...
              </>
            ) : (
              "Predict Price"
            )}
          </Button>

          {/* Result Section */}
          {prediction && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 mt-8">
              
              {/* 1. The Price Card (Now Centered and Larger) */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Predicted Price for {prediction.region}
                  </p>
                  <div className="text-5xl font-bold text-primary mb-2">
                    {formatPrice(prediction.predicted_price)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    on {new Date(prediction.target_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </CardContent>
              </Card>

              {/* 2. The Chart */}
              {historicalContext.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
                  <PriceChart 
                    data={historicalContext} 
                    prediction={{ 
                      date: prediction.target_date, 
                      price: prediction.predicted_price 
                    }} 
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PricePredictor;