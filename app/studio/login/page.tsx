import Link from "next/link";
import { GoogleSignIn } from "@/components/auth/google-sign-in";

export default function StudioLoginPage() {
  return (
    <main className="studio-login">
      <section className="login-card">
        <img src="/hiper-mark.svg" alt="HiPER" />
        <span className="eyebrow">HiPER Studio</span>
        <h1>Log masuk pentadbir</h1>
        <p>Gunakan akaun Google rasmi yang telah diberikan peranan ADMIN dalam Supabase.</p>
        <GoogleSignIn />
        <Link href="/" className="text-link">Kembali ke portal awam</Link>
      </section>
    </main>
  );
}
