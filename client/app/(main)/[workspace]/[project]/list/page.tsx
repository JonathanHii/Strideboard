"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { projectService } from "@/services/project-service";
import { WorkItem, WorkItemStatus, WorkItemPriority } from "@/types/types";
import { Search, Plus, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type SortField = "title" | "status" | "priority" | "createdAt" | "assignee";
type SortDirection = "asc" | "desc";

const STATUS_ORDER: Record<WorkItemStatus, number> = {
    BACKLOG: 0,
    TODO: 1,
    IN_PROGRESS: 2,
    DONE: 3,
};

const PRIORITY_ORDER: Record<WorkItemPriority, number> = {
    URGENT:  0,
    HIGH: 1,
    MEDIUM:  2,
    LOW: 3,
};

export default function ListPage() {
    const params = useParams();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    useEffect(() => {
        const fetchListData = async () => {
            try {
                const workspaceId = params.workspace as string;
                const projectId = params. project as string;
                if (workspaceId && projectId) {
                    const data = await projectService. getProjectWorkItems(workspaceId, projectId);
                    setItems(data);
                }
            } catch (err:  any) {
                setError(err.message || "Failed to load list");
            } finally {
                setIsLoading(false);
            }
        };
        fetchListData();
    }, [params]);

    const handleSort = (field:  SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ?  "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const sortedAndFilteredItems = useMemo(() => {
        let filtered = items. filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        return filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case "title":
                    comparison = a.title. localeCompare(b.title);
                    break;
                case "status": 
                    comparison = STATUS_ORDER[a. status] - STATUS_ORDER[b.status];
                    break;
                case "priority":
                    comparison = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
                    break;
                case "createdAt": 
                    comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "assignee":
                    const nameA = a.assignee?.fullName || "";
                    const nameB = b. assignee?.fullName || "";
                    comparison = nameA. localeCompare(nameB);
                    break;
            }

            return sortDirection === "asc" ? comparison :  -comparison;
        });
    }, [items, searchQuery, sortField, sortDirection]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <ChevronsUpDown className="h-3 w-3 text-slate-300" />;
        }
        return sortDirection === "asc" 
            ? <ChevronUp className="h-3 w-3 text-indigo-600" />
            :  <ChevronDown className="h-3 w-3 text-indigo-600" />;
    };

    if (isLoading) return <div className="p-10 animate-pulse text-slate-400">Loading list...</div>;
    if (error) return <div className="p-10 text-red-500 font-medium">Error: {error}</div>;

    return (
        <div className="h-full w-full flex flex-col">
            
            {/* --- List Toolbar (Fixed at top) --- */}
            <div className="flex items-center justify-between mb-6 flex-none">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target. value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                <button 
                    onClick={() => console.log("Open Create Modal")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-indigo-100"
                >
                    <Plus className="h-4 w-4" />
                    New Item
                </button>
            </div>

            {/* --- Table Container (Scrollable Area) --- */}
            <div className="flex-1 overflow-auto min-h-0 border border-slate-200 rounded-xl [scrollbar-gutter:stable]">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th 
                                className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => handleSort("title")}
                            >
                                <div className="flex items-center gap-1">
                                    Title
                                    <SortIcon field="title" />
                                </div>
                            </th>
                            <th 
                                className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-32"
                                onClick={() => handleSort("status")}
                            >
                                <div className="flex items-center gap-1">
                                    Status
                                    <SortIcon field="status" />
                                </div>
                            </th>
                            <th 
                                className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-28"
                                onClick={() => handleSort("priority")}
                            >
                                <div className="flex items-center gap-1">
                                    Priority
                                    <SortIcon field="priority" />
                                </div>
                            </th>
                            <th 
                                className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors w-40"
                                onClick={() => handleSort("assignee")}
                            >
                                <div className="flex items-center gap-1">
                                    Assignee
                                    <SortIcon field="assignee" />
                                </div>
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest w-20">
                                Type
                            </th>
                            <th 
                                className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover: bg-slate-100 transition-colors w-28"
                                onClick={() => handleSort("createdAt")}
                            >
                                <div className="flex items-center gap-1">
                                    Created
                                    <SortIcon field="createdAt" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedAndFilteredItems.map((item) => (
                            <WorkItemRow key={item.id} item={item} />
                        ))}
                        {sortedAndFilteredItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm italic">
                                    {searchQuery ? "No items match your search" : "No items in this project"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Footer Stats --- */}
            <div className="flex-none pt-4 text-xs text-slate-400">
                Showing {sortedAndFilteredItems.length} of {items. length} items
            </div>
        </div>
    );
}

function WorkItemRow({ item }: { item: WorkItem }) {
    const STATUS_CONFIG:  Record<WorkItemStatus, string> = {
        BACKLOG: "bg-slate-100 text-slate-600 border-slate-200",
        TODO: "bg-amber-50 text-amber-700 border-amber-200",
        IN_PROGRESS:  "bg-blue-50 text-blue-700 border-blue-200",
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
        <tr className="hover:bg-slate-50 cursor-pointer group transition-colors">
            <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-slate-800 group-hover: text-indigo-600 transition-colors">
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
                    {item.status. replace("_", " ")}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${priorityStyle}`}>
                    {item.priority}
                </span>
            </td>
            <td className="px-4 py-3">
                {item.assignee ?  (
                    <div className="flex items-center gap-2">
                        <div
                            className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-bold flex-shrink-0"
                            title={item.assignee.fullName}
                        >
                            {item.assignee.fullName. charAt(0)}
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
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day:  'numeric', year: 'numeric' })}
                </span>
            </td>
        </tr>
    );
}