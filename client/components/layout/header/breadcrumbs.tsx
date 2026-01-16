"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { workspaceService } from "@/services/workspace-service";
import { Workspace, Project } from "@/types/types";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const params = useParams();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const workspaceId = params?.workspace as string;
  const projectId = params?.project as string;

  const loadBreadcrumbs = useCallback(async () => {
    if (pathname === "/workspaces" || !workspaceId) {
      setWorkspace(null);
      setProject(null);
      return;
    }

    try {
      setLoading(true);

      // Define our fetch tasks
      const fetchTasks: Promise<any>[] = [
        workspaceService.getWorkspaceById(workspaceId)
      ];

      // Only fetch project if ID exists in URL
      if (projectId) {
        fetchTasks.push(workspaceService.getProjectById(workspaceId, projectId));
      }

      // Execute parallel requests
      const [wsData, pData] = await Promise.all(fetchTasks);

      setWorkspace(wsData);
      setProject(pData || null);
    } catch (error) {
      console.error("Breadcrumb fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, projectId, pathname]);

  useEffect(() => {
    loadBreadcrumbs();
  }, [loadBreadcrumbs]);

  useEffect(() => {
    window.addEventListener("breadcrumbs:refresh", loadBreadcrumbs);
    return () => {
      window.removeEventListener("breadcrumbs:refresh", loadBreadcrumbs);
    };
  }, [loadBreadcrumbs]);

  if (pathname === "/workspaces") return null;
  if (pathname === "/profile") return null;

  return (
    <nav className="flex items-center text-sm font-medium h-6">
      <Link
        href="/workspaces"
        className="text-gray-500 hover:text-gray-900 transition-colors"
      >
        Workspaces
      </Link>

      {workspaceId && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <Link
            href={`/${workspaceId}`}
            className={`transition-colors hover:text-indigo-600 ${!projectId ? "text-gray-900 font-semibold" : "text-gray-500"
              }`}
          >
            {workspace ? workspace.name : "... "}
          </Link>
        </>
      )}

      {projectId && (
        <>
          <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          <span className="text-gray-900 font-semibold">
            {project ? project.name : "... "}
          </span>
        </>
      )}

      {loading && <Loader2 className="w-3 h-3 ml-3 animate-spin text-gray-300" />}
    </nav>
  );
}