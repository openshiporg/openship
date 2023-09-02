import pluralize from "pluralize";
import { labelToPath } from "./labelToPath";
import { labelToClass } from "./labelToClass";
import { humanize } from "./humanize";

export function getNamesFromList(listKey, { graphql, ui, isSingleton }) {
  if (ui?.path !== undefined && !/^[a-z-_][a-z0-9-_]*$/.test(ui.path)) {
    throw new Error(
      `ui.path for ${listKey} is ${ui.path} but it must only contain lowercase letters, numbers, dashes, and underscores and not start with a number`
    );
  }

  const computedSingular = humanize(listKey);
  const computedPlural = pluralize.plural(computedSingular);
  const computedLabel = isSingleton ? computedSingular : computedPlural;
  const path = ui?.path || labelToPath(computedLabel);

  const pluralGraphQLName = graphql?.plural || labelToClass(computedPlural);
  if (pluralGraphQLName === listKey) {
    throw new Error(
      `The list key and the plural name used in GraphQL must be different but the list key ${listKey} is the same as the plural GraphQL name, please specify graphql.plural`
    );
  }

  return {
    pluralGraphQLName,
    adminUILabels: {
      label: ui?.label || computedLabel,
      singular: ui?.singular || computedSingular,
      plural: ui?.plural || computedPlural,
      path,
    },
  };
}
