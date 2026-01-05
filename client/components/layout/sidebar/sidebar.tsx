import Logo from "./logo";
import MyWork from "./my-work";
import WorkspaceList from "./workspace-list";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-[#F9FAFB] flex flex-col">
      <div className="p-4">
        <Logo />
      </div>
      <nav className="flex-1 px-2 py-4 space-y-8">
        <MyWork />
        <WorkspaceList />
      </nav>
    </aside>
  );
}