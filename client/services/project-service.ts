import { authService } from "./authService";
import { CreateWorkItemRequest, WorkItem } from "@/types/types";

const API_BASE_URL = "http://localhost:8080/api/projects";

export const projectService = {
    /**
     * Fetches all work items for a specific project.
     * Note: workspaceId is required by the backend for security/membership validation.
     */
    async getProjectWorkItems(workspaceId: string, projectId: string): Promise<WorkItem[]> {
        const token = authService.getToken();

        // The URL structure assumes the fix provided in the section below
        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}/work-items`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch work items");
        }

        return data;
    },
    /**
 * Update project name - Admin only
 */
    async updateProjectName(workspaceId: string, projectId: string, name: string): Promise<void> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}/name`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to update project name");
        }
    },

    /**
     * Update project description - Admin only
     */
    async updateProjectDescription(workspaceId: string, projectId: string, description: string): Promise<void> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}/description`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ description }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to update project description");
        }
    },

    /**
     * Delete project - Admin only
     */
    async deleteProject(workspaceId: string, projectId: string): Promise<void> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to delete project");
        }
    },

    async createWorkItem(
        workspaceId: string,
        projectId: string,
        payload: CreateWorkItemRequest
    ): Promise<WorkItem> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}/work-items`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to create work item");
        }

        return data;
    },

    async isProjectCreator(workspaceId: string, projectId: string): Promise<boolean> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}/is-creator`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to check creator status");
        }

        return data; // Returns true or false
    },
};