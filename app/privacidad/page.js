import Link from "next/link";
import PoliticaPrivacidad, { ACTUALIZACION } from "../../components/PoliticaPrivacidad";

// Render en cada petición: así el nonce de la CSP llega a los <script>.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacidad · Despensa MX",
  description:
    "Qué se queda en tu aparato, qué sale de él y cómo borrarlo: la política de privacidad de Despensa MX.",
};

export default function Privacidad() {
  return (
    <div className="wrap">
      <section className="hero mini">
        <div className="hero-orbita" aria-hidden="true">
          <span>🔒</span>
          <span>🧺</span>
          <span>📱</span>
        </div>
        <div>
          <h1>Política de privacidad</h1>
          <p>Última actualización: {ACTUALIZACION}.</p>
        </div>
      </section>

      <PoliticaPrivacidad />

      <section className="card">
        <div className="row">
          <Link className="btn" href="/">
            Volver a la app
          </Link>
          <Link className="btn sec" href="/instalar">
            Instalar la app
          </Link>
        </div>
        <p className="small">
          Dentro de la app, este mismo texto está en la pestaña «Privacidad».
        </p>
      </section>
    </div>
  );
}
