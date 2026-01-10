export interface User {
  id: string;         // Maps to UUID
  email: string;      // Maps to String
  fullName: string;   // Maps to String
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  memberEmails?: string[]; // Optional: Array of emails to invite immediately
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  projectCount: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO string from LocalDateTime
  workspaceId?: string;
}

export type WorkItemStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
export type WorkItemPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkItemType = 'TASK' | 'BUG' | 'EPIC';

export interface WorkItem {
  id: string;
  title: string;
  description?: string;

  status: WorkItemStatus;
  priority: WorkItemPriority;
  type: WorkItemType;

  position: number;

  createdAt: string;
  updatedAt: string;

  assignee: User | null; 
  creator: User;

  projectId: string;
}