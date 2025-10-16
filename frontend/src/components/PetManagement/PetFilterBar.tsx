import React from "react";
import { Search, Funnel, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "../../components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";

interface PetFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  ageFilter: string;
  onAgeFilterChange: (value: string) => void;
  genderFilter: string;
  onGenderFilterChange: (value: string) => void;
  sizeFilter: string;
  onSizeFilterChange: (value: string) => void;
  healthFilter: string;
  onHealthFilterChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const PetFilterBar: React.FC<PetFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  ageFilter,
  onAgeFilterChange,
  genderFilter,
  onGenderFilterChange,
  sizeFilter,
  onSizeFilterChange,
  healthFilter,
  onHealthFilterChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onClearFilters,
  activeFiltersCount,
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Basic Filters */}
      <div className="flex flex-col md:flex-row md:flex-wrap gap-4 md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by name or breed..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
            className="w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2 md:ml-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="adopted">Adopted</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="in_treatment">In Treatment</SelectItem>
              <SelectItem value="fostered">Fostered</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) => onTypeFilterChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dog">Dog</SelectItem>
              <SelectItem value="cat">Cat</SelectItem>
              <SelectItem value="bird">Bird</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={onToggleAdvancedFilters}
            leftIcon={Funnel}
            className="whitespace-nowrap"
          >
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              onClick={onClearFilters}
              leftIcon={X}
              size="sm"
              title="Clear all filters"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                value={ageFilter}
                onValueChange={(value) => onAgeFilterChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  <SelectItem value="baby">Baby</SelectItem>
                  <SelectItem value="young">Young</SelectItem>
                  <SelectItem value="adult">Adult</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={genderFilter}
                onValueChange={(value) => onGenderFilterChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sizeFilter}
                onValueChange={(value) => onSizeFilterChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={healthFilter}
                onValueChange={(value) => onHealthFilterChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select health status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Health Statuses</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="injured">Injured</SelectItem>
                  <SelectItem value="special_needs">Special Needs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PetFilterBar;
