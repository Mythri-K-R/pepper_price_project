// frontend/src/components/PerformanceChart.tsx
// --- [THIS IS A NEW FILE YOU MUST CREATE] ---

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// This component is built to receive the data from our new /model-backtest endpoint
interface PerformanceData {
  date: string;
  actual: number;
  predicted: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

// Helper to format the date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

// Helper to format the price
const formatPrice = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          tick={{ fill: "hsl(var(--foreground))" }} 
        />
        <YAxis 
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} 
          tick={{ fill: "hsl(var(--foreground))" }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelFormatter={formatDate}
          formatter={(value: number, name: string) => [formatPrice(value), name]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="actual" 
          name="Actual Price"
          stroke="hsl(var(--primary))" // Blue
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="predicted" 
          name="Predicted Price"
          stroke="hsl(var(--destructive))" // Red
          strokeWidth={2}
          strokeDasharray="5 5" // Makes it a dotted line
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;