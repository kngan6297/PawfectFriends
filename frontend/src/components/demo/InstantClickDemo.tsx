/**
 * Demo component showcasing the instant click functionality
 * This component demonstrates how the tab switching and contract viewing works
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { FileText, ExternalLink, Eye } from "lucide-react";

type TabType = "overview" | "contract" | "documents" | "timeline";

const InstantClickDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [hasContract, setHasContract] = useState(true);
  const [contractUrl, setContractUrl] = useState<string | null>(
    "https://example.com/contract.pdf"
  );

  const handleOpenContract = () => {
    if (contractUrl) {
      // Simulate opening contract file
      window.open(contractUrl, "_blank");
    } else {
      // Simulate tab switching fallback
      setActiveTab("contract");
      alert("No contract file available - switching to Contract tab");
    }
  };

  const handleViewInTab = () => {
    setActiveTab("contract");
    alert("Switching to Contract tab to view terms inline");
  };

  const toggleContractAvailability = () => {
    setHasContract(!hasContract);
    setContractUrl(hasContract ? null : "https://example.com/contract.pdf");
  };

  const tabs = [
    { id: "overview", label: "Overview", content: "Overview content here" },
    {
      id: "contract",
      label: "Contract",
      content: "Contract terms and details here",
    },
    {
      id: "documents",
      label: "Documents",
      content: "Document management here",
    },
    { id: "timeline", label: "Timeline", content: "Timeline events here" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Instant Click Demo
        </h1>
        <p className="text-gray-600">
          Demonstrating auto tab switching and contract viewing functionality
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={toggleContractAvailability}
                variant={hasContract ? "success" : "outline"}
              >
                {hasContract ? "Contract Available" : "No Contract"}
              </Button>
              <span className="text-sm text-gray-600">
                Toggle contract availability to test different scenarios
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Contract Action Buttons */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold mb-4">Contract Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">When Contract File Available:</h3>
              <Button
                onClick={handleOpenContract}
                leftIcon={ExternalLink}
                variant="outline"
                className="w-full"
              >
                View Contract
              </Button>
              <p className="text-xs text-gray-500">
                Opens contract file directly in new tab
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">When No Contract File:</h3>
              <Button
                onClick={handleViewInTab}
                leftIcon={Eye}
                variant="outline"
                className="w-full"
              >
                View in Contract Tab
              </Button>
              <p className="text-xs text-gray-500">
                Switches to Contract tab to view terms inline
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold mb-4">Tab Navigation</h2>
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">
              {tabs.find((tab) => tab.id === activeTab)?.label} Content
            </h3>
            <p className="text-gray-600">
              {tabs.find((tab) => tab.id === activeTab)?.content}
            </p>

            {activeTab === "contract" && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-medium mb-2">Contract Terms</h4>
                <p className="text-sm text-gray-600">
                  This is where contract terms would be displayed inline when no
                  file is available.
                </p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Status Display */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Active Tab:</span>
              <span className="ml-2 text-blue-600">{activeTab}</span>
            </div>
            <div>
              <span className="font-medium">Contract Available:</span>
              <span
                className={`ml-2 ${
                  hasContract ? "text-green-600" : "text-red-600"
                }`}
              >
                {hasContract ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="font-medium">Contract URL:</span>
              <span className="ml-2 text-gray-600">
                {contractUrl ? "Available" : "Not available"}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardBody>
          <h2 className="text-xl font-semibold mb-4">How to Test</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>
              <strong>Contract Available:</strong> Click "View Contract" to open
              the file directly
            </li>
            <li>
              <strong>No Contract:</strong> Toggle "No Contract" and click "View
              in Contract Tab" to see tab switching
            </li>
            <li>
              <strong>Tab Navigation:</strong> Click different tabs to see
              smooth transitions
            </li>
            <li>
              <strong>Mixed Scenarios:</strong> Try different combinations to
              test all fallback behaviors
            </li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
};

export default InstantClickDemo;
