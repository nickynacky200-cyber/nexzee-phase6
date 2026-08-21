import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Zap } from "lucide-react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Login failed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8">
        <div className="w-11 h-11 rounded-xl bg-nexzee flex items-center justify-center mb-8">
          <Zap size={22} className="text-white" fill="currentColor" />
        </div>

        <h1 className="text-2xl font-extrabold text-ink mb-1">Welcome Back 👋</h1>
        <p className="text-sm text-ink-soft mb-8">Login to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Phone Number"
            icon={<Mail size={18} />}
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <Input
            label="Password"
            icon={<Lock size={18} />}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-ink-faint"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="text-right">
            <button type="button" className="text-sm text-nexzee font-medium">
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <Button type="submit" loading={loading}>
            Login
          </Button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-8">
          Don't have an account?{" "}
          <Link to="/register" className="text-nexzee font-semibold">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
