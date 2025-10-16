// Chart theming utilities with CSS variables support
import { formatInt } from "./format";

export const cssVar = (name: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name) || fallback;
};

// Chart color palette using CSS variables
export const CHART_COLORS = {
    primary: cssVar("--chart-primary", "#3b82f6"),
    success: cssVar("--chart-success", "#10b981"),
    warning: cssVar("--chart-warning", "#f59e0b"),
    danger: cssVar("--chart-danger", "#ef4444"),
    mute: cssVar("--chart-mute", "#6b7280"),
    info: cssVar("--chart-info", "#06b6d4"),
    purple: cssVar("--chart-purple", "#8b5cf6"),
    pink: cssVar("--chart-pink", "#ec4899"),
};

// Status-based color mapping
export const getStatusColor = (status: string) => {
    switch (status) {
        case "approved":
        case "completed":
            return CHART_COLORS.success;
        case "rejected":
            return CHART_COLORS.danger;
        case "pending":
            return CHART_COLORS.warning;
        default:
            return CHART_COLORS.mute;
    }
};

// Star rating color mapping
export const getStarColor = (rating: number) => {
    const colors = [
        CHART_COLORS.danger,    // 1 star
        CHART_COLORS.warning,    // 2 stars  
        CHART_COLORS.warning,    // 3 stars
        CHART_COLORS.success,    // 4 stars
        CHART_COLORS.success,    // 5 stars
    ];
    return colors[Math.max(0, Math.min(rating - 1, colors.length - 1))] || CHART_COLORS.mute;
};

// Chart accessibility helpers
export const getChartAriaLabel = (chartType: string, dataType: string) => {
    return `${dataType} ${chartType} chart`;
};

// Chart formatters
export const chartFormatters = {
    // Format tooltip values
    tooltipValue: (value: number) => formatInt(value),

    // Format tooltip labels
    tooltipLabel: (label: string, prefix = "") => {
        return prefix ? `${prefix}: ${label}` : label;
    },

    // Format axis ticks
    axisTick: (value: number) => formatInt(value),
};
