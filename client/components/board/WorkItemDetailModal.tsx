"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { projectService } from "@/services/project-service";
import { workspaceService } from "@/services/workspace-service";
import { workItemService } from "@/services/work-item-service";
import {
    WorkItem,
    WorkItemStatus,
    WorkItemPriority,
    WorkItemType,
    WorkspaceMember,
    UpdateWorkItemRequest,
    WorkspaceRole,
} from "@/types/types";
import {
    X,
    Loader2,
    FileText,
    User,
    AlertCircle,
    Flag,
    Layers,
    Trash2,
    Clock,
    UserCircle,
    Plus,
} from "lucide-react";
import { TYPES, STATUSES, PRIORITIES } from "./contants";

interface WorkItemDetailModalProps {
    item: WorkItem | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updatedItem: WorkItem) => void;
    onDelete: (itemId: string) => void;
    workspaceId: string;
    projectId: string;
}

export default function WorkItemDetailModal({
    item,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    workspaceId,
    projectId,
}: WorkItemDetailModalProps) {
    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<WorkItemStatus>("BACKLOG");
    const [priority, setPriority] = useState<WorkItemPriority>("MEDIUM");
    const [type, setType] = useState<WorkItemType>("TASK");
    const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);

    // Members State
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);

    // Assignee Search State
    const [memberSearchQuery, setMemberSearchQuery] = useState("");
    const [filteredMembers, setFilteredMembers] = useState<WorkspaceMember[]>([]);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Submission State
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Populate form when item changes
    useEffect(() => {
        if (item) {
            setTitle(item.title);
            setDescription(item.description || "");
            setStatus(item.status);
            setPriority(item.priority);
            setType(item.type);
            setAssigneeId(item.assignee?.id);
            setShowDeleteConfirm(false);
            setShowAssigneeDropdown(false);
        }
    }, [item]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setMemberSearchQuery("");
            setFilteredMembers([]);
            setShowAssigneeDropdown(false);
            setMembers([]);
            setShowDeleteConfirm(false);
        }
    }, [isOpen]);

    // Fetch members when modal opens
    useEffect(() => {
        if (isOpen && workspaceId) {
            const fetchMembers = async () => {
                setIsLoadingMembers(true);
                try {
                    const data = await workspaceService.getWorkspaceMembers(workspaceId);
                    setMembers(data);
                    setFilteredMembers(data);
                } catch (err) {
                    console.error("Failed to fetch members", err);
                } finally {
                    setIsLoadingMembers(false);
                }
            };
            fetchMembers();
        }
    }, [isOpen, workspaceId]);

    // Debounced search/filter for members
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(() => {
            if (!memberSearchQuery.trim()) {
                setFilteredMembers(members);
                return;
            }

            const query = memberSearchQuery.toLowerCase();
            const filtered = members.filter(
                (member) =>
                    member.name?.toLowerCase().includes(query) ||
                    member.email.toLowerCase().includes(query)
            );
            setFilteredMembers(filtered);
        }, 200);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [memberSearchQuery, members]);

    // Derived state to determine who is currently assigned (Local state takes precedence)
    const currentAssignee = useMemo(() => {
        if (!assigneeId) return null;

        // First try to find in the fetched members list
        const foundMember = members.find((m) => m.id === assigneeId);
        if (foundMember) return foundMember;

        // Fallback: Use item's original assignee data if IDs match
        if (item?.assignee && item.assignee.id === assigneeId) {
            return {
                id: item.assignee.id,
                name: item.assignee.fullName,
                email: item.assignee.email,
                role: "MEMBER",
                joinedAt: new Date().toISOString(),
            } as unknown as WorkspaceMember;
        }
        return null;
    }, [members, assigneeId, item]);

    // Check if any changes have been made to the form
    const hasChanges = useMemo(() => {
        if (!item) return false;

        const currentTitle = title.trim();
        const originalTitle = item.title;

        // Normalize description (handle null vs empty string)
        const currentDesc = description.trim() || "";
        const originalDesc = (item.description || "").trim();

        // Normalize assignee (handle undefined vs null)
        const currentAssignee = assigneeId || null;
        const originalAssignee = item.assignee?.id || null;

        return (
            currentTitle !== originalTitle ||
            currentDesc !== originalDesc ||
            status !== item.status ||
            priority !== item.priority ||
            type !== item.type ||
            currentAssignee !== originalAssignee
        );
    }, [item, title, description, status, priority, type, assigneeId]);

    const handleSelectAssignee = (memberId: string) => {
        setAssigneeId(memberId);
        setMemberSearchQuery("");
        setShowAssigneeDropdown(false);
    };

    const handleClearAssignee = () => {
        setAssigneeId(undefined);
        setMemberSearchQuery("");
        setShowAssigneeDropdown(false);
    };

    const handleSave = async () => {
        if (!item || !title.trim()) return;

        setIsSaving(true);
        try {

            const shouldRemoveAssignee = !assigneeId;

            const payload: UpdateWorkItemRequest = {
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                type,
                assigneeId: assigneeId || null,
                removeAssignee: shouldRemoveAssignee,
            };

            const updatedItem = await workItemService.updateWorkItem(
                workspaceId,
                projectId,
                item.id,
                payload
            );

            onUpdate(updatedItem);
            onClose();
        } catch (error: any) {
            console.error("Failed to update work item", error);
            alert(error.message || "Failed to update work item. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!item) return;

        setIsDeleting(true);
        try {
            await workItemService.deleteWorkItem(workspaceId, projectId, item.id);
            onDelete(item.id);
        } catch (error: any) {
            console.error("Failed to delete work item", error);
            alert(error.message || "Failed to delete work item. Please try again.");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-20 rounded-t-2xl">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Work Item Details
                            </h2>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                {item.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Edit and manage this work item.
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
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter:stable]">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Implement user authentication"
                                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details about this work item..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    {/* Type, Status, Priority */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Layers className="w-4 h-4 inline mr-1.5 text-gray-400" />
                                Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as WorkItemType)}
                                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm font-medium"
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <AlertCircle className="w-4 h-4 inline mr-1.5 text-gray-400" />
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as WorkItemStatus)}
                                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm font-medium"
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                <Flag className="w-4 h-4 inline mr-1.5 text-gray-400" />
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as WorkItemPriority)}
                                className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 text-sm font-medium"
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Assignee Section */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Assignee
                        </label>

                        {currentAssignee ? (
                            /* Case 1: Assigned */
                            <div className="flex items-center justify-between p-3 bg-indigo-5 border border-indigo-100 rounded-xl group hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                        {currentAssignee.name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {currentAssignee.name || "Unknown User"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {currentAssignee.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClearAssignee}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                    title="Remove assignee"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : !showAssigneeDropdown ? (
                            /* Case 2: Unassigned ("Add" button) */
                            <button
                                onClick={() => setShowAssigneeDropdown(true)}
                                className="w-full h-12 border border-dashed border-gray-300 rounded-xl flex items-center gap-3 px-3 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 text-gray-500 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center bg-white group-hover:border-gray-400">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Assign a member</span>
                            </button>
                        ) : (
                            /* Case 3: Searching */
                            <div className="relative animate-in fade-in zoom-in-95 duration-150">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={memberSearchQuery}
                                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                                    autoFocus
                                    placeholder="Search team members..."
                                    className="w-full pl-11 pr-4 h-11 border border-indigo-500 ring-2 ring-indigo-500/20 rounded-xl outline-none transition-all"
                                    autoComplete="off"
                                />
                                <button
                                    onClick={() => setShowAssigneeDropdown(false)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-56 overflow-y-auto z-50 ring-1 ring-black/5 custom-scrollbar">
                                    {isLoadingMembers ? (
                                        <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading members...
                                        </div>
                                    ) : filteredMembers.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-400">
                                            No members found
                                        </div>
                                    ) : (
                                        <>
                                            {filteredMembers.map((member) => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => handleSelectAssignee(member.id)}
                                                    className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors group border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex shrink-0 items-center justify-center text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all font-bold text-xs">
                                                        {member.name?.charAt(0) || "?"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                                            {member.name || "Unknown User"}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>

                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowAssigneeDropdown(false)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <UserCircle className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Creator</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {item.creator.fullName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Created</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(item.createdAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Updated</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(item.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
                        {showDeleteConfirm ? (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-sm text-red-800 mb-3">
                                    Are you sure you want to delete &ldquo;{item.title}&rdquo;? This action cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg font-medium transition-all flex items-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-sm font-medium transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete this work item
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl z-20">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || isSaving || !hasChanges}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>Save Changes</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}