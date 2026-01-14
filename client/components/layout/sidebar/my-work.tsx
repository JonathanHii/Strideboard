import {User2} from "lucide-react";
import Link from "next/link";

export default function MyWork() {
  return (
    <Link
      href="/workspaces"
      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-200/50 text-gray-900 font-medium transition-colors"
    >
      <User2 className="w-4 h-4 text-gray-500" />
      <span>My Work</span>
    </Link>
  );
}