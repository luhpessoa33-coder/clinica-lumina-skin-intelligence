import { describe, expect, it } from "vitest";
import { budgetProgress, formatBRL, isOverdue, regulatedItemBlockReason } from "../shared/planner";

describe("planner business rules", () => {
  it("formats cents and clamps budget progress", () => {
    expect(formatBRL(125000)).toContain("1.250");
    expect(budgetProgress(150, 100)).toBe(100);
    expect(budgetProgress(0, 0)).toBe(0);
  });

  it("flags only unresolved past deadlines", () => {
    const now = new Date("2027-05-10T12:00:00Z");
    expect(isOverdue("pendente", "2027-05-01T12:00:00Z", now)).toBe(true);
    expect(isOverdue("concluido", "2027-05-01T12:00:00Z", now)).toBe(false);
    expect(isOverdue("pendente", "2027-06-01T12:00:00Z", now)).toBe(false);
  });

  it("blocks regulated items until validation is recorded", () => {
    expect(regulatedItemBlockReason("Toxina botulínica 100 U", "pago", null)).toContain("Item regulado");
    expect(regulatedItemBlockReason("HIFU Sonofocus", "concluido", "registro_e_treinamento_ok")).toBeNull();
    expect(regulatedItemBlockReason("Poltrona da recepção", "pago", null)).toBeNull();
  });
});
