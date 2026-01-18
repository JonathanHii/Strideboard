import { Workspace, CreateWorkspaceRequest, UserSummary, WorkspaceMember } from "@/types/types";
import { authService } from "./auth-service";

const API_BASE_URL = "http://localhost:8080/api/workspaces";

export const workspaceService = {
  async getMyWorkspaces(): Promise<Workspace[]> {
    const token = authService.getToken();
    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch workspaces");
    return data;
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
    if (!response.ok) throw new Error(result.message || "Failed to create workspace");
    return result;
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

  async updateWorkspaceName(workspaceId: string, name: string): Promise<Workspace> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/rename`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update workspace name");
    return data;
  },

  async leaveWorkspace(workspaceId: string): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/leave`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to leave workspace");
    }
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
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to delete workspace");
    }
  },

  // --- Users & Membership ---

  async searchUsers(query: string): Promise<UserSummary[]> {
    const token = authService.getToken();
    if (!query || query.length < 2) return [];

    const response = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`, {
      headers: { "Authorization": `Bearer ${token}` },
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

  async getCurrentUserInWorkspace(workspaceId: string): Promise<WorkspaceMember> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/me`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch current user details");
    return data;
  },

  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/members`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch workspace members");
    return data;
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

  async removeMemberFromWorkspace(workspaceId: string, memberId: string): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/members/${memberId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to remove member");
    }
  },

  async changeMemberRole(workspaceId: string, memberId: string, role: string): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/members/${memberId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to update member role");
    }
  },

  async getWorkspaceOwner(workspaceId: string): Promise<{ ownerId: string }> {
    const token = authService.getToken();
    const response = await fetch(`${API_BASE_URL}/${workspaceId}/owner`, {
      headers: { "Authorization": `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to fetch owner");
    return data;
  },
};