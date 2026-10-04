export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface Document {
  id: string;
  title: string;
  file: string;
  file_url: string;
  uploaded_by: User;
  page_count: number;
  created_at: string;
}

export interface SignaturePlacement {
  id: string;
  signer: User;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'pending' | 'signed';
  signed_at: string | null;
  order: number;
}

export interface SignatureRequest {
  id: string;
  document: Document;
  initiator: User;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  placements: SignaturePlacement[];
  placements_total: number;
  placements_signed: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  signed_file_url: string | null;
}

export interface SignatureRequestListItem {
  id: string;
  document: Document;
  initiator: User;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  placements_total: number;
  placements_signed: number;
  my_placements: {
    id: string;
    page_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'pending' | 'signed';
    order: number;
  }[];
  created_at: string;
  completed_at: string | null;
}

export interface PlacementInput {
  signer_id: number;
  page_number: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  order: number;
}

export interface DashboardStats {
  documents: number;
  pending: number;
  action_required: number;
  completed: number;
}

// For local state during placement creation
export interface LocalPlacement {
  id: string; // temporary local ID
  signer: User;
  page_number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  order: number;
}

export interface SelectedSigner extends User {
  color: SignerColor;
}

export interface SignerColor {
  bg: string;
  border: string;
  text: string;
  fill: string;
}
