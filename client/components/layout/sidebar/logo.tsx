import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-2">
      <div className="rounded-md overflow-hidden">
        <Image 
          src="/favicon.ico" 
          alt="Strideboard Logo" 
          width={32} 
          height={32} 
          className="w-8 h-8" 
        />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900">
        Strideboard
      </span>
    </Link>
  );
}