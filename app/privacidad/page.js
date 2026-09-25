import Link from "next/link";

export const metadata = {
  title: "Privacidad · Despensa MX",
  description: "Cómo guarda Despensa MX tus listas, ubicación y fotos.",
};

export default function Privacidad() {
  return (
    <div className="wrap">
      <section className="hero mini">
        <div>
          <h1>Política de privacidad</h1>
          <p>Borrador para revisión. Última actualización: 25 de septiembre de 2026.</p>
        </div>
      </section>
      <section className="card legal">
        <p>
          Despensa MX compara una lista de la compra entre súpers del Valle de México con un
          catálogo de referencia. No es un banco ni una red social.
        </p>
        <h2>Qué se queda en tu aparato</h2>
        <p>
          Listas, marcas, tiendas, presupuesto, historial y alacena se guardan en localStorage e IndexedDB
          de este navegador. No hay cuenta ni base de usuarios en un servidor nuestro.
        </p>
        <h2>Qué sale de tu aparato</h2>
        <ul>
          <li>Ubicación, solo si la autorizas, hacia OpenStreetMap / Overpass.</li>
          <li>Foto de la lista, solo si hay key de Gemini o Groq en Vercel.</li>
          <li>Nombre del producto (no la lista completa) a Open Food Facts para marcas.</li>
        </ul>
        <h2>Qué no hacemos</h2>
        <p>No vendemos listas. No pedimos correo. Las keys opcionales viven en Vercel, no en el código.</p>
        <Link className="btn" href="/">Volver a la app</Link>
      </section>
    </div>
  );
}
