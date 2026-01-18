"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Users, Loader2 } from "lucide-react";
import { Workspace, WorkspaceMember } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import { useRouter } from "next/navigation";

interface WorkspaceMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: Workspace;
}

export default function WorkspaceMembersModal({
    isOpen,
    onClose,
    workspace,
}: WorkspaceMembersModalProps) {
    const [currentUser, setCurrentUser] = useState<WorkspaceMember | null>(null);
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    // New state for the leave action (loader)
    const [isLeaving, setIsLeaving] = useState(false);

    // Load Members
    const loadMemberData = useCallback(async () => {
        if (!workspace.id) return;
        setLoading(true);
        try {
            const [currentUserData, membersData] = await Promise.all([
                workspaceService.getCurrentUserInWorkspace(workspace.id),
                workspaceService.getWorkspaceMembers(workspace.id),
            ]);
            setCurrentUser(currentUserData);
            setMembers(membersData);
        } catch (err) {
            console.error("Error loading member data:", err);
        } finally {
            setLoading(false);
        }
    }, [workspace.id]);

    useEffect(() => {
        if (isOpen) {
            loadMemberData();
        }
    }, [isOpen, loadMemberData]);

    const handleLeaveWorkspace = async () => {
        if (!confirm("Are you sure you want to leave this workspace?")) return;

        setIsLeaving(true);
        try {
            await workspaceService.leaveWorkspace(workspace.id);

            onClose();
            window.dispatchEvent(new Event("workspace-updated"));
            router.push("/workspaces");
        } catch (error) {
            console.error("Failed to leave workspace", error);
            alert(error instanceof Error ? error.message : "Failed to leave workspace.");
        } finally {
            setIsLeaving(false);
        }
    };

    // Helper Utils
    const getInitials = (name: string, email: string) => {
        if (name && name.trim()) {
            const parts = name.trim().split(" ");
            return parts.length >= 2
                ? (parts[0][0] + parts[1][0]).toUpperCase()
                : name.slice(0, 2).toUpperCase();
        }
        return email.slice(0, 2).toUpperCase();
    };

    const getAvatarColor = (role: string) => {
        switch (role.toUpperCase()) {
            case "ADMIN":
                return "bg-indigo-100 text-indigo-700";
            case "MEMBER":
                return "bg-orange-100 text-orange-700";
            case "VIEWER":
                return "bg-green-100 text-green-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-500" />
                            Workspace Members
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            People with access to <strong>{workspace.name}</strong>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter:stable]">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <div className="space-y-6"> {/* Increased space-y to separate sections */}

                            {/* Member List Section */}
                            <div className="space-y-3">
                                {/* Current User Card */}
                                {currentUser && (
                                    <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(
                                                    currentUser.role
                                                )}`}
                                            >
                                                You
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {currentUser.name || currentUser.email}
                                                    <span className="ml-2 text-xs text-indigo-600 font-normal">
                                                        (You)
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {currentUser.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Other Members List */}
                                {members
                                    .filter((member) => currentUser && member.id !== currentUser.id)
                                    .map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(
                                                        member.role
                                                    )}`}
                                                >
                                                    {getInitials(member.name, member.email)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {member.name || member.email}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{member.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                {members.length <= 1 && (
                                    <div className="text-center py-6 text-gray-500 text-sm">
                                        No other members in this workspace.
                                    </div>
                                )}
                            </div>

                            <hr className="border-gray-100" />

                            {/* Danger Zone - Leave Workspace */}
                            <section>
                                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">
                                    Danger Zone
                                </h3>
                                <div className="border border-red-100 bg-red-50 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-bold text-red-900">
                                            Leave Workspace
                                        </h4>
                                        <p className="text-sm text-red-700 mt-1">
                                            Revoke your access to this workspace.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleLeaveWorkspace}
                                        disabled={isLeaving}
                                        className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isLeaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Leave Workspace
                                    </button>
                                </div>
                            </section>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}