import { authService } from "./auth-service";
import { CreateWorkItemRequest, UpdateWorkItemRequest, WorkItem } from "@/types/types";

const getBaseUrl = (workspaceId: string, projectId: string) =>
    `http://localhost:8080/api/projects/${workspaceId}/${projectId}/work-items`;

export const workItemService = {

    async getProjectWorkItems(workspaceId: string, projectId: string): Promise<WorkItem[]> {
        const token = authService.getToken();
        const response = await fetch(getBaseUrl(workspaceId, projectId), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch work items");
        return data;
    },

    async createWorkItem(
        workspaceId: string,
        projectId: string,
        payload: CreateWorkItemRequest
    ): Promise<WorkItem> {
        const token = authService.getToken();
        const response = await fetch(getBaseUrl(workspaceId, projectId), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to create work item");
        return data;
    },

    async updateWorkItem(
        workspaceId: string,
        projectId: string,
        workItemId: string,
        payload: UpdateWorkItemRequest
    ): Promise<WorkItem> {
        const token = authService.getToken();
        const response = await fetch(`${getBaseUrl(workspaceId, projectId)}/${workItemId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to update work item");
        return data;
    },

    async deleteWorkItem(workspaceId: string, projectId: string, workItemId: string): Promise<void> {
        const token = authService.getToken();
        const response = await fetch(`${getBaseUrl(workspaceId, projectId)}/${workItemId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to delete work item");
        }
    },
};