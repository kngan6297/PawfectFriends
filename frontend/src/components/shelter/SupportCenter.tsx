import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Video,
  BookOpen,
  Users,
  Settings,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from "../../components/ui/Select";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category:
    | "general"
    | "pets"
    | "adoptions"
    | "technical"
    | "billing"
    | "staff";
  tags: string[];
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  category: string;
  createdAt: string;
  updatedAt: string;
}

const SupportCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    description: "",
    priority: "medium" as const,
    category: "general",
  });

  // Mock FAQ data - in real app, this would come from API
  const faqData: FAQItem[] = [
    {
      id: "1",
      question: "How do I add a new pet to my shelter?",
      answer:
        "To add a new pet, go to the Pet Management section and click 'Add New Pet'. Fill in all required information including photos, description, and medical details. Make sure to set the pet status as 'adoptable' to make it visible to potential adopters.",
      category: "pets",
      tags: ["pet", "add", "management"],
    },
    {
      id: "2",
      question: "How do I manage adoption requests?",
      answer:
        "Adoption requests can be managed from the Adoption Requests section. You can view all requests, approve or reject them, schedule meetings, and track the adoption process. Each request includes the adopter's profile and application details.",
      category: "adoptions",
      tags: ["adoption", "requests", "approval"],
    },
    {
      id: "3",
      question: "Can I add multiple staff members to my shelter?",
      answer:
        "Yes! You can add multiple staff members with different roles (manager, staff, volunteer) from the Staff Management section. Each staff member can have different permissions and access levels.",
      category: "staff",
      tags: ["staff", "management", "roles"],
    },
    {
      id: "4",
      question: "How do I update my shelter profile?",
      answer:
        "You can update your shelter profile from the Settings section. This includes basic information, location, operating hours, adoption process, and social media links. Don't forget to upload a profile picture and banner image.",
      category: "general",
      tags: ["profile", "settings", "update"],
    },
    {
      id: "5",
      question: "How do I communicate with potential adopters?",
      answer:
        "You can communicate with potential adopters through the built-in chat system. Go to the Chat section to view all conversations and respond to messages. You can also schedule meetings and send reminders.",
      category: "adoptions",
      tags: ["chat", "communication", "adopters"],
    },
    {
      id: "6",
      question: "How do I view analytics and reports?",
      answer:
        "Analytics and reports are available in the Reports section. You can view adoption statistics, pet performance, user engagement, and generate detailed reports for different time periods.",
      category: "general",
      tags: ["analytics", "reports", "statistics"],
    },
    {
      id: "7",
      question: "What should I do if I encounter technical issues?",
      answer:
        "If you encounter technical issues, first check our FAQ section. If the issue persists, contact our support team through the contact form or email us directly. Include screenshots and detailed descriptions of the problem.",
      category: "technical",
      tags: ["technical", "issues", "support"],
    },
    {
      id: "8",
      question: "How do I manage pet photos and media?",
      answer:
        "You can upload multiple photos for each pet from the Pet Management section. The first photo will be the primary image. You can also add videos and documents. Supported formats include JPG, PNG, MP4, and PDF.",
      category: "pets",
      tags: ["photos", "media", "upload"],
    },
  ];

  const filteredFAQ = faqData.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/api/support/tickets", contactForm);
      toast.success("Support ticket submitted successfully!");
      setContactForm({
        subject: "",
        description: "",
        priority: "medium",
        category: "general",
      });
      setShowContactForm(false);
    } catch (error) {
      console.error("Error submitting support ticket:", error);
      toast.error("Failed to submit support ticket");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pets":
        return <Zap className="h-4 w-4 text-blue-600" />;
      case "adoptions":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "staff":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "technical":
        return <Settings className="h-4 w-4 text-orange-600" />;
      case "billing":
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "pets":
        return "default";
      case "adoptions":
        return "success";
      case "staff":
        return "secondary";
      case "technical":
        return "warning";
      case "billing":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Support Center
        </h2>
        <p className="text-gray-600">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">FAQ</h3>
            <p className="text-sm text-gray-600">
              Find answers to common questions
            </p>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setShowContactForm(true)}
        >
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600">
              Get help from our support team
            </p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Documentation</h3>
            <p className="text-sm text-gray-600">
              Read detailed guides and tutorials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search FAQ..."
                className="pl-10"
              />
            </div>
            <div>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
        {filteredFAQ.map((faq) => (
          <Card key={faq.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <button
                onClick={() => handleFAQToggle(faq.id)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-start">
                  {getCategoryIcon(faq.category)}
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">
                      {faq.question}
                    </h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <Badge
                        variant={getCategoryBadgeVariant(faq.category) as any}
                      >
                        {faq.category}
                      </Badge>
                      {faq.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {expandedFAQ === faq.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-6">
                  <div className="border-t pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Contact Information</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium">Email Support</h4>
                <p className="text-sm text-gray-600">
                  support@pawfectfriends.com
                </p>
                <p className="text-xs text-gray-500">
                  Response within 24 hours
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Phone className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium">Phone Support</h4>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                <p className="text-xs text-gray-500">Mon-Fri 9AM-6PM EST</p>
              </div>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium">Live Chat</h4>
                <p className="text-sm text-gray-600">Available 24/7</p>
                <p className="text-xs text-gray-500">Instant response</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Additional Resources</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <FileText className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h4 className="font-medium">User Guide</h4>
                <p className="text-sm text-gray-600">
                  Complete platform documentation
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
            <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Video className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h4 className="font-medium">Video Tutorials</h4>
                <p className="text-sm text-gray-600">
                  Step-by-step video guides
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
            <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Users className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <h4 className="font-medium">Community Forum</h4>
                <p className="text-sm text-gray-600">
                  Connect with other shelters
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
            <div className="flex items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Settings className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <h4 className="font-medium">API Documentation</h4>
                <p className="text-sm text-gray-600">
                  For developers and integrations
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={contactForm.category}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  aria-label="Select ticket category"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={contactForm.priority}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      priority: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Select ticket priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={contactForm.description}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Please provide detailed information about your issue..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit Ticket</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportCenter;
