"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, X, Check, FolderOpen, Trash2, ChevronDown, Crown} from "lucide-react";
import { Workspace, WorkspaceMember } from "@/types/types";
import { workspaceService } from "@/services/workspace-service";
import AddPeopleModal from "./add-people-modal";
import DeleteWorkspaceModal from "./delete-workspace-modal";
import { useRouter } from "next/navigation";

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  onWorkspaceUpdated: (updatedWorkspace: Workspace) => void;
}

export default function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspace,
  onWorkspaceUpdated,
}: WorkspaceSettingsModalProps) {
  const router = useRouter();
  const [settingsName, setSettingsName] = useState(workspace.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Member State
  const [currentUser, setCurrentUser] = useState<WorkspaceMember | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Loading States
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  // Sub-Modals State
  const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Load Members when Settings Opens
  const loadMemberData = useCallback(async () => {
    if (!workspace.id) return;
    try {
      const [currentUserData, membersData, ownerData] = await Promise.all([
        workspaceService.getCurrentUserInWorkspace(workspace.id),
        workspaceService.getWorkspaceMembers(workspace.id),
        workspaceService.getWorkspaceOwner(workspace.id)
      ]);
      setCurrentUser(currentUserData);
      setMembers(membersData);
      setOwnerId(ownerData.ownerId);
    } catch (err) {
      console.error("Error loading member data:", err);
    }
  }, [workspace.id]);

  useEffect(() => {
    if (isOpen) {
      setSettingsName(workspace.name);
      loadMemberData();
    }
  }, [isOpen, workspace.name, loadMemberData]);

  const handleUpdateWorkspaceName = async () => {
    if (!settingsName.trim() || settingsName === workspace.name) return;

    setIsSavingName(true);
    setSaveSuccess(false);
    try {
      const updatedWorkspace = await workspaceService.updateWorkspaceName(workspace.id, settingsName.trim());
      onWorkspaceUpdated(updatedWorkspace);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to update workspace name", error);
      alert(error instanceof Error ? error.message : "Failed to update workspace name.");
      setSettingsName(workspace.name);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (removingMemberId) return;
    setRemovingMemberId(memberId);
    try {
      await workspaceService.removeMemberFromWorkspace(workspace.id, memberId);
      await loadMemberData();
    } catch (error) {
      console.error("Failed to remove member", error);
      alert(error instanceof Error ? error.message : "Failed to remove member.");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (updatingRoleId) return;

    setUpdatingRoleId(memberId);
    try {
      await workspaceService.changeMemberRole(workspace.id, memberId, newRole);
      await loadMemberData();
    } catch (error) {
      console.error("Failed to update role", error);
      alert(error instanceof Error ? error.message : "Failed to update role.");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!confirm("Are you sure you want to leave this workspace?")) return;

    setIsLeaving(true);
    try {
      await workspaceService.leaveWorkspace(workspace.id);

      onClose();
      window.dispatchEvent(new Event("workspace-updated"));
      router.push("/workspaces");
    } catch (error) {
      console.error("Failed to leave workspace", error);
      alert(error instanceof Error ? error.message : "Failed to leave workspace.");
    } finally {
      setIsLeaving(false);
    }
  };

  // Helper Utils
  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN": return "bg-indigo-100 text-indigo-700";
      case "MEMBER": return "bg-orange-100 text-orange-700";
      case "VIEWER": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (!isOpen) return null;

  const isAdmin = currentUser?.role.toUpperCase() === "ADMIN";
  const amIOwner = currentUser?.id === ownerId;

  // SORTING LOGIC: Owner first, everything else preserved
  const sortedMembers = members
    .filter((member) => currentUser && member.id !== currentUser.id)
    .sort((a, b) => {
      if (a.id === ownerId) return -1;
      if (b.id === ownerId) return 1;
      return 0;
    });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 rounded-t-2xl">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Workspace Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage configuration and members.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter:stable]">

            {/* General Section */}
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">General</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Workspace Name</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      className="flex-1 px-4 h-11 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-gray-900"
                    />
                    <button
                      onClick={handleUpdateWorkspaceName}
                      disabled={!settingsName.trim() || settingsName === workspace.name || isSavingName || !isAdmin}
                      className={`px-4 h-11 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 min-w-[100px] justify-center ${saveSuccess ? "bg-green-500 hover:bg-green-600" : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"
                        }`}
                    >
                      {isSavingName ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 animate-in zoom-in duration-200" /> Saved!
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold block">Workspace ID</span>
                    <span className="opacity-75 font-mono">{workspace.id}</span>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Members Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Members</h3>
                <button onClick={() => setIsAddPeopleOpen(true)} className="text-indigo-600 text-sm font-medium hover:underline">
                  Add People
                </button>
              </div>
              <div className="space-y-3">
                {currentUser && (
                  <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(currentUser.role)}`}>
                        You
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.name || currentUser.email}
                          <span className="ml-2 text-xs text-indigo-600 font-normal">(You)</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{currentUser.role}</p>
                          {amIOwner && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><Crown className="w-3 h-3" /> Owner</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sortedMembers.map((member) => {
                  const isTargetOwner = member.id === ownerId;
                  const isTargetAdmin = member.role.toUpperCase() === "ADMIN";

                  // PERMISSION CHECK:
                  // 1. Must be at least an Admin to edit anyone.
                  // 2. Can NEVER edit the Owner.
                  // 3. If I am NOT the Owner, I cannot edit other Admins.
                  const canEditRole = isAdmin && !isTargetOwner && (amIOwner || !isTargetAdmin);

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarColor(member.role)}`}>
                          {getInitials(member.name, member.email)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name || member.email}</p>
                          {isTargetOwner && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mb-1">
                              <Crown className="w-3 h-3" /> Owner
                            </span>
                          )}

                          {/* Role Selection Logic */}
                          {canEditRole ? (
                            <div className="relative flex items-center mt-0.5 group">
                              {updatingRoleId === member.id && (
                                <div className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none z-10">
                                  <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                                </div>
                              )}
                              <select
                                className={`
                                    appearance-none bg-transparent text-xs text-gray-500 font-medium 
                                    pr-4 py-0 border-none focus:ring-0 focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors
                                    ${updatingRoleId === member.id ? 'opacity-0' : ''}
                                  `}
                                value={member.role.toUpperCase()}
                                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                disabled={updatingRoleId === member.id}
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                                <option value="VIEWER">Viewer</option>
                              </select>
                              <ChevronDown className={`w-3 h-3 text-gray-400 pointer-events-none -ml-3 group-hover:text-indigo-600 transition-colors ${updatingRoleId === member.id ? 'hidden' : ''}`} />
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 mt-0.5">{member.role}</p>
                          )}
                        </div>
                      </div>

                      {/* Remove Button Logic */}
                      {canEditRole && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removingMemberId === member.id || updatingRoleId === member.id}
                          className="text-gray-400 hover:text-red-600 disabled:text-gray-300 transition-colors p-1"
                          title="Remove member"
                        >
                          {removingMemberId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  )
                })}
                {sortedMembers.length === 0 && <div className="text-center py-6 text-gray-500 text-sm">No other members in this workspace yet.</div>}
              </div>
            </section>

            <hr className="border-gray-100" />

            {/* Danger Zone */}
            <section>
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4">Danger Zone</h3>

              {/* DELETE WORKSPACE (Only for Owner) */}
              {amIOwner && (
                <div className="border border-red-100 bg-red-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Delete Workspace</h4>
                    <p className="text-sm text-red-700 mt-1">Permanently remove this workspace and all projects.</p>
                  </div>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap"
                  >
                    Delete Workspace
                  </button>
                </div>
              )}

              {/* LEAVE WORKSPACE (For everyone else, including Admins who are not Owner) */}
              {!amIOwner && (
                <div className="border border-red-100 bg-red-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Leave Workspace</h4>
                    <p className="text-sm text-red-700 mt-1">Revoke your access to this workspace.</p>
                  </div>
                  <button
                    onClick={handleLeaveWorkspace}
                    disabled={isLeaving}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLeaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Leave Workspace
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <AddPeopleModal
        isOpen={isAddPeopleOpen}
        onClose={() => setIsAddPeopleOpen(false)}
        workspaceId={workspace.id}
        onInviteSuccess={loadMemberData}
      />

      <DeleteWorkspaceModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </>
  );
}