package com.strideboard.data.workspace;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.strideboard.project.Project;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "workspaces")
public class Workspace {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String slug;

    @JsonIgnore
    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL)
    private List<Membership> memberships;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL)
    private List<Project> projects;

    @JsonProperty("memberCount")
    public int getMemberCount() {
        return memberships != null ? memberships.size() : 0;
    }

    @JsonProperty("projectCount")
    public int getProjectCount() {
        return projects != null ? projects.size() : 0;
    }
}
