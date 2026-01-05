import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2">
      <div className="bg-[#4F46E5] p-1.5 rounded-md">
        <LayoutDashboard className="w-5 h-5 text-white" />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900">
        Strideboard
      </span>
    </Link>
  );
}