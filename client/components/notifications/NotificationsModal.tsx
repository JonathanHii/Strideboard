"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Bell, Inbox, UserPlus, ChevronRight } from "lucide-react";
import { InboxItem } from "@/types/types";



interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = "all" | "invites" | "updates";

export default function NotificationsModal({
    isOpen,
    onClose,
}: NotificationsModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("all");

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Mock Data
    const allItems: InboxItem[] = [
        {
            id: 1,
            type: "invite",
            workspaceName: "Design Team",
            projectName: null,
            title: "Join Workspace",
            subtitle: "Invited by Sarah Chen",
            time: "2m ago",
            isUnread: true,
            referenceId: "workspace-123"
        },
        {
            id: 2,
            type: "update",
            workspaceName: "Strideboard",
            projectName: "UI Kit",
            title: "Button Component Fix",
            subtitle: "Assigned to you by John Doe",
            time: "15m ago",
            isUnread: true,
            referenceId: "task-456"
        },
        {
            id: 3,
            type: "invite",
            workspaceName: "Acme Corp",
            projectName: null,
            title: "Join Workspace",
            subtitle: "Invited by Mike Ross",
            time: "1h ago",
            isUnread: false,
            referenceId: "workspace-789"
        },
        {
            id: 4,
            type: "update",
            workspaceName: "Marketing",
            projectName: "Q4 Planning",
            title: "Roadmap Review",
            subtitle: "Due date updated to Nov 15",
            time: "1d ago",
            isUnread: false,
            referenceId: "task-101"
        },
        {
            id: 5,
            type: "update",
            workspaceName: "Engineering",
            projectName: "Mobile App",
            title: "Mobile View Fixes",
            subtitle: "Review comments added",
            time: "2d ago",
            isUnread: false,
            referenceId: "task-202"
        },
    ];

    const filteredItems = allItems.filter((item) => {
        if (activeTab === "all") return true;
        if (activeTab === "invites") return item.type === "invite";
        if (activeTab === "updates") return item.type === "update";
        return true;
    });

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-white/50 ring-1 ring-black/5">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Inbox
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 pb-0 border-b border-gray-100 bg-white flex gap-6 text-sm font-medium z-10 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.02)]">
                    {(["all", "invites", "updates"] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 border-b-2 capitalize transition-all ${activeTab === tab
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/80 p-5">
                    {filteredItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                            <Inbox className="w-12 h-12 mb-3 text-gray-200" />
                            <p className="text-sm font-medium text-gray-500">No notifications found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group relative p-3.5 bg-white rounded-xl border transition-all flex gap-3.5
                                        ${item.isUnread
                                            ? 'border-indigo-100 shadow-[0_2px_8px_-2px_rgba(79,70,229,0.1)]'
                                            : 'border-gray-200/60 shadow-sm hover:border-gray-300 hover:shadow-md'
                                        }`}
                                >
                                    {/* Icon/Avatar - Now Static Color */}
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-600">
                                        {item.type === 'invite' ? <UserPlus className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 min-w-0 pr-6">

                                        {/* Breadcrumbs */}
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-0.5">
                                            <span>{item.workspaceName}</span>
                                            {item.projectName && (
                                                <>
                                                    <ChevronRight className="w-3 h-3 text-gray-300" />
                                                    <span className="truncate max-w-[120px]">{item.projectName}</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-start mb-0.5">
                                            <p className={`text-sm truncate ${item.isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {item.title}
                                            </p>
                                        </div>

                                        <p className="text-xs text-gray-500 truncate mb-2">
                                            {item.subtitle}
                                        </p>

                                        <p className="text-[10px] text-gray-400 font-medium">
                                            {item.time}
                                        </p>

                                        {/* Invite Actions */}
                                        {item.type === 'invite' && (
                                            <div className="flex gap-2 mt-3">
                                                <button className="text-xs font-medium px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-100">
                                                    Accept
                                                </button>
                                                <button className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 text-gray-600 rounded-lg transition-colors shadow-sm">
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Always Visible Mark Read Button (Only for updates) */}
                                    {item.type !== 'invite' && (
                                        <button
                                            className="absolute right-3 top-3 p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}