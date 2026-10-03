export type MatchDetail = {
  id: string;
  slug: string;
  match_date: string;
  match_time: string;
  location: string;
  price_crc: number;
  sinpe_phone: string;
  notes: string | null;
  status: "open" | "cancelled" | "finished";
  created_by: string;
};

export type RegistrationRow = {
  id: string;
  name: string;
  phone: string;
  status: "pending" | "proof_submitted" | "approved" | "rejected";
  payment_proof_path: string | null;
  created_at: string;
};
