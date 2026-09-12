"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  Filter,
  Users,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  UserPlus,
  RotateCcw,
  Calendar,
  Moon,
  Sun,
  Kanban,
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  Eye,
  AlertTriangle,
  Check,
  Info,
  Volume2,
  VolumeX,
  Radio
} from "lucide-react";

// Types definition
type Priority = "Low" | "Medium" | "High";
type Status = "To Do" | "In Progress" | "Review" | "Done";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  assigneeId: string;
  status: Status;
  createdAt: string;
}

interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "info" | "error";
}

const DEFAULT_MEMBERS: TeamMember[] = [
  { id: "m-1", name: "Alex Vance", role: "Lead Engineer", initials: "AV" },
  { id: "m-2", name: "Sarah Chen", role: "Product Designer", initials: "SC" },
  { id: "m-3", name: "Marcus Brody", role: "Ops Specialist", initials: "MB" },
  { id: "m-4", name: "Elena Rostova", role: "Frontend Architect", initials: "ER" }
];

// Helper to get today's date in YYYY-MM-DD format safely
const getTodayStr = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DEFAULT_TASKS: Task[] = [
  {
    id: "task-101",
    title: "Audit Neumorphic Shadow Tokens",
    description: "Verify contrast ratios for dark & light tactile element states across display monitors.",
    dueDate: getTodayStr(),
    priority: "High",
    assigneeId: "m-4",
    status: "In Progress",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-102",
    title: "Client-Side Persistence Module",
    description: "Sync browser localStorage for instant lag-free task state updates without backend overhead.",
    dueDate: "2026-09-10",
    priority: "High",
    assigneeId: "m-1",
    status: "Done",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-103",
    title: "Team Roster & Modal Interface",
    description: "Build tactile modal to add, view, and assign company team members dynamically.",
    dueDate: "2026-09-08",
    priority: "Medium",
    assigneeId: "m-2",
    status: "To Do",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-104",
    title: "60fps Drag & Drop Kanban Engine",
    description: "Implement zero-lag drag and drop column transitions with instant state updates.",
    dueDate: "2026-09-25",
    priority: "High",
    assigneeId: "m-1",
    status: "In Progress",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-105",
    title: "Global Multi-Filter & Search Bar",
    description: "Filter tasks by title substring, priority level, or assigned team member.",
    dueDate: "2026-09-30",
    priority: "Low",
    assigneeId: "m-3",
    status: "Review",
    createdAt: new Date().toISOString()
  }
];

const STATUSES: Status[] = ["To Do", "In Progress", "Review", "Done"];

