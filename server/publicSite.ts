import { z } from "zod";
import { clonePublicSiteContent, DEFAULT_PUBLIC_SITE_CONTENT, type PublicSiteContent } from "@shared/publicSite";

export const PUBLIC_SITE_SETTING_KEY = "public_site_content";

const publicItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(255),
  description: z.string().max(10_000),
  link: z.string().trim().max(2_000),
}).strict();

export const publicSiteContentSchema = z.object({
  siteName: z.string().trim().min(1).max(160),
  signature: z.string().trim().max(180),
  heroTitle: z.string().trim().min(1).max(600),
  heroText: z.string().max(5_000),
  aboutTitle: z.string().trim().min(1).max(300),
  aboutText: z.string().max(8_000),
  appointmentUrl: z.string().trim().max(2_000),
  whatsappUrl: z.string().trim().max(2_000),
  paymentUrl: z.string().trim().max(2_000),
  footerText: z.string().trim().max(1_000),
  services: z.array(publicItemSchema).max(40),
  products: z.array(publicItemSchema).max(80),
}).strict();

export function publicSiteContentOrDefault(value: unknown): PublicSiteContent {
  const parsed = publicSiteContentSchema.safeParse(value);
  return parsed.success ? parsed.data : clonePublicSiteContent();
}
