import type { ReactNode } from "react";

export function SetupRequired({ children }: { children?: ReactNode }) {
  return <div className="state-card"><strong>Supabase setup required</strong><p>{children ?? "Configure the Supabase environment variables and apply the foundation migration."}</p></div>;
}

export function DataError({ message }: { message?: string }) {
  return <div className="state-card state-card--error"><strong>Data could not be loaded</strong><p>Please try again. {process.env.NODE_ENV === "development" && message ? message : null}</p></div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state-card"><p>{children}</p></div>;
}
