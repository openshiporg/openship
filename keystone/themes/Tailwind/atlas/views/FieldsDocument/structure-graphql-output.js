import { graphql } from "@keystone-6/core";
import { assertNever } from "./DocumentEditor/component-blocks/utils";

function wrapGraphQLFieldInResolver(inputField, getVal) {
  return graphql.field({
    type: inputField.type,
    args: inputField.args,
    deprecationReason: inputField.deprecationReason,
    description: inputField.description,
    extensions: inputField.extensions,
    resolve(value, args, context, info) {
      const val = getVal(value);
      if (!inputField.resolve) {
        return val;
      }
      return inputField.resolve({ value: val }, args, context, info);
    },
  });
}

export function getOutputGraphQLField(
  name,
  schema,
  interfaceImplementations,
  cache,
  meta
) {
  if (!cache.has(schema)) {
    const res = getOutputGraphQLFieldInner(
      name,
      schema,
      interfaceImplementations,
      cache,
      meta
    );
    cache.set(schema, res);
  }
  return cache.get(schema);
}

function getOutputGraphQLFieldInner(
  name,
  schema,
  interfaceImplementations,
  cache,
  meta
) {
  if (schema.kind === "form") {
    return wrapGraphQLFieldInResolver(schema.graphql.output, (x) => x.value);
  }
  if (schema.kind === "object") {
    return graphql.field({
      type: graphql.object()({
        name,
        fields: () =>
          Object.fromEntries(
            Object.entries(schema.fields).map(([key, val]) => {
              const field = getOutputGraphQLField(
                `${name}${key[0].toUpperCase()}${key.slice(1)}`,
                val,
                interfaceImplementations,
                cache,
                meta
              );
              return [
                key,
                wrapGraphQLFieldInResolver(field, (source) => source[key]),
              ];
            })
          ),
      }),
      resolve({ value }) {
        return value;
      },
    });
  }
  if (schema.kind === "array") {
    const innerField = getOutputGraphQLField(
      name,
      schema.element,
      interfaceImplementations,
      cache,
      meta
    );
    const resolve = innerField.resolve;

    return graphql.field({
      type: graphql.list(innerField.type),
      args: innerField.args,
      deprecationReason: innerField.deprecationReason,
      description: innerField.description,
      extensions: innerField.extensions,
      resolve({ value }, args, context, info) {
        if (!resolve) {
          return value;
        }
        return value.map((val) => resolve({ value: val }, args, context, info));
      },
    });
  }
  if (schema.kind === "conditional") {
    let discriminantField;

    const getDiscriminantField = () => {
      if (!discriminantField) {
        discriminantField = getOutputGraphQLField(
          name + "Discriminant",
          schema.discriminant,
          interfaceImplementations,
          cache,
          meta
        );
      }
      return discriminantField;
    };

    const interfaceType = graphql.interface()({
      name,
      resolveType: (value) => {
        const stringifiedDiscriminant = value.discriminant.toString();
        return (
          name +
          stringifiedDiscriminant[0].toUpperCase() +
          stringifiedDiscriminant.slice(1)
        );
      },
      fields: () => ({
        discriminant: getDiscriminantField(),
      }),
    });

    interfaceImplementations.push(
      ...Object.entries(schema.values).map(([key, val]) => {
        const innerName = name + key[0].toUpperCase() + key.slice(1);
        return graphql.object()({
          name: innerName,
          interfaces: [interfaceType],
          fields: () => ({
            discriminant: wrapGraphQLFieldInResolver(
              getDiscriminantField(),
              (x) => x.discriminant
            ),
            value: getOutputGraphQLField(
              `${innerName}Value`,
              val,
              interfaceImplementations,
              cache,
              meta
            ),
          }),
        });
      })
    );

    return graphql.field({
      type: interfaceType,
      resolve({ value }) {
        return value;
      },
    });
  }

  if (schema.kind === "relationship") {
    const listOutputType = meta.lists[schema.listKey].types.output;
    return graphql.field({
      type: schema.many ? graphql.list(listOutputType) : listOutputType,
      resolve({ value }, args, context) {
        if (Array.isArray(value)) {
          return context.db[schema.listKey].findMany({
            where: {
              id: { in: value.map((x) => x.id) },
            },
          });
        }
        if (value?.id == null) {
          return null;
        }
        return context.db[schema.listKey].findOne({
          where: {
            id: value.id,
          },
        });
      },
    });
  }

  assertNever(schema);
}
