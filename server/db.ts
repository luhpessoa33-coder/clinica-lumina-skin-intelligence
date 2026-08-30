import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertPlannerItem, InsertUser, plannerAttachments, plannerItems, users } from "../drizzle/schema";
import plannerExport from "../shared/data/planner-export.json";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === "false" ? false : process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertAdmin(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const now = new Date();
  const rows = await db.insert(users).values({ ...user, email: user.email.toLowerCase(), role: "admin", lastSignedIn: now, updatedAt: now }).onConflictDoUpdate({
    target: users.email,
    set: { name: user.name, passwordHash: user.passwordHash, role: "admin", lastSignedIn: now, updatedAt: now },
  }).returning();
  return rows[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1))[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
}

export async function listPlannerItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plannerItems).where(eq(plannerItems.userId, userId)).orderBy(desc(plannerItems.updatedAt));
}

export async function savePlannerItem(userId: number, item: Omit<InsertPlannerItem, "userId">) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(plannerItems).values({ ...item, userId }).onConflictDoUpdate({
    target: [plannerItems.userId, plannerItems.referenceId], set: { ...item, updatedAt: new Date() },
  });
  return db.select().from(plannerItems).where(and(eq(plannerItems.userId, userId), eq(plannerItems.referenceId, item.referenceId))).limit(1);
}

export async function removePlannerItem(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(plannerItems).where(and(eq(plannerItems.userId, userId), eq(plannerItems.id, id)));
}

export async function listAttachments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plannerAttachments).where(eq(plannerAttachments.userId, userId)).orderBy(desc(plannerAttachments.createdAt));
}

export async function addAttachment(data: typeof plannerAttachments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(plannerAttachments).values(data);
}

