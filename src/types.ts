export interface Member {
  id: string;
  name: string;
  vote: string | null;
  isAdmin: boolean;
  lastActiveTime: number;
}

export interface Room {
  members: Member[];
  revealed: boolean;
  votingSystem: 'fibonacci' | 'tshirt';
  adminId: string | null;
  lastAdminResetTime?: number;
}

export const fibonacciPoints = ['1', '2', '3', '5', '8', '13', '21', '?'];
export const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'];