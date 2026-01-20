package com.strideboard.realtime;

import com.strideboard.data.workitem.WorkItem;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WorkItemSocketEvent {
    private EventType type; // "CREATED", "UPDATED", "DELETED"
    private WorkItem workItem;
    private String workItemId; 

    public enum EventType {
        CREATED, UPDATED, DELETED
    }
}