"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, X, Mail, User, Plus } from "lucide-react";
import { workspaceService } from "@/services/workspace-service";
import { UserSummary } from "@/types/types";

interface AddPeopleModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onInviteSuccess: () => void;
}

export default function AddPeopleModal({
  isOpen,
  onClose,
  workspaceId,
  onInviteSuccess,
}: AddPeopleModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Search Logic
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!inviteEmail || inviteEmail.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await workspaceService.searchUsersNotInWorkspace(workspaceId, inviteEmail);
        const filtered = results.filter((u) => !invitedEmails.includes(u.email));
        setSearchResults(filtered);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [inviteEmail, invitedEmails, workspaceId]);

  const addEmail = (email: string) => {
    if (!email || !email.includes("@")) return;
    if (!invitedEmails.includes(email)) {
      setInvitedEmails([...invitedEmails, email]);
      setInviteEmail("");
      setSearchResults([]);
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter((email) => email !== emailToRemove));
  };

  const handleInviteMembers = async () => {
    if (invitedEmails.length === 0) return;

    setIsInviting(true);
    try {
      await workspaceService.addMembersToWorkspace(workspaceId, invitedEmails);
      onInviteSuccess();
      handleClose();
    } catch (error) {
      console.error("Failed to invite members", error);
      alert(error instanceof Error ? error.message : "Failed to invite members. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    setInviteEmail("");
    setInvitedEmails([]);
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add People</h2>
            <p className="text-sm text-gray-500 mt-0.5">Invite members to this workspace.</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 [scrollbar-gutter: stable]">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Users</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEmail(inviteEmail);
                  }
                }}
                placeholder="name@company.com"
                className="w-full pl-11 pr-4 h-11 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                autoComplete="off"
                autoFocus
              />

              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-47 overflow-y-auto z-50 ring-1 ring-black/5">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching users...
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addEmail(user.email)}
                        className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors group border-b border-gray-50 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex shrink-0 items-center justify-center text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name || "Unknown User"}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Plus className="w-4 h-4 ml-auto text-gray-400 group-hover:text-indigo-600" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selected Emails List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending Invites {invitedEmails.length > 0 && `(${invitedEmails.length})`}
              </p>
              {invitedEmails.length > 0 && (
                <button
                  onClick={() => setInvitedEmails([])}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="h-36 w-full border border-gray-200 rounded-xl bg-gray-50/50 p-2 overflow-y-auto overscroll-contain">
              {invitedEmails.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Mail className="w-5 h-5 mb-1 opacity-20" />
                  <span className="text-xs">No users selected yet</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {invitedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-white text-indigo-700 rounded-lg text-sm font-medium border border-indigo-100 shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded-md transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-medium transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleInviteMembers}
            disabled={invitedEmails.length === 0 || isInviting}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg font-medium"
          >
            {isInviting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Inviting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Invite Members
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}