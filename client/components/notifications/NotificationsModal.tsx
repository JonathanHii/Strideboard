"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Bell, Inbox, UserPlus, ChevronRight, Loader2 } from "lucide-react";
import { InboxItem } from "@/types/types";
import { notificationService } from "@/services/notification-service";

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FilterType = 'all' | InboxItem['type'];

export default function NotificationsModal({
    isOpen,
    onClose,
}: NotificationsModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>("all");
    const [notifications, setNotifications] = useState<InboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            fetchNotifications();
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error("Failed to load notifications", err);
            setError("Failed to load notifications");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkRead = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationService.markRead(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const handleAcceptInvite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationService.acceptInvite(id);
            window.dispatchEvent(new Event("workspace-updated"));

            setNotifications((prev) => prev.filter((n) => n.id !== id));
            onClose();
        } catch (err) {
            console.error("Failed to accept invite", err);
        }
    };

    const handleRejectInvite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await notificationService.rejectInvite(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (err) {
            console.error("Failed to reject invite", err);
        }
    };

    const filteredItems = notifications.filter((item) => {
        if (activeFilter === "all") return true;
        return item.type === activeFilter;
    });

    if (!mounted || !isOpen) return null;

    const getTabLabel = (type: FilterType) => {
        switch (type) {
            case 'all': return 'All';
            case 'invite': return 'Invites';
            case 'update': return 'Updates';
        }
    };

    const tabs: FilterType[] = ['all', 'invite', 'update'];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden border border-white/50 ring-1 ring-black/5">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        Inbox
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 pb-0 border-b border-gray-100 bg-white flex gap-6 text-sm font-medium z-10 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.02)]">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`pb-3 border-b-2 transition-all ${activeFilter === tab
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {getTabLabel(tab)}
                        </button>
                    ))}
                </div>

                {/* Content List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/80 p-5">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                            <p className="text-sm">Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center text-red-400 min-h-[300px]">
                            <p className="text-sm">{error}</p>
                            <button onClick={fetchNotifications} className="mt-2 text-indigo-600 text-xs hover:underline">Try Again</button>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                            <Inbox className="w-12 h-12 mb-3 text-gray-200" />
                            <p className="text-sm font-medium text-gray-500">No notifications found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative p-3.5 bg-white rounded-xl border border-gray-200/60 shadow-sm hover:border-gray-300 hover:shadow-md transition-all flex gap-3.5"
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                    ${item.type === 'invite' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {item.type === 'invite' ? <UserPlus className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-6">
                                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-0.5">
                                            <span>{item.workspaceName}</span>
                                            {item.projectName && (
                                                <>
                                                    <ChevronRight className="w-3 h-3 text-gray-300" />
                                                    <span className="truncate max-w-[120px]">{item.projectName}</span>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-sm font-medium text-gray-700 truncate mb-0.5">
                                            {item.type === 'invite' ? "Workspace Invitation" : item.subtitle}
                                        </p>

                                        {item.type === 'invite' && (
                                            <p className="text-xs text-gray-500 truncate mb-2">
                                                {item.subtitle}
                                            </p>
                                        )}

                                        <p className="text-[10px] text-gray-400 font-medium">
                                            {item.time}
                                        </p>

                                        {/* Invite Buttons */}
                                        {item.type === 'invite' && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={(e) => handleAcceptInvite(e, item.id)}
                                                    className="text-xs font-medium px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm shadow-indigo-100"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={(e) => handleRejectInvite(e, item.id)}
                                                    className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 text-gray-600 rounded-lg transition-colors shadow-sm"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mark Read (Only for updates) */}
                                    {item.type !== 'invite' && (
                                        <button
                                            onClick={(e) => handleMarkRead(e, item.id)}
                                            className="absolute right-3 top-3 p-1.5 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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