import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { Image } from '@heroui/image';
import { useCallback, useMemo, useState } from 'react';

import { usePlayableCards } from '@/feature/game/api/get-searchable-cards.ts';
import { useGuessCard } from '@/feature/game/api/guess-card.tsx';

const CustomImage = ({ src }: { src: string }) => (
  <Image height={'50'} radius={'sm'} src={src} width={'36'} />
);

export const SearchCard = () => {
  const { data } = usePlayableCards();
  const playableCards = data?.data ?? [];

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const filteredCards = useMemo(
    () => playableCards.filter((card) => !removedIds.has(card.cardId)),
    [playableCards, removedIds],
  );

  const selectedCard = useMemo(
    () => filteredCards.find((card) => card.cardId === selectedKey) ?? null,
    [filteredCards, selectedKey],
  );

  const guessCard = useGuessCard();

  const handleSelectionChange = useCallback(
    (id: string | null) => {
      if (id) {
        guessCard.mutate(id);
        setRemovedIds((prev) => new Set(prev).add(id));
      }
      // Clear selection/input
      setSelectedKey(null);
    },
    [guessCard],
  );

  const handleOnInputChange = () => {
    if (selectedKey === null) return;
  };

  return (
    <Autocomplete
      className="max-w-2xl"
      defaultItems={playableCards}
      itemHeight={54}
      label="Search a card"
      labelPlacement={'outside-top'}
      placeholder="Path to Exile"
      startContent={
        selectedCard ? <CustomImage src={selectedCard.imageUris.small} /> : null
      }
      onInputChange={handleOnInputChange}
      onSelectionChange={(key) => handleSelectionChange(key as string | null)}
      size="lg"
      // Clear the visible input by controlling selectedKey
      selectedKey={selectedKey ?? undefined}
    >
      {(item) => (
        <AutocompleteItem
          key={item.cardId}
          startContent={<CustomImage src={item.imageUris.small} />}
        >
          {item.name}
        </AutocompleteItem>
      )}
    </Autocomplete>
  );
};
