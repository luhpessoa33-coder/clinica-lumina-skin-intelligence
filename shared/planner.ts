export type PlannerModule = "task" | "budget" | "catalog" | "supplier" | "document" | "license" | "risk" | "course" | "decision" | "purchase" | "environment" | "protocol" | "notification_run";

export function formatBRL(cents: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format((cents ?? 0) / 100);
}

export function isOverdue(status: string, dueAt?: Date | string | null, now = new Date()) {
  if (!dueAt || ["concluido", "pago", "aprovado"].includes(status)) return false;
  return new Date(dueAt).getTime() < now.getTime();
}

export function budgetProgress(paid: number, planned: number) {
  if (planned <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / planned) * 100)));
}

const regulatedTerms = /toxina|botox|nabota|xeomin|preenchedor|bioestimulador|hialuronidase|anestésico|injetável|hifu|ultrassom micro|ultrassom macro|autoclave|cadeia fria/i;
const finalStatuses = new Set(["concluido", "contratado", "pago", "aprovado", "em_uso"]);
const acceptedValidations = new Set(["liberado_rt_vigilancia", "registro_e_treinamento_ok", "armazenamento_validado"]);

export function regulatedItemBlockReason(title: string, status: string, validationStatus?: string | null) {
  if (!regulatedTerms.test(title) || !finalStatuses.has(status)) return null;
  if (acceptedValidations.has(validationStatus ?? "")) return null;
  return "Item regulado: valide habilitação, responsável técnico, licença/registro, treinamento e armazenamento antes de concluir, contratar, pagar ou colocar em uso.";
}
