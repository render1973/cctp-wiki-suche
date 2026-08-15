export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="max-w-md">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Wiki-Suche</p>
        <h1 className="mt-2 text-xl font-semibold">Seite nicht gefunden</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Dieser Chat hat nur eine Fläche. Gehe zurück zur Suche.
        </p>
        <a
          href="#/"
          className="mt-6 inline-flex min-h-11 items-center text-sm font-medium text-primary"
          data-testid="link-home"
        >
          Zur Wiki-Suche
        </a>
      </div>
    </div>
  );
}