export async function ensurePlannerSeed(userId: number) {
  const existing = await listPlannerItems(userId);
  const existingReferences = new Set(existing.map(item => item.referenceId));
  const exportedDefaults = plannerExport.items.map(raw => ({
    ...raw,
    category: raw.category === "NULL" ? null : raw.category,
    quantity: raw.quantity === "NULL" ? null : raw.quantity,
    unit: raw.unit === "NULL" ? null : raw.unit,
    dueAt: raw.dueAt === "NULL" || !raw.dueAt ? null : new Date(raw.dueAt),
    responsible: raw.responsible === "NULL" ? null : raw.responsible,
    brandModel: raw.brandModel === "NULL" ? null : raw.brandModel,
    supplier: raw.supplier === "NULL" ? null : raw.supplier,
    validationStatus: raw.validationStatus === "NULL" ? null : raw.validationStatus,
    details: raw.details === "NULL" ? null : raw.details,
    plannedCents: Number(raw.plannedCents || 0), quotedCents: Number(raw.quotedCents || 0),
    contractedCents: Number(raw.contractedCents || 0), paidCents: Number(raw.paidCents || 0),
  })) as Array<Omit<InsertPlannerItem, "userId">>;
  const defaults: Array<Omit<InsertPlannerItem, "userId">> = exportedDefaults.length ? exportedDefaults : [
    { module: "task", referenceId: "task-formacao", title: "Concluir especialização em estética avançada", category: "Formação", status: "em_andamento", priority: "alta", dueAt: new Date("2027-04-30T12:00:00Z"), responsible: "Proprietária", details: "Vincular habilitação profissional aos serviços liberados." },
    { module: "task", referenceId: "task-levantamento", title: "Levantamento real do terreno e da casa", category: "Projeto", status: "pendente", priority: "critica", dueAt: new Date("2027-02-15T12:00:00Z"), responsible: "Arquiteto local", details: "Medidas, níveis, norte, acessos, instalações e recuos." },
    { module: "task", referenceId: "task-projeto-legal", title: "Protocolar projeto e licenças locais", category: "Licenças", status: "pendente", priority: "critica", dueAt: new Date("2027-04-15T12:00:00Z"), responsible: "Responsável técnico", validationStatus: "revisao_local" },
    { module: "task", referenceId: "task-obra", title: "Iniciar implantação física", category: "Obra", status: "planejado", priority: "alta", dueAt: new Date("2027-05-03T12:00:00Z"), responsible: "Construtora" },
    { module: "license", referenceId: "lic-vigilancia", title: "Licença sanitária", category: "Licença", status: "pendente", priority: "critica", validationStatus: "revisao_local", details: "Conferir exigências da Vigilância Sanitária municipal." },
    { module: "license", referenceId: "lic-rt", title: "Responsável técnico e conselho profissional", category: "Habilitação", status: "pendente", priority: "critica", validationStatus: "bloqueador", details: "Obrigatório antes de liberar procedimentos condicionais." },
    { module: "risk", referenceId: "risk-terreno", title: "Terreno ainda não levantado", category: "Arquitetura", status: "aberto", priority: "critica", details: "Todas as pranchas são anteprojeto-base ajustável." },
    { module: "risk", referenceId: "risk-layout-post-survey", title: "Levantamento real do terreno e dos acessos", category: "Bloqueio da versão executiva", status: "bloqueado", priority: "critica", validationStatus: "aguarda_levantamento", details: "Antes da versão executiva, medir níveis, portão, calçada, recuos, ligação com a casa e acessos; depois atualizar o fluxo público/técnico e prolongar a rota acessível até o passeio." },
    { module: "course", referenceId: "course-intercorrencias", title: "Manejo de intercorrências e suporte básico", category: "Curso", status: "planejado", priority: "alta", dueAt: new Date("2027-03-31T12:00:00Z"), plannedCents: 180000 },
    { module: "course", referenceId: "course-hifu", title: "Treinamento certificado no HIFU escolhido", category: "Curso", status: "planejado", priority: "alta", plannedCents: 120000 },
    { module: "document", referenceId: "doc-pgrss", title: "PGRSS", category: "Sanitário", status: "pendente", priority: "critica", validationStatus: "revisao_local" },
    { module: "document", referenceId: "doc-pop", title: "POPs e placas de biossegurança", category: "Biossegurança", status: "rascunho", priority: "alta", validationStatus: "aguarda_rt" },
    { module: "decision", referenceId: "decision-area", title: "Escolher alternativa de 60 m² ou 45 m²", category: "Marco", status: "pendente", priority: "alta", dueAt: new Date("2027-01-31T12:00:00Z"), details: "Comparar orçamento, privacidade e capacidade futura." },
    { module: "environment", referenceId: "room-reception", title: "Recepção e espera", category: "10,1 m²", status: "rascunho", priority: "alta", details: "4 lugares, balcão acessível, giro Ø1,50 m, água/café e infraestrutura de conforto." },
    { module: "environment", referenceId: "room-procedure", title: "Sala principal de procedimentos", category: "11,5 m²", status: "rascunho", priority: "critica", details: "Maca, bancada, cuba, fotografia, tomadas e reservas de equipamentos." },
    { module: "environment", referenceId: "room-evaluation", title: "Avaliação e administração", category: "7,5 m²", status: "rascunho", priority: "media", details: "Mesa, arquivo, fotografia e apoio administrativo." },
    { module: "environment", referenceId: "room-accessible-wc", title: "Sanitário acessível", category: "4,2 m²", status: "rascunho", priority: "critica", details: "Barras, lavatório, área de transferência e giro conforme validação local." },
    { module: "environment", referenceId: "room-technical", title: "Área técnica e estoque", category: "6,8 m²", status: "rascunho", priority: "critica", details: "Fluxos limpo/sujo, estoque FEFO e processamento condicional." },
    { module: "environment", referenceId: "room-circulation", title: "Circulação acessível", category: "7,7 m²", status: "rascunho", priority: "alta", details: "Rota acessível e separação funcional entre clientes, materiais e resíduos." },
    { module: "supplier", referenceId: "supplier-ibramed", title: "Ibramed / revenda autorizada", category: "Equipamentos", status: "pesquisa", priority: "alta", supplier: "Ibramed", details: "Solicitar demonstração, assistência regional, garantia e proposta do Sonofocus." },
    { module: "supplier", referenceId: "supplier-htm", title: "HTM Eletrônica / loja oficial", category: "Equipamentos", status: "pesquisa", priority: "alta", supplier: "HTM", details: "Solicitar demonstração, conteúdo do kit e custo total do Ultrafocus." },
    { module: "purchase", referenceId: "purchase-projects", title: "Projetos, aprovações e licenças", category: "Compra crítica", status: "planejado", priority: "critica", dueAt: new Date("2027-05-31T12:00:00Z"), plannedCents: 7200000 },
    { module: "purchase", referenceId: "purchase-furniture", title: "Marcenaria e mobiliário clínico", category: "Compra", status: "planejado", priority: "alta", dueAt: new Date("2028-06-30T12:00:00Z"), plannedCents: 5100000 },
    { module: "purchase", referenceId: "purchase-hifu", title: "HIFU selecionado após demonstração", category: "Equipamento", status: "bloqueado", priority: "alta", dueAt: new Date("2028-08-15T12:00:00Z"), plannedCents: 1099000, validationStatus: "aguarda_treinamento", details: "Selecionar apenas um: Sonofocus ou Ultrafocus; conferir registro, garantia e assistência." },
    { module: "purchase", referenceId: "purchase-stock", title: "Estoque inicial e biossegurança", category: "Insumos", status: "planejado", priority: "alta", dueAt: new Date("2028-08-31T12:00:00Z"), plannedCents: 2200000, details: "Comprar próximo da abertura e controlar lote, validade e FEFO." },
    { module: "decision", referenceId: "decision-professional-scope", title: "Validar escopo profissional e responsável técnico", category: "Liberação de serviços", status: "bloqueado", priority: "critica", dueAt: new Date("2027-08-31T12:00:00Z"), validationStatus: "revisao_local", details: "Condição para licenças, procedimentos invasivos e aquisição de injetáveis." },
    { module: "decision", referenceId: "decision-hifu-training", title: "Liberar compra do HIFU após treinamento", category: "Curso + compra", status: "bloqueado", priority: "alta", dueAt: new Date("2028-07-31T12:00:00Z"), validationStatus: "aguarda_treinamento", details: "Treinamento certificado, demonstração, orçamento total e assistência aprovados." },
    { module: "task", referenceId: "phase-projeto-executivo", title: "Projeto executivo e compatibilização", category: "Fase 1", status: "planejado", priority: "critica", dueAt: new Date("2027-06-30T12:00:00Z"), responsible: "Arquitetura e engenharia", details: "Meses 1–2: levantamento, executivo, estrutura e instalações." },
    { module: "task", referenceId: "phase-aprovacoes", title: "Aprovações, licenças e contratação", category: "Fase 2", status: "planejado", priority: "critica", dueAt: new Date("2027-08-31T12:00:00Z"), responsible: "RT e proprietária", details: "Meses 3–4: prefeitura, Vigilância, bombeiros e contratos." },
    { module: "task", referenceId: "phase-base-estrutura", title: "Preparação, fundações e estrutura", category: "Fase 3", status: "planejado", priority: "alta", dueAt: new Date("2027-11-30T12:00:00Z"), responsible: "Construtora", details: "Meses 5–7: canteiro, base, estrutura e cobertura." },
    { module: "task", referenceId: "phase-fechamentos", title: "Vedações, esquadrias e impermeabilização", category: "Fase 4", status: "planejado", priority: "alta", dueAt: new Date("2028-01-31T12:00:00Z"), responsible: "Construtora", details: "Meses 8–9: alvenarias, cobertura, calhas, portas e janelas." },
    { module: "task", referenceId: "phase-instalacoes", title: "Instalações e drenagem externa", category: "Fase 5", status: "planejado", priority: "alta", dueAt: new Date("2028-03-31T12:00:00Z"), responsible: "Equipes técnicas", details: "Meses 10–11: elétrica, dados, hidráulica, climatização e drenagem." },
    { module: "task", referenceId: "phase-acabamentos", title: "Revestimentos, forros e acabamentos", category: "Fase 6", status: "planejado", priority: "alta", dueAt: new Date("2028-05-31T12:00:00Z"), responsible: "Construtora", details: "Meses 12–13: pisos, paredes, pintura, iluminação e louças." },
    { module: "task", referenceId: "phase-mobiliario", title: "Marcenaria, mobiliário e comunicação", category: "Fase 7", status: "planejado", priority: "media", dueAt: new Date("2028-07-31T12:00:00Z"), responsible: "Fornecedores", details: "Meses 14–15: montagem, sinalização, recepção e decoração." },
    { module: "task", referenceId: "phase-equipamentos", title: "Equipamentos, TI e estoque inicial", category: "Fase 8", status: "planejado", priority: "alta", dueAt: new Date("2028-08-31T12:00:00Z"), responsible: "Proprietária e fornecedores", details: "Mês 16: entrega, instalação, calibração e treinamento." },
    { module: "task", referenceId: "phase-validacoes", title: "Comissionamento e validações finais", category: "Fase 9", status: "planejado", priority: "critica", dueAt: new Date("2028-09-30T12:00:00Z"), responsible: "RT e fiscalização", details: "Mês 17: testes, as built, POPs, PGRSS e inspeções." },
    { module: "task", referenceId: "phase-abertura", title: "Abertura assistida da Clínica Lumina", category: "Fase 10", status: "planejado", priority: "critica", dueAt: new Date("2028-10-31T12:00:00Z"), responsible: "Equipe Lumina", details: "Mês 18: operação piloto, ajustes e inauguração." },
  ];
  for (const item of defaults) if (!existingReferences.has(item.referenceId)) await savePlannerItem(userId, item);
  return listPlannerItems(userId);
}
