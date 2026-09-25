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
          Listas, marcas elegidas, tiendas activas, presupuesto, historial, ofertas que tú capturas
          y la alacena se guardan en <b>localStorage</b> e <b>IndexedDB</b> de este navegador. No
          tenemos una cuenta tuya ni una base de datos de usuarios en un servidor nuestro.
        </p>
        <h2>Qué sale de tu aparato</h2>
        <ul>
          <li>
            <b>Ubicación</b>, solo si la autorizas, para buscar súpers cercanos con OpenStreetMap /
            Overpass.
          </li>
          <li>
            <b>Foto de la lista</b>, solo si eliges “Foto” y hay una key de Gemini o Groq en el
            servidor. La foto se manda a ese proveedor para transcribir renglones. No se guarda en
            un archivo nuestro.
          </li>
          <li>
            <b>Nombre del producto</b> (sin tu lista completa) a Open Food Facts para sugerir
            marcas. API pública sin registro.
          </li>
          <li>
            Mapas de OpenStreetMap y, si pides ruta, Google Maps en otra pestaña.
          </li>
        </ul>
        <h2>Qué no hacemos</h2>
        <p>
          No vendemos listas. No pedimos correo para usar el comparador. No hay publicidad de
          terceros en esta versión. Las keys opcionales de Gemini/Groq viven en variables de
          entorno de Vercel, no en el código.
        </p>
        <h2>Tus controles</h2>
        <p>
          Puedes borrar datos del sitio en el navegador (configuración → datos del sitio). Quitar
          la precarga no borra el historial; bórralo desde el propio celular o limpia el
          almacenamiento.
        </p>
        <h2>Menores</h2>
        <p>La app no está dirigida a menores de 13 años y no pide datos de identificación.</p>
        <p className="small">
          Este texto es informativo. Si publicas la app a un público amplio, revísalo con quien te
          asesore legalmente.
        </p>
        <Link className="btn" href="/">
          Volver a la app
        </Link>
      </section>
    </div>
  );
}
