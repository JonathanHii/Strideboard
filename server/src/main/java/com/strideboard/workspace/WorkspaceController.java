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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.strideboard.data.project.CreateProjectRequest;
import com.strideboard.data.project.Project;
import com.strideboard.data.project.ProjectRepository;
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
        private final ProjectRepository projectRepository;

        @GetMapping
        @Transactional(readOnly = true)
        public ResponseEntity<List<Workspace>> getMyWorkspaces(Authentication auth) {
                // Find the user by email (principal name)
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Get workspaces through memberships
                List<Workspace> workspaces = user.getMemberships().stream()
                                .map(Membership::getWorkspace) // converet workspaces
                                .collect(Collectors.toList());

                return ResponseEntity.ok(workspaces);
        }

        @GetMapping("/users/search")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, String>>> searchUsers(
                        @RequestParam String query,
                        Authentication auth) {
                // 1. Validation
                if (query == null || query.trim().length() < 2) {
                        return ResponseEntity.ok(Collections.emptyList());
                }

                // 2. Get current user's email to exclude them from results
                String currentUserEmail = auth.getName();

                // 3. Search Database
                List<User> users = userRepository.findByEmailContainingIgnoreCase(query);

                // 4. Manual Mapping (Uses a loop to prevent type inference errors)
                List<Map<String, String>> result = new ArrayList<>();

                for (User u : users) {
                        // Skip the current user
                        if (u.getEmail().equalsIgnoreCase(currentUserEmail)) {
                                continue;
                        }

                        Map<String, String> map = new HashMap<>();
                        map.put("id", u.getId().toString());
                        map.put("email", u.getEmail());
                        // Use getFullName() because your Entity uses 'fullName', not 'name'
                        map.put("name", u.getFullName() != null ? u.getFullName() : "");

                        result.add(map);
                }

                // 5. Limit to top 10 results manually
                if (result.size() > 10) {
                        return ResponseEntity.ok(result.subList(0, 10));
                }

                return ResponseEntity.ok(result);
        }

        @GetMapping("/{workspaceId}/users/search")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, String>>> searchUsersNotInWorkspace(
                        @PathVariable UUID workspaceId,
                        @RequestParam String query,
                        Authentication auth) {
                // Validation
                if (query == null || query.trim().length() < 2) {
                        return ResponseEntity.ok(Collections.emptyList());
                }

                // Verify current user is a member of this workspace (security check)
                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!membershipRepository.existsByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                // Get all current workspace member emails
                List<Membership> memberships = membershipRepository.findByWorkspaceId(workspaceId);
                List<String> memberEmails = memberships.stream()
                                .map(m -> m.getUser().getEmail().toLowerCase())
                                .collect(Collectors.toList());

                // Search Database
                List<User> users = userRepository.findByEmailContainingIgnoreCase(query);

                // Manual Mapping - exclude all workspace members
                List<Map<String, String>> result = new ArrayList<>();

                for (User u : users) {
                        // Skip users who are already members of this workspace
                        if (memberEmails.contains(u.getEmail().toLowerCase())) {
                                continue;
                        }

                        Map<String, String> map = new HashMap<>();
                        map.put("id", u.getId().toString());
                        map.put("email", u.getEmail());
                        map.put("name", u.getFullName() != null ? u.getFullName() : "");

                        result.add(map);
                }

                // Limit to top 10 results manually
                if (result.size() > 10) {
                        return ResponseEntity.ok(result.subList(0, 10));
                }

                return ResponseEntity.ok(result);
        }

        @PostMapping
        @Transactional
        public ResponseEntity<Workspace> createWorkspace(@RequestBody CreateWorkspaceRequest request,
                        Authentication auth) {
                // Setup Workspace from DTO
                Workspace workspace = new Workspace();
                workspace.setName(request.getName());

                // Handle slug (use provided one or generate from name)
                if (request.getSlug() != null && !request.getSlug().isEmpty()) {
                        workspace.setSlug(request.getSlug());
                } else {
                        workspace.setSlug(request.getName().toLowerCase().replaceAll(" ", "-"));
                }

                Workspace savedWorkspace = workspaceRepository.save(workspace);

                // Find Current User (The Creator)
                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Add Creator as ADMIN
                Membership ownerMembership = Membership.builder()
                                .user(currentUser)
                                .workspace(savedWorkspace)
                                .role("ADMIN")
                                .build();

                membershipRepository.save(ownerMembership);

                // 4. Add other users from the list
                if (request.getMemberEmails() != null && !request.getMemberEmails().isEmpty()) {
                        for (String email : request.getMemberEmails()) {
                                // Skip if the email is the creator (already added as ADMIN)
                                if (email.equalsIgnoreCase(currentUser.getEmail())) {
                                        continue;
                                }

                                // Check if user exists in DB before adding
                                userRepository.findByEmail(email).ifPresent(user -> {
                                        Membership member = Membership.builder()
                                                        .user(user)
                                                        .workspace(savedWorkspace)
                                                        .role("MEMBER") // Default role for invitees
                                                        .build();
                                        membershipRepository.save(member);
                                });
                        }
                }

                return ResponseEntity.ok(savedWorkspace);
        }

        @GetMapping("/{workspaceId}/projects")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Project>> getWorkspaceProjects(
                        @PathVariable UUID workspaceId,
                        Authentication auth) {

                // 1. Find the user
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // 2. Security Check: Verify user is a member of this workspace
                boolean isMember = membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId);

                if (!isMember) {
                        return ResponseEntity.status(403).build(); // Forbidden if not a member
                }

                // 3. Fetch projects
                List<Project> projects = projectRepository.findByWorkspace_Id(workspaceId);

                return ResponseEntity.ok(projects);
        }

        @GetMapping("/{workspaceId}")
        public ResponseEntity<Workspace> getWorkspaceById(@PathVariable UUID workspaceId, Authentication auth) {
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Ensure the user is actually a member of this specific workspace
                if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                return workspaceRepository.findById(workspaceId)
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        @GetMapping("/{workspaceId}/projects/{projectId}")
        @Transactional(readOnly = true)
        public ResponseEntity<Project> getProjectById(
                        @PathVariable UUID workspaceId,
                        @PathVariable UUID projectId,
                        Authentication auth) {

                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
                        return ResponseEntity.status(403).build();
                }

                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new RuntimeException("Project not found"));

                if (!project.getWorkspace().getId().equals(workspaceId)) {
                        return ResponseEntity.status(400).build(); // Project is not in this workspace
                }

                return ResponseEntity.ok(project);
        }

        @PostMapping("/{workspaceId}/projects")
        @Transactional
        public ResponseEntity<Project> createProject(
                        @PathVariable UUID workspaceId,
                        @RequestBody CreateProjectRequest request,
                        Authentication auth) {

                // Find the user (for security context)
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Security Check: Verify user is a member of this workspace
                boolean isMember = membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId);
                if (!isMember) {
                        return ResponseEntity.status(403).build(); // Forbidden
                }

                // Fetch the Workspace entity
                Workspace workspace = workspaceRepository.findById(workspaceId)
                                .orElseThrow(() -> new RuntimeException("Workspace not found"));

                // Build the Project using your @Builder
                Project project = Project.builder()
                                .name(request.getName())
                                .description(request.getDescription())
                                .workspace(workspace) // Crucial for the @ManyToOne relationship
                                .build();

                // Save and Return
                Project savedProject = projectRepository.save(project);

                return ResponseEntity.ok(savedProject);
        }

        @GetMapping("/{workspaceId}/me")
        @Transactional(readOnly = true)
        public ResponseEntity<Map<String, String>> getCurrentUserInWorkspace(
                        @PathVariable UUID workspaceId,
                        Authentication auth) {

                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                                .orElse(null);

                if (membership == null) {
                        return ResponseEntity.status(403).build();
                }

                Map<String, String> result = new HashMap<>();
                result.put("id", user.getId().toString());
                result.put("email", user.getEmail());
                result.put("name", user.getFullName() != null ? user.getFullName() : "");
                result.put("role", membership.getRole().substring(0, 1).toUpperCase()
                                + membership.getRole().substring(1).toLowerCase());

                return ResponseEntity.ok(result);
        }

        @GetMapping("/{workspaceId}/members")
        @Transactional(readOnly = true)
        public ResponseEntity<List<Map<String, String>>> getWorkspaceMembers(
                        @PathVariable UUID workspaceId,
                        Authentication auth) {

                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Security Check: Verify user is a member of this workspace
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
                        map.put("role", m.getRole().substring(0, 1).toUpperCase()
                                        + m.getRole().substring(1).toLowerCase());
                        result.add(map);
                }

                return ResponseEntity.ok(result);
        }

        @DeleteMapping("/{workspaceId}")
        @Transactional
        public ResponseEntity<Void> deleteWorkspace(
                        @PathVariable UUID workspaceId,
                        Authentication auth) {

                // Find the current user
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Find the user's membership in this workspace
                Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                                .orElse(null);

                // Security Check: User must be a member
                if (membership == null) {
                        return ResponseEntity.status(403).build(); // Forbidden - not a member
                }

                // Security Check: Only ADMIN can delete a workspace
                if (!"ADMIN".equalsIgnoreCase(membership.getRole())) {
                        return ResponseEntity.status(403).build(); // Forbidden - not an admin
                }

                // Find the workspace
                Workspace workspace = workspaceRepository.findById(workspaceId)
                                .orElse(null);

                if (workspace == null) {
                        return ResponseEntity.notFound().build();
                }

                // Delete the workspace (cascades to memberships and projects due to
                // CascadeType.ALL)
                workspaceRepository.delete(workspace);

                return ResponseEntity.noContent().build(); // 204 No Content
        }

        @PostMapping("/{workspaceId}/rename")
        @Transactional
        public ResponseEntity<?> updateWorkspaceName(
                        @PathVariable UUID workspaceId,
                        @RequestBody Map<String, String> request,
                        Authentication auth) {

                // Find the current user
                User user = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Find the user's membership in this workspace
                Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                                .orElse(null);

                // Security Check: User must be a member
                if (membership == null) {
                        return ResponseEntity.status(403)
                                        .body(Map.of("message", "You are not a member of this workspace"));
                }

                // Security Check: Only ADMIN can update workspace name
                if (!"ADMIN".equalsIgnoreCase(membership.getRole())) {
                        return ResponseEntity.status(403)
                                        .body(Map.of("message", "Only admins can update the workspace name"));
                }

                // Validate the new name
                String newName = request.get("name");
                if (newName == null || newName.trim().isEmpty()) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Workspace name cannot be empty"));
                }

                // Find and update the workspace
                Workspace workspace = workspaceRepository.findById(workspaceId)
                                .orElse(null);

                if (workspace == null) {
                        return ResponseEntity.notFound().build();
                }

                workspace.setName(newName.trim());
                Workspace updatedWorkspace = workspaceRepository.save(workspace);

                return ResponseEntity.ok(updatedWorkspace);
        }

        @PostMapping("/{workspaceId}/members")
        @Transactional
        public ResponseEntity<?> addMembersToWorkspace(
                        @PathVariable UUID workspaceId,
                        @RequestBody AddMembersRequest request,
                        Authentication auth) {

                // Find the current user
                User currentUser = userRepository.findByEmail(auth.getName())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Security Check: Verify current user is a member of this workspace
                Membership currentMembership = membershipRepository
                                .findByUserIdAndWorkspaceId(currentUser.getId(), workspaceId)
                                .orElse(null);

                if (currentMembership == null) {
                        return ResponseEntity.status(403)
                                        .body(Map.of("message", "You are not a member of this workspace"));
                }

                // Only allow ADMIN to add members
                if (!"ADMIN".equalsIgnoreCase(currentMembership.getRole())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Only admins can add members"));
                }

                // Find the workspace
                Workspace workspace = workspaceRepository.findById(workspaceId)
                                .orElseThrow(() -> new RuntimeException("Workspace not found"));

                // Process each email
                for (String email : request.getEmails()) {
                        if (email == null || email.trim().isEmpty()) {
                                continue;
                        }

                        String trimmedEmail = email.trim().toLowerCase();

                        // Find user - skip if not found
                        User userToAdd = userRepository.findByEmail(trimmedEmail).orElse(null);
                        if (userToAdd == null) {
                                continue;
                        }

                        // Skip if already a member
                        if (membershipRepository.existsByUserIdAndWorkspaceId(userToAdd.getId(), workspaceId)) {
                                continue;
                        }

                        // Create membership
                        Membership newMembership = Membership.builder()
                                        .user(userToAdd)
                                        .workspace(workspace)
                                        .role("MEMBER")
                                        .build();

                        membershipRepository.save(newMembership);
                }

                return ResponseEntity.ok(Map.of("message", "Members added successfully"));
        }

}
