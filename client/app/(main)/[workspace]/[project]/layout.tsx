"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, usePathname } from "next/navigation";
import { projectService } from "@/services/project-service";
import {
  LayoutDashboard,
  List,
  Settings,
  Loader2
} from "lucide-react";
import { workspaceService } from "@/services/workspace-service";
import { Project, Workspace } from "@/types/types";
import Link from "next/link";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const workspaceId = params.workspace as string;
  const projectId = params.project as string;

  const fetchProjectData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectData, workspaces] = await Promise.all([
        projectService.getProjectById(workspaceId, projectId),
        workspaceService.getMyWorkspaces()
      ]);

      setProject(projectData);

    } catch (error) {
      console.error("Failed to load project:", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    if (workspaceId && projectId) fetchProjectData();
  }, [workspaceId, projectId, fetchProjectData]);

  useEffect(() => {
    const handleProjectUpdate = () => {
      fetchProjectData();
    };

    window.addEventListener("projectUpdated", handleProjectUpdate);

    return () => {
      window.removeEventListener("projectUpdated", handleProjectUpdate);
    };
  }, [fetchProjectData]);

  const tabs = [
    { name: "Board", href: `/${workspaceId}/${projectId}/board`, icon: <LayoutDashboard size={16} /> },
    { name: "List", href: `/${workspaceId}/${projectId}/list`, icon: <List size={16} /> },
    { name: "Settings", href: `/${workspaceId}/${projectId}/settings`, icon: <Settings size={16} /> },
  ];

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-hidden">
      <header className="max-w-7xl w-full mx-auto flex-none">
        <div className="flex items-center justify-between mb-3 md:mb-5 h-[40px]">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            {isLoading ? (
              <span className="flex items-center gap-3 text-gray-400">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                Loading...
              </span>
            ) : (
              project?.name || "Project Not Found"
            )}
          </h1>
        </div>

        <nav className="flex items-center gap-8 border-b border-gray-200">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors ${isActive
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover: text-gray-700 hover:border-gray-300"
                  }`}
              >
                {tab.icon}
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="bg-white flex-1 min-h-0 overflow-hidden pb-4">
        <div className="max-w-7xl mx-auto pt-4 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}