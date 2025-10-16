# Chart Theming System

## Overview

The chart theming system provides dynamic color support for both light and dark modes using CSS variables. This ensures charts automatically adapt to the current theme without hardcoded colors.

## Features

- **CSS Variable Integration**: Charts use CSS variables that automatically switch between light/dark themes
- **Accessibility Support**: Proper ARIA labels and screen reader support
- **Internationalization**: Number formatting using `Intl.NumberFormat` with Vietnamese locale
- **Responsive Design**: Charts adapt to container size and theme changes

## Usage

### 1. Import Chart Utilities

```typescript
import {
  getStatusColor,
  getStarColor,
  getChartAriaLabel,
  chartFormatters,
} from "@/utils/chart";
```

### 2. Basic Chart Implementation

```tsx
<ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={chartData}
    role="img"
    aria-label={getChartAriaLabel("bar", "Chart Title")}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="category" />
    <YAxis allowDecimals={false} tickFormatter={chartFormatters.axisTick} />
    <Tooltip
      formatter={(value) => chartFormatters.tooltipValue(value as number)}
      labelFormatter={(label) =>
        chartFormatters.tooltipLabel(label as string, "Category")
      }
    />
    <Bar dataKey="value" name="Count">
      {chartData.map((item, index) => (
        <Cell
          key={`cell-${item.key}-${index}`}
          fill={getStatusColor(item.status)}
        />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### 3. Pie Chart Implementation

```tsx
<PieChart
  role="img"
  aria-label={getChartAriaLabel("pie", "Distribution Chart")}
>
  <Pie data={pieData} dataKey="count" nameKey="label" outerRadius={100} label>
    {pieData.map((item, index) => (
      <Cell
        key={`cell-${item.key}-${index}`}
        fill={getStarColor(item.rating)}
      />
    ))}
  </Pie>
  <Tooltip
    formatter={(value) => chartFormatters.tooltipValue(value as number)}
    labelFormatter={(label) =>
      chartFormatters.tooltipLabel(label as string, "Rating")
    }
  />
  <Legend />
</PieChart>
```

## Color Functions

### `getStatusColor(status: string)`

Returns appropriate color for adoption/status-based data:

- `"approved"` / `"completed"` → Success (green)
- `"rejected"` → Danger (red)
- `"pending"` → Warning (yellow)
- Default → Mute (gray)

### `getStarColor(rating: number)`

Returns color for star rating data:

- 1-2 stars → Danger (red)
- 3 stars → Warning (yellow)
- 4-5 stars → Success (green)

## CSS Variables

The system uses these CSS variables that automatically switch between themes:

```css
:root {
  --chart-primary: #3b82f6; /* Blue */
  --chart-success: #10b981; /* Green */
  --chart-warning: #f59e0b; /* Yellow */
  --chart-danger: #ef4444; /* Red */
  --chart-mute: #6b7280; /* Gray */
  --chart-info: #06b6d4; /* Cyan */
  --chart-purple: #8b5cf6; /* Purple */
  --chart-pink: #ec4899; /* Pink */
}

/* Dark theme overrides */
.dark {
  --chart-primary: #60a5fa;
  --chart-success: #34d399;
  --chart-warning: #fbbf24;
  --chart-danger: #f87171;
  --chart-mute: #9ca3af;
  --chart-info: #22d3ee;
  --chart-purple: #a78bfa;
  --chart-pink: #f472b6;
}
```

## Formatters

### `chartFormatters.tooltipValue(value: number)`

Formats tooltip values using Vietnamese number formatting (e.g., "1,234")

### `chartFormatters.tooltipLabel(label: string, prefix?: string)`

Formats tooltip labels with optional prefix (e.g., "Status: Approved")

### `chartFormatters.axisTick(value: number)`

Formats axis tick values using Vietnamese number formatting

## Accessibility Features

- **ARIA Labels**: Charts include `role="img"` and descriptive `aria-label`
- **Screen Reader Support**: Proper semantic markup for assistive technologies
- **Keyboard Navigation**: Charts support keyboard interaction
- **High Contrast**: Colors meet accessibility contrast requirements

## Theme Integration

The chart system automatically detects and responds to:

1. **System Theme**: Uses `prefers-color-scheme: dark` media query
2. **Manual Theme**: Responds to `.dark` class on document root
3. **Dynamic Changes**: Colors update immediately when theme changes

## Customization

To add custom chart colors:

1. Add CSS variables to your theme:

```css
:root {
  --chart-custom: #your-color;
}
```

2. Use in chart utilities:

```typescript
const customColor = cssVar("--chart-custom", "#fallback-color");
```

## Benefits

- **Consistent Theming**: All charts automatically match your app's theme
- **Better UX**: Smooth transitions between light/dark modes
- **Accessibility**: Proper support for screen readers and keyboard navigation
- **Internationalization**: Proper number formatting for Vietnamese locale
- **Maintainable**: Centralized color management through CSS variables
- **Performance**: No runtime theme detection overhead
