import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface LineChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

interface ChartProps {
  data: ChartDataPoint[] | LineChartDataPoint[];
  title?: string;
  width?: number;
  height?: number;
  className?: string;
}

interface BarChartProps extends ChartProps {
  orientation?: "horizontal" | "vertical";
  showValues?: boolean;
}

interface LineChartProps extends ChartProps {
  showPoints?: boolean;
  showGrid?: boolean;
  color?: string;
}

interface PieChartProps extends ChartProps {
  showPercentage?: boolean;
  showLegend?: boolean;
}

interface AreaChartProps extends ChartProps {
  fillOpacity?: number;
  color?: string;
}

/**
 * Simple Bar Chart Component
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  width = 400,
  height = 300,
  orientation = "vertical",
  showValues = true,
  className = "",
}) => {
  const chartData = data as ChartDataPoint[];
  const maxValue = Math.max(...chartData.map((d) => d.value));
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
  ];

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full">
          <svg width={width} height={height} className="w-full h-auto">
            {orientation === "vertical" ? (
              <>
                {/* Vertical bars */}
                {chartData.map((item, index) => {
                  const barHeight = (item.value / maxValue) * (height - 60);
                  const barWidth = (width - 80) / chartData.length;
                  const x = 40 + index * barWidth + barWidth * 0.1;
                  const y = height - 40 - barHeight;
                  const color = item.color || colors[index % colors.length];

                  return (
                    <g key={index}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth * 0.8}
                        height={barHeight}
                        fill={color}
                        className="hover:opacity-80 transition-opacity"
                      />
                      {showValues && (
                        <text
                          x={x + barWidth * 0.4}
                          y={y - 5}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {item.value}
                        </text>
                      )}
                      <text
                        x={x + barWidth * 0.4}
                        y={height - 20}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </>
            ) : (
              <>
                {/* Horizontal bars */}
                {chartData.map((item, index) => {
                  const barWidth = (item.value / maxValue) * (width - 100);
                  const barHeight = (height - 80) / chartData.length;
                  const x = 80;
                  const y = 40 + index * barHeight + barHeight * 0.1;
                  const color = item.color || colors[index % colors.length];

                  return (
                    <g key={index}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight * 0.8}
                        fill={color}
                        className="hover:opacity-80 transition-opacity"
                      />
                      {showValues && (
                        <text
                          x={x + barWidth + 5}
                          y={y + barHeight * 0.4}
                          dominantBaseline="middle"
                          className="text-xs fill-gray-600"
                        >
                          {item.value}
                        </text>
                      )}
                      <text
                        x={x - 5}
                        y={y + barHeight * 0.4}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="text-xs fill-gray-600"
                      >
                        {item.label}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Simple Line Chart Component
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  width = 400,
  height = 300,
  showPoints = true,
  showGrid = true,
  color = "#3B82F6",
  className = "",
}) => {
  const chartData = data as LineChartDataPoint[];
  const maxValue = Math.max(...chartData.map((d) => d.y));
  const minValue = Math.min(...chartData.map((d) => d.y));
  const valueRange = maxValue - minValue || 1;

  // Calculate points
  const points = chartData.map((item, index) => {
    const x = 40 + (index / (chartData.length - 1)) * (width - 80);
    const y = height - 40 - ((item.y - minValue) / valueRange) * (height - 80);
    return { x, y, ...item };
  });

  // Create path string
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full">
          <svg width={width} height={height} className="w-full h-auto">
            {/* Grid lines */}
            {showGrid && (
              <>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                  const y = height - 40 - ratio * (height - 80);
                  return (
                    <line
                      key={index}
                      x1={40}
                      y1={y}
                      x2={width - 40}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth={1}
                    />
                  );
                })}
              </>
            )}

            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={2}
              className="drop-shadow-sm"
            />

            {/* Points */}
            {showPoints &&
              points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={color}
                  className="hover:r-6 transition-all"
                />
              ))}

            {/* Labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={height - 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {point.label || point.x}
              </text>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Simple Pie Chart Component
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  width = 300,
  height = 300,
  showPercentage = true,
  showLegend = true,
  className = "",
}) => {
  const chartData = data as ChartDataPoint[];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
  ];

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  let currentAngle = 0;

  const segments = chartData.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle += angle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    return {
      pathData,
      color: item.color || colors[index % colors.length],
      percentage,
      label: item.label,
      value: item.value,
    };
  });

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex items-center justify-center">
          <svg width={width} height={height} className="w-full h-auto">
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.pathData}
                  fill={segment.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
                {showPercentage && (
                  <text
                    x={centerX}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-medium fill-white"
                  >
                    {segment.percentage > 0.1
                      ? `${(segment.percentage * 100).toFixed(1)}%`
                      : ""}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>

        {showLegend && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" data-color={segment.color} />
                <span className="text-sm text-gray-600">
                  {segment.label}: {segment.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Simple Area Chart Component
 */
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  width = 400,
  height = 300,
  fillOpacity = 0.3,
  color = "#3B82F6",
  className = "",
}) => {
  const chartData = data as LineChartDataPoint[];
  const maxValue = Math.max(...chartData.map((d) => d.y));
  const minValue = Math.min(...chartData.map((d) => d.y));
  const valueRange = maxValue - minValue || 1;

  // Calculate points
  const points = chartData.map((item, index) => {
    const x = 40 + (index / (chartData.length - 1)) * (width - 80);
    const y = height - 40 - ((item.y - minValue) / valueRange) * (height - 80);
    return { x, y, ...item };
  });

  // Create area path
  const areaPath = [
    `M ${points[0].x} ${height - 40}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${height - 40}`,
    "Z",
  ].join(" ");

  // Create line path
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full">
          <svg width={width} height={height} className="w-full h-auto">
            {/* Area */}
            <path d={areaPath} fill={color} fillOpacity={fillOpacity} />

            {/* Line */}
            <path d={linePath} fill="none" stroke={color} strokeWidth={2} />

            {/* Points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={color}
                className="hover:r-5 transition-all"
              />
            ))}

            {/* Labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={point.x}
                y={height - 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
              >
                {point.label || point.x}
              </text>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Chart Container Component for responsive layouts
 */
export const ChartContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return <div className={`w-full ${className}`}>{children}</div>;
};

/**
 * Chart Grid Component for multiple charts
 */
export const ChartGrid: React.FC<{
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}> = ({ children, className = "", columns = 2 }) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {children}
    </div>
  );
};
