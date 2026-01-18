"use client";

import { useState, useEffect } from "react"; // Added useEffect
import { Mail, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { notificationService } from "@/services/notification-service"; // Import your service
import NotificationsModal from "@/components/notifications/NotificationsModal";

export default function UserActions() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const status = await notificationService.hasUnreadNotifications();
        setHasUnread(status);
      } catch (error) {
        console.error("Failed to check notifications", error);
      }
    };
    checkNotifications();
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/");
    router.refresh();
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setHasUnread(false);
  };

  return (
    <>
      <div className="flex items-center gap-5">
        {/* Messages Button */}
        <button
          onClick={handleOpenNotifications}
          className="relative text-gray-500 hover:text-gray-900 transition-colors p-1.5 outline-none"
          aria-label="Messages"
        >
          <Mail className="w-6 h-6" />

          {/* The Red Dot */}
          {hasUnread && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-white"></span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden transition-transform hover:scale-105 outline-none">
              <User className="w-6 h-6 text-gray-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notifications Modal Component */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}