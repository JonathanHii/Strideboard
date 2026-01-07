"use client";

import React, { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
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
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const workspaceId = params.workspace as string;
  const projectId = params.project as string;

  useEffect(() => {
    async function fetchProjectData() {
      try {
        setIsLoading(true);
        const workspaces = await workspaceService.getMyWorkspaces();
        const currentWorkspace = workspaces.find(w => w.id === workspaceId || w.slug === workspaceId);

        if (currentWorkspace) {
          setWorkspace(currentWorkspace);
          const currentProject = currentWorkspace.projects.find(p => p.id === projectId);
          if (currentProject) {
            setProject(currentProject);
          }
        }
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (workspaceId && projectId) {
      fetchProjectData();
    }
  }, [workspaceId, projectId]);

  const tabs = [
    { name: "Board", href: `/${workspaceId}/${projectId}/board`, icon: <LayoutDashboard size={16} /> },
    { name: "List", href: `/${workspaceId}/${projectId}/list`, icon: <List size={16} /> },
    { name: "Settings", href: `/${workspaceId}/${projectId}/settings`, icon: <Settings size={16} /> },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <header className="max-w-7xl w-full mx-auto p-8 pb-0">
        <div className="flex items-center justify-between mb-8 h-[40px]">
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
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                {tab.icon}
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-auto bg-white">
        {/* Match the horizontal alignment for the children */}
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}