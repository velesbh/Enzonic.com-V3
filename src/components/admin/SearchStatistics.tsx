import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  Search, 
  Users, 
  BarChart3, 
  Clock, 
  Flame,
  Activity,
  AlertCircle
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  getSearchStatisticsOverview, 
  getPopularSearches, 
  getRecentSearches, 
  getSearchTrends 
} from "@/lib/adminApi";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SearchStatisticsProps {
  getToken: () => Promise<string | null>;
}

const SearchStatistics = ({ getToken }: SearchStatisticsProps) => {
  const [timeframe, setTimeframe] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [popularSearches, setPopularSearches] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  // Fetch all statistics
  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get fresh token each time
      const token = await getToken();
      if (!token) {
        setError('Authentication token not available');
        return;
      }

      const [statsData, popularData, recentData, trendsData] = await Promise.all([
        getSearchStatisticsOverview(timeframe, token),
        getPopularSearches(timeframe, 20, token),
        getRecentSearches(50, token),
        getSearchTrends(timeframe, token)
      ]);

      // Ensure we have proper data structure with defaults
      setStats({
        timeframe: statsData.timeframe || timeframe,
        total_searches: statsData.total_searches || 0,
        unique_users: statsData.unique_users || 0,
        avg_results: statsData.avg_results || '0',
        categories: statsData.categories || [],
        time_series: statsData.time_series || []
      });
      setPopularSearches(popularData.popular_searches || []);
      setRecentSearches(recentData.recent_searches || []);
      setTrends(trendsData.trending_searches || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Set empty data on error
      setStats({
        timeframe,
        total_searches: 0,
        unique_users: 0,
        avg_results: '0',
        categories: [],
        time_series: []
      });
      setPopularSearches([]);
      setRecentSearches([]);
      setTrends([]);
      setError(error instanceof Error ? error.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Prepare chart data
  const timeSeriesChartData = stats && stats.time_series && stats.time_series.length > 0 ? {
    labels: stats.time_series.map(item => 
      new Date(item.time_bucket).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: timeframe === '24h' ? 'numeric' : undefined 
      })
    ),
    datasets: [
      {
        label: 'Searches',
        data: stats.time_series.map(item => item.searches),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  const categoryChartData = stats && stats.categories && stats.categories.length > 0 ? {
    labels: stats.categories.map(cat => cat.search_category),
    datasets: [
      {
        label: 'Searches by Category',
        data: stats.categories.map(cat => cat.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with timeframe selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Search Statistics</h2>
          <p className="text-muted-foreground mt-1">Real-time search analytics and insights</p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_searches?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In the last {timeframe === '24h' ? '24 hours' : timeframe === '7d' ? '7 days' : timeframe === '30d' ? '30 days' : 'year'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.unique_users?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active searchers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avg_results}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per search query
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Updates</CardTitle>
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">●</div>
            <p className="text-xs text-muted-foreground mt-1">
              Refreshes every 30s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {timeSeriesChartData ? (
                <Line data={timeSeriesChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No search data available yet</p>
                    <p className="text-sm">Data will appear once users start searching</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Searches by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {categoryChartData ? (
                <Bar data={categoryChartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No category data available yet</p>
                    <p className="text-sm">Data will appear once users start searching</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Tables */}
      <Tabs defaultValue="popular" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="popular">
            <Flame className="h-4 w-4 mr-2" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Searches</CardTitle>
            </CardHeader>
            <CardContent>
              {popularSearches && popularSearches.length > 0 ? (
                <div className="space-y-3">
                  {popularSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 justify-center">{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{search.search_query}</div>
                          <div className="text-sm text-muted-foreground">
                            {search.search_count} searches · Avg {parseFloat(search.avg_results).toFixed(0)} results
                          </div>
                        </div>
                      </div>
                      <Badge>{new Date(search.last_searched).toLocaleDateString()}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Flame className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No popular searches yet</p>
                  <p className="text-sm">Search data will appear here once users start searching</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Searches</CardTitle>
            </CardHeader>
            <CardContent>
              {trends && trends.length > 0 ? (
                <div className="space-y-3">
                  {trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{trend.search_query}</div>
                          <div className="text-sm text-muted-foreground">
                            Recent: {trend.recent_count} · Previous: {trend.older_count}
                          </div>
                        </div>
                      </div>
                      <Badge variant={trend.trend_percentage > 50 ? "default" : "secondary"}>
                        +{parseFloat(trend.trend_percentage).toFixed(0)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No trending searches yet</p>
                  <p className="text-sm">Trends will appear once there's enough search history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSearches && recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{search.search_query}</span>
                        <Badge variant="outline" className="text-xs">{search.search_category}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{search.results_count} results</span>
                        <span>·</span>
                        <span>{new Date(search.search_timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent searches</p>
                  <p className="text-sm">Recent search activity will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SearchStatistics;
