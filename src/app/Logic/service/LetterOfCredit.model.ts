export interface LetterOfCredit {
  id: number;
  amount: number;
  maturityDate: Date;
  discountRate: number;
  issuer: string;
  beneficiary: string;
}
