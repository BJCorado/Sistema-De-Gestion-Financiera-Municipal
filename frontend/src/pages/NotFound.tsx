import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-600">
      <p className="text-2xl font-bold">404</p>
      <p>Esta página no existe.</p>
      <Link to="/" className="text-navy underline">
        Volver al inicio
      </Link>
    </div>
  );
}
