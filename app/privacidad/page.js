import Link from "next/link";

// Render en cada petición: así el nonce de la CSP llega a los <script>.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Privacidad · Despensa MX",
  description:
    "Qué se queda en tu aparato, qué sale de él y cómo borrarlo: la política de privacidad de Despensa MX.",
};

const ACTUALIZACION = "9 de octubre de 2026";

function Card({ titulo, children, id }) {
  return (
    <section className="card legal" id={id}>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

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

      <section className="card destacada">
        <h2>En corto</h2>
        <ul className="small qr-pasos qr-lista">
          <li>
            <b>No hay cuenta, registro ni perfil de usuario.</b> No pedimos tu nombre, correo
            o teléfono.
          </li>
          <li>Tus listas, marcas, tiendas, presupuesto y la alacena se quedan en tu aparato.</li>
          <li>
            La ubicación y la foto de la lista solo salen si tú las autorizas o las envías:
            la ubicación se consulta con OpenStreetMap/Overpass y la foto pasa por nuestro
            servidor para llegar a Gemini o Groq.
          </li>
          <li>
            No hay publicidad de terceros, no hay analytics de terceros y no vendemos nada.
          </li>
          <li>Borrar tus datos es borrar los datos del sitio en tu navegador.</li>
        </ul>
      </section>

      <Card titulo="Qué se queda en tu aparato" id="local">
        <p>
          Listas guardadas, marcas elegidas, tiendas activas, presupuesto, historial, ofertas
          que tú capturas, antojos y la alacena viven en <b>localStorage</b> e{" "}
          <b>IndexedDB</b> de este navegador. En IndexedDB también guardamos por un rato el
          nombre del producto que consultaste para sugerir marcas y el resultado de la búsqueda
          de súpers (con la ubicación aproximada, redondeada a unos 10 metros). La caché de
          marcas vence a las 12 horas; la del mapa, a los 15 minutos. Las entradas caducadas
          se borran al volver a consultar o guardar resultados.
        </p>
        <p>
          El service worker guarda una copia de las páginas y los archivos de la app para que
          abra sin internet; esas páginas no contienen tus listas. Nada de tus datos de compra
          se sincroniza con un servidor nuestro: si abres la app en otro equipo, empiezas de
          cero.
        </p>
      </Card>

      <Card titulo="Qué sale de tu aparato" id="sale">
        <ul>
          <li>
            <b>Tu ubicación</b>, solo si la autorizas cuando tocas “Buscar súpers cerca”. Se
            manda a <b>Overpass / OpenStreetMap</b> para traer los comercios del radio que
            pediste, junto con el radio en kilómetros. La coordenada no pasa por nuestro
            servidor; guardamos en tu dispositivo solo el resultado aproximado durante 15 minutos.
          </li>
          <li>
            <b>La foto de la lista</b>, solo si eliges “Foto” y hay una llave de{" "}
            <b>Gemini (Google)</b> o <b>Groq</b> configurada en el servidor. La imagen se
            reduce en tu celular y viaja a ese proveedor para transcribir los renglones. No la
            archivamos: devolvemos el texto y la tiramos. El proveedor la procesa bajo su
            propia política; si eso no te late, usa .txt o .csv y no se manda ninguna imagen.
          </li>
          <li>
            <b>El nombre de un producto</b> (nada más: no tu lista completa, ni tu ubicación)
            a <b>Open Food Facts</b> para sugerirte marcas. Es una API pública sin registro.
          </li>
          <li>
            <b>Mapas y rutas:</b> si abres el mapa de la app, los mosaicos cartográficos se
            descargan de OpenStreetMap. “Mapa” o “Cómo llegar” abre Google Maps en otra pestaña
            con la tienda o tu alcaldía como destino; la app manda la alcaldía por omisión,
            o el origen que escribiste / la ubicación que autorizaste en Despensa MX.
          </li>
          <li>
            <b>Datos técnicos de conexión:</b> al servir la app, el servicio de hosting
            (Vercel) recibe tu dirección IP, navegador y la ruta que pediste; puede conservar
            esa información en sus bitácoras conforme a sus propios plazos y políticas. Es
            distinto de guardar una lista o crear un perfil de usuario.
          </li>
        </ul>
      </Card>

      <Card titulo="Qué no hacemos" id="no">
        <ul>
          <li>No pedimos correo, teléfono ni nombre para usar el comparador.</li>
          <li>No hay inicio de sesión, ni cookies publicitarias, ni píxeles de medición.</li>
          <li>
            No usamos Google Analytics ni servicios de seguimiento; no hay un perfil tuyo que
            vender.
          </li>
          <li>
            Las llaves opcionales de Gemini/Groq viven en variables de entorno del servidor,
            nunca en el código que llega a tu navegador.
          </li>
          <li>
            Los precios son de referencia, no una lectura en vivo de Walmart, Soriana o
            Chedraui: no nos conectamos a esas tiendas.
          </li>
        </ul>
      </Card>

      <Card titulo="Cuánto tiempo se guarda" id="tiempo">
        <p>
          En tu aparato, hasta que lo borres. La caché de súpers cercanos expira a los 15
          minutos y la de marcas a las 12 horas, para no consultar de más.
        </p>
        <p>
          Del lado del servidor no hay almacenamiento de listas ni de fotos: cada petición se
          atiende y se olvida. Solo hay control de abuso por IP en memoria (cuántas fotos
          llevas en el último minuto) para no reventar la cuota del proveedor.
        </p>
      </Card>

      <Card titulo="Cómo está protegida" id="seguridad">
        <ul>
          <li>
            Política de seguridad de contenido (CSP) con nonce por petición: la app no acepta
            scripts ni estilos de otros dominios.
          </li>
          <li>
            El mapa (Leaflet) se sirve desde nuestro propio dominio, no desde un CDN de
            terceros.
          </li>
          <li>
            Forzamos HTTPS (HSTS), bloqueamos que la app se meta en marcos de otros sitios
            (clickjacking) y apagamos de fábrica permisos como micrófono o pagos.
          </li>
          <li>
            La lectura de fotos acepta solo imágenes válidas, con tope de tamaño, límite de
            envíos y sin devolverte mensajes de error del proveedor.
          </li>
        </ul>
        <p className="small">
          Si encuentras un problema de seguridad, repórtalo por el canal privado descrito en
          el archivo SECURITY.md del repositorio.
        </p>
      </Card>

      <Card titulo="Menores de edad" id="menores">
        <p>
          La app no está dirigida a menores de 13 años y no pide datos de identificación. Es
          una herramienta para comparar precios de la despensa; no tiene contenido que
          requiera supervisión especial más allá del uso normal de internet.
        </p>
      </Card>

      <Card titulo="Responsable y solicitudes" id="responsable">
        <p>
          La app la mantiene la persona responsable del repositorio del proyecto{" "}
          <a href="https://github.com/muecojulio/despensaensupermercados" target="_blank" rel="noopener noreferrer">
            muecojulio/despensaensupermercados
          </a>. No hay una cuenta con la que podamos localizar tus listas: para borrarlas,
          usa los controles de arriba. Para preguntar por esta política o presentar una
          solicitud sobre el tratamiento de datos, usa el canal privado del repositorio
          (Security → Report a vulnerability) y no publiques información personal en un
          issue abierto. Los datos de conexión que conserve Vercel, OpenStreetMap, Google,
          Gemini, Groq u Open Food Facts están sujetos a las políticas de cada proveedor.
        </p>
        <p className="small">
          Como la app no recibe datos de identidad ni conserva una base de usuarios, no puede
          buscar ni exportar una lista asociada a una persona. Los datos locales se borran en
          el propio navegador. Este aviso no limita los derechos que te reconozca la ley
          aplicable.
        </p>
      </Card>

      <Card titulo="Tus controles" id="controles">
        <ul>
          <li>
            Borrar todo: en el navegador, entra a configuración → datos del sitio (o
            “almacenamiento”) y borra los datos de este sitio. Eso borra listas, historial,
            marcas y caché.
          </li>
          <li>
            Permiso de ubicación: se revoca desde el ícono de la barra de direcciones o en los
            ajustes del sistema, igual que cualquier otra app.
          </li>
          <li>
            Quitar la precarga de ejemplo no borra tu historial: eso se hace borrando los
            datos del sitio o desde tu propio aparato.
          </li>
          <li>
            Si solicitas ejercer derechos sobre datos personales, pueden aplicar los derechos
            ARCO reconocidos por la ley mexicana. Los registros técnicos de Vercel o los datos
            que reciban los proveedores externos se solicitan directamente a cada proveedor;
            para una consulta sobre la app, usa el canal privado indicado arriba.
          </li>
        </ul>
      </Card>

      <Card titulo="Cambios a esta política" id="cambios">
        <p>
          Si cambia algo sustancial —por ejemplo, agregar un proveedor nuevo que reciba datos
          tuyos— se actualiza esta página y la fecha de arriba. La app no manda
          notificaciones, así que conviene revisarla de vez en cuando.
        </p>
        <p className="small">
          Este texto es informativo y está escrito en lenguaje llano, no es asesoría legal. Si
          vas a publicar la app a un público amplio, revísalo con quien te asesore en la
          materia.
        </p>
      </Card>

      <section className="card">
        <div className="row">
          <Link className="btn" href="/">
            Volver a la app
          </Link>
          <Link className="btn sec" href="/instalar">
            Instalar la app
          </Link>
        </div>
      </section>
    </div>
  );
}
