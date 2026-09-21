import { trpc } from "@/lib/trpc";
import { isValidHexColor, publicThemeStyle } from "@/lib/publicTheme";
import { clonePublicSiteContent, DEFAULT_PUBLIC_SITE_THEME, type PublicSiteContent, type PublicSiteItem, type PublicSiteTheme } from "@shared/publicSite";
import { ExternalLink, LayoutPanelTop, Palette, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-[#38574f]"><span>{label}</span><div className="mt-1 [&_input]:h-10 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[#d9e2dc] [&_input]:bg-white [&_input]:px-3 [&_input]:outline-none [&_input:focus]:border-[#7ca78e] [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-[#d9e2dc] [&_textarea]:bg-white [&_textarea]:p-3 [&_textarea]:outline-none [&_textarea:focus]:border-[#7ca78e]">{children}</div></label>;
}

function newItem(): PublicSiteItem {
  return { id: crypto.randomUUID(), title: "", description: "", link: "" };
}

const colorFields: Array<{ key: keyof PublicSiteTheme; label: string; description: string }> = [
  { key: "primary", label: "Cor principal", description: "Cabeçalhos, portal protegido e base visual" },
  { key: "secondary", label: "Cor secundária", description: "Gradientes, links e detalhes de navegação" },
  { key: "accent", label: "Cor de destaque", description: "Chamadas, botões de ação e marcadores" },
  { key: "background", label: "Fundo", description: "Plano de fundo da página e do portal" },
  { key: "surface", label: "Superfícies", description: "Cartões, formulários e áreas de leitura" },
  { key: "text", label: "Texto principal", description: "Títulos e leitura prioritária" },
  { key: "mutedText", label: "Texto de apoio", description: "Descrições, legendas e informações auxiliares" },
];

export function PublicSiteEditor() {
  const utils = trpc.useUtils();
  const publicSite = trpc.administration.settings.publicSite.useQuery();
  const [content, setContent] = useState<PublicSiteContent>(() => clonePublicSiteContent());
  const save = trpc.administration.settings.savePublicSite.useMutation({
    onSuccess: (saved) => {
      setContent(saved);
      utils.administration.settings.publicSite.setData(undefined, saved);
      utils.publicSite.content.setData(undefined, saved);
      toast.success("Site público atualizado. A versão salva já aparece na página inicial.");
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (publicSite.data) setContent(clonePublicSiteContent(publicSite.data));
  }, [publicSite.data]);

  const set = <K extends keyof PublicSiteContent>(key: K, value: PublicSiteContent[K]) => setContent((current) => ({ ...current, [key]: value }));
  const setThemeColor = (key: keyof PublicSiteTheme, value: string) => setContent((current) => ({ ...current, theme: { ...current.theme, [key]: value.toUpperCase() } }));
  const updateItem = (group: "services" | "products", index: number, key: keyof PublicSiteItem, value: string) => setContent((current) => ({ ...current, [group]: current[group].map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const addItem = (group: "services" | "products") => setContent((current) => ({ ...current, [group]: [...current[group], newItem()] }));
  const removeItem = (group: "services" | "products", index: number) => setContent((current) => ({ ...current, [group]: current[group].filter((_, itemIndex) => itemIndex !== index) }));
  const paletteValid = Object.values(content.theme).every(isValidHexColor);

  return <section className="rounded-2xl border border-[#e0e7e1] bg-white p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf4ef] text-[#31574b]"><LayoutPanelTop size={19}/></span><div><h3 className="font-semibold">Editor do site público</h3><p className="mt-1 max-w-3xl text-sm text-[#657c74]">Você controla diretamente o texto institucional, chamadas, serviços, produtos e links de agendamento, WhatsApp e pagamento. O portal clínico e os prontuários não aparecem no site público.</p></div></div><a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d6ddd8] px-3 py-2 text-sm text-[#31574b] hover:bg-[#f5f8f4]">Ver página pública <ExternalLink size={15}/></a></div>

    {publicSite.isLoading ? <div className="mt-5 h-64 animate-pulse rounded-2xl bg-[#f5f8f4]" /> : <div className="mt-6 space-y-7">
      <section className="grid gap-3 rounded-2xl bg-[#f7faf7] p-4 lg:grid-cols-2"><Field label="Nome do site"><input value={content.siteName} onChange={(event) => set("siteName", event.target.value)} /></Field><Field label="Linha de apoio"><input value={content.signature} onChange={(event) => set("signature", event.target.value)} /></Field><div className="lg:col-span-2"><Field label="Título principal"><textarea value={content.heroTitle} onChange={(event) => set("heroTitle", event.target.value)} /></Field></div><div className="lg:col-span-2"><Field label="Texto principal"><textarea value={content.heroText} onChange={(event) => set("heroText", event.target.value)} /></Field></div></section>

      <section className="rounded-2xl border border-[#e0e7e1] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf4ef] text-[#31574b]"><Palette size={19}/></span><div><h4 className="font-semibold text-[#254a42]">Paleta LUmina — site e portal</h4><p className="mt-1 max-w-3xl text-sm text-[#657c74]">As mesmas cores são aplicadas ao site público e ao ambiente protegido. A paleta só entra no ar depois de clicar em <b>Salvar no site público</b>.</p></div></div><button type="button" onClick={() => set("theme", { ...DEFAULT_PUBLIC_SITE_THEME })} className="rounded-xl border border-[#cbd8cf] px-3 py-2 text-sm font-semibold text-[#31574b] hover:bg-[#f5f8f4]">Restaurar paleta LUmina</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{colorFields.map((field) => <ThemeColorField key={field.key} label={field.label} description={field.description} value={content.theme[field.key]} onChange={(value) => setThemeColor(field.key, value)} />)}</div>
        <div className="mt-5 rounded-2xl p-5 text-[var(--lumina-on-primary)]" style={{ ...publicThemeStyle(content.theme), background: "linear-gradient(120deg, var(--lumina-primary), var(--lumina-secondary))" }}><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--lumina-accent)]">Prévia da identidade</p><p className="mt-2 text-lg font-semibold">A mesma paleta será usada no site e no portal.</p><p className="mt-1 text-sm opacity-85">Os botões usam contraste automático para manter a leitura.</p><span className="mt-4 inline-flex rounded-lg bg-[var(--lumina-accent)] px-3 py-2 text-xs font-bold text-[var(--lumina-on-accent)]">Exemplo de chamada</span></div>
        {!paletteValid && <p className="mt-3 text-sm font-medium text-[#a55a55]">Revise os campos de cor: use apenas o formato hexadecimal completo, como <code>#183D37</code>.</p>}
      </section>

      <section className="grid gap-3 rounded-2xl border border-[#e0e7e1] p-4 lg:grid-cols-3"><Field label="Link de agendamento"><input type="url" value={content.appointmentUrl} onChange={(event) => set("appointmentUrl", event.target.value)} placeholder="https://…" /></Field><Field label="Link de WhatsApp"><input type="url" value={content.whatsappUrl} onChange={(event) => set("whatsappUrl", event.target.value)} placeholder="https://wa.me/…" /></Field><Field label="Link de pagamento"><input type="url" value={content.paymentUrl} onChange={(event) => set("paymentUrl", event.target.value)} placeholder="https://…" /></Field><p className="lg:col-span-3 text-xs leading-relaxed text-[#71857e]">Use somente URLs já aprovadas por você. O sistema exibe links externos como botões; ele não armazena token, senha, checkout privado ou segredo de pagamento.</p></section>

      <ContentCollection title="Serviços públicos" description="Cadastre apenas títulos e descrições aprovados por você. Se quiser valor ou condição comercial, inclua no texto depois de validá-los." items={content.services} onAdd={() => addItem("services")} onUpdate={(index, key, value) => updateItem("services", index, key, value)} onRemove={(index) => removeItem("services", index)} />
      <ContentCollection title="Produtos públicos" description="Use para produtos que você decidiu apresentar no site. Isso não altera o catálogo interno, o estoque nem o prontuário." items={content.products} onAdd={() => addItem("products")} onUpdate={(index, key, value) => updateItem("products", index, key, value)} onRemove={(index) => removeItem("products", index)} />

      <section className="grid gap-3 rounded-2xl bg-[#f7faf7] p-4 lg:grid-cols-2"><Field label="Título da seção institucional"><input value={content.aboutTitle} onChange={(event) => set("aboutTitle", event.target.value)} /></Field><Field label="Rodapé"><input value={content.footerText} onChange={(event) => set("footerText", event.target.value)} /></Field><div className="lg:col-span-2"><Field label="Texto institucional"><textarea value={content.aboutText} onChange={(event) => set("aboutText", event.target.value)} /></Field></div></section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e9e4] pt-5"><p className="max-w-2xl text-xs leading-relaxed text-[#71857e]">Salvar publica somente este conteúdo editorial e a paleta visual aprovada. Não publica dados de pacientes, CPF, fotografias clínicas, termos, evolução, agenda interna ou credenciais.</p><button onClick={() => save.mutate(content)} disabled={save.isPending || !paletteValid || !content.siteName.trim() || !content.heroTitle.trim() || !content.aboutTitle.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#183d37] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16}/>{save.isPending ? "Salvando…" : "Salvar no site público"}</button></div>
    </div>}
  </section>;
}

function ThemeColorField({ label, description, value, onChange }: { label: string; description: string; value: string; onChange: (value: string) => void }) {
  const valid = isValidHexColor(value);
  return <label className="rounded-2xl border border-[#e0e7e1] bg-[#fbfcfa] p-3"><span className="block text-sm font-semibold text-[#254a42]">{label}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#71857e]">{description}</span><span className="mt-3 flex items-center gap-2"><input aria-label={`${label} seletor`} type="color" value={valid ? value : "#183D37"} onChange={(event) => onChange(event.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-[#d9e2dc] bg-white p-1"/><input aria-label={`${label} hexadecimal`} value={value} onChange={(event) => onChange(event.target.value)} maxLength={7} spellCheck={false} className={`h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 font-mono text-sm uppercase outline-none ${valid ? "border-[#d9e2dc] focus:border-[#7ca78e]" : "border-[#c46a6a] focus:border-[#a55a55]"}`} /></span></label>;
}

function ContentCollection({ title, description, items, onAdd, onUpdate, onRemove }: { title: string; description: string; items: PublicSiteItem[]; onAdd: () => void; onUpdate: (index: number, key: keyof PublicSiteItem, value: string) => void; onRemove: (index: number) => void }) {
  return <section className="rounded-2xl border border-[#e0e7e1] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-semibold text-[#254a42]">{title}</h4><p className="mt-1 max-w-3xl text-sm text-[#657c74]">{description}</p></div><button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl border border-[#cbd8cf] px-3 py-2 text-sm font-semibold text-[#31574b] hover:bg-[#f5f8f4]"><Plus size={16}/> Adicionar</button></div><div className="mt-4 space-y-4">{items.map((item, index) => <article key={item.id} className="rounded-2xl bg-[#f7faf7] p-4"><div className="flex justify-end"><button onClick={() => onRemove(index)} className="inline-flex items-center gap-1 text-xs font-medium text-[#9b5757] hover:text-[#7a3939]"><Trash2 size={14}/> Remover</button></div><div className="-mt-5 grid gap-3 lg:grid-cols-2"><Field label="Título"><input value={item.title} onChange={(event) => onUpdate(index, "title", event.target.value)} /></Field><Field label="Link opcional"><input type="url" value={item.link} onChange={(event) => onUpdate(index, "link", event.target.value)} placeholder="https://…" /></Field><div className="lg:col-span-2"><Field label="Descrição"><textarea value={item.description} onChange={(event) => onUpdate(index, "description", event.target.value)} /></Field></div></div></article>)}{!items.length && <p className="rounded-xl border border-dashed border-[#cbd8cf] bg-[#fbfcfa] p-4 text-sm text-[#71857e]">Nenhum item cadastrado.</p>}</div></section>;
}
