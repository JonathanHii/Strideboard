import { WorkItem, WorkItemPriority } from "@/types/types";

interface WorkItemCardProps {
  item: WorkItem;
  searchQuery: string;
  onClick?: () => void;
}

export default function WorkItemCard({ item, searchQuery, onClick }: WorkItemCardProps) {
  const PRIORITY_CONFIG: Record<WorkItemPriority, string> = {
    URGENT: "bg-red-50 text-red-700 border-red-200",
    HIGH: "bg-orange-50 text-orange-700 border-orange-200",
    MEDIUM: "bg-blue-50 text-blue-700 border-blue-200",
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const priorityStyle = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.LOW;

  // Highlight matching text
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.trim();
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 text-yellow-900 rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 hover: border-indigo-300 hover:shadow-sm cursor-pointer group transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${priorityStyle}`}
        >
          {item.priority}
        </span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          {item.type}
        </span>
      </div>

      <h4 className="text-sm font-semibold leading-snug text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">
        {highlightText(item.title)}
      </h4>

      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
        {item.description
          ? highlightText(item.description)
          : "No description provided. "}
      </p>

      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
        <div className="flex items-center gap-2">
          {item.assignee ? (
            <div
              className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] text-indigo-700 font-bold"
              title={item.assignee.fullName}
            >
              {item.assignee.fullName.charAt(0)}
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
              ?
            </div>
          )}
        </div>
        <span className="text-[10px] font-medium text-slate-400">
          {new Date(item.createdAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}