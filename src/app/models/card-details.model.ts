export interface CardDetails {
    cardId: string;
}

export interface Card {
  card_id: string;
  card_title: string;
}

// The raw cards row returned by POST /api/addTask (not the card_id/card_title shape getTasks uses)
export interface NewCardResponse {
  id: string;
  list_id: string;
  title: string;
  description: string;
  position: number;
  due_date: string | null;
  created_at: string;
}