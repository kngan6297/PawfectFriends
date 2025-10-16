import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/DropdownMenu";

interface ExportDropdownProps {
  disabled?: boolean;
  onClick: (format: "csv" | "json", type: string) => void;
  type: string;
  className?: string;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  disabled = false,
  onClick,
  type,
  className = "",
}) => {
  const formatTypeName = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={className}
          aria-label={`Export ${formatTypeName(type)}`}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{formatTypeName(type)}</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onClick("csv", type)}
          disabled={disabled}
        >
          <div className="flex items-center">
            <span className="mr-2">📄</span>
            CSV Format
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onClick("json", type)}
          disabled={disabled}
        >
          <div className="flex items-center">
            <span className="mr-2">📋</span>
            JSON Format
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
