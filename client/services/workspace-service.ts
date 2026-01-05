import { Workspace, CreateWorkspaceRequest } from "@/types/types";
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
  }
};