package com.strideboard.project;

import java.util.UUID;

import com.strideboard.data.workitem.WorkItemPriority;
import com.strideboard.data.workitem.WorkItemStatus;
import com.strideboard.data.workitem.WorkItemType;

public record CreateWorkItemRequest(
        String title,
        String description,
        WorkItemStatus status,
        WorkItemPriority priority,
        WorkItemType type,
        UUID assigneeId) {
}