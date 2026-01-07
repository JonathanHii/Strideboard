"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FolderOpen, Plus, Search, Loader2 } from "lucide-react";
import { Workspace } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import ProjectCard from "@/components/project/project-card";

export default function WorkspaceProjectsPage() {
    const params = useParams();
    const workspaceSlug = params.workspace as string;

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const workspaces = await workspaceService.getMyWorkspaces();
                // Match by slug (URL) or ID
                const current = workspaces.find(ws => ws.slug === workspaceSlug || ws.id === workspaceSlug);
                setWorkspace(current || null);
            } catch (err) {
                console.error("Error loading projects:", err);
            } finally {
                setLoading(false);
            }
        };
        if (workspaceSlug) loadData();
    }, [workspaceSlug]);

    return (
        <div className="px-8 pt-4 pb-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {workspace ? workspace.name : "Loading..."}
                    </h1>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
                    <Plus className="w-5 h-5" />
                    New Project
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Filter projects..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                    <p className="animate-pulse">Retrieving your projects...</p>
                </div>
            ) : workspace ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {workspace.projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            workspaceSlug={workspaceSlug}
                        />
                    ))}

                    {workspace.projects.length === 0 && (
                        <div className="col-span-full py-20 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center">
                            <FolderOpen className="w-12 h-12 text-gray-200 mb-4" />
                            <p className="text-gray-500">No projects found in this workspace.</p>
                            <button className="mt-4 text-indigo-600 font-medium hover:underline">
                                Create your first project
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">Workspace not found.</p>
                </div>
            )}
        </div>
    );
}