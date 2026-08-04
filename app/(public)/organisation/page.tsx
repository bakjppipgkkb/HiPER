import { getPublicOrganisation } from "@/lib/data/organisation";
import { DataError, EmptyState, SetupRequired } from "@/components/ui/data-state";

export const dynamic = "force-dynamic";

export default async function OrganisationPage() {
  const result = await getPublicOrganisation();
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">Akauntabiliti bermula dengan manusia</span>
        <h1>Organisasi Pejabat Bendahari Agung Kehormat</h1>
        {result.status === "unconfigured" && <SetupRequired />}
        {result.status === "error" && <DataError message={result.message} />}
        {result.status === "ready" && result.data.length === 0 && <EmptyState>Struktur organisasi belum diterbitkan.</EmptyState>}
        <div className="org-grid">
          {result.data.map((item) => <article className="officer-card" key={item.id}><div className="avatar" aria-hidden="true">{item.fullName.charAt(0)}</div><h2>{item.fullName}</h2><strong>{item.positionBm}</strong>{item.unitNameBm && <span>{item.unitNameBm}</span>}</article>)}
        </div>
      </div>
    </section>
  );
}
