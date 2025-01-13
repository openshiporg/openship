import { FieldContainer } from "../../components/FieldContainer";
import { FieldDescription } from "../../components/FieldDescription";
import { FieldLabel } from "../../components/FieldLabel";
import { CellContainer } from "../../components/CellContainer";
import { CellLink } from "../../components/CellLink";
import { Badge } from "../../primitives/default/ui/badge";

import { PrettyData } from "./prettyData";

export const Field = ({ field, value }) =>
  value === createViewValue ? null : (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
      <FieldDescription id={`${field.path}-description`}>
        {field.description}
      </FieldDescription>
      <div className="opacity-90 flex gap-4 justify-between border shadow-sm py-2 px-2.5 rounded-md bg-muted/40">
        <div className="break-all">
          <PrettyData data={value} />
        </div>
        <div className="ml-auto">
          <Badge color="sky" className="rounded-sm tracking-wide text-xs">
            READ ONLY
          </Badge>
        </div>
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
