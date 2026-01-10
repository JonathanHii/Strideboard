package com.strideboard.data.workspace;

import java.util.List;

import lombok.Data;

@Data
public class CreateWorkspaceRequest {
    private String name;
    private String slug;
    private List<String> memberEmails;
}
