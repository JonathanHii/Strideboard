import { User2 } from "lucide-react";
import Link from "next/link";

interface MyWorkProps {
  onNavigate?: () => void;
}

export default function MyWork({ onNavigate }: MyWorkProps) {
  return (
    <Link
      href="/workspaces"
      onClick={onNavigate}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-900 font-medium hover:bg-gray-100 transition-colors"
    >
      <User2 className="w-4 h-4 text-gray-500" />
      <span>All Workspaces</span>
    </Link>
  );
}