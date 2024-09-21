export interface Invoice {
    id?: string;
    code: string;
    moduleId: string;
    issuerId: string;
    issueDate: string;
    dueDate?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    status: string;
    userId: string;
    currency?: string;
    exchangeRate?: number;
    discountDate?: string;
    tcea?: number;
    totalPayment?: number;
}