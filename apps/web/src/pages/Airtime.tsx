import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { api } from "../api/client";

interface Network {
  id: string;
  name: string;
}

const networkColors: Record<string, string> = {
  mtn: "#FFCC08",
  airtel: "#ED1C24",
  glo: "#5FB709",
  "9mobile": "#00A651",
};

const quickAmounts = [100, 200, 500, 1000];

export function Airtime() {
  const [networks, setNetworks] = useState<Network[]>([]);
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number | null>(quickAmounts[0]);
  const [customAmount, setCustomAmount] = useState("");
  const [loadingNetworks, setLoadingNetworks] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ outcome: string; message: string } | null>(null);

  useEffect(() => {
    api
      .get("/airtime/networks")
      .then((res) => {
        setNetworks(res.data.data);
        if (res.data.data[0]) setNetwork(res.data.data[0].id);
      })
      .catch(() => setError("Couldn't load networks. Please try again."))
      .finally(() => setLoadingNetworks(false));
  }, []);

  const finalAmount = customAmount ? Number(customAmount) : amount ?? 0;

  async function handleTopUp() {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/airtime/purchase", {
        network,
        mobile_number: phone,
        amount: finalAmount,
      });
      setResult({ outcome: res.data.outcome, message: res.data.message });
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Top-up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const isSuccess = result.outcome === "successful";
    return (
      <div className="app-shell">
        <PageHeader title="Airtime" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${
              isSuccess ? "bg-success/10" : "bg-warning/10"
            }`}
          >
            <span className="text-3xl">{isSuccess ? "✓" : "⏳"}</span>
          </div>
          <h2 className="text-lg font-bold text-ink mb-2">
            {isSuccess ? "Top Up Successful" : "Top Up Update"}
          </h2>
          <p className="text-sm text-ink-soft mb-8">{result.message}</p>
          <Button onClick={() => setResult(null)}>Top Up Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <PageHeader title="Airtime" />

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
                  key={n.id}
                  onClick={() => setNetwork(n.id)}
                  className={`aspect-square rounded-2xl flex items-center justify-center font-extrabold text-white text-xs transition-all ${
                    network === n.id ? "ring-2 ring-offset-2 ring-nexzee scale-95" : "opacity-80"
                  }`}
                  style={{ backgroundColor: networkColors[n.id] ?? "#5B2EBF" }}
                >
                  {n.name.slice(0, 4).toUpperCase()}
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

        <div>
          <p className="text-sm font-semibold text-ink mb-3">Amount</p>
          <div className="grid grid-cols-4 gap-2.5 mb-3">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setAmount(amt);
                  setCustomAmount("");
                }}
                className={`h-11 rounded-xl text-sm font-semibold transition-colors ${
                  amount === amt && !customAmount
                    ? "bg-nexzee text-white"
                    : "bg-nexzee-soft text-nexzee"
                }`}
              >
                ₦{amt}
              </button>
            ))}
          </div>
          <Input
            placeholder="Other Amount"
            type="number"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount(null);
            }}
          />
        </div>

        <div className="bg-card rounded-card shadow-card p-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">You will pay</span>
          <span className="text-lg font-extrabold text-ink">₦{finalAmount.toLocaleString()}.00</span>
        </div>

        {error && <p className="text-sm text-danger bg-danger/10 rounded-xl px-4 py-3">{error}</p>}
      </div>

      <div className="sticky bottom-0 px-5 py-4 bg-card border-t border-ink/5">
        <Button onClick={handleTopUp} loading={submitting} disabled={!phone || !finalAmount}>
          Top Up Airtime
        </Button>
      </div>
    </div>
  );
}
