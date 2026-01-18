"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FolderOpen, Plus, Search, Loader2, Settings, Users } from "lucide-react";
import { Workspace, Project, WorkspaceMember } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import { projectService } from "@/services/project-service";
import ProjectCard from "@/components/workspace/project-card";
import CreateProjectModal from "@/components/workspace/create-project-modal";
import WorkspaceSettingsModal from "@/components/workspace/workspace-settings-modal";
// Import the new modal
import WorkspaceMembersModal from "@/components/workspace/workspace-members-modal";

export default function WorkspaceProjectsPage() {
  const params = useParams();
  const workspaceId = params.workspace as string;

  // Data State
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentMember, setCurrentMember] = useState<WorkspaceMember | null>(null);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // New state for the members modal
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // --- Data Loading ---
  const loadData = useCallback(async () => {
    if (!workspaceId) return;

    try {
      if (projects.length === 0) setLoading(true);

      const [projectData, workspaceList, memberData] = await Promise.all([
        projectService.getWorkspaceProjects(workspaceId),
        workspaceService.getMyWorkspaces(),
        workspaceService.getCurrentUserInWorkspace(workspaceId)
      ]);

      setProjects(projectData);
      setCurrentMember(memberData);

      const currentWs = workspaceList.find((ws) => ws.id === workspaceId);
      if (currentWs) {
        setWorkspace(currentWs);
      }
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle updates from modals
  const handleWorkspaceUpdated = (updatedWorkspace: Workspace) => {
    setWorkspace(updatedWorkspace);
    window.dispatchEvent(new Event("workspace-updated"));
    window.dispatchEvent(new Event("breadcrumbs:refresh"));
  };

  const filteredProjects = projects.filter((p) =>
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

  // Helper to determine roles
  const isAdmin = currentMember?.role === "Admin";
  const isViewer = currentMember?.role === "Viewer";

  return (
    <div className="pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {workspace?.name || "Workspace"}
        </h1>

        {/* Only show create button if NOT a viewer */}
        {!isViewer && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {/* Search Bar & Context Button Row */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        {/* LOGIC: IF ADMIN -> SHOW SETTINGS. ELSE -> SHOW MEMBERS. */}
        {isAdmin ? (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
            title="Workspace Settings"
          >
            <Settings className="w-5 h-5" />
            <span className="sr-only sm:not-sr-only sm:text-sm sm:font-medium">
              Settings
            </span>
          </button>
        ) : (
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
            title="View Members"
          >
            <Users className="w-5 h-5" />
            <span className="sr-only sm:not-sr-only sm:text-sm sm:font-medium">
              Members
            </span>
          </button>
        )}
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
              <h3 className="text-lg font-semibold text-gray-900">
                No projects yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create a project to start tracking work.
              </p>

              {/* Only show create link if NOT a viewer */}
              {!isViewer && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
                >
                  Create one now &rarr;
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500">
          Workspace not found.
        </div>
      )}

      {/* --- Modals --- */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
        onProjectCreated={loadData}
      />

      {workspace && (
        <>
          {/* Admin Settings Modal */}
          <WorkspaceSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            workspace={workspace}
            onWorkspaceUpdated={handleWorkspaceUpdated}
          />

          {/* Member View Modal */}
          <WorkspaceMembersModal
            isOpen={isMembersModalOpen}
            onClose={() => setIsMembersModalOpen(false)}
            workspace={workspace}
          />
        </>
      )}
    </div>
  );
}