import React from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { TrendingUp, HelpCircle, Lock, Unlock } from "lucide-react";
import { MLRuleRatioSlider } from "./MLRuleRatioSlider";

interface AIOptions {
  useLearning: boolean;
  useML: boolean;
  mlWeight: number;
  ruleWeight: number;
  autoBalance: boolean;
}

interface AIOptionsPanelProps {
  aiOptions: AIOptions;
  onAIOptionsChange: (options: AIOptions) => void;
  showAdvancedOptions: boolean;
  onToggleAdvancedOptions: () => void;
}

export const AIOptionsPanel: React.FC<AIOptionsPanelProps> = ({
  aiOptions,
  onAIOptionsChange,
  showAdvancedOptions,
  onToggleAdvancedOptions,
}) => {
  const handleOptionChange = (updates: Partial<AIOptions>) => {
    onAIOptionsChange({ ...aiOptions, ...updates });
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-medium">Advanced AI Options</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleAdvancedOptions}
        >
          {showAdvancedOptions ? "Hide" : "Show"} Advanced
        </Button>
      </div>

      {showAdvancedOptions && (
        <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
          {/* AI Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Use Machine Learning
                </label>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Uses historical data to predict pet compatibility
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <Checkbox
                id="use-ml"
                name="useML"
                value="ml"
                checked={aiOptions.useML}
                onChange={(checked) => handleOptionChange({ useML: checked })}
                label="Enable ML-based scoring"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-gray-700">
                  Use Learning
                </label>
                <div className="group relative">
                  <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    Improves recommendations based on your feedback
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <Checkbox
                id="use-learning"
                name="useLearning"
                value="learning"
                checked={aiOptions.useLearning}
                onChange={(checked) =>
                  handleOptionChange({
                    useLearning: checked,
                  })
                }
                label="Learn from your interactions"
              />
            </div>
          </div>

          {/* ML/Rule Ratio Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                AI Approach Balance
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleOptionChange({
                      autoBalance: !aiOptions.autoBalance,
                    })
                  }
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  {aiOptions.autoBalance ? (
                    <>
                      <Lock className="w-3 h-3" />
                      Auto Balance
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" />
                      Manual Control
                    </>
                  )}
                </button>
              </div>
            </div>

            <MLRuleRatioSlider
              mlWeight={aiOptions.mlWeight}
              ruleWeight={aiOptions.ruleWeight}
              onChange={(mlWeight, ruleWeight) => {
                handleOptionChange({
                  mlWeight,
                  ruleWeight,
                });
              }}
              disabled={!aiOptions.useML}
            />

            {/* Auto Balance Info */}
            {aiOptions.autoBalance && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm">
                  <Lock className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 font-medium">Auto Balance Enabled</span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  ML and Rule weights are automatically balanced to total 100%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
