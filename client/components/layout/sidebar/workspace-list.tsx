"use client";

import { useEffect, useState } from "react";
import { Folder, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Workspace } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";

export default function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspaceService.getMyWorkspaces()
      .then(setWorkspaces)
      .catch((err) => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-3 text-xs font-semibold text-gray-500 uppercase">
        <span>Workspaces</span>
        <button className="hover:bg-gray-200 p-0.5 rounded transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-1">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Syncing...</span>
          </div>
        ) : (
          workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/${ws.slug}`}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors text-sm group"
            >
              <Folder className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
              <span className="truncate">{ws.name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}