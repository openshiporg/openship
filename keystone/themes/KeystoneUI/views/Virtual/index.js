import {
    FieldContainer,
    FieldDescription,
    FieldLabel
  } from "@keystone-ui/fields"
  
  import { PrettyData } from "./prettyData"
  
  export const Field = ({ field, value }) =>
    value === createViewValue ? null : (
      <FieldContainer>
        <FieldLabel>{field.label}</FieldLabel>
        <FieldDescription id={`${field.path}-description`}>
          {field.description}
        </FieldDescription>
        <PrettyData data={value} />
      </FieldContainer>
    )
  
  export const Cell = ({ item, field }) => {
    return <PrettyData data={item[field.path]} />
  }
  
  export const CardValue = ({ item, field }) => {
    return (
      <FieldContainer>
        <FieldLabel>{field.label}</FieldLabel>
        <PrettyData data={item[field.path]} />
      </FieldContainer>
    )
  }
  
  const createViewValue = Symbol("create view virtual field value")
  
  export const controller = config => {
    return {
      path: config.path,
      label: config.label,
      description: config.description,
      graphqlSelection: `${config.path}${config.fieldMeta.query}`,
      defaultValue: createViewValue,
      deserialize: data => {
        return data[config.path]
      },
      serialize: () => ({})
    }
  }
  