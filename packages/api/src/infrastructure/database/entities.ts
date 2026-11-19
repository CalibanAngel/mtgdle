import { CardEntity } from '../../models/card/card.schema';
import { CardFaceEntity } from '../../models/card/card-face/card-face.schema';
import { CardImageUrisEntity } from '../../models/card/card-image-uris/card-image-uris.schema';
import { ManaCostEntity } from '../../models/card/mana-cost/mana-cost.schema';
import { SetEntity } from '../../models/set/set.schema';
import { PlayableCardEntity } from '../../models/playable-card/playable-card.schema';
import { GameEntity } from '../../models/game/game.schema';
import { ClassicCatalogueEntity } from '../../models/classic-catalogue/classic-catalogue.schema';
import { ClassicDailyEntity } from '../../models/classic-daily/classic-daily.schema';
import { ClassicProgressEntity } from '../../models/classic-progress/classic-progress.schema';

export const ClassicEntities = [
  ClassicCatalogueEntity,
  ClassicDailyEntity,
  ClassicProgressEntity,
];

export const Entities = [
  CardEntity,
  CardFaceEntity,
  CardImageUrisEntity,
  GameEntity,
  ManaCostEntity,
  PlayableCardEntity,
  SetEntity,
  ...ClassicEntities,
];
