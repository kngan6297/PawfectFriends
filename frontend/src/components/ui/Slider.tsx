import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import clsx from "clsx";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
  className?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 1000,
  step = 50,
  label,
  disabled = false,
  className,
  showValue = true,
  formatValue = (value) => `$${value}`,
}) => {
  return (
    <div className={clsx("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <SliderPrimitive.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={value}
            onValueChange={onValueChange}
            max={max}
            min={min}
            step={step}
            disabled={disabled}
          >
            <SliderPrimitive.Track className="bg-gray-200 relative grow rounded-full h-2">
              <SliderPrimitive.Range className="absolute bg-primary-500 rounded-full h-full" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block w-5 h-5 bg-primary-600 rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
          </SliderPrimitive.Root>
        </div>

        {showValue && (
          <div className="text-sm font-medium text-gray-900 min-w-[60px] text-right">
            {formatValue(value[0])}
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};
