export interface Member {
  id: string;
  name: string;
  vote: string | null;
}

export interface Room {
  members: Member[];
  revealed: boolean;
  votingSystem: 'fibonacci' | 'tshirt';
}

export const fibonacciPoints = ['1', '2', '3', '5', '8', '13', '21', '?'];
export const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'];