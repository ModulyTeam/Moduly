import {AllowedActionEnum} from "./AllowedActionEnum";

export interface PermissionAssignment {
  assignerUserId: string;
  targetUserId: string;
  companyId: string;
  moduleId: string;
  permissionTypeId: string;
  allowedAction: AllowedActionEnum;
}
