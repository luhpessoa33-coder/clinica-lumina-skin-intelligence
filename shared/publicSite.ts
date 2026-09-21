export type PublicSiteItem = {
  id: string;
  title: string;
  description: string;
  link: string;
};

export type PublicSiteContent = {
  siteName: string;
  signature: string;
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
export const DEFAULT_PUBLIC_SITE_CONTENT: PublicSiteContent = {
  siteName: "LUmina Skin Intelligence",
  signature: "Site público em estruturação",
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
    services: value.services.map((item) => ({ ...item })),
    products: value.products.map((item) => ({ ...item })),
  };
}
