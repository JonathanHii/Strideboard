package com.strideboard.data.workitem;

import java.util.UUID;

public record UpdateWorkItemRequest(
                String title,
                String description,
                WorkItemStatus status,
                WorkItemPriority priority,
                WorkItemType type,
                UUID assigneeId,
                Double position) {
}
