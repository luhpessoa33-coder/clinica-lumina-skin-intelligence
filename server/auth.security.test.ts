import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { hashPassword, verifyPassword } from "./_core/auth";
import type { TrpcContext } from "./_core/context";

const request = { secure: true, headers: {} } as TrpcContext["req"];
const response = {} as TrpcContext["res"];
const makeUser = (role: "admin" | "user") => ({
  id: 1, email: `${role}@example.com`, passwordHash: "scrypt$test$00", name: role,
  role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
});

describe("portable authentication and authorization", () => {
  it("hashes and verifies passwords without storing plaintext", () => {
    const password = "uma-senha-forte-para-teste";
    const hash = hashPassword(password);
    expect(hash).not.toContain(password);
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("senha-incorreta", hash)).toBe(false);
  });

  it("denies anonymous access to planning data", async () => {
    const caller = appRouter.createCaller({ req: request, res: response, user: null });
    await expect(caller.planner.referenceData()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("denies authenticated users outside the administrator role", async () => {
    const caller = appRouter.createCaller({ req: request, res: response, user: makeUser("user") });
    await expect(caller.planner.referenceData()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an authorized administrator", async () => {
    const caller = appRouter.createCaller({ req: request, res: response, user: makeUser("admin") });
    const data = await caller.planner.referenceData();
    expect(data.catalog.length).toBeGreaterThan(100);
  });
});
