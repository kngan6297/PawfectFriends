import React, { useState } from "react";
import { Calendar, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { Calendar as CalendarComponent } from "@/components/ui/Calendar";
import { format } from "date-fns";

interface DateRangePickerProps {
  value?: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date } | undefined) => void;
  className?: string;
  disabled?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  className = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  const formatDateRange = (range?: { from: Date; to: Date }) => {
    if (!range) return "Select date range";

    const fromStr = format(range.from, "MMM dd, yyyy");
    const toStr = format(range.to, "MMM dd, yyyy");

    if (fromStr === toStr) {
      return fromStr;
    }

    return `${fromStr} - ${toStr}`;
  };

  const handleDateSelect = (
    selectedRange: { from: Date; to: Date } | undefined
  ) => {
    onChange(selectedRange);
    if (selectedRange) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-start text-left font-normal ${className}`}
          disabled={disabled}
          aria-label="Select date range"
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleDateSelect}
          numberOfMonths={2}
          disabled={(date) =>
            date > new Date() || date < new Date("1900-01-01")
          }
        />
        <div className="p-3 border-t">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <div className="text-xs text-gray-500">
              Select start and end dates
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
