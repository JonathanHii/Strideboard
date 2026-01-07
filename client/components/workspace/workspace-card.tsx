import { Workspace } from "@/types/types";
import Link from "next/link";

interface WorkspaceCardProps {
    workspace: Workspace;
}

export default function WorkspaceCard({ workspace }: WorkspaceCardProps) {
    // You can randomize colors or map them to the workspace name
    const colors = ["bg-indigo-600", "bg-emerald-600", "bg-orange-500", "bg-purple-600"];
    const bgColor = colors[Math.abs(workspace.id.length) % colors.length];

    return (
        <Link href={`/${workspace.id}`} className="block transition-transform hover:scale-[1.02]">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4 text-white font-bold text-xl`}>
                    {workspace.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{workspace.name}</h3>
                {/* Placeholder stats to match your UI */}
                <div className="mt-4 flex flex-col gap-1 text-sm text-gray-500">
                    <p>{workspace.projectCount} {workspace.projectCount === 1 ? 'Project' : 'Projects'},
                        {' '}{workspace.memberCount} {workspace.memberCount === 1 ? 'Member' : 'Members'}</p>
                    <p>Active</p>
                </div>
            </div>
        </Link>
    );
}