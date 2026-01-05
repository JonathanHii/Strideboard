import UserActions from "./user-actions";

export default function GlobalHeader() {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-end px-6">
      <UserActions />
    </header>
  );
}