export default function TaskDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Admin Authentication State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("dueDateAsc");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("Medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskStatus, setTaskStatus] = useState<Status>("To Do");

  // Team Form State
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null);

  // Ref to track last remote sync timestamp to avoid infinite feedback loops
  const lastSyncHashRef = useRef<string>("");

  // Sound Synthesizer using Web Audio API
  const playAudioChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Note 2: B5 (987.77 Hz) - Pleasant tactile chime chord
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(987.77, now + 0.09);
      gain2.gain.setValueAtTime(0.22, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.42);
    } catch (e) {
      console.warn("Audio chime context restricted by browser policy", e);
    }
  }, [soundEnabled]);

  // Trigger toast message helper with optional sound
  const triggerToast = useCallback(
    (message: string, type: "success" | "info" | "error" = "info", playSound = true) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      if (playSound) {
        playAudioChime();
      }
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    },
    [playAudioChime]
  );

  // Check if any modal is open
  const isAnyModalOpen = isTaskModalOpen || isTeamModalOpen || isAdminModalOpen;

  // Prevent background scrolling when any popup/modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAnyModalOpen]);

  // Escape key handler to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsTaskModalOpen(false);
        setIsTeamModalOpen(false);
        setIsAdminModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load environment variables for admin credentials with fallback
  const expectedAdminUser = (process.env.NEXT_PUBLIC_ADMIN_USERNAME || "Pruthveek").trim().toLowerCase();
  const expectedAdminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Pruthveek@123";

  // Realtime BroadcastChannel & LocalStorage Sync Across Tabs / Windows
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("mono_task_realtime_sync");
        channel.onmessage = (event) => {
          if (event.data && event.data.type === "SYNC_TASKS") {
            const incomingTasks: Task[] = event.data.tasks;
            const hash = JSON.stringify(incomingTasks);
            if (hash !== lastSyncHashRef.current) {
              lastSyncHashRef.current = hash;
              setTasks(incomingTasks);
              triggerToast("🔔 Live Update: Tasks synchronized!", "info", true);
            }
          } else if (event.data && event.data.type === "SYNC_MEMBERS") {
            const incomingMembers: TeamMember[] = event.data.members;
            setMembers(incomingMembers);
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported in environment", e);
    }

    return () => {
      if (channel) channel.close();
    };
  }, [triggerToast]);

  // Firebase Realtime DB Endpoint for cross-device live sync
  const firebaseDbUrl = (process.env.NEXT_PUBLIC_FIREBASE_DB_URL || "").trim().replace(/\/$/, "");

  // Realtime BroadcastChannel & LocalStorage Sync Across Tabs / Windows
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("mono_task_realtime_sync");
        channel.onmessage = (event) => {
          if (event.data && event.data.type === "SYNC_TASKS") {
            const incomingTasks: Task[] = event.data.tasks;
            const hash = JSON.stringify(incomingTasks);
            if (hash !== lastSyncHashRef.current) {
              lastSyncHashRef.current = hash;
              setTasks(incomingTasks);
              triggerToast("🔔 Live Update: Tasks synchronized!", "info", true);
            }
          } else if (event.data && event.data.type === "SYNC_MEMBERS") {
            const incomingMembers: TeamMember[] = event.data.members;
            setMembers(incomingMembers);
          }
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel not supported in environment", e);
    }

    return () => {
      if (channel) channel.close();
    };
  }, [triggerToast]);

  // Firebase Realtime DB Live Sync Stream (EventSource SSE) across all devices
  useEffect(() => {
    if (!firebaseDbUrl) return;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`${firebaseDbUrl}/sync.json`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          const syncObj = parsed && parsed.data ? parsed.data : parsed;
          if (syncObj) {
            if (Array.isArray(syncObj.tasks)) {
              const hash = JSON.stringify(syncObj.tasks);
              if (hash !== lastSyncHashRef.current) {
                lastSyncHashRef.current = hash;
                setTasks(syncObj.tasks);
                triggerToast("🔔 Live Update: Remote changes synced!", "info", true);
              }
            }
            if (Array.isArray(syncObj.members)) {
              setMembers(syncObj.members);
            }
          }
        } catch (e) {
          console.warn("Firebase SSE parse error", e);
        }
      };
    } catch (e) {
      console.warn("Firebase EventSource init error", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [firebaseDbUrl, triggerToast]);

  // Broadcast state changes to BroadcastChannel & Firebase REST DB
  const broadcastSync = useCallback(
    (newTasks: Task[], newMembers?: TeamMember[]) => {
      const hash = JSON.stringify(newTasks);
      lastSyncHashRef.current = hash;

      // Local BroadcastChannel sync across browser tabs
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("mono_task_realtime_sync");
          channel.postMessage({ type: "SYNC_TASKS", tasks: newTasks });
          if (newMembers) {
            channel.postMessage({ type: "SYNC_MEMBERS", members: newMembers });
          }
          channel.close();
        }
      } catch (e) {
        console.warn("BroadcastChannel post error", e);
      }

      // Firebase REST DB Push across all devices
      if (firebaseDbUrl) {
        try {
          fetch(`${firebaseDbUrl}/sync.json`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tasks: newTasks,
              members: newMembers || members,
              updatedAt: Date.now()
            })
          }).catch((err) => console.warn("Firebase sync error", err));
        } catch (e) {
          console.warn("Firebase fetch error", e);
        }
      }
    },
    [firebaseDbUrl, members]
  );

  // Load from localStorage & Firebase on mount
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem("mono_tasks");
      const savedMembers = localStorage.getItem("mono_members");
      const savedTheme = localStorage.getItem("mono_dark_mode");
      const savedAdmin = localStorage.getItem("mono_is_admin");
      const savedSound = localStorage.getItem("mono_sound_enabled");

      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        setTasks(parsed);
        lastSyncHashRef.current = JSON.stringify(parsed);
      } else {
        setTasks(DEFAULT_TASKS);
        lastSyncHashRef.current = JSON.stringify(DEFAULT_TASKS);
      }

      if (savedMembers) {
        setMembers(JSON.parse(savedMembers));
      } else {
        setMembers(DEFAULT_MEMBERS);
      }

      if (savedTheme !== null) {
        setDarkMode(JSON.parse(savedTheme));
      } else {
        setDarkMode(true);
      }

      if (savedAdmin !== null) {
        setIsAdmin(JSON.parse(savedAdmin));
      }

      if (savedSound !== null) {
        setSoundEnabled(JSON.parse(savedSound));
      }

      // Fetch latest state from Firebase if URL exists
      if (firebaseDbUrl) {
        fetch(`${firebaseDbUrl}/sync.json`)
          .then((res) => res.json())
          .then((remoteData) => {
            if (remoteData) {
              if (Array.isArray(remoteData.tasks)) {
                setTasks(remoteData.tasks);
                lastSyncHashRef.current = JSON.stringify(remoteData.tasks);
              }
              if (Array.isArray(remoteData.members)) {
                setMembers(remoteData.members);
              }
            }
          })
          .catch((e) => console.warn("Initial Firebase fetch error", e));
      }
    } catch (e) {
      console.error("Error reading localStorage", e);
      setTasks(DEFAULT_TASKS);
      setMembers(DEFAULT_MEMBERS);
    }
    setIsLoaded(true);
  }, [firebaseDbUrl]);

  // Save to localStorage & Broadcast when state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("mono_tasks", JSON.stringify(tasks));
      broadcastSync(tasks);
    } catch (e) {
      console.error("Error saving tasks to localStorage", e);
    }
  }, [tasks, isLoaded, broadcastSync]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("mono_members", JSON.stringify(members));
      broadcastSync(tasks, members);
    } catch (e) {
      console.error("Error saving members to localStorage", e);
    }
  }, [members, isLoaded, tasks, broadcastSync]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("mono_dark_mode", JSON.stringify(darkMode));
    } catch (e) {
      console.error("Error saving dark mode", e);
    }
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("mono_is_admin", JSON.stringify(isAdmin));
    } catch (e) {
      console.error("Error saving admin state", e);
    }
  }, [isAdmin, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("mono_sound_enabled", JSON.stringify(soundEnabled));
    } catch (e) {
      console.error("Error saving sound state", e);
    }
  }, [soundEnabled, isLoaded]);

  // Admin Login Handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      adminUsernameInput.trim().toLowerCase() === expectedAdminUser &&
      adminPasswordInput === expectedAdminPass
    ) {
      setIsAdmin(true);
      setIsAdminModalOpen(false);
      setAdminUsernameInput("");
      setAdminPasswordInput("");
      setLoginError("");
      triggerToast("Admin Access Granted!", "success");
    } else {
      setLoginError("Invalid User Name or Password!");
      triggerToast("Login failed: Invalid credentials", "error");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    triggerToast("Logged out of Admin Mode", "info");
  };

  // Reset Data to defaults (Admin only)
  const handleResetData = () => {
    if (!isAdmin) {
      triggerToast("Admin authorization required to reset data", "error");
      return;
    }
    if (confirm("Reset all tasks and team members to initial default state?")) {
      setTasks(DEFAULT_TASKS);
      setMembers(DEFAULT_MEMBERS);
      triggerToast("Dashboard reset to default state", "success");
    }
  };

  // Open Task Modal (Create or Edit - Admin only)
  const openTaskModal = (task?: Task, initialStatus?: Status) => {
    if (!isAdmin) {
      triggerToast("Admin login required to create or edit tasks", "error");
      setIsAdminModalOpen(true);
      return;
    }
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description);
      setTaskDueDate(task.dueDate);
      setTaskPriority(task.priority);
      
      const exists = members.some((m) => m.id === task.assigneeId);
      setTaskAssignee(exists ? task.assigneeId : (members[0]?.id || ""));
      setTaskStatus(task.status);
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDesc("");
      setTaskDueDate(getTodayStr());
      setTaskPriority("Medium");
      setTaskAssignee(members.length > 0 ? members[0].id : "");
      setTaskStatus(initialStatus || "To Do");
    }
    setIsTaskModalOpen(true);
  };

  // Save Task (Create or Update - Admin only)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!taskTitle.trim()) return;

    const assignedMember = members.find((m) => m.id === taskAssignee);

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskTitle.trim(),
                description: taskDesc.trim(),
                dueDate: taskDueDate || getTodayStr(),
                priority: taskPriority,
                assigneeId: taskAssignee || (members[0]?.id || ""),
                status: taskStatus
              }
            : t
        )
      );
      triggerToast(`🔔 Task "${taskTitle.trim()}" updated!`, "success", true);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        dueDate: taskDueDate || getTodayStr(),
        priority: taskPriority,
        assigneeId: taskAssignee || (members[0]?.id ?? ""),
        status: taskStatus,
        createdAt: new Date().toISOString()
      };
      setTasks((prev) => [newTask, ...prev]);
      triggerToast(
        `🔔 New Task Assigned to ${assignedMember?.name || 'Member'}: "${taskTitle.trim()}"`,
        "success",
        true
      );
    }

    setIsTaskModalOpen(false);
  };

  // Delete Task (Admin only)
  const handleDeleteTask = (id: string, title?: string) => {
    if (!isAdmin) {
      triggerToast("Admin permission required to delete tasks", "error");
      return;
    }
    if (confirm(`Are you sure you want to delete "${title || 'this task'}"?`)) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      triggerToast("Task deleted", "info");
    }
  };

  // Move Task Status (Allowed for ALL users!)
  const handleMoveStatus = (id: string, newStatus: Status) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;
    if (targetTask.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    triggerToast(`🔔 Status Updated: "${targetTask.title}" → ${newStatus}`, "success", true);
  };

  // Add Team Member (Admin only)
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!memberName.trim()) return;

    const parts = memberName.trim().split(" ");
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();

    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: memberName.trim(),
      role: memberRole.trim() || "Team Member",
      initials
    };

    setMembers((prev) => [...prev, newMember]);
    setMemberName("");
    setMemberRole("");
    triggerToast(`Added team member "${newMember.name}"`, "success");
  };

  // Delete Team Member (Admin only)
  const handleDeleteMember = (id: string) => {
    if (!isAdmin) {
      triggerToast("Admin permission required to remove team members", "error");
      return;
    }
    if (members.length <= 1) {
      triggerToast("At least one team member must remain", "error");
      return;
    }

    const memberToRemove = members.find((m) => m.id === id);
    const remaining = members.filter((m) => m.id !== id);

    setMembers(remaining);
    
    if (remaining.length > 0) {
      setTasks((prev) =>
        prev.map((t) => (t.assigneeId === id ? { ...t, assigneeId: remaining[0].id } : t))
      );
    }
    triggerToast(`Removed member "${memberToRemove?.name || 'Member'}"`, "info");
  };

  const todayStr = getTodayStr();

  // Helper to determine Task Date Status
  const getTaskDateInfo = (task: Task) => {
    const isDone = task.status === "Done";
    if (isDone) return { label: "Completed", type: "done" };
    if (!task.dueDate) return { label: "Pending", type: "pending" };

    if (task.dueDate < todayStr) {
      return { label: "Overdue!", type: "overdue" };
    }
    if (task.dueDate === todayStr) {
      return { label: "Due Today", type: "today" };
    }
    return { label: "Pending", type: "pending" };
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((task) => {
      const assignee = members.find((m) => m.id === task.assigneeId);
      const assigneeName = assignee ? assignee.name.toLowerCase() : "";
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assigneeName.includes(searchQuery.toLowerCase());

      const matchesPriority =
        selectedPriority === "All" || task.priority === selectedPriority;

      const matchesAssignee =
        selectedAssignee === "All" || task.assigneeId === selectedAssignee;

      // Date Filters
      let matchesDate = true;
      if (selectedDateFilter === "PendingOnly") {
        matchesDate = task.status !== "Done";
      } else if (selectedDateFilter === "Overdue") {
        matchesDate = task.status !== "Done" && task.dueDate < todayStr;
      } else if (selectedDateFilter === "Today") {
        matchesDate = task.dueDate === todayStr;
      }

      return matchesSearch && matchesPriority && matchesAssignee && matchesDate;
    });

    // Sorting Logic
    return result.sort((a, b) => {
      if (sortBy === "dueDateAsc") {
        return (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99");
      }
      if (sortBy === "dueDateDesc") {
        return (b.dueDate || "0000-00-00").localeCompare(a.dueDate || "0000-00-00");
      }
      if (sortBy === "priority") {
        const pOrder: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      if (sortBy === "newest") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return 0;
    });
  }, [tasks, members, searchQuery, selectedPriority, selectedAssignee, selectedDateFilter, sortBy, todayStr]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status !== "Done").length;
    const overdue = tasks.filter((t) => t.status !== "Done" && t.dueDate < todayStr).length;
    const done = tasks.filter((t) => t.status === "Done").length;

    const pad = (n: number) => n.toString().padStart(4, "0");

    return {
      total: pad(total),
      pending: pad(pending),
      overdue: pad(overdue),
      done: pad(done)
    };
  }, [tasks, todayStr]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId) {
      handleMoveStatus(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--ink)]">
        <div className="font-mono text-xl tracking-widest animate-pulse skeuo-panel p-6 rounded-2xl">
          CONSOLE 08 // INITIALIZING...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] transition-colors duration-300 p-4 md:p-8 font-sans selection:bg-[var(--ink)] selection:text-[var(--bg)] relative">
      
      {/* TOAST NOTIFICATION CONTAINER WITH AUDIO INDICATOR */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto skeuo-panel rounded-2xl px-4 py-3 font-mono text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in slide-in-from-bottom-5 duration-200 ${
              t.type === "success"
                ? "border border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : t.type === "error"
                ? "border border-rose-500/40 text-rose-600 dark:text-rose-400"
                : "text-[var(--ink)]"
            }`}
          >
            {t.type === "success" && <Check className="w-4 h-4 text-emerald-500" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500" />}
            {t.type === "info" && <Info className="w-4 h-4 text-blue-500" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP CONSOLE HEADER */}
        <header className="skeuo-panel rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Console Branding */}
            <div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[var(--ink)] animate-ping" />
                <h1 className="text-lg md:text-xl font-bold tracking-[4px] uppercase text-[var(--ink)]">
                  CONSOLE 08
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold skeuo-inset text-[var(--ink-soft)]">
                  {isAdmin ? "ADMIN MODE" : "GUEST MODE"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono text-emerald-600 dark:text-emerald-400 skeuo-inset flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  REALTIME SYNC
                </span>
              </div>
              <p className="mt-1 text-xs tracking-[2px] uppercase text-[var(--ink-soft)] font-medium">
                MONOCHROME TASK & TEAM CONTROL UNIT
              </p>
            </div>

            {/* Top Right Action Controls */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* AUDIO CHIME NOTIFICATION TOGGLE */}
              <button
                onClick={() => {
                  const nextState = !soundEnabled;
                  setSoundEnabled(nextState);
                  if (nextState) {
                    playAudioChime();
                    triggerToast("Audio Notifications Enabled 🔔", "info", false);
                  } else {
                    triggerToast("Audio Muted 🔇", "info", false);
                  }
                }}
                className="skeuo-btn p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title={soundEnabled ? "Mute Sound Chime" : "Enable Sound Chime"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 opacity-50" />
                )}
                <span className="font-mono text-[10px] font-bold hidden sm:inline">
                  {soundEnabled ? "SOUND ON" : "MUTED"}
                </span>
              </button>

              {/* ADMIN LOGIN / LOGOUT TOGGLE */}
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-2xl skeuo-inset text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" />
                    ADMIN LOGGED IN
                  </span>
                  <button
                    onClick={handleAdminLogout}
                    className="skeuo-btn px-3 py-2 rounded-2xl text-xs font-mono font-bold uppercase text-rose-500 hover:text-rose-600 cursor-pointer"
                    title="Logout from Admin Mode"
                  >
                    LOGOUT
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAdminUsernameInput("");
                    setAdminPasswordInput("");
                    setLoginError("");
                    setIsAdminModalOpen(true);
                  }}
                  className="skeuo-btn px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-[var(--ink)] cursor-pointer"
                  title="Login as Admin to create, edit or delete tasks"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ADMIN LOGIN</span>
                </button>
              )}

              {/* Dark Mode Toggle Matching Reference */}
              <div className="flex items-center gap-3 skeuo-inset px-4 py-2 rounded-2xl">
                <span className="text-xs font-mono font-bold tracking-widest text-[var(--ink-soft)] uppercase flex items-center gap-1.5">
                  {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {darkMode ? "DARK" : "LIGHT"}
                </span>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label="Toggle Theme"
                  className={`relative w-14 h-7 rounded-full skeuo-inset cursor-pointer transition-colors duration-300 ${
                    darkMode ? "bg-[var(--bg-dark)]" : "bg-[var(--bg)]"
                  }`}
                >
                  <div
                    className={`absolute top-[3px] w-5.5 h-5.5 rounded-full bg-[var(--bg)] shadow-[3px_3px_6px_var(--shadow-dark),-3px_-3px_6px_var(--shadow-light)] transition-all duration-200 ease-out ${
                      darkMode ? "left-[31px]" : "left-[3px]"
                    }`}
                  />
                </button>
              </div>

              {/* Reset Data Button (Admin only) */}
              {isAdmin && (
                <button
                  onClick={handleResetData}
                  title="Reset to default seed data"
                  className="skeuo-btn p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">RESET</span>
                </button>
              )}

              {/* Team Management Modal Trigger */}
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="skeuo-btn px-4 py-2.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>TEAM ({members.length})</span>
              </button>

              {/* Create Task Button (Admin only or prompt login) */}
              <button
                onClick={() => {
                  if (!isAdmin) {
                    setIsAdminModalOpen(true);
                  } else {
                    openTaskModal();
                  }
                }}
                className={`skeuo-btn px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 text-[var(--ink)] font-mono cursor-pointer ${
                  !isAdmin ? "opacity-75" : ""
                }`}
                title={!isAdmin ? "Login as Admin to add tasks" : "Create new task"}
              >
                <Plus className="w-4 h-4" />
                <span>+ NEW TASK {!isAdmin && "🔒"}</span>
              </button>
            </div>
          </div>
        </header>

        {/* DIGITAL LCD STATISTICS PANEL WITH PENDING & OVERDUE METRICS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="skeuo-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[var(--ink-soft)] uppercase">
              TOTAL TASKS
            </span>
            <div className="mt-3 skeuo-lcd rounded-xl p-3 flex justify-between items-center font-mono">
              <span className="text-2xl md:text-3xl tracking-[4px] font-bold">
                {stats.total}
              </span>
              <Kanban className="w-5 h-5 opacity-40" />
            </div>
          </div>

          <div className="skeuo-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[var(--ink-soft)] uppercase">
              PENDING TASKS
            </span>
            <div className="mt-3 skeuo-lcd rounded-xl p-3 flex justify-between items-center font-mono">
              <span className="text-2xl md:text-3xl tracking-[4px] font-bold">
                {stats.pending}
              </span>
              <Clock className="w-5 h-5 opacity-40" />
            </div>
          </div>

          <div className="skeuo-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[var(--ink-soft)] uppercase">
              OVERDUE TASKS
            </span>
            <div className="mt-3 skeuo-lcd rounded-xl p-3 flex justify-between items-center font-mono">
              <span className={`text-2xl md:text-3xl tracking-[4px] font-bold ${Number(stats.overdue) > 0 ? "text-rose-500" : ""}`}>
                {stats.overdue}
              </span>
              <AlertTriangle className="w-5 h-5 opacity-40" />
            </div>
          </div>

          <div className="skeuo-panel rounded-2xl p-4 md:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-mono font-bold tracking-widest text-[var(--ink-soft)] uppercase">
              COMPLETED
            </span>
            <div className="mt-3 skeuo-lcd rounded-xl p-3 flex justify-between items-center font-mono">
              <span className="text-2xl md:text-3xl tracking-[4px] font-bold">
                {stats.done}
              </span>
              <CheckCircle2 className="w-5 h-5 opacity-40" />
            </div>
          </div>
        </section>

        {/* SEARCH, DATE FILTER & SORTING BAR */}
        <section className="skeuo-panel rounded-3xl p-4 md:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Global Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-soft)]" />
              <input
                type="text"
                placeholder="Search by title, description, or assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full skeuo-input rounded-2xl pl-11 pr-4 py-3 text-sm font-medium placeholder:text-[var(--ink-soft)]/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Date & Pending Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Date Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl skeuo-inset text-xs font-semibold">
                {[
                  { id: "All", label: "All Tasks" },
                  { id: "PendingOnly", label: "Pending Only" },
                  { id: "Today", label: "Due Today" },
                  { id: "Overdue", label: "Overdue ⚠️" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedDateFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      selectedDateFilter === f.id
                        ? "skeuo-btn-active font-bold text-[var(--ink)]"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Priority Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="skeuo-input rounded-2xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              {/* Assignee Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="skeuo-input rounded-2xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <option value="All">All Members</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.initials})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="skeuo-input rounded-2xl px-3 py-2.5 text-xs font-semibold cursor-pointer font-mono"
                  title="Sort Tasks"
                >
                  <option value="dueDateAsc">📅 Date: Earliest First</option>
                  <option value="dueDateDesc">📅 Date: Latest First</option>
                  <option value="priority">🔥 Priority Level</option>
                  <option value="newest">✨ Newest Created</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center p-1 rounded-2xl skeuo-inset">
                <button
                  onClick={() => setViewMode("kanban")}
                  title="Kanban Board View"
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === "kanban" ? "skeuo-btn-active text-[var(--ink)]" : "text-[var(--ink-soft)]"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="Compact List View"
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === "list" ? "skeuo-btn-active text-[var(--ink)]" : "text-[var(--ink-soft)]"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* MAIN BOARD VIEW */}
        {viewMode === "kanban" ? (
          /* KANBAN GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATUSES.map((status) => {
              const columnTasks = filteredTasks.filter((t) => t.status === status);
              const isOver = dragOverStatus === status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`skeuo-panel rounded-3xl p-4 flex flex-col min-h-[500px] transition-all ${
                    isOver ? "ring-2 ring-[var(--ink-soft)] scale-[1.01]" : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--ink-soft)]/20 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--ink)]" />
                      <h2 className="font-mono text-xs font-bold tracking-wider uppercase text-[var(--ink)]">
                        {status}
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full skeuo-inset text-[var(--ink-soft)]">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Column Tasks List */}
                  <div className="flex-1 space-y-4">
                    {columnTasks.length === 0 ? (
                      <div className="h-40 rounded-2xl skeuo-inset border border-dashed border-[var(--ink-soft)]/30 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-xs font-mono text-[var(--ink-soft)]">
                          NO TASKS HERE
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => openTaskModal(undefined, status)}
                            className="mt-2 text-[11px] underline font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                          >
                            + Add one now
                          </button>
                        )}
                      </div>
                    ) : (
                      columnTasks.map((task) => {
                        const assignee = members.find(
                          (m) => m.id === task.assigneeId
                        );
                        const dateInfo = getTaskDateInfo(task);

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            className="skeuo-card skeuo-card-hover rounded-2xl p-4 cursor-grab active:cursor-grabbing relative group space-y-3"
                          >
                            {/* Card Header: Priority & Edit/Delete (Admin Only) */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-lg skeuo-inset ${
                                  task.priority === "High"
                                    ? "text-rose-600 dark:text-rose-400 font-extrabold"
                                    : task.priority === "Medium"
                                    ? "text-[var(--ink)]"
                                    : "text-[var(--ink-soft)]"
                                }`}
                              >
                                ● {task.priority}
                              </span>

                              {isAdmin ? (
                                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTaskModal(task);
                                    }}
                                    className="p-1 rounded-lg skeuo-btn text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                                    title="Edit Task (Admin)"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTask(task.id, task.title);
                                    }}
                                    className="p-1 rounded-lg skeuo-btn text-rose-500 hover:text-rose-600 cursor-pointer"
                                    title="Delete Task (Admin)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[10px] font-mono text-[var(--ink-soft)]/60">
                                  READ ONLY
                                </div>
                              )}
                            </div>

                            {/* Title & Description */}
                            <div>
                              <h3 className="font-semibold text-sm leading-snug text-[var(--ink)]">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-xs text-[var(--ink-soft)] line-clamp-2 mt-1 font-normal">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            {/* Card Footer: Due Date Status Badge & Assignee */}
                            <div className="pt-2 border-t border-[var(--ink-soft)]/10 flex items-center justify-between text-xs">
                              {/* Due Date & Pending/Overdue Status */}
                              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                <Calendar className="w-3.5 h-3.5 opacity-60" />
                                <span>{task.dueDate}</span>
                                
                                {/* Status Pill */}
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                                    dateInfo.type === "overdue"
                                      ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                                      : dateInfo.type === "today"
                                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                                      : dateInfo.type === "done"
                                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                      : "skeuo-inset text-[var(--ink-soft)]"
                                  }`}
                                >
                                  {dateInfo.label}
                                </span>
                              </div>

                              {/* Assignee Avatar */}
                              {assignee && (
                                <div
                                  title={`${assignee.name} (${assignee.role})`}
                                  className="w-6 h-6 rounded-full skeuo-btn flex items-center justify-center text-[10px] font-mono font-bold text-[var(--ink)] shrink-0 ml-1"
                                >
                                  {assignee.initials}
                                </div>
                              )}
                            </div>

                            {/* Quick Move Status Selector (ALLOWED FOR EVERYONE!) */}
                            <div className="mt-2 pt-1.5 border-t border-dashed border-[var(--ink-soft)]/20 flex items-center justify-between text-[11px] text-[var(--ink-soft)]">
                              <span className="font-mono text-[9px] uppercase font-bold flex items-center gap-1 text-[var(--ink)]">
                                MOVE STATUS:
                              </span>
                              <select
                                value={task.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(task.id, e.target.value as Status);
                                }}
                                className="bg-[var(--bg)] border border-[var(--ink-soft)]/20 rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer text-[var(--ink)] focus:outline-none skeuo-inset"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABBED COMPACT LIST VIEW */
          <div className="skeuo-panel rounded-3xl p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--ink-soft)]/20 font-mono text-xs text-[var(--ink-soft)] uppercase tracking-wider">
                    <th className="py-3 px-4">Task Title</th>
                    <th className="py-3 px-4">Status (Move Allowed)</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Due Date & Pending State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-soft)]/10 text-sm font-medium">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs font-mono text-[var(--ink-soft)]">
                        No matching tasks found.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const assignee = members.find((m) => m.id === task.assigneeId);
                      const dateInfo = getTaskDateInfo(task);
                      return (
                        <tr key={task.id} className="hover:bg-[var(--bg-dark)]/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-[var(--ink)]">
                            <div>{task.title}</div>
                            {task.description && (
                              <div className="text-xs font-normal text-[var(--ink-soft)] truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleMoveStatus(task.id, e.target.value as Status)
                              }
                              className="skeuo-input rounded-xl px-2.5 py-1 text-xs font-mono font-semibold cursor-pointer"
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <span className="px-2.5 py-1 rounded-lg skeuo-inset">
                              {task.priority}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {assignee ? (
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full skeuo-btn flex items-center justify-center text-[10px] font-mono font-bold">
                                  {assignee.initials}
                                </span>
                                <span className="text-xs">{assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--ink-soft)]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-[var(--ink-soft)]">
                            <div className="flex items-center gap-2">
                              <span>{task.dueDate}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase ${
                                  dateInfo.type === "overdue"
                                    ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                                    : dateInfo.type === "today"
                                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40"
                                    : dateInfo.type === "done"
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "skeuo-inset text-[var(--ink-soft)]"
                                }`}
                              >
                                {dateInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => openTaskModal(task)}
                                  className="skeuo-btn p-1.5 rounded-lg text-xs cursor-pointer"
                                  title="Edit Task (Admin)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id, task.title)}
                                  className="skeuo-btn p-1.5 rounded-lg text-xs text-rose-500 hover:text-rose-600 cursor-pointer"
                                  title="Delete Task (Admin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-mono text-[var(--ink-soft)]/50">
                                Protected 🔒
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL: ADMIN LOGIN */}
        {isAdminModalOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAdminModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
          >
            <div className="skeuo-panel rounded-3xl w-full max-w-md p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in duration-150">
              
              <div className="flex items-center justify-between border-b border-[var(--ink-soft)]/20 pb-4">
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  ADMIN AUTHENTICATION
                </h3>
                <button
                  onClick={() => setIsAdminModalOpen(false)}
                  className="skeuo-btn p-1.5 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loginError && (
                <div className="text-xs text-rose-500 font-medium skeuo-inset p-3 rounded-xl border border-rose-500/30">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                    User Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter user name..."
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    className="w-full skeuo-input rounded-2xl px-4 py-2.5 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password..."
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full skeuo-input rounded-2xl px-4 py-2.5 text-sm font-medium"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(false)}
                    className="skeuo-btn px-5 py-2.5 rounded-2xl text-xs font-bold uppercase cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="skeuo-btn px-6 py-2.5 rounded-2xl text-xs font-bold uppercase text-[var(--ink)] font-mono cursor-pointer"
                  >
                    LOGIN
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MODAL: TASK FORM (CREATE / EDIT - ADMIN ONLY) */}
        {isTaskModalOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsTaskModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="skeuo-panel rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in duration-150">
              
              <div className="flex items-center justify-between border-b border-[var(--ink-soft)]/20 pb-4">
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase">
                  {editingTask ? "EDIT TASK (ADMIN)" : "+ NEW TASK ENTRY (ADMIN)"}
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="skeuo-btn p-1.5 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter task title..."
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full skeuo-input rounded-2xl px-4 py-2.5 text-sm font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add task details..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full skeuo-input rounded-2xl p-4 text-sm font-normal"
                  />
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as Priority)}
                      className="w-full skeuo-input rounded-2xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full skeuo-input rounded-2xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Assignee & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                      Assignee
                    </label>
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="w-full skeuo-input rounded-2xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.initials})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase font-bold text-[var(--ink-soft)] mb-1">
                      Status
                    </label>
                    <select
                      value={taskStatus}
                      onChange={(e) => setTaskStatus(e.target.value as Status)}
                      className="w-full skeuo-input rounded-2xl px-3.5 py-2.5 text-sm font-semibold cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="pt-4 border-t border-[var(--ink-soft)]/20 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="skeuo-btn px-5 py-2.5 rounded-2xl text-xs font-bold uppercase cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="skeuo-btn px-6 py-2.5 rounded-2xl text-xs font-bold uppercase text-[var(--ink)] font-mono cursor-pointer"
                  >
                    {editingTask ? "UPDATE TASK" : "SAVE TASK"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MODAL: TEAM MANAGEMENT */}
        {isTeamModalOpen && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsTeamModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <div className="skeuo-panel rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in duration-150">
              
              <div className="flex items-center justify-between border-b border-[var(--ink-soft)]/20 pb-4">
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  COMPANY TEAM ROSTER
                </h3>
                <button
                  onClick={() => setIsTeamModalOpen(false)}
                  className="skeuo-btn p-1.5 rounded-xl text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Add Member Form (Admin Only) */}
              {isAdmin ? (
                <form onSubmit={handleAddMember} className="skeuo-inset rounded-2xl p-4 space-y-3">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--ink-soft)] block">
                    + ADD NEW TEAM MEMBER (ADMIN)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Full Name (e.g. David Kim)"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="skeuo-input rounded-xl px-3.5 py-2 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. QA Engineer)"
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="skeuo-input rounded-xl px-3.5 py-2 text-xs font-medium"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="skeuo-btn px-4 py-1.5 rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                    >
                      ADD MEMBER
                    </button>
                  </div>
                </form>
              ) : (
                <div className="skeuo-inset rounded-2xl p-3 text-xs font-mono text-[var(--ink-soft)] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Only Admin can add or remove team members.</span>
                </div>
              )}

              {/* Existing Members List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                <span className="text-xs font-mono font-bold uppercase text-[var(--ink-soft)] block">
                  CURRENT MEMBERS ({members.length})
                </span>
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="skeuo-card rounded-2xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full skeuo-btn flex items-center justify-center font-mono text-xs font-bold text-[var(--ink)]">
                        {member.initials}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--ink)]">{member.name}</div>
                        <div className="text-[11px] font-mono text-[var(--ink-soft)]">
                          {member.role}
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="skeuo-btn p-1.5 rounded-xl text-rose-500 hover:text-rose-600 cursor-pointer"
                        title="Remove Member (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-[var(--ink-soft)]/20 flex justify-end">
                <button
                  onClick={() => setIsTeamModalOpen(false)}
                  className="skeuo-btn px-6 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  DONE
                </button>
              </div>

            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="text-center pt-4 pb-8 border-t border-[var(--ink-soft)]/10 font-mono text-[10px] tracking-[2px] uppercase text-[var(--ink-soft)]">
          SKEUOMORPHIC MONOCHROME DASHBOARD — REALTIME SYNC & AUDIO NOTIFICATIONS — RBAC AUTHENTICATION ENFORCED
        </footer>

      </div>
    </div>
  );
}
