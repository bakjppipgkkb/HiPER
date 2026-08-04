import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader /><main>{children}</main><SiteFooter /></>;
}
