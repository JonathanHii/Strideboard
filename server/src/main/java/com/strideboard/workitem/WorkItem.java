package com.strideboard.workitem;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.strideboard.data.user.User;
import com.strideboard.project.Project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "work_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

 
    @Enumerated(EnumType.STRING)
    private WorkItemStatus status; 
    // BACKLOG
    // Todo    
    // IN PROGRESS
    // DONE

    @Enumerated(EnumType.STRING)
    private WorkItemPriority priority; // LOW, MEDIUM, HIGH, URGENT

    @Enumerated(EnumType.STRING)
    private WorkItemType type; // TASK, BUG, EPIC

    /**
     * Position used for Drag and Drop ordering within a column.
     * Using Double allows for easy re-ordering (averaging positions).
     */
    @Column(nullable = false)
    private Double position;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    // Helper methods for JSON response consistency
    @JsonProperty("projectId")
    public UUID getProjectId() {
        return project != null ? project.getId() : null;
    }

    @JsonProperty("assigneeName")
    public String getAssigneeName() {
        return assignee != null ? assignee.getFullName() : "Unassigned";
    }
}