import { trpc } from "@/lib/trpc";
import { publicThemeStyle } from "@/lib/publicTheme";
import { clonePublicSiteContent, type PublicSiteItem } from "@shared/publicSite";
import { ArrowUpRight, CalendarDays, ExternalLink, LockKeyhole, MessageCircle, Sparkles } from "lucide-react";

function safeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed, window.location.origin);
    return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function ContentCard({ item, kind }: { item: PublicSiteItem; kind: "Serviço" | "Produto" }) {
  const href = safeHref(item.link);
  return <article className="group rounded-[1.75rem] border border-black/10 bg-[var(--lumina-surface)] p-6 shadow-[0_18px_45px_rgba(25,59,55,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(25,59,55,0.12)]">
    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">{kind}</p>
    <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--lumina-text)]">{item.title || "Sem título"}</h3>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--lumina-muted-text)]">{item.description || "Descrição em edição pela administração."}</p>
    {href && <a href={href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lumina-secondary)] transition hover:text-[var(--lumina-accent)]">Ver detalhes <ArrowUpRight size={16}/></a>}
  </article>;
}

export default function PublicSite() {
  const content = trpc.publicSite.content.useQuery();
  const site = content.data ?? clonePublicSiteContent();
  const themeStyle = publicThemeStyle(site.theme);
  const appointmentHref = safeHref(site.appointmentUrl);
  const whatsappHref = safeHref(site.whatsappUrl);
  const paymentHref = safeHref(site.paymentUrl);

  return <main style={themeStyle} className="min-h-screen overflow-x-hidden bg-[var(--lumina-background)] text-[var(--lumina-text)]">
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[color:color-mix(in_srgb,var(--lumina-background)_92%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-3"><img src="/assets/images/lumina-logo-official.png" alt="Marca LUmina" className="h-10 w-10 rounded-xl object-contain"/><span className="min-w-0"><span className="block truncate text-base font-bold tracking-tight text-[var(--lumina-text)]">{site.siteName}</span><span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[.16em] text-[var(--lumina-accent)]">{site.signature}</span></span></a>
        <nav className="hidden items-center gap-5 text-sm text-[var(--lumina-muted-text)] md:flex"><a href="#servicos" className="transition hover:text-[var(--lumina-text)]">Serviços</a><a href="#produtos" className="transition hover:text-[var(--lumina-text)]">Produtos</a><a href="#sobre" className="transition hover:text-[var(--lumina-text)]">Sobre</a></nav>
        <a href="/acesso" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-black/15 bg-[var(--lumina-surface)] px-3.5 py-2 text-sm font-semibold text-[var(--lumina-secondary)] transition hover:opacity-85"><LockKeyhole size={15}/> Acesso da equipe</a>
      </div>
    </header>

    <section className="relative isolate border-b border-black/10 text-[var(--lumina-on-primary)]" style={{ background: "radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--lumina-accent) 27%, transparent), transparent 26rem), linear-gradient(125deg, var(--lumina-primary) 0%, var(--lumina-secondary) 65%, var(--lumina-primary) 120%)" }}>
      <div className="mx-auto grid min-h-[560px] max-w-7xl items-end gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.25fr_.75fr] lg:px-8">
        <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium"><Sparkles size={14}/> Conteúdo administrado pela clínica</div><h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{site.heroTitle}</h1><p className="mt-6 max-w-2xl whitespace-pre-wrap text-base leading-relaxed opacity-85 sm:text-lg">{site.heroText}</p><div className="mt-9 flex flex-wrap gap-3">{appointmentHref ? <a href={appointmentHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[var(--lumina-accent)] px-5 py-3 text-sm font-bold text-[var(--lumina-on-accent)] transition hover:brightness-110"><CalendarDays size={17}/> Agendar</a> : <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium">Agendamento será configurado pela clínica</span>}{whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"><MessageCircle size={17}/> Contato</a>}</div></div>
        <aside className="rounded-[2rem] border border-white/20 bg-black/10 p-6 backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">Privacidade por padrão</p><h2 className="mt-3 text-2xl font-semibold">O site público não é o prontuário.</h2><p className="mt-4 text-sm leading-relaxed opacity-85">Avaliações, fotos clínicas, documentos, CPF, agenda detalhada e orçamentos individuais ficam exclusivamente no ambiente protegido da equipe.</p><a href="/acesso" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lumina-accent)] transition hover:brightness-125">Entrar no portal protegido <ArrowUpRight size={16}/></a></aside>
      </div>
    </section>

    <section id="servicos" className="mx-auto max-w-7xl px-5 py-18 sm:py-24 lg:px-8"><div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">Serviços</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--lumina-text)]">Informações definidas pela administração.</h2><p className="mt-4 text-sm leading-relaxed text-[var(--lumina-muted-text)]">Cada serviço, descrição, valor, imagem e link é revisado e publicado pela SUPER ADM. Nenhuma informação clínica é exibida aqui.</p></div>{site.services.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{site.services.map((item) => <ContentCard key={item.id} item={item} kind="Serviço"/>)}</div> : <EmptyPublicSection label="Os serviços serão publicados quando a administração aprovar o conteúdo."/>}</section>

    <section id="produtos" className="border-y border-black/10" style={{ background: "color-mix(in srgb, var(--lumina-secondary) 8%, var(--lumina-background))" }}><div className="mx-auto max-w-7xl px-5 py-18 sm:py-24 lg:px-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">Produtos</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--lumina-text)]">Seleção comercial independente do prontuário.</h2></div>{paymentHref && <a href={paymentHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--lumina-secondary)] transition hover:text-[var(--lumina-accent)]">Acessar pagamento configurado <ExternalLink size={16}/></a>}</div>{site.products.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{site.products.map((item) => <ContentCard key={item.id} item={item} kind="Produto"/>)}</div> : <EmptyPublicSection label="Os produtos serão publicados quando a administração definir o catálogo público."/>}</div></section>

    <section id="sobre" className="mx-auto grid max-w-7xl gap-8 px-5 py-18 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><div className="rounded-[2rem] bg-[var(--lumina-primary)] p-8 text-[var(--lumina-on-primary)]"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">Controle editorial</p><h2 className="mt-4 text-3xl font-semibold tracking-tight">Você controla o que aparece.</h2><p className="mt-5 text-sm leading-relaxed opacity-85">A SUPER ADM edita textos, serviços, produtos, links de agendamento, WhatsApp, pagamentos e rodapé diretamente pelo portal. O conteúdo só é público depois de salvo por você.</p><a href="/acesso" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--lumina-accent)] transition hover:brightness-125">Abrir área administrativa <ArrowUpRight size={16}/></a></div><div className="self-center"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">{site.aboutTitle}</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--lumina-text)]">{site.aboutTitle}</h2><p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-[var(--lumina-muted-text)]">{site.aboutText}</p></div></section>

    <footer className="border-t border-black/10 bg-[var(--lumina-surface)]"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[var(--lumina-muted-text)] sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>{site.footerText || site.siteName}</p><div className="flex items-center gap-4"><a href="/acesso" className="transition hover:text-[var(--lumina-text)]">Portal protegido</a>{whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="transition hover:text-[var(--lumina-text)]">Contato</a>}</div></div></footer>
  </main>;
}

function EmptyPublicSection({ label }: { label: string }) { return <div className="mt-9 rounded-[1.75rem] border border-dashed border-black/15 bg-[color:color-mix(in_srgb,var(--lumina-surface)_72%,transparent)] p-8 text-sm leading-relaxed text-[var(--lumina-muted-text)]">{label}</div>; }
