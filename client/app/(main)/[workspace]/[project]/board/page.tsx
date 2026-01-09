"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { projectService } from "@/services/project-service";
import { WorkItem } from "@/types/types";

export default function BoardPage() {
    const params = useParams();
    const [data, setData] = useState<WorkItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const testApi = async () => {
            try {
                // IMPORTANT: Matches [workspace] and [project] folder names
                const workspaceId = params.workspace as string;
                const projectId = params.project as string;

                if (workspaceId && projectId) {
                    const items = await projectService.getProjectWorkItems(workspaceId, projectId);
                    setData(items);
                } else {
                    setError(`Missing params. Found workspace: ${workspaceId}, project: ${projectId}`);
                }
            } catch (err: any) {
                setError(err.message);
            }
        };

        testApi();
    }, [params]);

    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Board</h1>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <p className="text-gray-500">Board content will appear here...</p>
            </div>

            {/* API TEST SECTION */}
            <div>
                {error && <div>Error: {error}</div>}
                {data ? (
                    <pre>
                        {JSON.stringify(data, null, 2)}
                    </pre>
                ) : (
                    <p>{!error && "Fetching data from API..."}</p>
                )}
            </div>
        </div>
    );
}