export type PublicSiteItem = {
  id: string;
  title: string;
  description: string;
  link: string;
};

export type PublicSiteTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
};

export type PublicSiteContent = {
  siteName: string;
  signature: string;
  theme: PublicSiteTheme;
  heroTitle: string;
  heroText: string;
  aboutTitle: string;
  aboutText: string;
  appointmentUrl: string;
  whatsappUrl: string;
  paymentUrl: string;
  footerText: string;
  services: PublicSiteItem[];
  products: PublicSiteItem[];
};

/**
 * Conteúdo neutro de primeira publicação. Serviços, preços, credenciais e
 * links comerciais somente aparecem depois de definidos pela SUPER ADM.
 */
export const DEFAULT_PUBLIC_SITE_THEME: PublicSiteTheme = {
  primary: "#183d37",
  secondary: "#24574d",
  accent: "#e7bd7c",
  background: "#f7f4ed",
  surface: "#ffffff",
  text: "#183d37",
  mutedText: "#667b74",
};

export const DEFAULT_PUBLIC_SITE_CONTENT: PublicSiteContent = {
  siteName: "LUmina Skin Intelligence",
  signature: "Site público em estruturação",
  theme: DEFAULT_PUBLIC_SITE_THEME,
  heroTitle: "Uma presença digital clara, organizada e sob seu controle.",
  heroText: "A administração da clínica define e publica nesta área os conteúdos institucionais, serviços, produtos, formas de contato e links comerciais aprovados.",
  aboutTitle: "Conteúdo em personalização",
  aboutText: "Esta área pública não exibe prontuários, avaliações, fotografias clínicas, documentos ou dados pessoais. As informações profissionais serão inseridas e revisadas pela administração antes da publicação.",
  appointmentUrl: "",
  whatsappUrl: "",
  paymentUrl: "",
  footerText: "LUmina Skin Intelligence",
  services: [],
  products: [],
};

export function clonePublicSiteContent(value: PublicSiteContent = DEFAULT_PUBLIC_SITE_CONTENT): PublicSiteContent {
  return {
    ...value,
    theme: { ...value.theme },
    services: value.services.map((item) => ({ ...item })),
    products: value.products.map((item) => ({ ...item })),
  };
}
