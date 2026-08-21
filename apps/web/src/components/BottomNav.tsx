import { NavLink } from "react-router-dom";
import { Home, Receipt, Wallet, User } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 bg-card border-t border-ink/5 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around z-20">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
              isActive ? "text-nexzee" : "text-ink-faint"
            }`
          }
        >
          <Icon size={22} strokeWidth={2.2} />
          <span className="text-[11px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
