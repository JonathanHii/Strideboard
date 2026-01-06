export interface Workspace {
  id: string;
  name: string;
  slug: string;
  memberCount: number;  
  projectCount: number;
  projects: Project[];
}

export interface Membership {
  id: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  user?: any; // expand this if  need User details
  workspace?: Workspace;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO string from LocalDateTime
  workspaceId?: string; 
}