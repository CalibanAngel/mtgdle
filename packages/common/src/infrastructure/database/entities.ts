import { SetEntity } from '../../models/set/set.schema';
import { CardEntity } from '../../models/card/card.schema';
import { CardFaceEntity } from '../../models/card/card-face/card-face.schema';
import { ManaCostEntity } from '../../models/card/mana-cost/mana-cost.schema';
import { CardImageUrisEntity } from '../../models/card/card-image-uris/card-image-uris.schema';

export const Entities = [
  CardEntity,
  CardFaceEntity,
  CardImageUrisEntity,
  ManaCostEntity,
  SetEntity,
];
