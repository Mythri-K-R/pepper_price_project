// frontend/src/pages/Index.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, easeInOut } from "framer-motion";
import {
  LineChart,
  Cpu,
  MessageCircle,
  Database,
  Brain,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import heroImage from "@/assets/hero-pepper-plantation.jpg";

const API_URL = "http://127.0.0.1:5000";

// --- Data Type ---
interface KpiData {
  price: number;
  date: string;
}

// --- Live Market Card Component ---
const LiveMarketCard = ({ region, regionName }: { region: string; regionName: string }) => {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPrice = async () => {
      try {
        const response = await fetch(`${API_URL}/latest-prices`);
        if (!response.ok) throw new Error("Failed to fetch latest prices");
        const allKpis = await response.json();
        setData(allKpis[region]);
      } catch (err) {
        console.error(`Error fetching ${region} KPI:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestPrice();
  }, [region]);

  const formatPrice = (price?: number) => {
    if (price === undefined) return "N/A";
    return price.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (loading) return <Skeleton className="h-40 w-full rounded-2xl" />;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.3, ease: easeInOut }}
    >
      <Card className="shadow-lg bg-white/60 backdrop-blur-md border border-green-200 hover:shadow-xl transition-shadow">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-green-800">{regionName} Latest Price</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-900">{formatPrice(data?.price)}</div>
          <p className="text-sm text-gray-600">as of {data?.date || "N/A"}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Main Component ---
const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-green-100 text-gray-900">
      <Navigation />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Pepper Plantation"
          className="absolute inset-0 w-full h-full object-cover brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/70 via-green-800/60 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: easeInOut }}
          className="relative z-10 text-center px-6"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg mb-6">
            AI-Powered Market Intelligence for Karnataka’s Black Gold
          </h1>
          <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto mb-10">
            Real-time forecasting and insights for black pepper — powered by AI, data, and sustainability.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/predict">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white text-lg px-8 py-6 rounded-full shadow-lg">
                Get Forecast
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button
                variant="secondary"
                className="text-lg px-8 py-6 rounded-full border-green-300 text-green-900 bg-white/80 hover:bg-white shadow-lg"
              >
                View Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- LIVE MARKET SNAPSHOT --- */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-green-800 mb-12">Live Market Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <LiveMarketCard region="madikeri" regionName="Madikeri" />
            <LiveMarketCard region="sirsi" regionName="Sirsi" />
            <LiveMarketCard region="chikkamagaluru" regionName="Chikkamagaluru" />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-20 bg-green-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-green-900 mb-12">From Data to Decision</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { icon: <Database className="w-10 h-10 text-green-700" />, title: "Aggregate", text: "We collect years of price and weather data to uncover patterns." },
              { icon: <Brain className="w-10 h-10 text-green-700" />, title: "Analyze", text: "Our AI models learn from historical and live data to generate insights." },
              { icon: <Lightbulb className="w-10 h-10 text-green-700" />, title: "Decide", text: "You get accurate forecasts to make confident business decisions." },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: easeInOut }}
                viewport={{ once: true }}
                className="p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-green-200"
              >
                <div className="flex flex-col items-center mb-4">{item.icon}</div>
                <h3 className="text-2xl font-semibold text-green-800 mb-2">{item.title}</h3>
                <p className="text-gray-700">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ABOUT & CONTACT SECTION --- */}
      <section className="py-20 px-6 bg-gradient-to-b from-green-100 to-green-50">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easeInOut }}
            viewport={{ once: true }}
            className="p-10 bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-green-200 mb-12"
          >
            <h2 className="text-3xl font-bold text-green-800 mb-4">About the Project</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Pepper Price Forecasting System</strong> is an AI-powered initiative focused on predicting black pepper prices across Karnataka’s major producing regions — Madikeri, Sirsi, and Chikkamagaluru.  
              It blends deep learning with live weather data to empower farmers, traders, and policymakers with accurate, data-driven insights.
            </p>
          </motion.div>

          <div className="p-8 bg-white/60 backdrop-blur-md rounded-2xl shadow-md border border-green-200">
            <h2 className="text-3xl font-bold text-green-800 mb-6">Contact Us</h2>
            <div className="flex flex-col items-center gap-3 text-gray-700">
              <div className="flex items-center gap-2"><Mail className="w-5 h-5 text-green-700" /> pepperforecast@gmail.com</div>
              <div className="flex items-center gap-2"><Phone className="w-5 h-5 text-green-700" /> +91 98765 43210</div>
              <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-green-700" /> SDMIT, Ujire, Karnataka</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-6 text-center bg-green-900 text-green-100">
        © {new Date().getFullYear()} Pepper Price Forecasting System. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
