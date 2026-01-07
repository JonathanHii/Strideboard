"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { workspaceService } from "@/services/workspace-service";
import { Workspace } from "@/types/types";

export default function Breadcrumbs() {
  const params = useParams();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  
  const workspaceId = params?.workspace as string;
  const projectId = params?.project as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch workspaces to resolve names from IDs
        const data = await workspaceService.getMyWorkspaces();
        setWorkspaces(data);
      } catch (error) {
        console.error("Failed to load breadcrumb data:", error);
      }
    };
    loadData();
  }, []);

  // Find the current workspace object by ID
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);
  
  // Find the current project object within that workspace
  const currentProject = currentWorkspace?.projects?.find((p) => p.id === projectId);

  return (
    <nav className="flex items-center text-sm font-medium">
      {/* Static Home Link */}
      <Link 
        href="/dashboard" 
        className="text-gray-500 hover:text-gray-900 transition-colors"
      >
        Dashboard
      </Link>

      {/* Dynamic Workspace Breadcrumb */}
      {workspaceId && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <Link 
            href={`/${workspaceId}`} 
            className={`transition-colors hover:text-blue-600 ${
              !projectId ? "text-gray-900 font-semibold" : "text-gray-500"
            }`}
          >
            {currentWorkspace ? currentWorkspace.name : "Loading..."}
          </Link>
        </>
      )}

      {/* Dynamic Project Breadcrumb */}
      {projectId && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 font-semibold">
            {currentProject ? currentProject.name : "Loading..."}
          </span>
        </>
      )}
    </nav>
  );
}