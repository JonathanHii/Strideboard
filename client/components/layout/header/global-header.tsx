import UserActions from "./user-actions";
import Breadcrumbs from "./breadcrumbs";

export default function GlobalHeader() {
  return (
    // ADDED 'relative' back here so the absolute positioning stays inside the header
    <header className="relative h-20 border-b border-gray-200 bg-white w-full px-8 flex items-center">
      
      {/* Centered Breadcrumbs container */}
      <div className="w-full max-w-7xl mx-auto flex items-center pr-16">
        <Breadcrumbs />
      </div>

      {/* User Actions pinned to the absolute right */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <UserActions />
      </div>

    </header>
  );
}