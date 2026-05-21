"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { dashboardApi, type InventoryTrendItem } from "@/lib/api/warehouse/dashboardApi";

interface UserInfo {
  managerId?: number | string;
  ManagerId?: number | string;
  id: number | string;
}

const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <div className="h-[350px] w-full bg-gray-50 animate-pulse rounded-[2rem]" />
});

// Helper function to create a continuous list of dates
const getDatesInRange = (startDate: Date, endDate: Date) => {
  const dates = [];
  const curr = new Date(startDate);
  while (curr <= endDate) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

interface InventoryChartProps {
  dateRange?: string;
  customDates?: { start: string; end: string } | null;
  warehouseId?: number;
}

export default function InventoryChart({ dateRange = "7", customDates, warehouseId }: InventoryChartProps) {
  const [mounted, setMounted] = useState(false);
  const [inboundData, setInboundData] = useState<number[]>([]);
  const [outboundData, setOutboundData] = useState<number[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Lấy managerId từ localStorage
        const userInfoRaw = localStorage.getItem('user_info');
        let managerId = 0;
        if (userInfoRaw) {
          const userInfo = JSON.parse(userInfoRaw) as UserInfo;
          const rawId = userInfo.managerId || userInfo.ManagerId;
          managerId = rawId && rawId !== "null" ? Number(rawId) : Number(userInfo.id);
        }

        // 2. Xác định StartDate và EndDate theo logic Hybrid
        let startStr = "";
        let endStr = new Date().toISOString().split('T')[0];

        if (dateRange === "custom" && customDates) {
          startStr = customDates.start;
          endStr = customDates.end;
        } else {
          const days = parseInt(dateRange) || 7;
          const d = new Date();
          d.setDate(d.getDate() - (days - 1));
          startStr = d.toISOString().split('T')[0];
        }

        // 3. Gọi API
        const data = await dashboardApi.getInventoryTrend({
          startDate: startStr,
          endDate: endStr,
          managerId: managerId,
          warehouseId: warehouseId
        });

        // Hỗ trợ Trend từ Backend
        const apiTrend = data.Trend || [];

        // 4. LOGIC LẤP ĐẦY DỮ LIỆU (DATA FILLING)
        const fullDateSequence = getDatesInRange(new Date(startStr), new Date(endStr));

        const finalInbound = fullDateSequence.map(dateStr => {
          const match = apiTrend.find((item: InventoryTrendItem) => (item.Date || "").startsWith(dateStr));
          return match ? (match.TotalInbound || 0) : 0;
        });

        const finalOutbound = fullDateSequence.map(dateStr => {
          const match = apiTrend.find((item: InventoryTrendItem) => (item.Date || "").startsWith(dateStr));
          return match ? (match.TotalOutbound || 0) : 0;
        });

        const finalCategories = fullDateSequence.map(dateStr => {
          const d = new Date(dateStr);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        });

        setInboundData(finalInbound);
        setOutboundData(finalOutbound);
        setCategories(finalCategories);

      } catch (error) {
        console.error("Lỗi fetch inventory trend:", error);
      } finally {
        setLoading(false);
      }
    };
    if (mounted) fetchData();
  }, [dateRange, customDates, warehouseId, mounted]);

  const chartConfig = useMemo(() => {
    return {
      series: [
        { name: 'Nhập kho', data: inboundData },
        { name: 'Xuất kho', data: outboundData }
      ],
      options: {
        chart: {
          type: 'area' as const,
          toolbar: { show: false },
          zoom: { enabled: false },
          fontFamily: 'Inter, sans-serif',
        },
        colors: ['#3b82f6', '#E4002B'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth' as const, width: 3 },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.45,
            opacityTo: 0.05,
            stops: [20, 100]
          }
        },
        xaxis: {
          categories: categories,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: {
            style: { colors: '#9ca3af', fontWeight: 700, fontSize: '10px' }
          }
        },
        yaxis: {
          labels: {
            style: { colors: '#9ca3af', fontWeight: 700, fontSize: '10px' }
          },
          min: 0,
        },
        grid: {
          borderColor: '#f1f1f1',
          strokeDashArray: 4,
          padding: { left: 20 }
        },
        legend: { show: false },
        tooltip: {
          theme: 'dark',
          style: { fontSize: '12px', fontFamily: 'Inter' },
          y: { formatter: (val: number) => val + " phiếu" }
        }
      }
    };
  }, [inboundData, outboundData, categories]);

  if (!mounted || loading) {
    return <div className="h-[350px] w-full bg-gray-50 animate-pulse rounded-[2.5rem]" />;
  }

  return (
    <div className="w-full h-full min-h-[350px]">
      <Chart
        options={chartConfig.options}
        series={chartConfig.series}
        type="area"
        width="100%"
        height="100%"
      />
    </div>
  );
}