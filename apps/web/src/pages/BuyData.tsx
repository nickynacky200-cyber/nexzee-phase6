import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { api } from "../api/client";

interface Network {
  identifier: string;
  name: string;
}

interface Plan {
  plan_code: string;
  amount: number;
  label: string;
}

// Same 4-network colour set used across Data/Airtime for visual consistency.
const networkColors: Record<string, string> = {
  mtn: "#FFCC08",
  mtn_gifting_data: "#FFCC08",
  mtn_data_share: "#FFCC08",
  airtel: "#ED1C24",
  glo: "#5FB709",
  "9mobile": "#00A651",
};

function colorFor(identifier: string) {
  const key = Object.keys(networkColors).find((k) => identifier.toLowerCase().includes(k));
  return key ? networkColors[key] : "#5B2EBF";
}

export function BuyData() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [network, setNetwork] = useState<string>("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planCode, setPlanCode] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [loadingNetworks, setLoadingNetworks] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ outcome: string; message: string } | null>(null);

  useEffect(() => {
    api
      .get("/data/networks")
      .then((res) => {
        setNetworks(res.data.data);
        if (res.data.data[0]) setNetwork(res.data.data[0].identifier);
      })
      .catch(() => setError("Couldn't load networks. Please try again."))
      .finally(() => setLoadingNetworks(false));
  }, []);

  useEffect(() => {
    if (!network) return;
    setLoadingPlans(true);
    setPlanCode("");
    api
      .get("/data/plans", { params: { network } })
      .then((res) => {
        setPlans(res.data.data);
        if (res.data.data[0]) setPlanCode(res.data.data[0].plan_code);
      })
      .catch(() => setError("Couldn't load plans for this network."))
      .finally(() => setLoadingPlans(false));
  }, [network]);

  const selectedPlan = plans.find((p) => p.plan_code === planCode);

  async function handlePurchase() {
    if (!selectedPlan) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/data/purchase", {
        network,
        mobile_number: phone,
        plan_code: planCode,
      });
      setResult({ outcome: res.data.outcome, message: res.data.message });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Purchase failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const isSuccess = result.outcome === "successful";
    return (
      <div className="app-shell">
        <PageHeader title="Buy Data" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
              isSuccess ? "bg-success/10" : "bg-warning/10"
            }`}
          >
            <span className="text-3xl">{isSuccess ? "✓" : "⏳"}</span>
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">
            {isSuccess ? "Purchase Successful" : "Purchase Update"}
          </h2>
          <p className="text-sm text-ink-soft mb-8">{result.message}</p>
          <Button onClick={() => setResult(null)}>Buy More Data</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <PageHeader title="Buy Data" />

      <div className="flex-1 px-5 pb-28 space-y-6">
        <div>
          <p className="text-sm font-semibold text-ink mb-3">Select Network</p>
          {loadingNetworks ? (
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-2xl bg-ink/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {networks.map((n) => (
                <button
                  key={n.identifier}
                  onClick={() => setNetwork(n.identifier)}
                  className={`aspect-square rounded-2xl flex items-center justify-center font-extrabold text-white text-[10px] px-1 text-center transition-all ${
                    network === n.identifier
                      ? "ring-2 ring-offset-2 ring-nexzee scale-95"
                      : "opacity-80"
                  }`}
                  style={{ backgroundColor: colorFor(n.identifier) }}
                >
                  {n.name.slice(0, 6).toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Select Plan</p>
          {loadingPlans ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-ink/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.plan_code}
                  onClick={() => setPlanCode(plan.plan_code)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    planCode === plan.plan_code
                      ? "border-nexzee bg-nexzee-soft"
                      : "border-ink/10 bg-card"
                  }`}
                >
                  <p className="text-xs font-semibold text-ink leading-snug">{plan.label}</p>
                  <p className="text-sm font-bold text-nexzee mt-1.5">
                    ₦{plan.amount.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <Input
          label="Phone Number"
          icon={<Phone size={18} />}
          type="tel"
          placeholder="0801 234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {selectedPlan && (
          <div className="bg-card rounded-card shadow-card p-4 flex items-center justify-between">
            <span className="text-sm text-ink-soft">You will pay</span>
            <span className="text-lg font-extrabold text-ink">
              ₦{selectedPlan.amount.toLocaleString()}.00
            </span>
          </div>
        )}

        {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      </div>

      <div className="sticky bottom-0 px-5 py-4 bg-card border-t border-ink/5">
        <Button
          onClick={handlePurchase}
          loading={submitting}
          disabled={!phone || !selectedPlan || loadingPlans}
        >
          Purchase Data
        </Button>
      </div>
    </div>
  );
}
