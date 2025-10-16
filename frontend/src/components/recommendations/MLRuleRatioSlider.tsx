import React from "react";
import { Brain, Settings } from "lucide-react";

interface MLRuleRatioSliderProps {
  mlWeight: number;
  ruleWeight: number;
  onChange: (mlWeight: number, ruleWeight: number) => void;
  disabled?: boolean;
  className?: string;
}

export const MLRuleRatioSlider: React.FC<MLRuleRatioSliderProps> = ({
  mlWeight,
  ruleWeight,
  onChange,
  disabled = false,
  className = "",
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mlRatio = parseFloat(e.target.value);
    const ruleRatio = 1 - mlRatio;
    onChange(mlRatio, ruleRatio);
  };

  const getRatioLabel = (mlWeight: number) => {
    if (mlWeight >= 0.8) return "ML-Heavy";
    if (mlWeight >= 0.6) return "ML-Focused";
    if (mlWeight >= 0.4) return "Balanced";
    if (mlWeight >= 0.2) return "Rule-Focused";
    return "Rule-Heavy";
  };

  const getRatioColor = (mlWeight: number) => {
    if (mlWeight >= 0.8) return "text-blue-600";
    if (mlWeight >= 0.6) return "text-blue-500";
    if (mlWeight >= 0.4) return "text-gray-600";
    if (mlWeight >= 0.2) return "text-green-500";
    return "text-green-600";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-600" />
          <label className="block text-sm font-medium text-gray-700">
            ML:Rule Ratio
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getRatioColor(mlWeight)}`}>
            {getRatioLabel(mlWeight)}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {mlWeight.toFixed(1)} : {ruleWeight.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={mlWeight}
          onChange={handleSliderChange}
          disabled={disabled}
          className={`w-full h-3 bg-gradient-to-r from-green-500 via-gray-400 to-blue-500 rounded-lg appearance-none cursor-pointer ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{
            background: `linear-gradient(to right, #10b981 0%, #6b7280 50%, #3b82f6 100%)`,
          }}
          aria-label="ML to Rule ratio slider"
        />

        {/* Custom slider thumb styling */}
        <style jsx>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #3b82f6;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          input[type="range"]::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #3b82f6;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Settings className="w-3 h-3 text-green-600" />
          <span>Rule-Based</span>
        </div>
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-blue-600" />
          <span>ML-Based</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="p-2 bg-green-50 rounded border border-green-200">
          <div className="font-medium text-green-700">Rule-Based</div>
          <div className="text-green-600">{(ruleWeight * 100).toFixed(0)}%</div>
          <div className="text-gray-500">Traditional matching rules</div>
        </div>
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <div className="font-medium text-blue-700">ML-Based</div>
          <div className="text-blue-600">{(mlWeight * 100).toFixed(0)}%</div>
          <div className="text-gray-500">AI learning & patterns</div>
        </div>
      </div>
    </div>
  );
};
