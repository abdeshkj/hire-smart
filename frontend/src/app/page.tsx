"use client";

import { useEffect, useState } from "react";
import { getHealthStatus, HealthStatusResponse } from "@/services/api";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const [healthData, setHealthData] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnectivity = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHealthStatus();
      setHealthData(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to backend");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
          HireSmart Frontend
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Proof of Connectivity between Next.js Client & Express API
        </p>

        <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-left text-sm font-mono space-y-2">
          {loading && (
            <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              <span>Checking backend connection...</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 space-y-1">
              <p className="font-semibold">⚠️ Connection Failed</p>
              <p className="text-xs">{error}</p>
            </div>
          )}

          {healthData && (
            <div className="space-y-1 text-green-700 dark:text-green-400">
              <p className="font-semibold flex items-center gap-1">
                <span>✅</span> Backend Status: <span>{healthData.status}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Service: {healthData.service}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Timestamp: {healthData.timestamp}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={checkConnectivity}
          variant="primary"
          size="sm"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Testing..." : "Re-test Connection"}
        </Button>
      </div>
    </main>
  );
}
