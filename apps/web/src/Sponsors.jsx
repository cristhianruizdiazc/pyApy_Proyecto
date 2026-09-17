import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { api } from "./api.js";
export default function Sponsors() {
  const query = useQuery({
    queryKey: ["sponsors"],
    queryFn: () => api("/sponsors"),
  });
  const seen = useRef(new Set());
  useEffect(() => {
    for (const campaign of query.data?.items || [])
      if (!seen.current.has(campaign.id)) {
        seen.current.add(campaign.id);
        api("/events", {
          method: "POST",
          body: { event: "sponsor_impression", campaignId: campaign.id },
        }).catch(() => {});
      }
  }, [query.data]);
  if (!query.data?.items.length) return null;
  return (
    <aside className="sponsor-band page-width" aria-label="Publicidad">
      <span className="eyebrow">SPONSORS</span>
      {query.data.items.map((c) => (
        <a
          key={c.id}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            api("/events", {
              method: "POST",
              body: { event: "sponsor_click", campaignId: c.id },
            }).catch(() => {})
          }
        >
          <span>
            <strong>{c.name}</strong> · {c.title}
          </span>
          <ArrowUpRight size={18} />
        </a>
      ))}
    </aside>
  );
}
