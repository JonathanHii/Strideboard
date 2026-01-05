package com.strideboard.workspace;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.strideboard.data.user.User;
import com.strideboard.data.user.UserRepository;
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

    @PostMapping
    @Transactional
    public ResponseEntity<Workspace> createWorkspace(@RequestBody Workspace workspace, Authentication auth) {
        // Generate a slug (simple version: "My Team" -> "my-team")
        workspace.setSlug(workspace.getName().toLowerCase().replaceAll(" ", "-"));

        // Save Workspace
        Workspace savedWorkspace = workspaceRepository.save(workspace);

        // Find Current User
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create and Save Membership (Owner/Admin)
        Membership membership = Membership.builder()
                .user(currentUser)
                .workspace(savedWorkspace)
                .role("ADMIN")
                .build();

        membershipRepository.save(membership);

        return ResponseEntity.ok(savedWorkspace);
    }

}
