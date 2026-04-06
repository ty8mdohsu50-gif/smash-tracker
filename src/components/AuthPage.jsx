import { useState } from "react";
import { Swords, Mail, Lock, User, ArrowRight, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useI18n } from "../i18n/index.jsx";

const FONT = "'Chakra Petch', 'Noto Sans JP', -apple-system, 'Hiragino Sans', sans-serif";

export default function AuthPage({ onSkip }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
        setSent(true);
      }
    } catch (err) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (err) setError(translateError(err.message));
  };

  if (sent) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <Mail size={40} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e", marginBottom: 8 }}>
            {t("auth.emailSent")}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, textAlign: "center" }}>
            <strong>{email}</strong>{t("auth.emailSentDesc")}
          </div>
          <button
            onClick={() => { setSent(false); setMode("login"); }}
            style={linkBtnStyle}
          >
            {t("auth.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #374151, #1F2937)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(124,58,237,.35)",
            }}
          >
            <Swords size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: "#9CA3AF", fontFamily: "'Chakra Petch', sans-serif" }}>
              SMASH TRACKER
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              {mode === "login" ? t("auth.login") : t("auth.signup")}
            </div>
          </div>
        </div>

        {/* Google button */}
        <button onClick={handleGoogle} style={googleBtnStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t("auth.googleLogin")}
        </button>

        <div style={dividerStyle}>
          <div style={dividerLineStyle} />
          <span style={{ fontSize: 12, color: "#9ca3af", padding: "0 12px" }}>{t("auth.or")}</span>
          <div style={dividerLineStyle} />
        </div>

        {/* Error */}
        {error && (
          <div style={errorStyle}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <div style={inputGroupStyle}>
            <Mail size={16} color="#9ca3af" style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              required
              style={inputStyle}
            />
          </div>
          <div style={inputGroupStyle}>
            <Lock size={16} color="#9ca3af" style={{ position: "absolute", left: 14, top: 14 }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={submitBtnStyle}>
            {loading ? "..." : (
              <>
                {mode === "login" ? t("auth.loginButton") : t("auth.signupButton")}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Toggle mode */}
        <button
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          style={linkBtnStyle}
        >
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
        </button>

        {/* Skip */}
        <button onClick={onSkip} style={skipBtnStyle}>
          {t("auth.skipLogin")}
        </button>
        <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>
          {t("auth.skipNote")}
        </div>
      </div>
    </div>
  );
}

function translateError(msg) {
  if (msg.includes("Invalid login")) return "メールアドレスまたはパスワードが正しくありません";
  if (msg.includes("already registered")) return "このメールアドレスは既に登録されています";
  if (msg.includes("valid email")) return "有効なメールアドレスを入力してください";
  if (msg.includes("at least 6")) return "パスワードは6文字以上で入力してください";
  if (msg.includes("rate limit")) return "しばらく時間をおいてから再度お試しください";
  if (msg.includes("Email not confirmed")) return "メールアドレスの確認が完了していません。確認メールをご確認ください";
  if (msg.includes("provider is not enabled")) return "Google認証はまだ設定されていません";
  return msg;
}

const containerStyle = {
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
  padding: "16px",
  fontFamily: FONT,
  boxSizing: "border-box",
};

const cardStyle = {
  background: "#fff",
  borderRadius: 20,
  padding: "32px 24px",
  width: "100%",
  maxWidth: 400,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxShadow: "0 20px 60px rgba(0,0,0,.3)",
};

const googleBtnStyle = {
  width: "100%",
  padding: "14px 20px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  background: "#fff",
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  cursor: "pointer",
  transition: "background .15s",
  fontFamily: FONT,
};

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  margin: "20px 0",
};

const dividerLineStyle = {
  flex: 1,
  height: 1,
  background: "#e5e7eb",
};

const errorStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(220,38,38,.08)",
  border: "1px solid rgba(220,38,38,.2)",
  borderRadius: 10,
  color: "#dc2626",
  fontSize: 13,
  marginBottom: 16,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const inputGroupStyle = {
  position: "relative",
  width: "100%",
  marginBottom: 12,
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px 13px 40px",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  fontSize: 14,
  color: "#1c1c1e",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: FONT,
  transition: "border-color .15s",
};

const submitBtnStyle = {
  width: "100%",
  padding: "14px 20px",
  border: "none",
  borderRadius: 12,
  background: "linear-gradient(135deg, #374151, #1F2937)",
  color: "#fff",
  fontSize: 15,
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  marginTop: 4,
  boxShadow: "0 4px 16px rgba(124,58,237,.35)",
  fontFamily: FONT,
};

const linkBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#9CA3AF",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 20,
  fontFamily: FONT,
};

const skipBtnStyle = {
  background: "transparent",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  color: "#6b7280",
  fontSize: 13,
  fontWeight: 500,
  padding: "10px 20px",
  cursor: "pointer",
  marginTop: 20,
  fontFamily: FONT,
};
