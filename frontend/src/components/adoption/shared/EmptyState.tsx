import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PawPrint } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No adoption requests yet",
  description = "Start your pet adoption journey by browsing available pets and submitting applications.",
  actionLabel = "Browse Available Pets",
  onAction,
  icon: Icon = PawPrint,
  className = "",
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        {onAction && <Button onClick={onAction}>{actionLabel}</Button>}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
