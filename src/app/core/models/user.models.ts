export enum UserRole {
  Admin        = 'Admin',
  Doctor       = 'Doctor',
  Receptionist = 'Receptionist',
  Patient      = 'Patient',
}

export interface UserListItemDto {
  id:        string;
  email:     string;
  firstName: string;
  lastName:  string;
  role:      UserRole;
  isActive:  boolean;
  createdAt: string;
}
