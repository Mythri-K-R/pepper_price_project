import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot } from "recharts";

interface PriceDataPoint {
  date: string;
  price: number;
  isPrediction?: boolean;
}

interface PriceChartProps {
  data: PriceDataPoint[];
  prediction?: { date: string; price: number };
}

const PriceChart = ({ data, prediction }: PriceChartProps) => {
  // Combine historical data with prediction
  const chartData = [...data];
  if (prediction) {
    chartData.push({
      date: prediction.date,
      price: prediction.price,
      isPrediction: true,
    });
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isPrediction) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={8}
          fill="hsl(var(--primary))"
          stroke="#fff"
          strokeWidth={3}
        />
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          tick={{ fill: "hsl(var(--foreground))" }}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          tick={{ fill: "hsl(var(--foreground))" }}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelFormatter={(value) => new Date(value).toLocaleDateString('en-IN')}
          formatter={(value: number) => [
            new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(value),
            "Price"
          ]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="price" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={<CustomDot />}
          name="Price (INR)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;