import { getPublicTabungRecords } from "@/lib/data/tabung";
import { formatRinggitFromSen } from "@/lib/format/currency";
import { DataError, EmptyState, SetupRequired } from "@/components/ui/data-state";

export const dynamic = "force-dynamic";

export default async function TabungPage() {
  const result = await getPublicTabungRecords();
  const collection = result.data.filter((record) => record.type === "COLLECTION").reduce((sum, record) => sum + record.amount_sen, 0);
  const distribution = result.data.filter((record) => record.type === "DISTRIBUTION").reduce((sum, record) => sum + record.amount_sen, 0);

  return (
    <section className="section section--soft">
      <div className="container container--narrow">
        <span className="eyebrow">Kutipan dan agihan terbuka</span>
        <h1>Tabung Jumaat</h1>
        <div className="summary-grid">
          <article className="metric-card"><span>Kutipan dipaparkan</span><strong>{formatRinggitFromSen(collection)}</strong></article>
          <article className="metric-card"><span>Agihan dipaparkan</span><strong>{formatRinggitFromSen(distribution)}</strong></article>
        </div>
        <div className="content-surface">
          {result.status === "unconfigured" && <SetupRequired />}
          {result.status === "error" && <DataError message={result.message} />}
          {result.status === "ready" && result.data.length === 0 && <EmptyState>Belum ada rekod awam.</EmptyState>}
          {result.data.map((record) => (
            <div className="record-row" key={record.id}>
              <div><strong>{record.description_bm}</strong><span>{record.occurred_on}</span></div>
              <strong>{record.type === "DISTRIBUTION" ? "−" : "+"}{formatRinggitFromSen(record.amount_sen)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
