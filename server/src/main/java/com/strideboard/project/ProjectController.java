package com.strideboard.project;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.strideboard.data.project.Project;
import com.strideboard.data.project.ProjectRepository;
import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;
import com.strideboard.data.workitem.WorkItem;
import com.strideboard.data.workitem.WorkItemRepository;
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

}
