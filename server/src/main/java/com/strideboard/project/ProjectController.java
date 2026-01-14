package com.strideboard.project;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.strideboard.data.project.Project;
import com.strideboard.data.project.ProjectRepository;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;
import com.strideboard.data.workitem.WorkItem;
import com.strideboard.data.workitem.WorkItemPriority;
import com.strideboard.data.workitem.WorkItemRepository;
import com.strideboard.data.workitem.WorkItemStatus;
import com.strideboard.data.workitem.WorkItemType;
import com.strideboard.data.workspace.Membership;
import com.strideboard.data.workspace.MembershipRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {
    private final WorkItemRepository workItemRepository;
    private final ProjectRepository projectRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;

    @GetMapping("/{workspaceId}/{projectId}/work-items")
    public ResponseEntity<List<WorkItem>> getProjectWorkItems(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            Authentication auth) {

        // Identify the user
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Security Check: Is the user a member of this workspace
        if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
            return ResponseEntity.status(403).build();
        }

        // Validation: Does the project actually belong to this workspace?
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build(); // Bad request: Project/Workspace mismatch
        }

        // fetch
        List<WorkItem> items = workItemRepository.findByProject_IdOrderByPositionAsc(projectId);
        return ResponseEntity.ok(items);
    }

    // DTO for updating project name
    public record UpdateProjectNameRequest(String name) {
    }

    // DTO for updating project description
    public record UpdateProjectDescriptionRequest(String description) {
    }

    /**
     * Update project name - Admin only
     */
    @PatchMapping("/{workspaceId}/{projectId}/name")
    public ResponseEntity<Project> updateProjectName(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody UpdateProjectNameRequest request,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is ADMIN
        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElse(null);
        if (membership == null || !"ADMIN".equals(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        if (request.name() == null || request.name().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        project.setName(request.name());
        return ResponseEntity.ok(projectRepository.save(project));
    }

    /**
     * Update project description - Admin only
     */
    @PatchMapping("/{workspaceId}/{projectId}/description")
    public ResponseEntity<Project> updateProjectDescription(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody UpdateProjectDescriptionRequest request,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is ADMIN
        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElse(null);
        if (membership == null || !"ADMIN".equals(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        project.setDescription(request.description());
        return ResponseEntity.ok(projectRepository.save(project));
    }

    /**
     * Delete project - Admin only
     */
    @DeleteMapping("/{workspaceId}/{projectId}")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is ADMIN
        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElse(null);
        if (membership == null || !"ADMIN".equals(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        projectRepository.delete(project);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{workspaceId}/{projectId}/work-items")
    public ResponseEntity<WorkItem> createWorkItem(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody CreateWorkItemRequest request,
            Authentication auth) {

        // Identify the Creator
        User creator = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Security: Is Creator in this Workspace?
        if (!membershipRepository.existsByUserIdAndWorkspaceId(creator.getId(), workspaceId)) {
            return ResponseEntity.status(403).build();
        }

        // Validation: Project existence and Workspace ownership
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        // Validate Input
        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Handle Assignee (Optional)
        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));

            // Validate: Is the assignee actually a member of this workspace?
            if (!membershipRepository.existsByUserIdAndWorkspaceId(assignee.getId(), workspaceId)) {
                return ResponseEntity.badRequest().build();
            }
        }

        // Calculate Position (Append to bottom)
        Double maxPosition = workItemRepository.findMaxPositionByProjectId(projectId);
        double newPosition = (maxPosition != null) ? maxPosition + 1000.0 : 1000.0;

        // 7. Build and Save
        WorkItem workItem = WorkItem.builder()
                .title(request.title())
                .description(request.description())
                // Use defaults if null
                .status(request.status() != null ? request.status() : WorkItemStatus.BACKLOG)
                .priority(request.priority() != null ? request.priority() : WorkItemPriority.MEDIUM)
                .type(request.type() != null ? request.type() : WorkItemType.TASK)
                .position(newPosition)
                .project(project)
                .creator(creator)
                .assignee(assignee)
                .build();

        return ResponseEntity.ok(workItemRepository.save(workItem));
    }
}
