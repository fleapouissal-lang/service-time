/**
 * Tarifs Paymob / Accept — source : `specal prices .pdf` (Commercial Proposal, juin 2026).
 * Frais de transaction et services marchands ; pas les prix des pièces ou services atelier.
 */

export type PaymobPercentFee = {
  id: string;
  percent: number;
};

export type PaymobBnplFee = {
  id: string;
  percent: number;
  fixedSar: number;
};

/** Paiements en ligne par carte */
export const PAYMOB_ONLINE_CARD_FEES = {
  mada: {
    id: "mada",
    percent: 1.0,
  },
  visaMastercardMada: {
    id: "visa_mastercard_mada",
    percent: 2.5,
  },
  internationalCards: {
    id: "international_cards",
    percent: 3.5,
  },
  /** Supplément Shopify si applicable */
  shopifyExtra: {
    id: "shopify_extra",
    percent: 0.35,
  },
} as const satisfies Record<string, PaymobPercentFee>;

/** Tabby & Tamara (Contact) — BNPL */
export const PAYMOB_BNPL_FEES = {
  tabby: {
    id: "tabby",
    percent: 6.99,
    fixedSar: 1.5,
  },
  tamara: {
    id: "tamara",
    percent: 7,
    fixedSar: 1,
  },
} as const satisfies Record<string, PaymobBnplFee>;

/** Frais compte marchand (tous les checkout ci-dessus inclus) */
export const PAYMOB_MERCHANT_ACCOUNT_FEES = {
  settlementTwiceWeekly: 599,
  settlementDaily: 999,
} as const;

/** Checkout inclus sans frais supplémentaires dans la proposition */
export const PAYMOB_FREE_CHECKOUT_FEATURES = [
  "in_page_checkout",
  "in_app_checkout",
  "standalone_checkout",
  "invoice_checkout",
] as const;

export function formatPercentFee(percent: number, locale: string): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: percent % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(percent);
  return `${formatted}%`;
}

export function formatBnplFee(
  fee: PaymobBnplFee,
  locale: string,
): string {
  const percent = formatPercentFee(fee.percent, locale);
  const fixed = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fee.fixedSar % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(fee.fixedSar);
  return `${percent} + ${fixed} SAR`;
}

export function formatMerchantFee(amountSar: number, locale: string): string {
  return `${new Intl.NumberFormat(locale).format(amountSar)} SAR`;
}

/** Liste des méthodes affichées au client sur la page de paiement */
export function getPaymobCheckoutMethods(locale: string) {
  return [
    {
      id: PAYMOB_ONLINE_CARD_FEES.mada.id,
      fee: formatPercentFee(PAYMOB_ONLINE_CARD_FEES.mada.percent, locale),
    },
    {
      id: PAYMOB_ONLINE_CARD_FEES.visaMastercardMada.id,
      fee: formatPercentFee(
        PAYMOB_ONLINE_CARD_FEES.visaMastercardMada.percent,
        locale,
      ),
    },
    {
      id: PAYMOB_ONLINE_CARD_FEES.internationalCards.id,
      fee: formatPercentFee(
        PAYMOB_ONLINE_CARD_FEES.internationalCards.percent,
        locale,
      ),
    },
    {
      id: "apple_pay",
      fee: null,
    },
    {
      id: PAYMOB_BNPL_FEES.tabby.id,
      fee: formatBnplFee(PAYMOB_BNPL_FEES.tabby, locale),
    },
    {
      id: PAYMOB_BNPL_FEES.tamara.id,
      fee: formatBnplFee(PAYMOB_BNPL_FEES.tamara, locale),
    },
  ] as const;
}
