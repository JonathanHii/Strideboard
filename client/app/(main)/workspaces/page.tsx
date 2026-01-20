"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { Workspace } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import WorkspaceCard from "@/components/workspace/workspace-card";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadWorkspaces = useCallback(async () => {
    try {
      const data = await workspaceService.getMyWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to load workspaces", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();

    const handleWorkspaceUpdate = () => {
      loadWorkspaces();
    };

    window.addEventListener("workspace-updated", handleWorkspaceUpdate);

    return () => {
      window.removeEventListener("workspace-updated", handleWorkspaceUpdate);
    };
  }, [loadWorkspaces]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="animate-pulse">Retrieving your workspaces...</p>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5 md:mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Create Workspace</span>
        </button>
      </div>

      <div className="relative mb-7 md:mb-8 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search your workspaces..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {workspaces.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}

        {workspaces.length === 0 && (
          <div className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Plus className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No workspaces yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first workspace to start collaborating.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
            >
              Create one now &rarr;
            </button>
          </div>
        )}
      </div>

      {/* --- Create Workspace Modal --- */}
      {isModalOpen && (
        <CreateWorkspaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadWorkspaces}
        />
      )}
    </div>
  );
}