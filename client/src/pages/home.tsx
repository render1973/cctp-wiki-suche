import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUp, Moon, Sun } from "lucide-react";
import { LabMark } from "@/components/mark";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import type { AskResponse, Citation } from "@shared/schema";

type PageSummary = {
  id: string;
  title: string;
  shortTitle: string;
  type: string;
  area: string;
  status: string;
  author: string;
  reviewed: string;
  released: string;
  created: string;
  path: string;
  sources: string[];
  excerpt?: string;
};

type WikiPage = PageSummary & { body: string };

type Prompt = { id: string; label: string; text: string };

type ChatMessage =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; result?: AskResponse };

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function Home() {
  const { theme, toggle } = useTheme();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [openPageId, setOpenPageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastItemRef = useRef<HTMLLIElement>(null);

  const pagesQuery = useQuery<PageSummary[]>({ queryKey: ["/api/pages"] });
  const promptsQuery = useQuery<Prompt[]>({ queryKey: ["/api/prompts"] });
  const pageQuery = useQuery<WikiPage>({
    queryKey: ["/api/pages", openPageId],
    enabled: Boolean(openPageId),
  });

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const history = messages.slice(-6).map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const response = await apiRequest("POST", "/api/ask", { question, history });
      return (await response.json()) as AskResponse;
    },
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        { id: newId(), role: "assistant", content: result.answer, result },
      ]);
    },
    onError: () => {
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content:
            "Die Frage konnte nicht gestellt werden. Prüfe die Verbindung und versuche es erneut.",
        },
      ]);
    },
  });

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (ask.isPending) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      return;
    }
    if (last?.role === "assistant") {
      lastItemRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, ask.isPending]);

  const pages = pagesQuery.data ?? [];
  const prompts = promptsQuery.data ?? [];
  const openPage = pageQuery.data;

  function submit(question: string) {
    const trimmed = question.trim();
    if (trimmed.length < 2 || ask.isPending) return;
    setMessages((current) => [...current, { id: newId(), role: "user", content: trimmed }]);
    setDraft("");
    setSidebarOpen(false);
    ask.mutate(trimmed);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submit(draft);
  }

  const empty = messages.length === 0;

  return (
    <div className="h-dvh bg-background text-foreground flex flex-col">
      <a
        href="#frage"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2"
      >
        Zur Frage springen
      </a>
      <header className="shrink-0 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-3 md:px-6">
          <LabMark className="h-7 w-7 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              CCTP Knowledge Lab
            </p>
            <h1 className="text-sm font-semibold leading-tight">Wiki-Suche</h1>
          </div>
          <p className="hidden sm:block text-xs text-muted-foreground" data-testid="text-corpus-count">
            {pages.length} Seiten · freigegeben
          </p>
          <Button
            type="button"
            variant="ghost"
            className="md:hidden min-h-11 px-3 text-xs font-medium"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-bestand"
          >
            Bestand
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="min-h-11 min-w-11"
            onClick={toggle}
            data-testid="button-theme"
            aria-label={theme === "dark" ? "Hellen Modus einschalten" : "Dunklen Modus einschalten"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <aside className="hidden md:flex w-80 shrink-0 flex-col border-r border-border bg-sidebar">
          <CorpusList
            pages={pages}
            loading={pagesQuery.isLoading}
            onOpen={setOpenPageId}
          />
        </aside>

        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto" data-testid="scroll-chat">
            <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-16 md:px-8">
              {empty ? (
                <EmptyState prompts={prompts} onPick={submit} />
              ) : (
                <ol className="space-y-8" aria-live="polite">
                  {messages.map((message, index) => (
                    <li
                      key={message.id}
                      ref={index === messages.length - 1 ? lastItemRef : undefined}
                    >
                      {message.role === "user" ? (
                        <UserBubble text={message.content} />
                      ) : (
                        <AssistantBubble
                          message={message}
                          onOpenPage={setOpenPageId}
                        />
                      )}
                    </li>
                  ))}
                  {ask.isPending ? <li><Thinking /></li> : null}
                  <div ref={endRef} />
                </ol>
              )}
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="shrink-0 border-t border-border bg-background px-4 py-3 md:px-8"
          >
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <label htmlFor="frage" className="sr-only">
                Frage an das Wiki
              </label>
              <Textarea
                id="frage"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    submit(draft);
                  }
                }}
                placeholder="Was wissen wir hierzu – und woher stammt es?"
                className="min-h-[52px] max-h-36 resize-none bg-card"
                data-testid="input-frage"
              />
              <Button
                type="submit"
                size="icon"
                className="min-h-11 min-w-11 shrink-0"
                disabled={ask.isPending || draft.trim().length < 2}
                data-testid="button-fragen"
                aria-label="Frage senden"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="mx-auto mt-2 max-w-3xl text-xs text-muted-foreground">
              Antworten nur aus den fünf freigegebenen Seiten. CDE und DMS bleiben für verbindliche Unterlagen führend.
            </p>
          </form>
        </main>
      </div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-sm p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>Bestand</SheetTitle>
          </SheetHeader>
          <CorpusList
            pages={pages}
            loading={pagesQuery.isLoading}
            onOpen={(id) => {
              setOpenPageId(id);
              setSidebarOpen(false);
            }}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(openPageId)} onOpenChange={(open) => !open && setOpenPageId(null)}>
        <SheetContent side="right" className="w-[94vw] max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="pr-8">{openPage?.title ?? "Seite"}</SheetTitle>
          </SheetHeader>
          {pageQuery.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Seite wird geladen.</p>
          ) : openPage ? (
            <article className="mt-6 space-y-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground" data-testid={`status-page-${openPage.id}`}>
                {openPage.area} · {openPage.status} · {openPage.released}
              </p>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {openPage.body}
              </pre>
            </article>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Seite nicht gefunden.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CorpusList({
  pages,
  loading,
  onOpen,
}: {
  pages: PageSummary[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bestand</p>
        <h2 className="mt-1 text-sm font-semibold">Fünf freigegebene Seiten</h2>
      </div>
      <ScrollArea className="flex-1">
        <ul className="space-y-1 px-3 pb-4">
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <li key={index} className="h-20 rounded-md bg-muted animate-pulse" />
              ))
            : pages.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(page.id)}
                    className="w-full rounded-md border border-transparent px-3 py-3 text-left hover-elevate"
                    data-testid={`button-page-${page.id}`}
                  >
                    <span className="block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      {page.area}
                    </span>
                    <span className="mt-1 block text-sm font-medium leading-snug">{page.title}</span>
                    <span className="mt-2 inline-block text-[11px] uppercase tracking-[0.12em] text-primary">
                      {page.status}
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      </ScrollArea>
      <p className="border-t border-sidebar-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">
        Status und Freigabe setzt allein Thomas Heim. Dieser Chat liest nur freigegebene Seiten.
      </p>
    </div>
  );
}

