import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "./useSession";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f9] text-sub-secondary-txt">
        확인 중...
      </div>
    );
  }

  if (session === null) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
