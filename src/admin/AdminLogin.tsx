import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "./useSession";
import { AlertIcon } from "./icons";
import { Button, Input, Label } from "./ui";

export default function AdminLogin() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from?.pathname ?? "/admin"} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    navigate("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6fb] px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex items-center justify-center mb-8">
          <div className="h-11 w-11 rounded-xl bg-[#111116] flex items-center justify-center text-white font-semibold text-lg">
            P
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-8 flex flex-col gap-5"
        >
          <div className="text-center mb-1">
            <h1 className="text-lg font-semibold text-[#18181b]">관리자 로그인</h1>
            <p className="mt-1 text-sm text-[#a1a1aa]">포트폴리오 콘텐츠를 관리하려면 로그인하세요.</p>
          </div>

          <div>
            <Label htmlFor="admin-email">이메일</Label>
            <Input
              id="admin-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="admin-password">비밀번호</Label>
            <Input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-[#fef2f2] px-3 py-2.5 text-sm text-[#dc2626]">
              <AlertIcon className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full mt-1">
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
