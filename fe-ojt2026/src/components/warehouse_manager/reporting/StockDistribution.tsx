"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { dashboardApi } from '@/lib/api/warehouse/dashboardApi';
import type { Warehouse } from '@/types/warehouse/warehouse';

const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full bg-gray-50 animate-pulse rounded-[2rem]" />
});

const TYPE_LABELS: Record<string, string> = {
  'Nguyên Liệu Thô': 'Nguyên liệu thô',
  'Thiết Bị': 'Thiết bị',
  'Bao Bì': 'Bao bì'
};

interface StockDistributionProps {
  warehouseId?: number;
}

export default function StockDistribution({ warehouseId }: StockDistributionProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<number[]>([0]);
  const [labels, setLabels] = useState<string[]>(['Đang tải...']);
  const [hoveredInfo, setHoveredInfo] = useState<{ label: string, value: number } | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (warehouseId !== undefined) {
      const match = warehouses.find(w => w.Id === warehouseId);
      if (match) setSelectedWarehouse(match);
      else if (warehouseId === undefined) setSelectedWarehouse(null);
    } else {
      setSelectedWarehouse(null);
    }
  }, [warehouseId, warehouses]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getManagerWarehouseInventory(selectedWarehouse?.Id);

        if (!response || !response.Warehouses || response.Warehouses.length === 0) {
          setSeries([100]);
          setLabels(['Không có dữ liệu']);
          return;
        }

        if (warehouses.length === 0) {
          const mappedWarehouses = response.Warehouses.map(w => ({
            Id: w.WarehouseId,
            Name: w.WarehouseName,
            IsActive: true
          } as Warehouse));
          setWarehouses(mappedWarehouses);
        }

        const summary = response.Summary;
        if (summary.GrandTotalCount === 0) {
          setSeries([100]);
          setLabels(['Kho trống']);
        } else {
          const newLabels = summary.SummaryBreakdown.map(b => TYPE_LABELS[b.ProductType] || b.ProductType);
          const newSeries = summary.SummaryBreakdown.map(b => b.Percentage);
          setSeries(newSeries);
          setLabels(newLabels);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu phân loại kho:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mounted, selectedWarehouse, warehouses.length]);

  // Remove SVG <title> to prevent native "Chart" tooltip
  useEffect(() => {
    if (!mounted || !chartRef.current) return;
    const timer = setTimeout(() => {
      const titles = chartRef.current?.querySelectorAll('title');
      titles?.forEach(t => t.remove());
    }, 500);
    return () => clearTimeout(timer);
  }, [mounted, loading]);

  const chartOptions = useMemo<ApexOptions>(() => {
    return {
      chart: {
        id: 'stock-distribution-donut',
        type: 'donut' as const,
        fontFamily: 'Outfit, sans-serif',
        sparkline: {
          enabled: true
        },
        dropShadow: {
          enabled: false,
          top: 15,
          left: 0,
          blur: 25,
          opacity: 0.05,
          color: '#000'
        },
        animations: {
          enabled: true,
          easing: 'easeinout' as const,
          speed: 800,
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        events: {
          dataPointMouseEnter: function (_event: unknown, _chartContext: unknown, config: { dataPointIndex: number }) {
            const index = config.dataPointIndex;
            if (index === -1 || !labels[index]) return;
            setHoveredInfo({ label: labels[index], value: series[index] });
            if (!chartRef.current) return;
            const slices = chartRef.current.querySelectorAll('.apexcharts-pie-area');
            slices.forEach((slice, i) => {
              const el = slice as SVGElement;
              el.style.transition = 'opacity 0.3s, filter 0.3s, transform 0.3s';
              el.style.transformOrigin = 'center';
              if (i === index) {
                el.style.opacity = '1';
                el.style.filter = 'brightness(1.1) drop-shadow(0 4px 12px rgba(0,0,0,0.25))';
                el.style.transform = 'scale(1.06)';
              } else {
                el.style.opacity = '0.3';
                el.style.filter = 'none';
                el.style.transform = 'scale(1)';
              }
            });
          },
          dataPointMouseLeave: function () {
            setHoveredInfo(null);
            if (!chartRef.current) return;
            const slices = chartRef.current.querySelectorAll('.apexcharts-pie-area');
            slices.forEach((slice) => {
              const el = slice as SVGElement;
              el.style.transition = 'opacity 0.3s, filter 0.3s, transform 0.3s';
              el.style.opacity = '1';
              el.style.filter = 'none';
              el.style.transform = 'scale(1)';
            });
          }
        }
      },
      labels: labels,
      colors: ['#E4002B', '#2563eb', '#1e293b', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0ea5e9'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: "vertical",
          shadeIntensity: 0.6,
          gradientToColors: ['#E4002B', '#2563eb', '#1e293b', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0ea5e9'], // Gán cứng tuyệt đối
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      states: {
        hover: {
          filter: { type: 'lighten', value: 0.1 }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: { type: 'none' }
        }
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      stroke: {
        show: true,
        width: 5,
        colors: ['#fff']
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          offsetY: 0,
          customScale: 0.75,
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'Inter, sans-serif',
                color: '#9ca3af',
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '32px',
                fontWeight: 900,
                fontFamily: 'Inter, sans-serif',
                color: '#1e293b',
                offsetY: 2,
                formatter: function (val: string) {
                  return parseFloat(Number(val).toFixed(2)) + '%';
                }
              },
              total: {
                show: true,
                showAlways: false,
                fontSize: '11px',
                fontWeight: 800,
                fontFamily: 'Inter, sans-serif',
                color: '#9ca3af',
                label: 'TỔNG CỘNG',
                formatter: function (w: { globals: { seriesTotals: number[] } }) {
                  return parseFloat(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toFixed(2)) + '%';
                }
              }
            }
          }
        }
      },
      tooltip: { enabled: false }
    };
  }, [labels, series]);

  const totalPercentage = series.reduce((a: number, b: number) => a + b, 0);

  const handleLegendHover = useCallback((index: number) => {
    setHoveredInfo({ label: labels[index], value: series[index] });
    if (!chartRef.current) return;

    const slices = chartRef.current.querySelectorAll('.apexcharts-pie-area');
    slices.forEach((slice, i) => {
      const el = slice as SVGElement;
      el.style.transition = 'opacity 0.3s, filter 0.3s, transform 0.3s';
      el.style.transformOrigin = 'center';
      if (i === index) {
        el.style.opacity = '1';
        el.style.filter = 'brightness(1.1) drop-shadow(0 4px 12px rgba(0,0,0,0.25))';
        el.style.transform = 'scale(1.06)';
      } else {
        el.style.opacity = '0.3';
        el.style.filter = 'none';
        el.style.transform = 'scale(1)';
      }
    });

    const nameEl = chartRef.current.querySelector('.apexcharts-datalabel-label');
    const valueEl = chartRef.current.querySelector('.apexcharts-datalabel-value');
    if (nameEl) {
      nameEl.textContent = labels[index].toUpperCase();
      (nameEl as SVGElement).style.fill = '#E4002B';
    }
    if (valueEl) {
      valueEl.textContent = parseFloat(Number(series[index]).toFixed(2)) + '%';
    }
  }, [labels, series]);

  const handleLegendLeave = useCallback(() => {
    setHoveredInfo(null);
    if (!chartRef.current) return;

    const slices = chartRef.current.querySelectorAll('.apexcharts-pie-area');
    slices.forEach((slice) => {
      const el = slice as SVGElement;
      el.style.transition = 'opacity 0.3s, filter 0.3s, transform 0.3s';
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.transform = 'scale(1)';
    });

    const nameEl = chartRef.current.querySelector('.apexcharts-datalabel-label');
    const valueEl = chartRef.current.querySelector('.apexcharts-datalabel-value');
    if (nameEl) {
      nameEl.textContent = 'TỔNG CỘNG';
      (nameEl as SVGElement).style.fill = '#9ca3af';
    }
    if (valueEl) {
      valueEl.textContent = parseFloat(Number(totalPercentage).toFixed(2)) + '%';
    }
  }, [totalPercentage]);

  if (!mounted) {
    return <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-[2rem]" />;
  }

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 h-full flex flex-col overflow-visible">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
        <h3 className="font-black uppercase text-[14px] tracking-widest text-[#1e293b]">
          Phân loại nhóm hàng
        </h3>
      </div>

      {/* Chart — mx-auto để căn ngang, kích thước cố định */}
      <div ref={chartRef} className="relative w-full mx-auto h-[320px] flex items-center justify-center overflow-visible px-6 pb-6">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-20 rounded-2xl">
            <div className="w-8 h-8 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Center label now handled natively by ApexCharts donut labels */}

        <Chart
          options={chartOptions}
          series={series}
          type="donut"
          width="100%"
          height="340"
        />
        <style jsx global>{`
          #stock-distribution-donut .apexcharts-canvas,
          #stock-distribution-donut .apexcharts-svg {
            overflow: visible !important;
          }
          .apexcharts-svg > title {
            display: none !important;
          }
        `}</style>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 mt-4">
        {labels.map((label, index) => (
          <div
            key={label}
            onMouseEnter={() => handleLegendHover(index)}
            onMouseLeave={handleLegendLeave}
            className={`flex items-center gap-2 transition-all duration-300 cursor-pointer ${hoveredInfo?.label === label ? 'scale-110 opacity-100' : 'opacity-70 scale-100'
              }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: ['#E4002B', '#2563eb', '#1e293b', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#0ea5e9'][index % 8] }}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}