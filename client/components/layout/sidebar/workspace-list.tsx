"use client";

import { useCallback, useEffect, useState } from "react";
import { Folder, Loader2, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Workspace } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import CreateWorkspaceModal from "@/components/workspace/CreateWorkspaceModal";

interface WorkspaceListProps {
  onNavigate?: () => void;
}

export default function WorkspaceList({ onNavigate }: WorkspaceListProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workspaceService.getMyWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();

    const handleRefresh = () => fetchWorkspaces();
    window.addEventListener("workspace-updated", handleRefresh);

    return () => window.removeEventListener("workspace-updated", handleRefresh);
  }, [fetchWorkspaces]);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 text-xs font-semibold text-gray-500 uppercase">
          <span>Workspaces</span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="hover:bg-gray-200 p-0.5 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Syncing...</span>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <h3 className="text-xs font-medium text-gray-900">
                No workspaces yet
              </h3>
              <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                Create your first workspace to start collaborating.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-3 flex items-center justify-center gap-1 mx-auto text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
              >
                <span>Create one now</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/${ws.id}`}
                onClick={onNavigate}
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm group"
              >
                <Folder className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                <span className="truncate">{ws.name}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateWorkspaceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchWorkspaces}
        />
      )}
    </>
  );
}