import { Card } from './card-details.model';

export interface ListType {
    listId: string;
    listName: string;
    cards: Card[];
}
