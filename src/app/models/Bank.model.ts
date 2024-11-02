export interface  Bank {
  id: string;
  name: string;
  accountNumber: string;
  iban: string;
  swift: string;
  accountHolderName: string;
  accountType: string;
  bankAddress: string;
  paymentReference: string;
  tceApreferredRate: number;
}
