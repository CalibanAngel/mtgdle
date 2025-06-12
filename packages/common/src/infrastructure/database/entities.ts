import { CardEntity } from '@mtgdle/common/models/card/card.schema';
import { CardFaceEntity } from '@mtgdle/common/models/card/card-face/card-face.schema';
import { CardImageUrisEntity } from '@mtgdle/common/models/card/card-image-uris/card-image-uris.schema';
import { ManaCostEntity } from '@mtgdle/common/models/card/mana-cost/mana-cost.schema';
import { SetEntity } from '@mtgdle/common/models/set/set.schema';

export const Entities = [
  CardEntity,
  CardFaceEntity,
  CardImageUrisEntity,
  ManaCostEntity,
  SetEntity,
];
