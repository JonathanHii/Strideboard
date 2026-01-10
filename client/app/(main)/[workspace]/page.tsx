"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { FolderOpen, Plus, Search, Loader2, X, Settings } from "lucide-react";
import { Workspace, Project } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import ProjectCard from "@/components/project/project-card";

export default function WorkspaceProjectsPage() {
    const params = useParams();
    const workspaceId = params.workspace as string;

    // Data State
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDescription, setNewDescription] = useState("");

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
            <div className="flex items-center justify-between mb-8">
                {/* Search - Left Side */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
                
                {/* Settings Button - Right Side */}
                <button 
                    className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
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
                                <p className="text-sm text-gray-500 mt-0.5">Start a new initiative in this workspace.</p>
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
                                    placeholder="e.g. Website Redesign"
                                    className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
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
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
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
        </div>
    );
}