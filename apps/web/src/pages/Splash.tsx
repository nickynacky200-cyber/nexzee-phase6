import { useNavigate } from "react-router-dom";
import { Wifi, Wallet, Zap } from "lucide-react";
import { Button } from "../components/Button";

export function Splash() {
  const navigate = useNavigate();

  return (
    <div className="app-shell bg-gradient-to-b from-nexzee to-nexzee-dark text-white">
      <div className="flex-1 flex flex-col px-6 pt-16 pb-8">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Zap size={20} className="text-white" fill="currentColor" />
          </div>
          <div>
            <p className="font-extrabold text-lg leading-none">NEXZEE</p>
            <p className="text-[11px] text-white/70 leading-none mt-0.5">Data • Wallet • More</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold leading-tight mb-3">
            Buy Data, Airtime &amp; Subscriptions with Ease
          </h1>
          <p className="text-white/75 text-sm leading-relaxed mb-10">
            Fast, secure and reliable service at your fingertips.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Wifi, label: "Data & Airtime" },
              { icon: Wallet, label: "Secure Wallet" },
              { icon: Zap, label: "Instant Delivery" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white/10 rounded-card p-3 flex flex-col items-center text-center gap-2"
              >
                <Icon size={20} />
                <span className="text-[11px] text-white/85 font-medium leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mt-8">
          <Button
            variant="secondary"
            className="!bg-white !text-nexzee"
            onClick={() => navigate("/register")}
          >
            Get Started
          </Button>
          <button
            onClick={() => navigate("/login")}
            className="w-full text-center text-sm text-white/80 py-2"
          >
            Already have an account? <span className="font-semibold text-white">Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
