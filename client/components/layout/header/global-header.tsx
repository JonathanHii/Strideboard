import UserActions from "./user-actions";
import Breadcrumbs from "./breadcrumbs";

export default function GlobalHeader() {
  return (
    <header className="h-20 border-b border-gray-200 bg-white relative flex items-center w-full">
      <div className="w-full max-w-7xl mx-auto px-8 flex items-center">
        <Breadcrumbs />
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <UserActions />
      </div>
    </header>
  );
}