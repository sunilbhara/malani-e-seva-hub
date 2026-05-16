export type Language = "default" | "hi" | "en";

export type LanguageOption = {
  value: Language;
  label: string;
};

export type NavItem = {
  label: string;
  section: string;
  route: string;
};

export type FeatureItem = {
  title: string;
  description: string;
};

export type LabeledStat = {
  number: string;
  label: string;
};

export type ServiceCard = {
  title: string;
  description: string;
  features?: string[];
  bullets?: string[];
};

export type FaqItem = {
  question: string;
  answer: string;
};
