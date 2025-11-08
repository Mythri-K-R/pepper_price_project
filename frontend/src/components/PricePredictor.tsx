import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import PriceChart from "./PriceChart";

const PricePredictor = () => {
  const [region, setRegion] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 15);
    return maxDate.toISOString().split("T")[0];
  };

  const getReliability = (selectedDate: string) => {
    const today = new Date();
    const target = new Date(selectedDate);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 5) return "High";
    if (diffDays <= 10) return "Medium";
    return "Low";
  };

  const handlePredict = async () => {
    if (!region || !date) {
      toast.error("Please select both region and date");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictedPrice(null);
    setHistoricalData([]);

    try {
      // First, fetch historical data (last 90 days)
      const historyResponse = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Give me the last 90 days of historical price data for ${region} in JSON format`,
        }),
      });

      let historicalPrices = [];
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        try {
          const jsonMatch = historyData.response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            historicalPrices = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error("Failed to parse historical data:", e);
        }
      }

      // Now, get the prediction
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, date }),
      });

      const data = await response.json();

      if (response.ok) {
        setPredictedPrice(data.predicted_price);
        setHistoricalData(historicalPrices);
        toast.success("Price predicted successfully!");
      } else {
        setError(data.error || "An error occurred");
        toast.error(data.error || "An error occurred");
      }
    } catch (err) {
      setError("Failed to connect to the server");
      toast.error("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const reliability = date ? getReliability(date) : null;
  const reliabilityColor = reliability === "High" ? "text-green-600" : reliability === "Medium" ? "text-yellow-600" : "text-orange-600";

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <Card className="shadow-xl border-0">
        <CardContent className="p-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-foreground mb-2">Pepper Price Prediction</h2>
            <p className="text-muted-foreground">Predict prices up to 15 days in advance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTomorrowDate()}
                max={getMaxDate()}
                className="w-full px-4 py-3 border border-input rounded-lg bg-card text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Region</label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="w-full py-6 rounded-lg">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="madikeri">Madikeri</SelectItem>
                  <SelectItem value="sirsi">Sirsi</SelectItem>
                  <SelectItem value="chikkamagaluru">Chikkamagaluru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-7 text-lg font-bold rounded-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-5 w-5" />
                Predict Price
              </>
            )}
          </Button>

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 rounded-lg text-center border border-destructive">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart and Results */}
      {predictedPrice !== null && (
        <Card className="shadow-xl border-0">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-2xl font-bold text-center">Prediction Results</h3>
            
            {historicalData.length > 0 && (
              <div className="mb-6">
                <PriceChart 
                  data={historicalData} 
                  prediction={{ date, price: predictedPrice }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-primary/20 rounded-xl text-center border-2 border-primary">
                <p className="text-sm text-foreground/70 mb-2">Predicted Price</p>
                <p className="text-4xl font-bold text-primary">{formatINR(predictedPrice)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  For {new Date(date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </p>
              </div>

              {reliability && (
                <div className="p-6 bg-muted rounded-xl text-center border-2 border-border">
                  <p className="text-sm text-foreground/70 mb-2">Prediction Reliability</p>
                  <p className={`text-4xl font-bold ${reliabilityColor}`}>{reliability}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on forecast timeframe
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PricePredictor;