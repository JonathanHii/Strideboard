import {Bell} from "lucide-react";

export default function UserActions() {
  return (
    <div className="flex items-center gap-4">
      <button className="text-gray-500 hover:text-gray-900 transition-colors p-1 relative">
        <Bell className="w-5 h-5" />
        {/* Simple Notification Dot */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
      </button>
      
      <button className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 border border-amber-200 overflow-hidden">
        {/* Placeholder for User Avatar image */}
        <img 
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
          alt="User Profile" 
          className="w-full h-full object-cover"
        />
      </button>
    </div>
  );
}