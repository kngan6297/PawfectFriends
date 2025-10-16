// Vietnamese number formatter
export const nf = new Intl.NumberFormat("vi-VN");

// Format integer with Vietnamese locale
export const formatInt = (n?: number) => nf.format(n ?? 0);

// Format currency with Vietnamese locale
export const formatCurrency = (n?: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(n ?? 0);

// Get trend color classes based on delta value
export const trendColor = (delta: number) =>
    delta > 0 ? "text-green-600 bg-green-50"
        : delta < 0 ? "text-red-600 bg-red-50"
            : "text-gray-600 bg-gray-50";

// Get trend icon based on delta value
export const trendIcon = (delta: number) =>
    delta > 0 ? "▲" : delta < 0 ? "▼" : "•";

// Format percentage with sign
export const formatPercentage = (delta: number) => {
    const sign = delta > 0 ? "+" : "";
    return `${sign}${delta.toFixed(1)}%`;
};