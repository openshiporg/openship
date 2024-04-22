import { FieldContainer } from "@keystone/components/FieldContainer";
import { FieldDescription } from "@keystone/components/FieldDescription";
import { FieldLabel } from "@keystone/components/FieldLabel";
import { CellContainer } from "@keystone/components/CellContainer";
import { CellLink } from "@keystone/components/CellLink";
import { Badge } from "@keystone/primitives/default/ui/badge";

import { PrettyData } from "./prettyData";

export const Field = ({ field, value }) =>
  value === createViewValue ? null : (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      <div className="flex justify-between border shadow-sm py-2 px-2.5 rounded-md bg-muted/40">
        <PrettyData data={value} />
        <Badge color="sky" className="rounded-sm">
          Virtual
        </Badge>
      </div>
    </FieldContainer>
  );

export const Cell = ({ item, field, linkTo }) => {
  let value = item[field.path];
  return linkTo ? (
    <CellLink {...linkTo}>
      <PrettyData data={item[field.path]} />
    </CellLink>
  ) : (
    <CellContainer>
      <PrettyData data={item[field.path]} />
    </CellContainer>
  );
};

Cell.supportsLinkTo = true;

export const CardValue = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <PrettyData data={item[field.path]} />
    </FieldContainer>
  );
};

const createViewValue = Symbol("create view virtual field value");

export const controller = (config) => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: `${config.path}${config.fieldMeta.query}`,
    defaultValue: createViewValue,
    deserialize: (data) => {
      return data[config.path];
    },
    serialize: () => ({}),
  };
};
