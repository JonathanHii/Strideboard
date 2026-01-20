"use client"

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { workspaceService } from "@/services/workspace-service";
import { workItemService } from "@/services/work-item-service";
import { WorkItem, WorkItemStatus, WorkItemPriority, WorkspaceMember } from "@/types/types";
import { Search, Plus, ChevronUp, ChevronDown, ChevronsUpDown, Calendar, User as UserIcon } from "lucide-react";
import CreateWorkItemModal from "@/components/board/CreateWorkItemModal";
import WorkItemDetailModal from "@/components/board/WorkItemDetailModal";
import ViewOnlyWorkItemModal from "@/components/board/ViewOnlyWorkItemModal";
import { useProjectSocket } from "@/hooks/use-project-socket";

type SortField = "title" | "status" | "priority" | "createdAt" | "assignee";
type SortDirection = "asc" | "desc";

const STATUS_ORDER: Record<WorkItemStatus, number> = {
    BACKLOG: 0,
    TODO: 1,
    IN_PROGRESS: 2,
    DONE: 3,
};

const PRIORITY_ORDER: Record<WorkItemPriority, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
};

export default function ListPage() {
    const params = useParams();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [currentMember, setCurrentMember] = useState<WorkspaceMember | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    // State for Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);

    const workspaceId = params.workspace as string;
    const projectId = params.project as string;

    const fetchListData = async () => {
        try {
            if (workspaceId && projectId) {
                const [data, memberData] = await Promise.all([
                    workItemService.getProjectWorkItems(workspaceId, projectId),
                    workspaceService.getCurrentUserInWorkspace(workspaceId)
                ]);

                setItems(data);
                setCurrentMember(memberData);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load list");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchListData();
    }, [params]);

    // Websocket
    const socketResult = useProjectSocket(projectId, (event) => {
        setItems((currentItems) => {
            switch (event.type) {
                case 'CREATED':
                    if (event.workItem && !currentItems.find(i => i.id === event.workItem!.id)) {
                        return [...currentItems, event.workItem];
                    }
                    return currentItems;
                case 'UPDATED':
                    if (!event.workItem) return currentItems;
                    return currentItems.map(item =>
                        item.id === event.workItem!.id ? event.workItem! : item
                    );
                case 'DELETED':
                    return currentItems.filter(item => item.id !== event.workItemId);
                default:
                    return currentItems;
            }
        });
    });

    const isConnected = (socketResult as any)?.isConnected ?? true;

    const handleCreateSuccess = async () => {
        await fetchListData();
    };

    const handleItemClick = (item: WorkItem) => setSelectedItem(item);
    const handleCloseDetail = () => setSelectedItem(null);

    const handleItemUpdate = async (updatedItem: WorkItem) => {
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
            )
        );
    };

    const handleItemDelete = async (itemId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        setSelectedItem(null);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedAndFilteredItems = useMemo(() => {
        let filtered = items.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
                case "status":
                    comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
                    break;
                case "priority":
                    comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                    break;
                case "createdAt":
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "assignee":
                    const nameA = a.assignee?.fullName || "";
                    const nameB = b.assignee?.fullName || "";
                    comparison = nameA.localeCompare(nameB);
                    break;
            }
            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [items, searchQuery, sortField, sortDirection]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ChevronsUpDown className="h-3 w-3 text-slate-300" />;
        }
        return sortDirection === "asc"
            ? <ChevronUp className="h-3 w-3 text-indigo-600" />
            : <ChevronDown className="h-3 w-3 text-indigo-600" />;
    };

    const isViewer = currentMember?.role === "Viewer";

    if (isLoading) return <div className="p-10 animate-pulse text-slate-400">Loading list...</div>;
    if (error) return <div className="p-10 text-red-500 font-medium">Error: {error}</div>;

    return (
        <div className="h-full w-full flex flex-col">

            {/* --- List Toolbar --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-1 md:mb-6 gap-4 flex-none">

                {/* Search Bar & Mobile Add Button */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>
                    {/* Mobile Only: Add Button (Small +) */}
                    {!isViewer && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="md:hidden flex items-center justify-center h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-100 transition-all flex-shrink-0"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="flex items-center gap-1.5 px-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-400"}`} />
                        <span className={`text-xs font-medium ${isConnected ? "text-green-600" : "text-red-500"}`}>
                            {isConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>

                    {/* Desktop Only: Add Button (Full Text) */}
                    {!isViewer && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-indigo-100"
                        >
                            <Plus className="h-4 w-4" />
                            New Item
                        </button>
                    )}
                </div>
            </div>

            {/* --- Content Area --- */}
            <div className={`
                flex-1 overflow-y-auto min-h-0 md:border border-slate-200 md:rounded-xl 
                bg-white
                [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]
            `}>

                {/* Desktop View: Table */}
                <table className="hidden md:table w-full min-w-[800px]">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("title")}>
                                <div className="flex items-center gap-1">Title <SortIcon field="title" /></div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-32" onClick={() => handleSort("status")}>
                                <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-28" onClick={() => handleSort("priority")}>
                                <div className="flex items-center gap-1">Priority <SortIcon field="priority" /></div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-40" onClick={() => handleSort("assignee")}>
                                <div className="flex items-center gap-1">Assignee <SortIcon field="assignee" /></div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-20">Type</th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-28" onClick={() => handleSort("createdAt")}>
                                <div className="flex items-center gap-1">Created <SortIcon field="createdAt" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedAndFilteredItems.map((item) => (
                            <WorkItemRow
                                key={item.id}
                                item={item}
                                onClick={() => handleItemClick(item)}
                            />
                        ))}
                    </tbody>
                </table>

                {/* Mobile View: Connected List */}
                <div className="md:hidden p-4">
                    <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                        {sortedAndFilteredItems.map((item) => (
                            <MobileWorkItemCard
                                key={item.id}
                                item={item}
                                onClick={() => handleItemClick(item)}
                            />
                        ))}
                        {sortedAndFilteredItems.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm italic">
                                {searchQuery ? "No items match your search" : "No items in this project"}
                            </div>
                        )}
                    </div>
                </div>

                {sortedAndFilteredItems.length === 0 && !searchQuery && items.length === 0 && (
                    <div className="hidden md:block px-4 py-12 text-center text-slate-400 text-sm italic">
                        No items in this project
                    </div>
                )}
            </div>

            {/* --- Footer Stats --- */}
            <div className="flex-none pt-4 text-xs text-slate-400 hidden md:block">
                Showing {sortedAndFilteredItems.length} of {items.length} items
            </div>

            {/* --- Modals --- */}
            <CreateWorkItemModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                workspaceId={workspaceId}
                projectId={projectId}
            />

            {isViewer ? (
                <ViewOnlyWorkItemModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={handleCloseDetail}
                />
            ) : (
                <WorkItemDetailModal
                    item={selectedItem}
                    isOpen={!!selectedItem}
                    onClose={handleCloseDetail}
                    onUpdate={handleItemUpdate}
                    onDelete={handleItemDelete}
                    workspaceId={workspaceId}
                    projectId={projectId}
                />
            )}
        </div>
    );
}

// Desktop Row Component
function WorkItemRow({ item, onClick }: { item: WorkItem; onClick: () => void }) {
    const STATUS_CONFIG: Record<WorkItemStatus, string> = {
        BACKLOG: "bg-slate-100 text-slate-600 border-slate-200",
        TODO: "bg-amber-50 text-amber-700 border-amber-200",
        IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
        DONE: "bg-green-50 text-green-700 border-green-200",
    };

    const PRIORITY_CONFIG: Record<WorkItemPriority, string> = {
        URGENT: "bg-red-50 text-red-700 border-red-200",
        HIGH: "bg-orange-50 text-orange-700 border-orange-200",
        MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
        LOW: "bg-slate-50 text-slate-600 border-slate-200",
    };

    const statusStyle = STATUS_CONFIG[item.status] || STATUS_CONFIG.BACKLOG;
    const priorityStyle = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.LOW;

    return (
        <tr
            onClick={onClick}
            className="hover:bg-slate-50 cursor-pointer group transition-colors"
        >
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {item.title}
                    </span>
                    {item.description && (
                        <span className="text-xs text-slate-400 line-clamp-1">
                            {item.description}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${statusStyle}`}>
                    {item.status.replace("_", " ")}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${priorityStyle}`}>
                    {item.priority}
                </span>
            </td>
            <td className="px-4 py-3">
                {item.assignee ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-bold flex-shrink-0"
                            title={item.assignee.fullName}
                        >
                            {item.assignee.fullName.charAt(0)}
                        </div>
                        <span className="text-sm text-slate-600 truncate">
                            {item.assignee.fullName}
                        </span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 italic">Unassigned</span>
                )}
            </td>
            <td className="px-4 py-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {item.type}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </td>
        </tr>
    );
}

// Mobile Card Component
function MobileWorkItemCard({ item, onClick }: { item: WorkItem; onClick: () => void }) {
    const STATUS_CONFIG: Record<WorkItemStatus, string> = {
        BACKLOG: "bg-slate-100 text-slate-600 border-slate-200",
        TODO: "bg-amber-50 text-amber-700 border-amber-200",
        IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
        DONE: "bg-green-50 text-green-700 border-green-200",
    };

    const statusStyle = STATUS_CONFIG[item.status];

    return (
        <div onClick={onClick} className="bg-white p-4 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${statusStyle}`}>
                    {item.status.replace("_", " ")}
                </span>
                {item.priority === 'URGENT' || item.priority === 'HIGH' ? (
                    <span className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-1">
                        {item.priority}
                    </span>
                ) : null}
            </div>

            <h3 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2">{item.title}</h3>
            {item.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{item.description}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    {item.assignee ? (
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold">
                            {item.assignee.fullName.charAt(0)}
                        </div>
                    ) : (
                        <UserIcon className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.type}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span className="text-[10px]">
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </div>
        </div>
    )
}