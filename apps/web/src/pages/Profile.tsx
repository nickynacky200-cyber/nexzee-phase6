import { useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Landmark,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../context/AuthContext";

const links = [
  { icon: User, label: "Personal Information" },
  { icon: Lock, label: "Change Password" },
  { icon: Landmark, label: "Bank Details" },
  { icon: Bell, label: "Notification Settings" },
  { icon: HelpCircle, label: "Help & Support" },
  { icon: Info, label: "About Nexzee" },
];

export function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <div className="flex-1 pb-24">
        <header className="px-5 pt-6 pb-4">
          <h1 className="text-lg font-bold text-ink">Profile</h1>
        </header>

        <div className="px-5 flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-nexzee-soft flex items-center justify-center text-nexzee text-2xl font-extrabold mb-3">
            {user?.fullName?.[0]?.toUpperCase() ?? "N"}
          </div>
          <p className="text-base font-bold text-ink">{user?.fullName ?? "NEXZEE User"}</p>
          <p className="text-sm text-ink-soft">{user?.phone ?? user?.email ?? ""}</p>
        </div>

        <div className="px-5">
          <div className="bg-card rounded-card shadow-card divide-y divide-ink/5">
            {links.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 px-4 py-3.5"
              >
                <div className="w-9 h-9 rounded-full bg-nexzee-soft flex items-center justify-center text-nexzee shrink-0">
                  <Icon size={17} />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-ink">{label}</span>
                <ChevronRight size={16} className="text-ink-faint" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 mt-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-danger font-semibold text-sm"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
