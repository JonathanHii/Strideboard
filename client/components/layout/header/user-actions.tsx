import { Bell } from "lucide-react";

export default function UserActions() {
  return (
    <div className="flex items-center gap-5">
      {/* Notification Button */}
      <button className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 relative">
        <Bell className="w-6 h-6" />
        {/* Adjusted Notification Dot position for larger icon */}
        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
      </button>
      
      {/* Avatar Button */}
      <button className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 border border-amber-200 overflow-hidden transition-transform hover:scale-105">
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