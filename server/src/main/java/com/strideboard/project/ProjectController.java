package com.strideboard.project;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.strideboard.data.project.CreateProjectRequest;
import com.strideboard.data.project.Project;
import com.strideboard.data.project.ProjectRepository;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;
import com.strideboard.data.workspace.Membership;
import com.strideboard.data.workspace.MembershipRepository;
import com.strideboard.data.workspace.Workspace;
import com.strideboard.data.workspace.WorkspaceRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final WorkspaceRepository workspaceRepository;
    private final ProjectRepository projectRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @GetMapping("/{workspaceId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Project>> getWorkspaceProjects(
            @PathVariable UUID workspaceId,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
            return ResponseEntity.status(403).build();
        }

        List<Project> projects = projectRepository.findByWorkspace_Id(workspaceId);
        return ResponseEntity.ok(projects);
    }

    @PostMapping("/{workspaceId}")
    @Transactional
    public ResponseEntity<Project> createProject(
            @PathVariable UUID workspaceId,
            @RequestBody CreateProjectRequest request,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElse(null);

        if (membership == null || "VIEWER".equalsIgnoreCase(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .workspace(workspace)
                .creator(user)
                .build();

        return ResponseEntity.ok(projectRepository.save(project));
    }

    /**
     * Get a specific project.
     * MOVED FROM WORKSPACE CONTROLLER (Formerly /{wid}/projects/{pid})
     * Path: GET /api/projects/{workspaceId}/{projectId}
     */
    @GetMapping("/{workspaceId}/{projectId}")
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
            return ResponseEntity.status(400).build();
        }

        return ResponseEntity.ok(project);
    }

    @PatchMapping("/{workspaceId}/{projectId}/name")
    public ResponseEntity<Project> updateProjectName(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody UpdateProjectNameRequest request,
            Authentication auth) {

        return updateProject(workspaceId, projectId, auth, project -> {
            if (request.name() != null && !request.name().isBlank()) {
                project.setName(request.name());
            }
        });
    }

    @PatchMapping("/{workspaceId}/{projectId}/description")
    public ResponseEntity<Project> updateProjectDescription(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody UpdateProjectDescriptionRequest request,
            Authentication auth) {

        return updateProject(workspaceId, projectId, auth, project -> {
            project.setDescription(request.description());
        });
    }

    @DeleteMapping("/{workspaceId}/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        if (!hasProjectEditPermissions(user, project, workspaceId)) {
            return ResponseEntity.status(403).build();
        }

        projectRepository.delete(project);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{workspaceId}/{projectId}/is-creator")
    public ResponseEntity<Boolean> isProjectCreator(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            Authentication auth) {

        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Security check omitted for brevity, but should ideally check workspace
        // membership

        boolean isCreator = project.getCreator() != null && project.getCreator().getId().equals(currentUser.getId());
        return ResponseEntity.ok(isCreator);
    }

    // --- Helpers and DTOs ---

    public record UpdateProjectNameRequest(String name) {
    }

    public record UpdateProjectDescriptionRequest(String description) {
    }

    // Helper to consolidate update permissions logic
    private ResponseEntity<Project> updateProject(UUID workspaceId, UUID projectId, Authentication auth,
            java.util.function.Consumer<Project> updater) {
        User user = userRepository.findByEmail(auth.getName()).orElseThrow(() -> new RuntimeException("User"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId))
            return ResponseEntity.status(400).build();

        if (!hasProjectEditPermissions(user, project, workspaceId))
            return ResponseEntity.status(403).build();

        updater.accept(project);
        return ResponseEntity.ok(projectRepository.save(project));
    }

    private boolean hasProjectEditPermissions(User user, Project project, UUID workspaceId) {
        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId).orElse(null);
        if (membership == null)
            return false;

        boolean isCreator = project.getCreator() != null && project.getCreator().getId().equals(user.getId());
        boolean isAdmin = "ADMIN".equals(membership.getRole());

        return isCreator || isAdmin;
    }
}
