"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const { workspace, project } = params;
    if (workspace && project) {
      router.replace(`/${workspace}/${project}/board`);
    }
  }, [params, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-sm text-gray-400 animate-pulse">
        Entering project view...
      </div>
    </div>
  );
}