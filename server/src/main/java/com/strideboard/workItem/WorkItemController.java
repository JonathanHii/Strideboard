package com.strideboard.workItem;

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

import com.strideboard.data.notification.Notification;
import com.strideboard.data.notification.NotificationRepository;
import com.strideboard.data.notification.NotificationType;
import com.strideboard.data.project.Project;
import com.strideboard.data.project.ProjectRepository;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;
import com.strideboard.data.workitem.CreateWorkItemRequest;
import com.strideboard.data.workitem.UpdateWorkItemRequest;
import com.strideboard.data.workitem.WorkItem;
import com.strideboard.data.workitem.WorkItemPriority;
import com.strideboard.data.workitem.WorkItemRepository;
import com.strideboard.data.workitem.WorkItemStatus;
import com.strideboard.data.workitem.WorkItemType;
import com.strideboard.data.workspace.Membership;
import com.strideboard.data.workspace.MembershipRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects/{workspaceId}/{projectId}/work-items")
@RequiredArgsConstructor
public class WorkItemController {

    private final WorkItemRepository workItemRepository;
    private final ProjectRepository projectRepository;
    private final MembershipRepository membershipRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<WorkItem>> getProjectWorkItems(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!membershipRepository.existsByUserIdAndWorkspaceId(user.getId(), workspaceId)) {
            return ResponseEntity.status(403).build();
        }

        // Validate Project Hierarchy
        if (!validateProjectInWorkspace(projectId, workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        return ResponseEntity.ok(workItemRepository.findByProject_IdOrderByPositionAsc(projectId));
    }

    @PostMapping
    public ResponseEntity<WorkItem> createWorkItem(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @RequestBody CreateWorkItemRequest request,
            Authentication auth) {

        User creator = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(creator.getId(), workspaceId)
                .orElse(null);

        // Security: Must be ADMIN or MEMBER (not VIEWER)
        if (membership == null || "VIEWER".equalsIgnoreCase(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (!project.getWorkspace().getId().equals(workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        if (request.title() == null || request.title().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Handle Assignee
        User assignee = null;
        if (request.assigneeId() != null) {
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));

            if (!membershipRepository.existsByUserIdAndWorkspaceId(assignee.getId(), workspaceId)) {
                return ResponseEntity.badRequest().build();
            }
        }

        // Auto-position logic
        Double maxPosition = workItemRepository.findMaxPositionByProjectId(projectId);
        double newPosition = (maxPosition != null) ? maxPosition + 1000.0 : 1000.0;

        WorkItem workItem = WorkItem.builder()
                .title(request.title())
                .description(request.description())
                .status(request.status() != null ? request.status() : WorkItemStatus.BACKLOG)
                .priority(request.priority() != null ? request.priority() : WorkItemPriority.MEDIUM)
                .type(request.type() != null ? request.type() : WorkItemType.TASK)
                .position(newPosition)
                .project(project)
                .creator(creator)
                .assignee(assignee)
                .build();

        WorkItem savedWorkItem = workItemRepository.save(workItem);

        // Send Notification
        if (assignee != null && !assignee.getId().equals(creator.getId())) {
            Notification notification = Notification.builder()
                    .recipient(assignee)
                    .type(NotificationType.UPDATE)
                    .workspace(project.getWorkspace())
                    .workItem(savedWorkItem)
                    .title("New Task Assigned")
                    .subtitle("You have been assigned to: " + savedWorkItem.getTitle())
                    .build();
            notificationRepository.save(notification);
        }

        return ResponseEntity.ok(savedWorkItem);
    }

    @PatchMapping("/{workItemId}")
    public ResponseEntity<WorkItem> updateWorkItem(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @PathVariable UUID workItemId,
            @RequestBody UpdateWorkItemRequest request,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElse(null);

        if (membership == null || "VIEWER".equalsIgnoreCase(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new RuntimeException("Work item not found"));

        if (!validateHierarchy(workItem, projectId, workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        // Apply Updates
        if (request.title() != null && !request.title().isBlank())
            workItem.setTitle(request.title());
        if (request.description() != null)
            workItem.setDescription(request.description());
        if (request.status() != null)
            workItem.setStatus(request.status());
        if (request.priority() != null)
            workItem.setPriority(request.priority());
        if (request.type() != null)
            workItem.setType(request.type());

        // Update Assignee
        if (request.assigneeId() != null) {
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new RuntimeException("Assignee not found"));
            if (!membershipRepository.existsByUserIdAndWorkspaceId(assignee.getId(), workspaceId)) {
                return ResponseEntity.badRequest().build();
            }
            workItem.setAssignee(assignee);
        } 
        return ResponseEntity.ok(workItemRepository.save(workItem));
    }

    @DeleteMapping("/{workItemId}")
    public ResponseEntity<Void> deleteWorkItem(
            @PathVariable UUID workspaceId,
            @PathVariable UUID projectId,
            @PathVariable UUID workItemId,
            Authentication auth) {

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Membership membership = membershipRepository.findByUserIdAndWorkspaceId(user.getId(), workspaceId)
                .orElse(null);

        if (membership == null || "VIEWER".equalsIgnoreCase(membership.getRole())) {
            return ResponseEntity.status(403).build();
        }

        WorkItem workItem = workItemRepository.findById(workItemId)
                .orElseThrow(() -> new RuntimeException("Work item not found"));

        if (!validateHierarchy(workItem, projectId, workspaceId)) {
            return ResponseEntity.status(400).build();
        }

        workItemRepository.delete(workItem);
        return ResponseEntity.noContent().build();
    }

    // --- Helpers ---

    private boolean validateProjectInWorkspace(UUID projectId, UUID workspaceId) {
        return projectRepository.findById(projectId)
                .map(p -> p.getWorkspace().getId().equals(workspaceId))
                .orElse(false);
    }

    private boolean validateHierarchy(WorkItem item, UUID projectId, UUID workspaceId) {
        return item.getProject().getId().equals(projectId) &&
                item.getProject().getWorkspace().getId().equals(workspaceId);
    }
}
