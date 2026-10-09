import PaginaInstalar from "../../components/PaginaInstalar";

// Render en cada petición: así el nonce de la CSP llega a los <script>.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Instalar · Despensa MX",
  description:
    "Instala Despensa MX en tu celular, iPad o computadora: pasos para Safari, Chrome y Edge, o escanea el código QR.",
};

export default function Instalar() {
  return <PaginaInstalar />;
}
