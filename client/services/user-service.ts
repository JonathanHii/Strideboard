import { authService } from "./auth-service";
import Cookies from 'js-cookie';

const API_URL = "http://localhost:8080/api/users";

export const userService = {
    /**
     * GET /api/users/me
     * Loads the current user's profile data
     */
    async getProfile() {
        const token = authService.getToken();

        const response = await fetch(`${API_URL}/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error("Failed to load profile");

        // Returns { fullName: "...", email: "..." }
        return await response.json();
    },

    /**
     * PATCH /api/users/me
     * Updates general info (Display Name, Email)
     */
    async updateProfile(fullName: string, email: string) {
        const token = authService.getToken();

        const response = await fetch(`${API_URL}/me`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fullName, email }),
        });

        if (!response.ok) {
            throw new Error("Failed to update profile");
        }
        const data = await response.json();

        // IF a new token was sent back, update the cookie immediately
        if (data.token) {
            Cookies.set('stride_token', data.token, { expires: 1, secure: true, sameSite: 'strict' });
        }

        // Return just the user info so your React component doesn't break
        return data.user;
    },
    /**
     * PATCH /api/users/me/password
     * Updates the password
     */
    async updatePassword(currentPassword: string, newPassword: string) {
        const token = authService.getToken();

        const response = await fetch(`${API_URL}/me/password`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        if (!response.ok) throw new Error("Failed to update password. Check your current password.");

        return true;
    },
};