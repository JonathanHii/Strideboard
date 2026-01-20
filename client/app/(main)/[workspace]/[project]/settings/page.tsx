"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { workspaceService } from "@/services/workspace-service";
import { projectService } from "@/services/project-service";
import { Project } from "@/types/types";
import {
    Save,
    Trash2,
    AlertTriangle,
    Loader2,
    Check,
    X,
} from "lucide-react";

export default function SettingsPage() {
    const params = useParams();
    const router = useRouter();

    // Data states
    const [project, setProject] = useState<Project | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [isCreator, setIsCreator] = useState<boolean>(false);

    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [projectName, setProjectName] = useState("");
    const [projectDescription, setProjectDescription] = useState("");

    // Save states
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingDescription, setIsSavingDescription] = useState(false);
    const [nameSuccess, setNameSuccess] = useState(false);
    const [descriptionSuccess, setDescriptionSuccess] = useState(false);

    // Delete states
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const workspaceId = params.workspace as string;
    const projectId = params.project as string;

    useEffect(() => {
        const fetchSettingsData = async () => {
            try {
                if (workspaceId && projectId) {
                    const [projectData, memberData, creatorStatus] = await Promise.all([
                        projectService.getProjectById(workspaceId, projectId),
                        workspaceService.getCurrentUserInWorkspace(workspaceId),
                        projectService.isProjectCreator(workspaceId, projectId)
                    ]);

                    setProject(projectData);
                    setProjectName(projectData.name || "");
                    setProjectDescription(projectData.description || "");
                    setUserRole(memberData.role);
                    setIsCreator(creatorStatus);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load project settings");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettingsData();
    }, [workspaceId, projectId]);

    const isAdmin = userRole === "ADMIN";
    const canEditName = isAdmin || isCreator;
    const canDelete = isAdmin || isCreator;
    const canEditDescription = isAdmin || isCreator || userRole === "MEMBER";

    const handleSaveName = async () => {
        if (!canEditName) return;
        if (!projectName.trim() || projectName === project?.name) return;

        setIsSavingName(true);
        setNameSuccess(false);
        try {
            await projectService.updateProjectName(workspaceId, projectId, projectName.trim());
            setProject(prev => prev ? { ...prev, name: projectName.trim() } : null);
            setNameSuccess(true);
            window.dispatchEvent(new Event("breadcrumbs:refresh"));
            window.dispatchEvent(new Event("projectUpdated"));
            setTimeout(() => setNameSuccess(false), 2000);
        } catch (err: any) {
            console.error("Failed to update project name", err);
            alert(err.message || "Failed to update project name. Please try again.");
            if (project) setProjectName(project.name);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleSaveDescription = async () => {
        if (!canEditDescription) return;
        if (projectDescription === (project?.description || "")) return;

        setIsSavingDescription(true);
        setDescriptionSuccess(false);
        try {
            await projectService.updateProjectDescription(workspaceId, projectId, projectDescription);
            setProject(prev => prev ? { ...prev, description: projectDescription } : null);
            setDescriptionSuccess(true);
            setTimeout(() => setDescriptionSuccess(false), 2000);
        } catch (err: any) {
            console.error("Failed to update project description", err);
            alert(err.message || "Failed to update project description. Please try again.");
            if (project) setProjectDescription(project.description || "");
        } finally {
            setIsSavingDescription(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!canDelete) return;
        if (deleteConfirmText !== project?.name) return;

        setIsDeleting(true);
        try {
            await projectService.deleteProject(workspaceId, projectId);
            router.push(`/${workspaceId}`);
        } catch (err: any) {
            console.error("Failed to delete project", err);
            alert(err.message || "Failed to delete project. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const openDeleteModal = () => {
        setIsDeleteModalOpen(true);
        setDeleteConfirmText("");
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeleteConfirmText("");
    };

    const hasNameChanged = projectName.trim() !== (project?.name || "") && projectName.trim() !== "";
    const hasDescriptionChanged = projectDescription !== (project?.description || "");

    if (isLoading) {
        return (
            <div className="p-10 flex items-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading settings...
            </div>
        );
    }

    if (error) {
        return <div className="p-10 text-red-500 font-medium">Error: {error}</div>;
    }

    return (
        <div className="h-full w-full overflow-y-auto px-1 sm:pr-4">
            <div className="pb-12 space-y-8">

                {/* --- General Settings --- */}
                <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                            General Settings
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6 space-y-5">

                        {/* Project Name */}
                        <div>
                            <label htmlFor="projectName" className="block text-sm text-slate-700 mb-1.5">
                                Project Name
                            </label>
                            {/* Changed to flex-col on mobile, flex-row on desktop */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <input
                                    id="projectName"
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Enter project name"
                                    disabled={!canEditName}
                                    className={`flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${!canEditName ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                                />
                                {canEditName && (
                                    <button
                                        onClick={handleSaveName}
                                        disabled={!hasNameChanged || isSavingName}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm sm:min-w-[100px] justify-center ${nameSuccess
                                            ? "bg-green-500 hover:bg-green-600 text-white"
                                            : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white"
                                            }`}
                                    >
                                        {isSavingName ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : nameSuccess ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Project Description */}
                        <div>
                            <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-1.5">
                                Description
                            </label>
                            <textarea
                                id="projectDescription"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Describe your project..."
                                rows={3}
                                disabled={!canEditDescription}
                                className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none ${!canEditDescription ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}`}
                            />
                            {canEditDescription && (
                                <div className="pt-3">
                                    <button
                                        onClick={handleSaveDescription}
                                        disabled={!hasDescriptionChanged || isSavingDescription}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm w-full sm:w-auto sm:min-w-[140px] justify-center ${descriptionSuccess
                                            ? "bg-green-500 hover:bg-green-600 text-white"
                                            : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white"
                                            }`}
                                    >
                                        {isSavingDescription ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : descriptionSuccess ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save Description
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* --- Danger Zone --- */}
                {canDelete && (
                    <section className="bg-white border border-red-200 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide">
                                    Danger Zone
                                </h2>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Delete Project Row */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/30 gap-4">
                                <div className="max-w-md">
                                    <h3 className="text-sm font-semibold text-slate-700">Delete Project</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Permanently delete this project and all its data. This cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={openDeleteModal}
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* --- Delete Confirmation Modal --- */}
            {isDeleteModalOpen && canDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Delete Project</h2>
                            </div>
                            <button
                                onClick={closeDeleteModal}
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <p className="text-sm text-red-800 leading-relaxed">
                                    <strong>Warning: </strong> This action cannot be undone. This will permanently delete the
                                    <strong className="mx-1 break-all">{project?.name}</strong>
                                    project and all of its work items.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Type <span className="font-mono text-red-600 break-all">{project?.name}</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="Enter project name"
                                    className="w-full px-4 h-11 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium text-gray-900"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                            <button
                                onClick={closeDeleteModal}
                                className="w-full sm:w-auto px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteProject}
                                disabled={deleteConfirmText !== project?.name || isDeleting}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md font-medium"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete Project
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}