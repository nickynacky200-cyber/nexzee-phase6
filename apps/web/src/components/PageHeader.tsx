import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-4 bg-card">
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full hover:bg-ink/5 text-ink"
        aria-label="Go back"
      >
        <ChevronLeft size={22} />
      </button>
      <h1 className="text-base font-bold text-ink">{title}</h1>
      <div className="w-9 h-9 flex items-center justify-center">{right}</div>
    </header>
  );
}
