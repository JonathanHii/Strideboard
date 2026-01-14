package com.strideboard.data.workitem;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface WorkItemRepository extends JpaRepository<WorkItem, UUID> {
    List<WorkItem> findByProjectId(UUID projectId);

    List<WorkItem> findByProject_IdOrderByPositionAsc(UUID projectId);

    @Query("SELECT MAX(w.position) FROM WorkItem w WHERE w.project.id = :projectId")
    Double findMaxPositionByProjectId(@Param("projectId") UUID projectId);
}
