import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-text-muted text-xs tracking-widest uppercase">404</p>
        <h1 className="font-display text-foreground mt-3 text-2xl">Secțiune inexistentă</h1>
        <p className="text-text-secondary mt-2 text-sm">
          Pagina pe care o cauți nu există în panoul de administrare.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="bg-primary text-text-inverse hover:bg-primary-600 rounded-xs px-4 py-2 text-sm font-medium transition"
          >
            Înapoi la dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
