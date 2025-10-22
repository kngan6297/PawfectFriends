import React, { useEffect, useState } from "react";
import { api } from "@/config/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Clock, TrendingUp } from "lucide-react";

interface RecommendationMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  averageRecommendationScore: number;
  averageResponseTime: number;
  errors: number;
  lastUpdated: string;
}

export const RecommendationMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/recommendations/metrics");
      setMetrics(response.data);
    } catch (err) {
      setError("Failed to fetch metrics");
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetMetrics = async () => {
    try {
      await api.post("/recommendations/metrics/reset");
      await fetchMetrics();
    } catch (err) {
      setError("Failed to reset metrics");
      console.error("Error resetting metrics:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refresh metrics every minute
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading metrics...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Recommendation Metrics</h2>
        <div className="flex gap-2">
          <Button
            onClick={fetchMetrics}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={resetMetrics}
            variant="outline"
            className="flex items-center gap-2"
          >
            Reset Metrics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium">Cache Hit Rate</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics.cacheHitRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">
            {metrics.cacheHits} hits / {metrics.cacheMisses} misses
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            <h3 className="font-medium">Avg Response Time</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics.averageResponseTime.toFixed(0)}ms
          </p>
          <p className="text-sm text-gray-500">
            Total requests: {metrics.totalRequests}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <h3 className="font-medium">Avg Score</h3>
          </div>
          <p className="text-2xl font-bold mt-2">
            {metrics.averageRecommendationScore.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500">Recommendation quality score</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-medium">Errors</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{metrics.errors}</p>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        </Card>
      </div>
    </div>
  );
};
