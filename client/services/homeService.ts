import { authService } from "./authService";

const API_BASE_URL = "http://localhost:8080";

export const homeService = {
  /**
   * Fetches the welcome message from the backend root "/"
   * @returns Promise<{ message: string }>
   */
  async getWelcomeMessage(): Promise<{ message: string }> {
    const token = authService.getToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Session expired");
      }
      throw new Error("Failed to fetch home information");
    }

    return response.json();
  }
};