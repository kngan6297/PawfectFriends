import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Calendar, CalendarDays } from "lucide-react";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  className = "",
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCustomRange, setIsCustomRange] = useState(false);

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setIsCustomRange(false);

    onDateRangeChange(start.toISOString(), end.toISOString());
  };

  const handleCustomRangeSubmit = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day

      onDateRangeChange(start.toISOString(), end.toISOString());
    }
  };

  const quickOptions = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 90 Days", days: 90 },
    { label: "Last Year", days: 365 },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-gray-500" />
        <Label className="text-sm font-medium">Date Range</Label>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickOptions.map((option) => (
          <Button
            key={option.days}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(option.days)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
        <Button
          variant={isCustomRange ? "default" : "outline"}
          size="sm"
          onClick={() => setIsCustomRange(!isCustomRange)}
          className="text-xs"
        >
          Custom Range
        </Button>
      </div>

      {/* Custom Date Range Inputs */}
      {isCustomRange && (
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
          <div>
            <Label htmlFor="start-date" className="text-xs text-gray-600">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-xs text-gray-600">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="col-span-2">
            <Button
              onClick={handleCustomRangeSubmit}
              disabled={!startDate || !endDate}
              size="sm"
              className="w-full"
            >
              Apply Custom Range
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
