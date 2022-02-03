export type CustomerPayload = {
  email: string;
  cardToken: string;
  pendingCharge?: string;
  subscribe?: string;
};

export type BuyCreditsPayload = {
  email: string;
  cardToken: string;
  amount: number;
};