function EmptyState({
  prompts,
  onPick,
}: {
  prompts: Prompt[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="pt-2 md:pt-16">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Schicht 4</p>
      <h2 className="mt-3 max-w-xl text-xl font-semibold leading-snug">
        Was wissen wir hierzu – und woher stammt es?
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Der Chat sucht nur in den fünf freigegebenen Wiki-Seiten. Jede Antwort nennt Seite, Status und Rohquelle.
      </p>
      <ul className="mt-5 grid gap-2">
        {prompts.map((prompt) => (
          <li key={prompt.id}>
            <button
              type="button"
              onClick={() => onPick(prompt.text)}
              className="w-full rounded-md border border-border bg-card px-4 py-3 text-left hover-elevate"
              data-testid={`button-prompt-${prompt.id}`}
            >
              <span className="block text-[11px] uppercase tracking-[0.14em] text-primary">
                {prompt.label}
              </span>
              <span className="mt-1 block text-sm leading-snug">{prompt.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p
        className="max-w-[36rem] rounded-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground"
        data-testid="text-user-message"
      >
        {text}
      </p>
    </div>
  );
}

function AssistantBubble({
  message,
  onOpenPage,
}: {
  message: Extract<ChatMessage, { role: "assistant" }>;
  onOpenPage: (id: string) => void;
}) {
  const paragraphs = useMemo(
    () => message.content.split(/\n{2,}/).filter(Boolean),
    [message.content],
  );
  const citations = message.result?.citations ?? [];
  return (
    <article className="max-w-[40rem]">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Wiki
        {message.result?.mode === "auszug" ? " · Auszug" : ""}
        {message.result?.coverage === "nicht-im-bestand" ? " · nicht im Bestand" : ""}
      </p>
      <div className="mt-2 space-y-3 font-serif text-[1.05rem] leading-relaxed" data-testid="text-assistant-message">
        {paragraphs.map((paragraph, index) => (
          <p key={index}><RichLine text={paragraph} /></p>
        ))}
      </div>
      {citations.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {citations.map((citation) => (
            <li key={citation.id}>
              <CitationCard citation={citation} onOpen={() => onOpenPage(citation.id)} />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function CitationCard({
  citation,
  onOpen,
}: {
  citation: Citation;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-md border border-border bg-card px-3 py-3 text-left hover-elevate"
      data-testid={`button-citation-${citation.id}`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{citation.title}</span>
        <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-primary">
          {citation.status}
        </span>
      </span>
      {citation.section ? (
        <span className="mt-1 block text-xs text-muted-foreground">{citation.section}</span>
      ) : null}
      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{citation.source}</span>
    </button>
  );
}

function RichLine({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="font-sans text-[0.85em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function Thinking() {
  return (
    <p className="text-sm text-muted-foreground" data-testid="status-thinking">
      Suche im freigegebenen Bestand
      <span className="inline-flex w-6 overflow-hidden align-bottom">
        <span className="animate-pulse">…</span>
      </span>
    </p>
  );
}
