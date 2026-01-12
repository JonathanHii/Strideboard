import { Workspace, CreateWorkspaceRequest, Project, UserSummary, CreateProjectRequest, WorkspaceMember } from "@/types/types";
import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080/api/workspaces";

export const workspaceService = {
  async getMyWorkspaces(): Promise<Workspace[]> {
    const token = authService.getToken(); // Retrieve the token

    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch workspaces");
    }

    return data;
  },

  async searchUsers(query: string): Promise<UserSummary[]> {
    const token = authService.getToken();
    // Only search if 2+ chars to save API calls
    if (!query || query.length < 2) return [];

    const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) return [];
    return response.json();
  },

  async searchUsersNotInWorkspace(workspaceId: string, query: string): Promise<UserSummary[]> {
    const token = authService.getToken();
    // Only search if 2+ chars to save API calls
    if (!query || query.length < 2) return [];

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/users/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) return [];
    return response.json();
  },

  async createWorkspace(data: CreateWorkspaceRequest): Promise<Workspace> {
    const token = authService.getToken();

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create workspace");
    }

    return result;
  },

  async createProject(workspaceId: string, data: CreateProjectRequest): Promise<Project> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create project");
    }

    return result;
  },

  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch projects for this workspace");
    }

    return data;
  },

  async getWorkspaceById(workspaceId: string): Promise<Workspace> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to fetch workspace");
    }

    return response.json();
  },

  async getProjectById(workspaceId: string, projectId: string): Promise<Project> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/projects/${projectId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch project");
    return response.json();
  },

  async getCurrentUserInWorkspace(workspaceId: string): Promise<WorkspaceMember> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch current user details");
    }

    return data;
  },

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/members`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch workspace members");
    }

    return data;
  },

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      // Handle different error cases
      if (response.status === 403) {
        throw new Error("You don't have permission to delete this workspace");
      }
      if (response.status === 404) {
        throw new Error("Workspace not found");
      }

      // Try to get error message from response body
      try {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete workspace");
      } catch {
        throw new Error("Failed to delete workspace");
      }
    }

    // 204 No Content - successful deletion, no body to parse
    return;
  },

  async addMembersToWorkspace(workspaceId: string, emails: string[]): Promise<void> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ emails }),
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || "Failed to add members");
    }
  },

  async updateWorkspaceName(workspaceId: string, name: string): Promise<Workspace> {
    const token = authService.getToken();

    const response = await fetch(`${API_BASE_URL}/${workspaceId}/rename`, {
      method: "POST",  // Using POST instead
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle different error cases
      if (response.status === 403) {
        throw new Error(data.message || "You don't have permission to update this workspace");
      }
      if (response.status === 404) {
        throw new Error("Workspace not found");
      }
      if (response.status === 400) {
        throw new Error(data.message || "Invalid workspace name");
      }
      throw new Error(data.message || "Failed to update workspace name");
    }

    return data;
  }

};