package com.strideboard.notification;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.strideboard.data.notification.InboxItem;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<InboxItem>> getNotifications(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId()));
    }

    // Mark Read
    @DeleteMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    // Accept Invite
    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> acceptInvite(@PathVariable UUID id) {
        notificationService.acceptInvite(id);
        return ResponseEntity.ok().build();
    }

    // Reject Invite
    @DeleteMapping("/{id}/reject")
    public ResponseEntity<Void> rejectInvite(@PathVariable UUID id) {
        notificationService.rejectInvite(id);
        return ResponseEntity.noContent().build();
    }

    // Check if notifications exist
    @GetMapping("/has-unread")
    public ResponseEntity<Boolean> hasNotifications(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean hasNotifications = !notificationService.getUserNotifications(user.getId()).isEmpty();

        return ResponseEntity.ok(hasNotifications);
    }

}
