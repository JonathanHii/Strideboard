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
        public ResponseEntity<List<Map<String, String>>> searchUsers(@RequestParam String query) {
                // 1. Validation
                if (query == null || query.trim().length() < 2) {
                        return ResponseEntity.ok(Collections.emptyList());
                }

                // 2. Search Database
                List<User> users = userRepository.findByEmailContainingIgnoreCase(query);

                // 3. Manual Mapping (Uses a loop to prevent type inference errors)
                List<Map<String, String>> result = new ArrayList<>();

                for (User u : users) {
                        Map<String, String> map = new HashMap<>();
                        map.put("id", u.getId().toString());
                        map.put("email", u.getEmail());
                        // Use getFullName() because your Entity uses 'fullName', not 'name'
                        map.put("name", u.getFullName() != null ? u.getFullName() : "");

                        result.add(map);
                }

                // 4. Limit to top 10 results manually
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

                //  Save and Return
                Project savedProject = projectRepository.save(project);

                return ResponseEntity.ok(savedProject);
        }

}
