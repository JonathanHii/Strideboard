"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { workspaceService } from "@/services/workspace-service";
import { workItemService } from "@/services/work-item-service";
import { WorkItem, WorkItemStatus, WorkspaceMember } from "@/types/types";
import { Search, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import WorkItemCard from "@/components/board/WorkItemCard";
import CreateWorkItemModal from "@/components/board/CreateWorkItemModal";
import WorkItemDetailModal from "@/components/board/WorkItemDetailModal";
import ViewOnlyWorkItemModal from "@/components/board/ViewOnlyWorkItemModal";
import { COLUMNS } from "@/components/board/contants";

import { useProjectSocket } from "@/hooks/use-project-socket";

export default function BoardPage() {
    const params = useParams();
    const [items, setItems] = useState<WorkItem[]>([]);
    const [currentMember, setCurrentMember] = useState<WorkspaceMember | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<WorkItem | null>(null);

    const [isBrowser, setIsBrowser] = useState(false);

    const workspaceId = params.workspace as string;
    const projectId = params.project as string;

    useEffect(() => {
        setIsBrowser(true);
    }, []);

    const fetchBoardData = async () => {
        try {
            if (workspaceId && projectId) {
                const [data, memberData] = await Promise.all([
                    workItemService.getProjectWorkItems(workspaceId, projectId),
                    workspaceService.getCurrentUserInWorkspace(workspaceId)
                ]);

                const sortedData = data.sort((a, b) => a.position - b.position);
                setItems(sortedData);
                setCurrentMember(memberData);
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

        const filteredItems = items.filter((item) => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase().trim();
            return (
                item.title.toLowerCase().includes(query) ||
                (item.description?.toLowerCase().includes(query) || false)
            );
        });

        filteredItems.forEach((item) => {
            if (groups[item.status]) {
                groups[item.status].push(item);
            }
        });

        Object.keys(groups).forEach((key) => {
            groups[key as WorkItemStatus].sort((a, b) => a.position - b.position);
        });

        return groups;
    }, [items, searchQuery]);

    const totalFilteredCount = useMemo(() => {
        return COLUMNS.reduce((acc, status) => acc + groupedItems[status].length, 0);
    }, [groupedItems]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source } = result;

        if (!destination) return;
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const sourceStatus = source.droppableId as WorkItemStatus;
        const destStatus = destination.droppableId as WorkItemStatus;

        const previousItems = [...items];

        const newGroups = { ...groupedItems };
        const sourceList = [...newGroups[sourceStatus]];
        const destList = sourceStatus === destStatus ? sourceList : [...newGroups[destStatus]];

        const [movedItem] = sourceList.splice(source.index, 1);

        const updatedItem = { ...movedItem, status: destStatus };

        destList.splice(destination.index, 0, updatedItem);

        const prevItem = destList[destination.index - 1];
        const nextItem = destList[destination.index + 1];

        let newPosition = 0;

        if (!prevItem && !nextItem) {
            newPosition = 1000;
        } else if (!prevItem) {
            newPosition = nextItem.position / 2;
        } else if (!nextItem) {
            newPosition = prevItem.position + 1000;
        } else {
            newPosition = (prevItem.position + nextItem.position) / 2;
        }

        updatedItem.position = newPosition;

        const newItems: WorkItem[] = [];
        COLUMNS.forEach(status => {
            if (status === sourceStatus) newItems.push(...sourceList);
            else if (status === destStatus) newItems.push(...destList);
            else newItems.push(...newGroups[status]);
        });

        setItems(newItems);

        try {
            await workItemService.updateWorkItem(
                workspaceId,
                projectId,
                movedItem.id,
                {
                    status: destStatus,
                    position: newPosition
                }
            );
        } catch (err) {
            console.error("Failed to update status/position on server:", err);
            setItems(previousItems);
        }
    };

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
                    ).sort((a, b) => a.position - b.position);
                case 'DELETED':
                    return currentItems.filter(item => item.id !== event.workItemId);
                default:
                    return currentItems;
            }
        });
    });

    const isConnected = (socketResult as any)?.isConnected ?? true;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);
    const handleCreateSuccess = async () => await fetchBoardData();
    const handleItemClick = (item: WorkItem) => setSelectedItem(item);
    const handleCloseDetail = () => setSelectedItem(null);

    const handleItemUpdate = async (updatedItem: WorkItem) => {
        setItems((prevItems) => prevItems.map((item) => item.id === updatedItem.id ? updatedItem : item));
    };

    const handleItemDelete = async (itemId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        setSelectedItem(null);
    };

    const isViewer = currentMember?.role === "Viewer";

    if (isLoading) return <div className="p-10 animate-pulse text-slate-400">Loading board...</div>;
    if (error) return <div className="p-10 text-red-500 font-medium">Error: {error}</div>;

    return (
        <div className="h-full w-full flex flex-col">

            {/* --- Board Toolbar (EXACT MATCH TO LIST PAGE) --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-4 flex-none">

                {/* Search Bar & Mobile Add Button */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={handleSearchChange}
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
                            <Plus className="h-4 w-4" /> New Item
                        </button>
                    )}
                </div>
            </div>

            {isBrowser ? (
                <DragDropContext onDragEnd={onDragEnd}>

                    <div className="flex flex-1 gap-0 md:gap-6 overflow-x-auto overflow-y-hidden min-h-0 pb-4 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">                        {COLUMNS.map((status) => (
                        <div
                            key={status}
                            className="flex flex-col min-w-full md:min-w-[280px] flex-1 max-w-full md:max-w-[350px] h-full max-h-full snap-center px-4 md:px-0"
                        >

                            <div className="flex items-center justify-between mb-3 px-1 flex-none">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        {status.replace("_", " ")}
                                    </h3>
                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {groupedItems[status].length}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 min-h-0 bg-slate-50 rounded-xl p-2 flex flex-col gap-3 border border-slate-100">
                                <Droppable droppableId={status}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`
                                                    flex-1 overflow-y-auto min-h-[100px] flex flex-col gap-3 pr-1
                                                    [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]
                                                    ${snapshot.isDraggingOver ? "bg-slate-100/80 ring-2 ring-indigo-500/10 rounded-lg transition-all" : ""}
                                                `}
                                        >
                                            {groupedItems[status].map((item, index) => (
                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}
                                                    isDragDisabled={isViewer}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                opacity: snapshot.isDragging ? 0.9 : 1,
                                                            }}
                                                            className={`${snapshot.isDragging ? "shadow-xl ring-2 ring-indigo-500 cursor-grabbing rounded-lg bg-white z-50" : "cursor-grab"}`}
                                                        >
                                                            <WorkItemCard
                                                                item={item}
                                                                searchQuery={searchQuery}
                                                                onClick={() => handleItemClick(item)}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}

                                            {groupedItems[status].length === 0 && !snapshot.isDraggingOver && (
                                                <div className="h-24 flex items-center justify-center text-slate-300 text-xs border-2 border-dashed border-slate-200 rounded-lg m-1">
                                                    {items.length === 0 && !isViewer ? (
                                                        <button
                                                            onClick={() => setIsCreateModalOpen(true)}
                                                            className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" /> Create work item
                                                        </button>
                                                    ) : (
                                                        "Drop here"
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        </div>
                    ))}
                    </div>
                </DragDropContext>
            ) : (
                <div className="flex flex-1 items-center justify-center text-slate-400">
                    Loading Board...
                </div>
            )}

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