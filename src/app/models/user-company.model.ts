export interface UserCompany {
  id: string;
  userId: string;
  companyId: string;
  role: string;
  joinDate: string; // Consider using Date if you prefer handling dates as Date objects
}
