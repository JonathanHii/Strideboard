"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { projectService } from "@/services/project-service";
import { WorkItem, WorkItemStatus } from "@/types/types";
import { Search, Plus } from "lucide-react";

// Imported Components & Constants
import WorkItemCard from "@/components/board/WorkItemCard";
import CreateWorkItemModal from "@/components/board/CreateWorkItemModal";
import WorkItemDetailModal from "@/components/board/WorkItemDetailModal";
import { COLUMNS } from "@/components/board/contants";

export default function BoardPage() {
    const params = useParams();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);

    const workspaceId = params.workspace as string;
    const projectId = params.project as string;

    const fetchBoardData = async () => {
        try {
            if (workspaceId && projectId) {
                const data = await projectService.getProjectWorkItems(
                    workspaceId,
                    projectId
                );
                setItems(data);
            }
        } catch (err: any) {
            setError(err.message || "Failed to load board");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBoardData();
    }, [params]);

    const groupedItems = useMemo(() => {
        const groups = {} as Record<WorkItemStatus, WorkItem[]>;
        COLUMNS.forEach((status) => (groups[status] = []));

        // Filter items based on search query
        const filteredItems = items.filter((item) => {
            if (!searchQuery.trim()) return true;

            const query = searchQuery.toLowerCase().trim();
            const titleMatch = item.title.toLowerCase().includes(query);
            const descriptionMatch =
                item.description?.toLowerCase().includes(query) || false;

            return titleMatch || descriptionMatch;
        });

        // Group filtered items by status
        filteredItems.forEach((item) => {
            if (groups[item.status]) {
                groups[item.status].push(item);
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
        return COLUMNS.reduce(
            (acc, status) => acc + groupedItems[status].length,
            0
        );
    }, [groupedItems]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const handleCreateSuccess = async () => {
        await fetchBoardData();
    };

    const handleItemClick = (item: WorkItem) => {
        setSelectedItem(item);
    };

    const handleCloseDetail = () => {
        setSelectedItem(null);
    };

    const handleItemUpdate = async (updatedItem: WorkItem) => {
        // Update the item in local state for immediate UI feedback
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
            )
        );
    };

    const handleItemDelete = async (itemId: string) => {
        // Remove from local state
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        // Close the modal
        setSelectedItem(null);
    };

    if (isLoading)
        return (
            <div className="p-10 animate-pulse text-slate-400">Loading board...</div>
        );
    if (error)
        return (
            <div className="p-10 text-red-500 font-medium">Error:  {error}</div>
        );

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
                            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-indigo-100"
                >
                    <Plus className="h-4 w-4" />
                    New Item
                </button>
            </div>

            {/* --- Kanban Columns (Scrollable Area) --- */}
            <div className="flex flex-1 gap-6 overflow-x-auto overflow-y-auto min-h-0 pb-4 [scrollbar-gutter: stable]">
                {COLUMNS.map((status) => (
                    <div
                        key={status}
                        className="flex flex-col min-w-[280px] flex-1 max-w-[350px]"
                    >
                        {/* Column Header */}
                        <div className="flex items-center justify-between mb-4 px-1 flex-none">
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {status.replace("_", " ")}
                                </h3>
                                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {groupedItems[status].length}
                                </span>
                            </div>
                        </div>

                        {/* Cards Container */}
                        <div className="flex flex-col gap-3 px-1">
                            {groupedItems[status].map((item) => (
                                <WorkItemCard
                                    key={item.id}
                                    item={item}
                                    searchQuery={searchQuery}
                                    onClick={() => handleItemClick(item)}
                                />
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

            {/* Create Work Item Modal */}
            <CreateWorkItemModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                workspaceId={workspaceId}
                projectId={projectId}
            />

            {/* Work Item Detail Modal */}
            <WorkItemDetailModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={handleCloseDetail}
                onUpdate={handleItemUpdate}
                onDelete={handleItemDelete}
                workspaceId={workspaceId}
                projectId={projectId}
            />
        </div>
    );
}