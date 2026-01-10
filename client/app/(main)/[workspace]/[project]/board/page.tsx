"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { projectService } from "@/services/project-service";
import { WorkItem, WorkItemStatus, WorkItemPriority } from "@/types/types";
import { Search, Plus } from "lucide-react";

const COLUMNS:  WorkItemStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "DONE"];

export default function BoardPage() {
    const params = useParams();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBoardData = async () => {
            try {
                const workspaceId = params. workspace as string;
                const projectId = params. project as string;
                if (workspaceId && projectId) {
                    const data = await projectService. getProjectWorkItems(workspaceId, projectId);
                    setItems(data);
                }
            } catch (err:  any) {
                setError(err. message || "Failed to load board");
            } finally {
                setIsLoading(false);
            }
        };
        fetchBoardData();
    }, [params]);

    const groupedItems = useMemo(() => {
        const groups = {} as Record<WorkItemStatus, WorkItem[]>;
        COLUMNS.forEach((status) => (groups[status] = []));

        // Filter items based on search query
        const filteredItems = items.filter(item => {
            if (!searchQuery. trim()) return true;
            
            const query = searchQuery.toLowerCase().trim();
            const titleMatch = item.title. toLowerCase().includes(query);
            const descriptionMatch = item.description?.toLowerCase().includes(query) || false;
            
            return titleMatch || descriptionMatch;
        });

        // Group filtered items by status
        filteredItems.forEach((item) => {
            if (groups[item.status]) {
                groups[item.status]. push(item);
            }
        });

        // Sort each group by position
        COLUMNS.forEach((status) => {
            groups[status].sort((a, b) => a.position - b.position);
        });

        return groups;
    }, [items, searchQuery]);

    // Calculate total filtered count for display
    const totalFilteredCount = useMemo(() => {
        return COLUMNS.reduce((acc, status) => acc + groupedItems[status].length, 0);
    }, [groupedItems]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e. target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    if (isLoading) return <div className="p-10 animate-pulse text-slate-400">Loading board...</div>;
    if (error) return <div className="p-10 text-red-500 font-medium">Error: {error}</div>;

    return (
        <div className="h-full w-full flex flex-col">
            
            {/* --- Board Toolbar (Fixed at top of board) --- */}
            <div className="flex items-center justify-between mb-6 flex-none">
                <div className="flex items-center gap-4">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus: ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm font-medium"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <span className="text-xs text-slate-500">
                            Found {totalFilteredCount} of {items.length} items
                        </span>
                    )}
                </div>

                <button 
                    onClick={() => console.log("Open Create Modal")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-indigo-100"
                >
                    <Plus className="h-4 w-4" />
                    New Item
                </button>
            </div>

            {/* --- Kanban Columns (Scrollable Area) --- */}
            <div className="flex flex-1 gap-6 overflow-x-auto overflow-y-auto min-h-0 pb-4 [scrollbar-gutter:stable]">
                {COLUMNS.map((status) => (
                    <div key={status} className="flex flex-col min-w-[280px] flex-1 max-w-[350px]">
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1 flex-none">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {status. replace("_", " ")}
                                </h3>
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {groupedItems[status]. length}
                                </span>
                            </div>
                        </div>

                        {/* Cards Container */}
                        <div className="flex flex-col gap-3 px-1">
                            {groupedItems[status].map((item) => (
                                <WorkItemCard key={item.id} item={item} searchQuery={searchQuery} />
                            ))}
                            {groupedItems[status].length === 0 && (
                                <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 flex items-center justify-center text-slate-300 text-xs italic">
                                    {searchQuery ? "No matches found" : "No items here"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface WorkItemCardProps {
    item: WorkItem;
    searchQuery: string;
}

function WorkItemCard({ item, searchQuery }:  WorkItemCardProps) {
    const PRIORITY_CONFIG:  Record<WorkItemPriority, string> = {
        URGENT: "bg-red-50 text-red-700 border-red-200",
        HIGH:  "bg-orange-50 text-orange-700 border-orange-200",
        MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
        LOW: "bg-slate-50 text-slate-600 border-slate-200",
    };

    const priorityStyle = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.LOW;

    // Highlight matching text
    const highlightText = (text: string) => {
        if (!searchQuery. trim()) return text;
        
        const query = searchQuery. trim();
        const regex = new RegExp(`(${query. replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        
        return parts.map((part, index) => 
            regex.test(part) ?  (
                <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm cursor-pointer group transition-all duration-200">
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${priorityStyle}`}>
                    {item.priority}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {item.type}
                </span>
            </div>

            <h4 className="text-sm font-semibold leading-snug text-slate-800 group-hover: text-indigo-600 transition-colors mb-2">
                {highlightText(item. title)}
            </h4>

            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                {item.description ?  highlightText(item.description) : "No description provided. "}
            </p>

            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2">
                    {item.assignee ?  (
                        <div
                            className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-bold"
                            title={item.assignee. fullName}
                        >
                            {item.assignee.fullName. charAt(0)}
                        </div>
                    ) : (
                        <div className="h-6 w-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                            ? 
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
            </div>
        </div>
    );
}