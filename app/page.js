import AppClient from "../components/AppClient";

/**
 * La página se arma en cada petición a propósito: la CSP lleva un nonce distinto
 * por visita y Next solo puede copiarlo a sus <script> cuando el HTML se genera
 * en el momento (con páginas prerenderizadas el nonce llegaría tarde y el
 * navegador bloquearía los scripts). La app es liviana y el service worker la
 * deja funcionando sin internet.
 */
export const dynamic = "force-dynamic";

export default function Page() {
  return <AppClient />;
}
