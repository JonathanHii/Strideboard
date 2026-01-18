import { authService } from "./auth-service";
import { Project, CreateProjectRequest } from "@/types/types";

// Base URL for projects
const API_BASE_URL = "http://localhost:8080/api/projects";

export const projectService = {

    /**
     * Get all projects for a specific workspace
     */
    async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/${workspaceId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to fetch projects");
        return data;
    },

    /**
     * Get specific project details
     */
    async getProjectById(workspaceId: string, projectId: string): Promise<Project> {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/${workspaceId}/${projectId}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch project");
        return response.json();
    },

    /**
     * Create a new project
     */
    async createProject(workspaceId: string, data: CreateProjectRequest): Promise<Project> {
        const token = authService.getToken();
        const response = await fetch(`${API_BASE_URL}/${workspaceId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to create project");
        return result;
    },

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
        if (!response.ok) throw new Error(data.message || "Failed to check creator status");
        return data;
    },
};