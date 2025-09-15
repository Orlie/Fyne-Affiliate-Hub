import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SimpleBarChartProps {
    data: { label: string; value: number }[];
    label: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, label }) => {
    const { theme } = useTheme();
    const [tooltip, setTooltip] = useState<{ x: number, y: number, label: string, value: number } | null>(null);

    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No data available</div>;
    }
    
    const chartHeight = 288;
    const chartWidth = 500; // Assuming a fixed aspect ratio container
    const padding = { top: 20, right: 20, bottom: 40, left: 30 };
    const contentWidth = chartWidth - padding.left - padding.right;
    const contentHeight = chartHeight - padding.top - padding.bottom;

    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    const barWidth = contentWidth / data.length;
    
    const textColor = theme === 'dark' ? '#9ca3af' : '#4b5563';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

    const yAxisTicks = 5;
    const yAxisValues = Array.from({ length: yAxisTicks + 1 }, (_, i) => 
        Math.ceil((maxValue / yAxisTicks) * i)
    );

    return (
        <div className="w-full h-full relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
                {/* Y-axis grid lines and labels */}
                {yAxisValues.map(tickValue => {
                    const y = padding.top + contentHeight - (tickValue / maxValue) * contentHeight;
                    return (
                        <g key={tickValue}>
                            <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={gridColor} strokeWidth="1" />
                            <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill={textColor}>{tickValue}</text>
                        </g>
                    );
                })}
                
                {/* Bars and X-axis labels */}
                {data.map((d, i) => {
                    const barHeight = (d.value / maxValue) * contentHeight;
                    const x = padding.left + i * barWidth;
                    const y = padding.top + contentHeight - barHeight;

                    return (
                        <g key={d.label}>
                            <rect
                                x={x + barWidth * 0.1}
                                y={y}
                                width={barWidth * 0.8}
                                height={barHeight}
                                className="fill-current text-primary-500 hover:text-primary-400 transition-colors"
                                onMouseMove={(e) => {
                                    const svgRect = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
                                    setTooltip({ 
                                        x: (e.clientX - svgRect.left) * (chartWidth / svgRect.width),
                                        y: y - 5,
                                        label: d.label, 
                                        value: d.value 
                                    });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            />
                            {data.length <= 31 && (
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight - padding.bottom + 15}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill={textColor}
                                >
                                    {d.label}
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* X and Y Axis lines */}
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartHeight - padding.bottom} stroke={textColor} strokeWidth="1" />
                <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke={textColor} strokeWidth="1" />

                 {/* Tooltip */}
                {tooltip && (
                    <g transform={`translate(${tooltip.x}, ${tooltip.y})`}>
                        <rect x="-40" y="-25" width="80" height="22" rx="4" fill="rgba(0,0,0,0.7)" />
                        <text x="0" y="-10" textAnchor="middle" fontSize="10" fill="white">
                           {tooltip.label}: {tooltip.value}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

export default SimpleBarChart;
