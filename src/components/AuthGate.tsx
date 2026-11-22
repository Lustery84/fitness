"use client";

import { useState } from "react";
import { Lock, LogIn, Mail, UserPlus } from "lucide-react";
import {
  getBrowserSupabase,
  setBrowserSupabaseConfig,
} from "@/lib/storage/supabase";

interface AuthGateProps {
  supabaseConfig?: { url: string; publicKey: string } | null;
  onAuthenticated: () => void;
}

export function AuthGate({ supabaseConfig, onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (supabaseConfig?.url && supabaseConfig?.publicKey) {
      setBrowserSupabaseConfig(supabaseConfig.url, supabaseConfig.publicKey);
    }
    const supabase = getBrowserSupabase();
    if (!supabase) {
      setError(
        "Chưa nhận được cấu hình Supabase ở trình duyệt. Kiểm tra NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY rồi Redeploy.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        onAuthenticated();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        if (data.session) {
          onAuthenticated();
        } else {
          setMessage(
            "Đã tạo tài khoản! Kiểm tra email xác nhận hoặc bấm Đăng nhập nếu dự án đã tắt Confirm email.",
          );
          setMode("login");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi kết nối khi đăng nhập/đăng ký.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-center bg-[var(--bg-canvas)] px-5 py-8 shadow-xl">
      <div className="mobile-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--mint-primary)] text-lg font-black text-white">
            F
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">FitSnap Cloud</h1>
            <p className="text-xs text-[var(--ink-muted)]">
              Đồng bộ dữ liệu an toàn trên mọi thiết bị
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-full bg-[var(--bg-soft)] p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-full py-2 transition ${
              mode === "login"
                ? "bg-[var(--mint-primary)] text-white"
                : "text-[var(--ink-muted)]"
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded-full py-2 transition ${
              mode === "signup"
                ? "bg-[var(--mint-primary)] text-white"
                : "text-[var(--ink-muted)]"
            }`}
          >
            Tạo tài khoản
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl border border-teal-200 bg-[var(--mint-soft)] px-3.5 py-2.5 text-xs text-[var(--mint-dark)]">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <label className="block">
            <span className="font-semibold text-[var(--ink-muted)]">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@example.com"
                className="w-full rounded-xl bg-[var(--bg-soft)] py-2.5 pl-9 pr-3"
              />
            </div>
          </label>

          <label className="block">
            <span className="font-semibold text-[var(--ink-muted)]">Mật khẩu</span>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[var(--ink-muted)]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl bg-[var(--bg-soft)] py-2.5 pl-9 pr-3"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--mint-primary)] py-3 text-xs font-extrabold text-white hover:bg-[var(--mint-dark)] disabled:opacity-60"
          >
            {mode === "login" ? (
              <>
                <LogIn className="h-4 w-4" />
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {loading ? "Đang tạo..." : "Đăng ký tài khoản"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
