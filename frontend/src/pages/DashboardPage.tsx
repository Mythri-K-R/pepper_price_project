// frontend/src/pages/Dashboard.tsx
// --- [FULLY CORRECTED CODE WITH 3-TAB LAYOUT] ---

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Import BOTH chart types
import PriceChart from "@/components/PriceChart"; // Your existing chart
import PerformanceChart from "@/components/PerformanceChart"; // The new one

// --- Define our data types ---
interface ApiHistoricalData { Date: string; Price: number; }
interface ChartData { date: string; price: number; } // For PriceChart
interface PerformanceData { date: string; actual: number; predicted: number; } // For PerformanceChart
interface KpiData { price: number; date: string; }

const API_URL = "https://pepper-price-project.onrender.com";

// Helper to format price
const formatPrice = (price?: number) => {
  if (price === undefined) return "N/A";
  return price.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Helper to transform API data for simple chart
const transformApiData = (data: ApiHistoricalData[]): ChartData[] => {
  if (!data) return []; // Add a check for undefined data
  return data.map(d => ({ date: d.Date, price: d.Price }));
};

// Helper Component for KPI Cards
const KpiCard = ({ title, value, date }: { title: string; value?: number; date?: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-4xl font-bold">{formatPrice(value)}</div>
      <p className="text-xs text-muted-foreground">as of {date}</p>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [kpiData, setKpiData] = useState<{ [key: string]: KpiData }>({});

  const [loadingOverview, setLoadingOverview] = useState(true);
  // This state will hold the 3 data arrays
  const [overviewData, setOverviewData] = useState<{
    madikeri: ApiHistoricalData[],
    sirsi: ApiHistoricalData[],
    chikkam: ApiHistoricalData[]
  } | null>(null);

  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performanceRegion, setPerformanceRegion] = useState("sirsi");
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);

  const [loadingTable, setLoadingTable] = useState(false);
  const [tableRegion, setTableRegion] = useState("sirsi");
  const [tableData, setTableData] = useState<(ApiHistoricalData & { Region: string })[]>([]);

  // --- Data Fetching Functions ---

  // Fetches data for Tab 1 (Overview)
  const fetchOverviewData = async () => {
    setLoadingKpis(true);
    setLoadingOverview(true);
    try {
      // 1. Fetch KPIs
      const kpiResponse = await fetch(`${API_URL}/latest-prices`);
      if (!kpiResponse.ok) throw new Error("Failed to fetch latest prices");
      const kpis = await kpiResponse.json();
      setKpiData(kpis);
      setLoadingKpis(false);

      // 2. Fetch Historical Data (30 days for this chart)
      const days = 30;
      const [madikeriRes, sirsiRes, chikkamRes] = await Promise.all([
        fetch(`${API_URL}/historical-data?region=madikeri&days=${days}`),
        fetch(`${API_URL}/historical-data?region=sirsi&days=${days}`),
        fetch(`${API_URL}/historical-data?region=chikkamagaluru&days=${days}`),
      ]);

      if (!madikeriRes.ok || !sirsiRes.ok || !chikkamRes.ok) {
        throw new Error("Failed to fetch historical chart data");
      }

      const madikeri = await madikeriRes.json();
      const sirsi = await sirsiRes.json();
      const chikkam = await chikkamRes.json();

      setOverviewData({ madikeri, sirsi, chikkam });
      
    } catch (err) {
      console.error("Error loading overview:", err);
      toast.error("Failed to load overview data.");
    }
    setLoadingOverview(false);
  };

  // Fetches data for Tab 2 (Performance)
  const fetchPerformanceData = async (region: string) => {
    setLoadingPerformance(true);
    try {
      const days = 90; // Let's backtest for 90 days
      const response = await fetch(`${API_URL}/model-backtest?region=${region}&days=${days}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Failed to fetch backtest for ${region}`);
      }
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      console.error("Error loading performance data:", err);
      toast.error((err as Error).message);
    }
    setLoadingPerformance(false);
  };

  // Fetches data for Tab 3 (Table)
  const fetchTableData = async (region: string) => {
    setLoadingTable(true);
    try {
      const response = await fetch(`${API_URL}/historical-data?region=${region}&days=180`);
      if (!response.ok) throw new Error("Failed to fetch table data");
      const data: ApiHistoricalData[] = await response.json();
      // [FIX] Capitalize the region string
      const regionName = region.charAt(0).toUpperCase() + region.slice(1);
      setTableData(data.map(d => ({...d, Region: regionName})).reverse());
    } catch (err) {
      console.error("Error fetching table data:", err);
      toast.error("Failed to load raw data table.");
    }
    setLoadingTable(false);
  };

  // --- Load initial data on page load ---
  useEffect(() => {
    fetchOverviewData();
  }, []);

  // --- Handle Tab Changes ---
  const handleTabChange = (tab: string) => {
    if (tab === 'performance' && performanceData.length === 0) {
      fetchPerformanceData(performanceRegion);
    }
    if (tab === 'data' && tableData.length === 0) {
      fetchTableData(tableRegion);
    }
  };
  
  // --- Handle Region Selectors ---
  const handlePerformanceRegionChange = (region: string) => {
    setPerformanceRegion(region);
    fetchPerformanceData(region);
  };

  const handleTableRegionChange = (region: string) => {
    setTableRegion(region);
    fetchTableData(region);
  };


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Market Dashboard</h1>
          
          <Tabs defaultValue="overview" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Market Overview</TabsTrigger>
              <TabsTrigger value="performance">Model Performance</TabsTrigger>
              <TabsTrigger value="data">Raw Data</TabsTrigger>
            </TabsList>

            {/* --- TAB 1: MARKET OVERVIEW --- */}
            <TabsContent value="overview" className="mt-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {loadingKpis ? (
                  <>
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="h-36 w-full" />
                    <Skeleton className="h-36 w-full" />
                  </>
                ) : (
                  <>
                    <KpiCard title="Madikeri Latest Price" value={kpiData.madikeri?.price} date={kpiData.madikeri?.date} />
                    <KpiCard title="Sirsi Latest Price" value={kpiData.sirsi?.price} date={kpiData.sirsi?.date} />
                    <KpiCard title="Chikkamagaluru Latest Price" value={kpiData.chikkamagaluru?.price} date={kpiData.chikkamagaluru?.date} />
                  </>
                )}
              </div>
              
              {/* 3 Separate Charts */}
              <div className="space-y-8">
                <Card>
                  <CardHeader><CardTitle>Madikeri - 30 Day Trend</CardTitle></CardHeader>
                  <CardContent>
                    {/* [FIX] Check for null overviewData and use ?? [] */}
                    {loadingOverview ? <Skeleton className="h-[400px] w-full" /> : <PriceChart data={transformApiData(overviewData?.madikeri ?? [])} />}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Sirsi - 30 Day Trend</CardTitle></CardHeader>
                  <CardContent>
                    {loadingOverview ? <Skeleton className="h-[400px] w-full" /> : <PriceChart data={transformApiData(overviewData?.sirsi ?? [])} />}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Chikkamagaluru - 30 Day Trend</CardTitle></CardHeader>
                  <CardContent>
                    {loadingOverview ? <Skeleton className="h-[400px] w-full" /> : <PriceChart data={transformApiData(overviewData?.chikkam ?? [])} />}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* --- TAB 2: MODEL PERFORMANCE --- */}
            <TabsContent value="performance" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Performance: Actual vs. Predicted (90 Days)</CardTitle>
                  <div className="pt-4">
                    <Select value={performanceRegion} onValueChange={handlePerformanceRegionChange}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sirsi">Sirsi</SelectItem>
                        <SelectItem value="madikeri">Madikeri</SelectItem>
                        <SelectItem value="chikkamagaluru">Chikkamagaluru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingPerformance ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <PerformanceChart data={performanceData} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* --- TAB 3: RAW DATA --- */}
            <TabsContent value="data" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Data Table (180 Days)</CardTitle>
                  <div className="pt-4">
                    <Select value={tableRegion} onValueChange={handleTableRegionChange}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sirsi">Sirsi</SelectItem> {/* [FIX] Removed a typo here */}
                        <SelectItem value="madikeri">Madikeri</SelectItem>
                        <SelectItem value="chikkamagaluru">Chikkamagaluru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[800px] overflow-y-auto">
                  {loadingTable ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead className="text-right">Price (₹)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.Date}</TableCell>
                            <TableCell>{row.Region}</TableCell>
                            <TableCell className="text-right">{formatPrice(row.Price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;