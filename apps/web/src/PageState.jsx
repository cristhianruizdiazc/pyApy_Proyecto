import { Compass } from "lucide-react";
import "./page-state.css";

export default function PageState({
  title,
  kicker = "PYAPY",
  icon: Icon = Compass,
  children,
}) {
  return (
    <main className="page page-state">
      <section className="state-card">
        <span className="state-icon">
          <Icon size={30} aria-hidden="true" />
        </span>
        <p className="eyebrow">{kicker}</p>
        <h1>{title}</h1>
        {children}
      </section>
    </main>
  );
}
