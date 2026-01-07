import { Project } from "@/types/types";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

interface ProjectCardProps {
    project: Project;
    workspaceSlug: string;
}

export default function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
    // Matching your color logic from WorkspaceCard
    const colors = ["bg-indigo-600", "bg-emerald-600", "bg-orange-500", "bg-purple-600"];
    // Use project ID to stay consistent, or a different index to differentiate from the parent workspace
    const bgColor = colors[Math.abs(project.id.length + 1) % colors.length];

    return (
        <Link
            href={`/${workspaceSlug}/${project.id}`}
            className="block transition-transform hover:scale-[1.02]"
        >
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center text-white font-bold text-xl`}>
                        {project.name.charAt(0)}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                </div>

                <h3 className="font-semibold text-gray-900 text-lg mb-2">{project.name}</h3>

                <p className="text-sm text-gray-500 line-clamp-2 flex-grow">
                    {project.description || "No description provided."}
                </p>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </Link>
    );
}