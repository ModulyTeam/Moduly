import {AllowedActionEnum} from "./AllowedActionEnum";

export interface PermissionType {
  name: string;
  description?: string;
  companyId: string;
  userId: string;
  allowedActions: AllowedActionEnum[];
}
