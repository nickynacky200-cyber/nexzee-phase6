import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms & Conditions to continue");
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="flex-1 flex flex-col px-6 pt-10 pb-8">
        <h1 className="text-2xl font-extrabold text-ink mb-1">Create Account</h1>
        <p className="text-sm text-ink-soft mb-6">Join Nexzee today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            icon={<User size={18} />}
            placeholder="John Doe"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            required
          />
          <Input
            label="Email Address"
            icon={<Mail size={18} />}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            icon={<Phone size={18} />}
            type="tel"
            placeholder="0801 234 5678"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />
          <Input
            label="Password"
            icon={<Lock size={18} />}
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
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
          <Input
            label="Confirm Password"
            icon={<Lock size={18} />}
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            required
          />

          <label className="flex items-start gap-2.5 text-sm text-ink-soft pt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-nexzee shrink-0"
            />
            <span>
              I agree to the <span className="text-nexzee font-medium">Terms &amp; Conditions</span>
            </span>
          </label>

          {error && (
            <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <Button type="submit" loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-ink-soft mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-nexzee font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
