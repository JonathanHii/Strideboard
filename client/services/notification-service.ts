import { authService } from "./auth-service";
import { InboxItem } from "@/types/types"; // Ensure this matches your types file location

const API_BASE_URL = "http://localhost:8080/api/notifications";

export const notificationService = {
    /**
     * Fetches all notifications for the currently logged-in user.
     */
    async getNotifications(): Promise<InboxItem[]> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch notifications");
        }

        return data;
    },

    /**
     * Mark a notification as read.
     * For "updates", this deletes the notification.
     */
    async markRead(notificationId: string): Promise<void> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to mark notification as read");
        }
    },

    /**
     * Accept an invite.
     * Adds the user to the workspace and removes the notification.
     */
    async acceptInvite(notificationId: string): Promise<void> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${notificationId}/accept`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to accept invite");
        }
    },

    /**
     * Reject an invite.
     * Simply deletes the notification.
     */
    async rejectInvite(notificationId: string): Promise<void> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/${notificationId}/reject`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to reject invite");
        }
    },

    /**
     * Checks if the user has any unread notifications.
     * Returns true if there are notifications, false otherwise.
     */
    async hasUnreadNotifications(): Promise<boolean> {
        const token = authService.getToken();

        const response = await fetch(`${API_BASE_URL}/has-unread`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Failed to check notification status");
        }

        return data;
    },
};