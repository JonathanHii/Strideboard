package com.strideboard.workspace;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.strideboard.data.notification.Notification;
import com.strideboard.data.notification.NotificationRepository;
import com.strideboard.data.notification.NotificationType;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;
import com.strideboard.data.workspace.AddMembersRequest;
import com.strideboard.data.workspace.CreateWorkspaceRequest;
import com.strideboard.data.workspace.Membership;
import com.strideboard.data.workspace.MembershipRepository;
import com.strideboard.data.workspace.Workspace;
import com.strideboard.data.workspace.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {
        private final WorkspaceRepository workspaceRepository;
        private final MembershipRepository membershipRepository;
        private final UserRepository userRepository;
        private final NotificationRepository notificationRepository;

        @GetMapping
        @Transactional(readOnly = true)
        public ResponseEntity<List<Workspace>> getMyWorkspaces(Authentication auth) {
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                List<Workspace> workspaces = user.getMemberships().stream()
                                .map(Membership::getWorkspace)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(workspaces);
        }

        @GetMapping("/{workspaceId}")
        public ResponseEntity<Workspace> getWorkspaceById(@PathVariable UUID workspaceId, Authentication auth) {
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                return workspaceRepository.findById(workspaceId)
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/{workspaceId}/owner")
        @Transactional(readOnly = true)
        public ResponseEntity<Map<String, String>> getWorkspaceOwner(
                        @PathVariable UUID workspaceId,
                        Authentication auth) {

                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                Workspace workspace = workspaceRepository.findById(workspaceId)
                                .orElseThrow(() -> new RuntimeException("Workspace not found"));

                return ResponseEntity.ok(Map.of("ownerId", workspace.getOwner().getId().toString()));
        }

        @PostMapping
        @Transactional
        public ResponseEntity<Workspace> createWorkspace(@RequestBody CreateWorkspaceRequest request,
                        Authentication auth) {

                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Workspace workspace = new Workspace();
                workspace.setName(request.getName());

                if (request.getSlug() != null && !request.getSlug().isEmpty()) {
                        workspace.setSlug(request.getSlug());
                } else {
                        workspace.setSlug(request.getName().toLowerCase().replaceAll(" ", "-"));
                }

                workspace.setOwner(currentUser);

                Workspace savedWorkspace = workspaceRepository.save(workspace);

                Membership ownerMembership = Membership.builder()
                                .user(currentUser)
                                .workspace(savedWorkspace)
                                .role("ADMIN")
                                .build();

                membershipRepository.save(ownerMembership);

                // Handle initial invites
                if (request.getMemberEmails() != null && !request.getMemberEmails().isEmpty()) {
                        inviteUsers(request.getMemberEmails(), savedWorkspace, currentUser);
                }

                return ResponseEntity.ok(savedWorkspace);
        }

        // Helper method for invites to keep code clean
        private void inviteUsers(List<String> emails, Workspace workspace, User sender) {
                for (String email : emails) {
                        if (email.equalsIgnoreCase(sender.getEmail()))
                                continue;

                        String trimmedEmail = email.trim().toLowerCase();
                        userRepository.findByEmail(trimmedEmail).ifPresent(userToInvite -> {
                                boolean alreadyMember = membershipRepository.existsByUserIdAndWorkspaceId(
                                                userToInvite.getId(), workspace.getId());

                                if (!alreadyMember) {
                                        boolean inviteExists = notificationRepository
                                                        .existsByRecipientIdAndWorkspaceIdAndType(
                                                                        userToInvite.getId(), workspace.getId(),
                                                                        NotificationType.INVITE);

                                        if (!inviteExists) {
                                                Notification invite = Notification.builder()
                                                                .recipient(userToInvite)
                                                                .type(NotificationType.INVITE)
                                                                .workspace(workspace)
                                                                .title("Workspace Invitation")
                                                                .subtitle("You have been invited to join "
                                                                                + workspace.getName())
                                                                .build();
                                                notificationRepository.save(invite);
                                        }
                                }
                        });
                }
        }

        @DeleteMapping("/{workspaceId}")
        @Transactional
        public ResponseEntity<Void> deleteWorkspace(@PathVariable UUID workspaceId, Authentication auth) {
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                                .orElse(null);

                if (membership == null || !"ADMIN".equalsIgnoreCase(membership.getRole())) {
                        return ResponseEntity.status(403).build();
                }

                Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
                if (workspace == null)
                        return ResponseEntity.notFound().build();

                workspaceRepository.delete(workspace);
                return ResponseEntity.noContent().build();
        }

        @PostMapping("/{workspaceId}/rename")
        @Transactional
        public ResponseEntity<?> updateWorkspaceName(@PathVariable UUID workspaceId,
                        @RequestBody Map<String, String> request, Authentication auth) {

                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                                .orElse(null);

                if (membership == null || !"ADMIN".equalsIgnoreCase(membership.getRole())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Not authorized"));
                }

                String newName = request.get("name");
                if (newName == null || newName.trim().isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Name required"));
                }

                Workspace workspace = workspaceRepository.findById(workspaceId).orElse(null);
                if (workspace == null)
                        return ResponseEntity.notFound().build();

                workspace.setName(newName.trim());
                workspaceRepository.save(workspace);
                return ResponseEntity.ok(workspace);
        }

        // --- Membership Management ---

        @GetMapping("/{workspaceId}/members")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, String>>> getWorkspaceMembers(@PathVariable UUID workspaceId,
                        Authentication auth) {
                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!membershipRepository.existsByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                List<Membership> memberships = membershipRepository.findByWorkspaceId(workspaceId);
                List<Map<String, String>> result = new ArrayList<>();

                for (Membership m : memberships) {
                        User u = m.getUser();
                        Map<String, String> map = new HashMap<>();
                        map.put("id", u.getId().toString());
                        map.put("email", u.getEmail());
                        map.put("name", u.getFullName() != null ? u.getFullName() : "");
                        map.put("role", formatRole(m.getRole()));
                        result.add(map);
                }
                return ResponseEntity.ok(result);
        }

        @PostMapping("/{workspaceId}/members")
        @Transactional
        public ResponseEntity<?> addMembersToWorkspace(@PathVariable UUID workspaceId,
                        @RequestBody AddMembersRequest request, Authentication auth) {

                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership currentMembership = membershipRepository
                                .findByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)
                                .orElse(null);

                if (currentMembership == null || !"ADMIN".equalsIgnoreCase(currentMembership.getRole())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Only admins can invite members"));
                }

                Workspace workspace = workspaceRepository.findById(workspaceId)
                                .orElseThrow(() -> new RuntimeException("Workspace not found"));

                // Reuse the invite logic
                inviteUsers(request.getEmails(), workspace, currentUser);

                return ResponseEntity.ok(Map.of("message", "Invitations processed"));
        }

        @DeleteMapping("/{workspaceId}/members/{memberId}")
        @Transactional
        public ResponseEntity<?> removeMemberFromWorkspace(@PathVariable UUID workspaceId,
                        @PathVariable UUID memberId, Authentication auth) {

                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership currentMembership = membershipRepository
                                .findByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)
                                .orElse(null);

                if (currentMembership == null || !"ADMIN".equalsIgnoreCase(currentMembership.getRole())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Only admins can remove members"));
                }

                if (currentUser.getId().equals(memberId)) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Cannot remove yourself"));
                }

                Membership membershipToRemove = membershipRepository.findByUserIdAndWorkspaceId(memberId, workspaceId)
                                .orElse(null);

                if (membershipToRemove == null)
                        return ResponseEntity.notFound().build();

                membershipRepository.delete(membershipToRemove);
                return ResponseEntity.noContent().build();
        }

        @PutMapping("/{workspaceId}/members/{memberId}/role")
        @Transactional
        public ResponseEntity<?> changeMemberRole(@PathVariable UUID workspaceId, @PathVariable UUID memberId,
                        @RequestBody Map<String, String> request, Authentication auth) {

                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (currentUser.getId().equals(memberId)) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Cannot change your own role"));
                }

                Membership currentMembership = membershipRepository
                                .findByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)
                                .orElse(null);

                if (currentMembership == null || !"ADMIN".equalsIgnoreCase(currentMembership.getRole())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Only admins can change roles"));
                }

                String newRole = request.get("role");
                if (newRole == null || !List.of("ADMIN", "MEMBER", "VIEWER").contains(newRole.toUpperCase())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid role"));
                }

                Membership targetMembership = membershipRepository.findByUserIdAndWorkspaceId(memberId, workspaceId)
                                .orElse(null);

                if (targetMembership == null)
                        return ResponseEntity.notFound().build();

                // Check ownership constraints
                Workspace workspace = targetMembership.getWorkspace();
                if (workspace.getOwner().getId().equals(memberId)) {
                        return ResponseEntity.status(403).body(Map.of("message", "Cannot change Owner role"));
                }

                targetMembership.setRole(newRole.toUpperCase());
                membershipRepository.save(targetMembership);

                return ResponseEntity.ok(Map.of("message", "Role updated", "role", newRole.toUpperCase()));
        }

        @GetMapping("/{workspaceId}/me")
        @Transactional(readOnly = true)
        public ResponseEntity<Map<String, String>> getCurrentUserInWorkspace(@PathVariable UUID workspaceId,
                        Authentication auth) {
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                                .orElse(null);

                if (membership == null)
                        return ResponseEntity.status(403).build();

                Map<String, String> result = new HashMap<>();
                result.put("id", user.getId().toString());
                result.put("email", user.getEmail());
                result.put("name", user.getFullName());
                result.put("role", formatRole(membership.getRole()));

                return ResponseEntity.ok(result);
        }

        @DeleteMapping("/{workspaceId}/leave")
        @Transactional
        public ResponseEntity<?> leaveWorkspace(@PathVariable UUID workspaceId, Authentication auth) {
                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership membership = membershipRepository
                                .findByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)
                                .orElse(null);

                if (membership == null) {
                        return ResponseEntity.notFound().build();
                }
                
                // owner cannot leave
                Workspace workspace = membership.getWorkspace();
                if (workspace.getOwner().getId().equals(currentUser.getId())) {
                        return ResponseEntity.status(403)
                                        .body(Map.of("message",
                                                        "The Workspace Owner cannot leave. You must delete the workspace instead."));
                }

                membershipRepository.delete(membership);

                return ResponseEntity.noContent().build();
        }

        // --- User Search ---

        @GetMapping("/users/search")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, String>>> searchUsers(@RequestParam String query, Authentication auth) {
                if (query == null || query.trim().length() < 2)
                        return ResponseEntity.ok(Collections.emptyList());

                String currentUserEmail = auth.getName();
                return ResponseEntity.ok(userRepository.findByEmailContainingIgnoreCase(query).stream()
                                .filter(u -> !u.getEmail().equalsIgnoreCase(currentUserEmail))
                                .limit(10)
                                .map(this::mapUserToSimpleMap)
                                .collect(Collectors.toList()));
        }

        @GetMapping("/{workspaceId}/users/search")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, String>>> searchUsersNotInWorkspace(
                        @PathVariable UUID workspaceId,
                        @RequestParam String query,
                        Authentication auth) {

                if (query == null || query.trim().length() < 2) {
                        return ResponseEntity.ok(Collections.emptyList());
                }

                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!membershipRepository.existsByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                List<String> memberEmails = membershipRepository.findByWorkspaceId(workspaceId).stream()
                                .map(m -> m.getUser().getEmail().toLowerCase())
                                .collect(Collectors.toList());

                return ResponseEntity.ok(userRepository.findByEmailContainingIgnoreCase(query).stream()
                                .filter(u -> !memberEmails.contains(u.getEmail().toLowerCase()))
                                .limit(10)
                                .map(this::mapUserToSimpleMap)
                                .collect(Collectors.toList()));
        }

        // --- Helpers ---

        private String formatRole(String role) {
                return role.substring(0, 1).toUpperCase() + role.substring(1).toLowerCase();
        }

        private Map<String, String> mapUserToSimpleMap(User u) {
                Map<String, String> map = new HashMap<>();
                map.put("id", u.getId().toString());
                map.put("email", u.getEmail());
                map.put("name", u.getFullName() != null ? u.getFullName() : "");
                return map;
        }
}
