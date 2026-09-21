import { trpc } from "@/lib/trpc";
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
  return <article className="group rounded-[1.75rem] border border-[#d9dfd5] bg-white/90 p-6 shadow-[0_18px_45px_rgba(25,59,55,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(25,59,55,0.1)]">
    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a27b47]">{kind}</p>
    <h3 className="mt-3 text-xl font-semibold tracking-tight text-[#183d37]">{item.title || "Sem título"}</h3>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#667b74]">{item.description || "Descrição em edição pela administração."}</p>
    {href && <a href={href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#255f50] hover:text-[#a27b47]">Ver detalhes <ArrowUpRight size={16}/></a>}
  </article>;
}

export default function PublicSite() {
  const content = trpc.publicSite.content.useQuery();
  const site = content.data ?? clonePublicSiteContent();

  const appointmentHref = safeHref(site.appointmentUrl);
  const whatsappHref = safeHref(site.whatsappUrl);
  const paymentHref = safeHref(site.paymentUrl);

  return <main className="min-h-screen overflow-x-hidden bg-[#f7f4ed] text-[#183d37]">
    <header className="sticky top-0 z-30 border-b border-[#dbe2d8]/80 bg-[#f7f4ed]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-3"><img src="/assets/images/lumina-logo-official.png" alt="Marca LUmina" className="h-10 w-10 rounded-xl object-contain"/><span className="min-w-0"><span className="block truncate text-base font-bold tracking-tight text-[#183d37]">{site.siteName}</span><span className="mt-0.5 block truncate text-[10px] font-bold uppercase tracking-[.16em] text-[#a27b47]">{site.signature}</span></span></a>
        <nav className="hidden items-center gap-5 text-sm text-[#4f6861] md:flex"><a href="#servicos" className="hover:text-[#183d37]">Serviços</a><a href="#produtos" className="hover:text-[#183d37]">Produtos</a><a href="#sobre" className="hover:text-[#183d37]">Sobre</a></nav>
        <a href="/acesso" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#cbd8cf] bg-white px-3.5 py-2 text-sm font-semibold text-[#234b42] transition hover:border-[#9bb8aa] hover:bg-[#f2f7f2]"><LockKeyhole size={15}/> Acesso da equipe</a>
      </div>
    </header>

    <section className="relative isolate border-b border-[#dbe2d8] bg-[radial-gradient(circle_at_80%_20%,rgba(197,166,112,.22),transparent_26rem),linear-gradient(125deg,#173d37_0%,#24574d_55%,#718d78_120%)] text-[#fbfaf4]">
      <div className="mx-auto grid min-h-[560px] max-w-7xl items-end gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.25fr_.75fr] lg:px-8">
        <div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-[#e7bd7c]/35 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#f6dbac]"><Sparkles size={14}/> Conteúdo administrado pela clínica</div><h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{site.heroTitle}</h1><p className="mt-6 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-[#d9e7df] sm:text-lg">{site.heroText}</p><div className="mt-9 flex flex-wrap gap-3">{appointmentHref ? <a href={appointmentHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#f1c982] px-5 py-3 text-sm font-bold text-[#183d37] transition hover:bg-[#ffdaa0]"><CalendarDays size={17}/> Agendar</a> : <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium text-[#e8f1ea]">Agendamento será configurado pela clínica</span>}{whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"><MessageCircle size={17}/> Contato</a>}</div></div>
        <aside className="rounded-[2rem] border border-white/20 bg-[#f9f7ef]/10 p-6 backdrop-blur-sm"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#f1c982]">Privacidade por padrão</p><h2 className="mt-3 text-2xl font-semibold">O site público não é o prontuário.</h2><p className="mt-4 text-sm leading-relaxed text-[#dceae1]">Avaliações, fotos clínicas, documentos, CPF, agenda detalhada e orçamentos individuais ficam exclusivamente no ambiente protegido da equipe.</p><a href="/acesso" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#f6d89f] hover:text-white">Entrar no portal protegido <ArrowUpRight size={16}/></a></aside>
      </div>
    </section>

    <section id="servicos" className="mx-auto max-w-7xl px-5 py-18 sm:py-24 lg:px-8"><div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a27b47]">Serviços</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#183d37]">Informações definidas pela administração.</h2><p className="mt-4 text-sm leading-relaxed text-[#667b74]">Cada serviço, descrição, valor, imagem e link é revisado e publicado pela SUPER ADM. Nenhuma informação clínica é exibida aqui.</p></div>{site.services.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{site.services.map((item) => <ContentCard key={item.id} item={item} kind="Serviço"/>)}</div> : <EmptyPublicSection label="Os serviços serão publicados quando a administração aprovar o conteúdo."/>}</section>

    <section id="produtos" className="border-y border-[#dbe2d8] bg-[#eef3ed]"><div className="mx-auto max-w-7xl px-5 py-18 sm:py-24 lg:px-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a27b47]">Produtos</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#183d37]">Seleção comercial independente do prontuário.</h2></div>{paymentHref && <a href={paymentHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#255f50] hover:text-[#a27b47]">Acessar pagamento configurado <ExternalLink size={16}/></a>}</div>{site.products.length ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{site.products.map((item) => <ContentCard key={item.id} item={item} kind="Produto"/>)}</div> : <EmptyPublicSection label="Os produtos serão publicados quando a administração definir o catálogo público."/>}</div></section>

    <section id="sobre" className="mx-auto grid max-w-7xl gap-8 px-5 py-18 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><div className="rounded-[2rem] bg-[#183d37] p-8 text-[#fbfaf4]"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#f1c982]">Controle editorial</p><h2 className="mt-4 text-3xl font-semibold tracking-tight">Você controla o que aparece.</h2><p className="mt-5 text-sm leading-relaxed text-[#d9e7df]">A SUPER ADM edita textos, serviços, produtos, links de agendamento, WhatsApp, pagamentos e rodapé diretamente pelo portal. O conteúdo só é público depois de salvo por você.</p><a href="/acesso" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#f5d79e] hover:text-white">Abrir área administrativa <ArrowUpRight size={16}/></a></div><div className="self-center"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#a27b47]">{site.aboutTitle}</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#183d37]">{site.aboutTitle}</h2><p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-[#667b74]">{site.aboutText}</p></div></section>

    <footer className="border-t border-[#dbe2d8] bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#617971] sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>{site.footerText || site.siteName}</p><div className="flex items-center gap-4"><a href="/acesso" className="hover:text-[#183d37]">Portal protegido</a>{whatsappHref && <a href={whatsappHref} target="_blank" rel="noreferrer" className="hover:text-[#183d37]">Contato</a>}</div></div></footer>
  </main>;
}

function EmptyPublicSection({ label }: { label: string }) { return <div className="mt-9 rounded-[1.75rem] border border-dashed border-[#cbd8cf] bg-white/60 p-8 text-sm leading-relaxed text-[#667b74]">{label}</div>; }
