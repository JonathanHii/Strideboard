"use client";

import { Bell, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function UserActions() {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-5">
      <button className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 relative">
        <Bell className="w-6 h-6" />
        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
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
  );
}