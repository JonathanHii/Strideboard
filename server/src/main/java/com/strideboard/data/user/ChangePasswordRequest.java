package com.strideboard.data.user;

public record ChangePasswordRequest(String currentPassword, String newPassword) {
}
