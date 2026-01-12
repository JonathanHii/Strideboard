"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FolderOpen, Plus, Search, Loader2, X, Settings, Save, Trash2, Mail, User } from "lucide-react";
import { Workspace, Project, WorkspaceMember, UserSummary } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import ProjectCard from "@/components/project/project-card";

export default function WorkspaceProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspace as string;

  // Data State
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Member State
  const [currentUser, setCurrentUser] = useState<WorkspaceMember | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  // Modal & Form State (Create Project)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Modal State (Settings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add People State
  const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Delete Workspace State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Data Loading ---
  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      // Only set loading to true on initial load, not on refresh
      if (projects.length === 0) setLoading(true);

      const [projectData, workspaceList] = await Promise.all([
        workspaceService.getWorkspaceProjects(workspaceId),
        workspaceService.getMyWorkspaces()
      ]);

      setProjects(projectData);

      const currentWs = workspaceList.find(ws => ws.id === workspaceId);
      if (currentWs) {
        setWorkspace(currentWs);
        setSettingsName(currentWs.name); // Pre-fill settings name
      }
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // --- Load Members when Settings Modal Opens ---
  const loadMemberData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const [currentUserData, membersData] = await Promise.all([
        workspaceService.getCurrentUserInWorkspace(workspaceId),
        workspaceService.getWorkspaceMembers(workspaceId)
      ]);

      setCurrentUser(currentUserData);
      setMembers(membersData);
    } catch (err) {
      console.error("Error loading member data:", err);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isSettingsOpen) {
      loadMemberData();
    }
  }, [isSettingsOpen, loadMemberData]);

  // --- Search Logic for Add People ---
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!inviteEmail || inviteEmail.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await workspaceService.searchUsersNotInWorkspace(workspaceId, inviteEmail);
        const filtered = results.filter((u) => !invitedEmails.includes(u.email));
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [inviteEmail, invitedEmails, workspaceId]);

  // --- Helper to get initials ---
  const getInitials = (name: string, email: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // --- Helper to get avatar color based on role ---
  const getAvatarColor = (role: string): string => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-indigo-100 text-indigo-700";
      case "MEMBER":
        return "bg-orange-100 text-orange-700";
      case "VIEWER":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // --- Add People Handlers ---
  const addEmail = (email: string) => {
    if (!email || !email.includes("@")) return;

    if (!invitedEmails.includes(email)) {
      setInvitedEmails([...invitedEmails, email]);
      setInviteEmail("");
      setSearchResults([]);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter((email) => email !== emailToRemove));
  };

  const handleInviteMembers = async () => {
    if (invitedEmails.length === 0) return;

    setIsInviting(true);
    try {
      await workspaceService.addMembersToWorkspace(workspaceId, invitedEmails);
      await loadMemberData(); // Refresh members list
      closeAddPeopleModal();
    } catch (error) {
      console.error("Failed to invite members", error);
      alert(error instanceof Error ? error.message : "Failed to invite members.  Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const openAddPeopleModal = () => {
    setIsAddPeopleOpen(true);
    setInviteEmail("");
    setInvitedEmails([]);
    setSearchResults([]);
  };

  const closeAddPeopleModal = () => {
    setIsAddPeopleOpen(false);
    setInviteEmail("");
    setInvitedEmails([]);
    setSearchResults([]);
  };

  // --- Form Handlers ---
  const handleCreateProject = async () => {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      await workspaceService.createProject(workspaceId, {
        name: newName,
        description: newDescription
      });

      await loadData(); // Refresh list
      closeModal();
    } catch (error) {
      console.error("Failed to create project", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewName("");
    setNewDescription("");
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async () => {
    if (!settingsName.trim()) return;
    setIsSavingSettings(true);

    // Simulate API Call
    setTimeout(() => {
      setIsSavingSettings(false);
      setIsSettingsOpen(false);
      // Optimistic update
      if (workspace) setWorkspace({ ...workspace, name: settingsName });
    }, 1000);
  };

  // --- Delete Workspace Handlers ---
  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== workspace?.name) return;

    setIsDeleting(true);
    try {
      await workspaceService.deleteWorkspace(workspaceId);
      // Close modals and redirect to workspaces list
      setIsDeleteConfirmOpen(false);
      setIsSettingsOpen(false);
      window.dispatchEvent(new Event("workspace-updated"));
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete workspace", error);
      alert(error instanceof Error ? error.message : "Failed to delete workspace.  Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteConfirm = () => {
    setIsDeleteConfirmOpen(true);
    setDeleteConfirmText("");
  };

  const closeDeleteConfirm = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmText("");
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="animate-pulse">Retrieving your projects...</p>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {workspace?.name || "Workspace"}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Search Bar & Settings Row */}
      <div className="flex items-center justify-between mb-8 gap-4">
        {/* Search - Matches WorkspacesPage EXACT styling */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // Exact classes from WorkspacesPage (py-2 instead of py-2.5)
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus: ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* Settings Button - Adjusted padding to match new search height */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
          title="Workspace Settings"
        >
          <Settings className="w-5 h-5" />
          <span className="sr-only sm:not-sr-only sm:text-sm sm:font-medium">Settings</span>
        </button>
      </div>

      {/* Grid Content */}
      {workspace ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              workspaceId={workspaceId}
            />
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <FolderOpen className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No projects yet</h3>
              <p className="text-gray-500 mb-6">Create a project to start tracking work.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
              >
                Create one now &rarr;
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500">
          Workspace not found.
        </div>
      )}

      {/* --- Create Project Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">

            {/* 1. Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                <p className="text-sm text-gray-500 mt-0.5">Start a new initiative in this workspace. </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter:stable]">
              {/* Project Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g.  Website Redesign"
                  className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 placeholder: text-gray-400"
                  autoFocus
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Briefly describe the goals of this project..."
                  className="w-full px-4 py-3 h-32 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* 3. Footer */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newName.trim() || isCreating}
                className="bg-indigo-600 hover:bg-indigo-700 disabled: bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Project</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Settings Modal --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">

            {/* 1. Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Workspace Settings</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage configuration and members. </p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Content Area */}
            <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter:stable]">

              {/* General Section */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">General</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <FolderOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-semibold block">Workspace ID</span>
                      <span className="opacity-75 font-mono">{workspaceId}</span>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Members Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Members</h3>
                  <button
                    onClick={openAddPeopleModal}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Add People
                  </button>
                </div>
                <div className="space-y-3">
                  {/* Current User */}
                  {currentUser && (
                    <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(currentUser.role)}`}>
                          You
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {currentUser.name || currentUser.email}
                            <span className="ml-2 text-xs text-indigo-600 font-normal">(You)</span>
                          </p>
                          <p className="text-xs text-gray-500">{currentUser.role}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Members */}
                  {members
                    .filter(member => currentUser && member.id !== currentUser.id)
                    .map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(member.role)}`}>
                            {getInitials(member.name, member.email)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {member.name || member.email}
                            </p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover: text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                  {/* Empty State */}
                  {members.length <= 1 && (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No other members in this workspace yet.
                    </div>
                  )}
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* Danger Zone */}
              <section>
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">Danger Zone</h3>
                <div className="border border-red-100 bg-red-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Delete Workspace</h4>
                    <p className="text-sm text-red-700 mt-1">Permanently remove this workspace and all projects.</p>
                  </div>
                  <button
                    onClick={openDeleteConfirm}
                    disabled={currentUser?.role.toUpperCase() !== "ADMIN"}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Workspace
                  </button>
                </div>
                {currentUser?.role.toUpperCase() !== "ADMIN" && (
                  <p className="text-xs text-gray-500 mt-2">Only workspace admins can delete the workspace.</p>
                )}
              </section>
            </div>

            {/* 3. Footer */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover: border-gray-300 rounded-xl font-medium transition-all shadow-sm"
              >
                Close
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- Add People Modal --- */}
      {isAddPeopleOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add People</h2>
                <p className="text-sm text-gray-500 mt-0.5">Invite members to this workspace. </p>
              </div>
              <button
                onClick={closeAddPeopleModal}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter:stable]">

              {/* Search Input Group */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEmail(inviteEmail);
                      }
                    }}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 h-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    autoComplete="off"
                    autoFocus
                  />

                  {/* Dropdown Results */}
                  {(searchResults.length > 0 || isSearching) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-47 overflow-y-auto z-50 ring-1 ring-black/5">
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Searching users...
                        </div>
                      ) : (
                        searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => addEmail(user.email)}
                            className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors group border-b border-gray-50 last:border-0"
                          >
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex shrink-0 items-center justify-center text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {user.name || "Unknown User"}
                              </p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <Plus className="w-4 h-4 ml-auto text-gray-400 group-hover:text-indigo-600" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Emails List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending Invites {invitedEmails.length > 0 && `(${invitedEmails.length})`}
                  </p>
                  {invitedEmails.length > 0 && (
                    <button
                      onClick={() => setInvitedEmails([])}
                      className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="h-36 w-full border border-gray-200 rounded-xl bg-gray-50/50 p-2 overflow-y-auto overscroll-contain">
                  {invitedEmails.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Mail className="w-5 h-5 mb-1 opacity-20" />
                      <span className="text-xs">No users selected yet</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {invitedEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 shadow-sm animate-in fade-in zoom-in duration-200"
                        >
                          {email}
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className="text-gray-400 hover: text-red-500 hover:bg-red-50 p-0.5 rounded-md transition-all"
                          >
                            <X className="w-3. 5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={closeAddPeopleModal}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover: border-gray-300 rounded-xl font-medium transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMembers}
                disabled={invitedEmails.length === 0 || isInviting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Invite Members
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Delete Workspace</h2>
              </div>
              <button
                onClick={closeDeleteConfirm}
                className="text-gray-400 hover:text-gray-600 hover: bg-gray-100 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning: </strong> This action cannot be undone. This will permanently delete the
                  <strong className="mx-1">{workspace?.name}</strong>
                  workspace, all of its projects, and remove all member associations.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type <span className="font-mono text-red-600">{workspace?.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter workspace name"
                  className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus: ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-gray-900 placeholder: text-gray-400"
                  autoFocus
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
              <button
                onClick={closeDeleteConfirm}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover: border-gray-300 rounded-xl font-medium transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={deleteConfirmText !== workspace?.name || isDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover: shadow-lg font-medium"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Workspace
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}