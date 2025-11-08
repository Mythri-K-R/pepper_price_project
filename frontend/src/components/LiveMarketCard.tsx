import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

interface LiveMarketCardProps {
  region: string;
}

const LiveMarketCard = ({ region }: LiveMarketCardProps) => {
  const [price, setPrice] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestPrice = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:5000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `What is the latest price for ${region} as a single number?`,
          }),
        });

        const data = await response.json();
        
        if (response.ok) {
          // Extract price from response
          const priceMatch = data.response.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            setPrice(priceMatch[0]);
            // Set today's date as the price date
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
          } else {
            setError("Unable to parse price");
          }
        } else {
          setError(data.error || "Failed to fetch price");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPrice();
  }, [region]);

  const formatINR = (value: string) => {
    const num = parseFloat(value.replace(/,/g, ''));
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {region}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <p className="text-3xl font-bold text-primary mb-2">
              {price && formatINR(price)}
            </p>
            <p className="text-sm text-muted-foreground">
              As of {date && new Date(date).toLocaleDateString('en-IN')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveMarketCard;