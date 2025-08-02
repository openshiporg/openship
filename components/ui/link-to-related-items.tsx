import { Button } from "./button";

interface LinkToRelatedItemsProps {
  itemId: string | null;
  refFieldKey?: string;
  list: {
    path?: string;
    singular?: string;
    plural?: string;
  };
  value: {
    kind: string;
    value: unknown; // Changed any to unknown
  };
}

export function LinkToRelatedItems({ itemId, refFieldKey, list, value }: LinkToRelatedItemsProps) {
  // Define type for the items in a 'many' relationship value
  type RelationshipItem = { id: string };

  function constructQuery({ refFieldKey, itemId, value }: { refFieldKey?: string; itemId: string | null; value: unknown }) { // Changed any to unknown
    if (refFieldKey && itemId) {
      return `!${refFieldKey}_matches="${itemId}"`;
    }
    // Assert value is an array of RelationshipItem for 'many' case
    const items = value as RelationshipItem[] | undefined;
    return `!id_in="${(items ?? [])
      .slice(0, 100)
      .map((item) => item.id)
      .join(",")}"`;
  }

  if (value.kind === "many") {
    const query = constructQuery({ refFieldKey, value, itemId });
    return (
      <Button variant="ghost">
        <a href={`/${list.path}?${query}`}>
          View related {list.plural}
        </a>
      </Button>
    );
  }

  return (
    <Button variant="ghost">
      {/* Assert value is an object with id for single case */}
      {/* Access value.value and then cast */}
      <a href={`/${list.path}/${(value.value as RelationshipItem | undefined)?.id}`}>
        View {list.singular} details
      </a>
    </Button>
  );
} 