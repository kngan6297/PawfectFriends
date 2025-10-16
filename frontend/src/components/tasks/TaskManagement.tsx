import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { format, isToday, isTomorrow, isAfter, addDays } from "date-fns";
import { formatDisplayDate } from "@/utils/dateUtils";

interface Task {
  _id: string;
  title: string;
  description?: string;
  category:
    | "adoption"
    | "meeting"
    | "follow_up"
    | "maintenance"
    | "review"
    | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate: string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  tags?: string[];
  relatedData?: {
    requestId?: string;
    petId?: string;
    meetingId?: string;
    userId?: string;
  };
}

interface TaskManagementProps {
  onTaskComplete?: (task: Task) => void;
  onTaskUpdate?: (task: Task) => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({
  onTaskComplete,
  onTaskUpdate,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    dueDate: "all",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    category: "general" as const,
    priority: "medium" as const,
    dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    tags: [] as string[],
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters, searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      // const response = await api.get('/api/tasks');

      // Mock data for demonstration
      const mockTasks: Task[] = [
        {
          _id: "1",
          title: "Review adoption request for Max",
          description:
            "John Doe submitted adoption request for Golden Retriever",
          category: "adoption",
          priority: "high",
          status: "pending",
          dueDate: new Date().toISOString(),
          createdBy: "shelter1",
          createdAt: new Date().toISOString(),
          relatedData: { requestId: "req1", petId: "pet1" },
          tags: ["adoption", "urgent"],
        },
        {
          _id: "2",
          title: "Schedule home visit for Sarah",
          description: "Follow up on approved adoption request",
          category: "meeting",
          priority: "medium",
          status: "in_progress",
          dueDate: addDays(new Date(), 1).toISOString(),
          createdBy: "shelter1",
          createdAt: new Date().toISOString(),
          relatedData: { requestId: "req2", userId: "user2" },
          tags: ["home-visit"],
        },
        {
          _id: "3",
          title: "Update pet medical records",
          description: "Annual vaccinations due for 5 pets",
          category: "maintenance",
          priority: "medium",
          status: "pending",
          dueDate: addDays(new Date(), 3).toISOString(),
          createdBy: "shelter1",
          createdAt: new Date().toISOString(),
          tags: ["medical", "maintenance"],
        },
        {
          _id: "4",
          title: "Follow-up call with recent adopter",
          description: "Check on Bella's adjustment to new home",
          category: "follow_up",
          priority: "low",
          status: "pending",
          dueDate: addDays(new Date(), 7).toISOString(),
          createdBy: "shelter1",
          createdAt: new Date().toISOString(),
          relatedData: { requestId: "req3" },
          tags: ["follow-up"],
        },
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((task) => task.category === filters.category);
    }

    // Due date filter
    const now = new Date();
    switch (filters.dueDate) {
      case "today":
        filtered = filtered.filter((task) => isToday(new Date(task.dueDate)));
        break;
      case "tomorrow":
        filtered = filtered.filter((task) =>
          isTomorrow(new Date(task.dueDate))
        );
        break;
      case "overdue":
        filtered = filtered.filter(
          (task) =>
            isAfter(now, new Date(task.dueDate)) && task.status !== "completed"
        );
        break;
      case "upcoming":
        filtered = filtered.filter((task) =>
          isAfter(new Date(task.dueDate), now)
        );
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    setFilteredTasks(filtered);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      // This would be replaced with actual API call
      // const response = await api.post('/api/tasks', newTask);

      const task: Task = {
        _id: Date.now().toString(),
        ...newTask,
        status: "pending",
        createdBy: "shelter1",
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [task, ...prev]);
      setNewTask({
        title: "",
        description: "",
        category: "general",
        priority: "medium",
        dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        tags: [],
      });
      setShowAddForm(false);
      toast.success("Task created successfully");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      // This would be replaced with actual API call
      // const response = await api.patch(`/api/tasks/${taskId}`, updates);

      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, ...updates } : task
        )
      );

      if (updates.status === "completed") {
        onTaskComplete?.(tasks.find((t) => t._id === taskId)!);
      }

      setEditingTask(null);
      toast.success("Task updated successfully");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // This would be replaced with actual API call
      // await api.delete(`/api/tasks/${taskId}`);

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "secondary";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "cancelled":
        return "danger";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "adoption":
        return "🐾";
      case "meeting":
        return "📅";
      case "follow_up":
        return "📞";
      case "maintenance":
        return "🔧";
      case "review":
        return "⭐";
      default:
        return "📝";
    }
  };

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date();
    const taskDate = new Date(dueDate);

    if (isToday(taskDate)) return { status: "today", color: "text-blue-600" };
    if (isTomorrow(taskDate))
      return { status: "tomorrow", color: "text-orange-600" };
    if (isAfter(now, taskDate))
      return { status: "overdue", color: "text-red-600" };
    return { status: "upcoming", color: "text-gray-600" };
  };

  const renderAddTaskForm = () => (
    <Card className="mb-6">
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-900">Add New Task</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <Input
              type="text"
              placeholder="Enter task title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              placeholder="Enter task description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select
                value={newTask.category}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, category: value as any }))
                }
              >
                <option value="general">General</option>
                <option value="adoption">Adoption</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow-up</option>
                <option value="maintenance">Maintenance</option>
                <option value="review">Review</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={newTask.priority}
                onValueChange={(value) =>
                  setNewTask((prev) => ({ ...prev, priority: value as any }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) =>
                  setNewTask((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddTask}>
              Add Task
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTaskList = () => (
    <div className="space-y-4">
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CheckSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm mt-2">
            Try adjusting your filters or add a new task
          </p>
        </div>
      ) : (
        filteredTasks.map((task) => {
          const dueDateStatus = getDueDateStatus(task.dueDate);
          return (
            <Card key={task._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleUpdateTask(task._id, {
                            status:
                              task.status === "completed"
                                ? "pending"
                                : "completed",
                            completedAt:
                              task.status === "completed"
                                ? undefined
                                : new Date().toISOString(),
                          })
                        }
                        className="mt-1"
                      >
                        {task.status === "completed" ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>

                      <span className="text-lg">
                        {getCategoryIcon(task.category)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3
                          className={`text-sm font-medium truncate ${
                            task.status === "completed"
                              ? "line-through text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {task.title}
                        </h3>
                        <Badge
                          variant={getPriorityColor(task.priority)}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                        <Badge
                          variant={getStatusColor(task.status)}
                          className="text-xs"
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>

                      {task.description && (
                        <p
                          className={`text-sm mb-2 ${
                            task.status === "completed"
                              ? "text-gray-400"
                              : "text-gray-600"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span className={dueDateStatus.color}>
                              {formatDisplayDate(new Date(task.createdAt))}
                            </span>
                            {dueDateStatus.status === "overdue" && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                          </div>

                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              {task.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="text-xs">
                                  +{task.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Task Management
          </h2>
          <p className="text-gray-600">Manage upcoming activities and to-dos</p>
        </div>
        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => setShowAddForm(true)}
        >
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, priority: value }))
                }
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, category: value }))
                }
              >
                <option value="all">All Categories</option>
                <option value="adoption">Adoption</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow-up</option>
                <option value="maintenance">Maintenance</option>
                <option value="review">Review</option>
                <option value="general">General</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Select
                value={filters.dueDate}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, dueDate: value }))
                }
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="overdue">Overdue</option>
                <option value="upcoming">Upcoming</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Task Form */}
      {showAddForm && renderAddTaskForm()}

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        renderTaskList()
      )}
    </div>
  );
};

export default TaskManagement;
