import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface QuickFilter {
  id: string;
  label: string;
  value: string;
  description?: string;
}

interface QuickFiltersProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: "7d",
    label: "Last 7 days",
    value: "7d",
    description: "Past week",
  },
  {
    id: "30d",
    label: "Last 30 days",
    value: "30d",
    description: "Past month",
  },
  {
    id: "90d",
    label: "Last 90 days",
    value: "90d",
    description: "Past quarter",
  },
  {
    id: "1y",
    label: "Last year",
    value: "1y",
    description: "Past 12 months",
  },
  {
    id: "ytd",
    label: "Year to date",
    value: "ytd",
    description: "Since Jan 1st",
  },
  {
    id: "all",
    label: "All time",
    value: "all",
    description: "Complete history",
  },
];

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {QUICK_FILTERS.map((filter) => (
        <Button
          key={filter.id}
          variant={value === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(filter.value)}
          className="relative"
          title={filter.description}
        >
          {filter.label}
          {value === filter.value && (
            <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
              Active
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
};

export default QuickFilters;
