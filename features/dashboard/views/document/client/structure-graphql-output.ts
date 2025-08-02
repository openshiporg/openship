import { graphql } from '@keystone-6/core'
import type {
  BaseItem,
  FieldData,
  KeystoneContext,
  MaybePromise,
} from '@keystone-6/core/types'
import type { GraphQLField, GraphQLOutputType, GraphQLInputType, GraphQLArgument, GraphQLResolveInfo } from 'graphql'

import type { ComponentSchema } from './DocumentEditor/component-blocks/api'
import { getInitialPropsValue } from './DocumentEditor/component-blocks/initial-values'
import { type ReadonlyPropPath, assertNever } from './DocumentEditor/component-blocks/utils'

type OutputFieldType = GraphQLField<Record<string, unknown>, KeystoneContext, any>

export function getOutputGraphQLField(
  name: string,
  schema: ComponentSchema,
  cache: Map<ComponentSchema, GraphQLOutputType>,
  meta: FieldData
): OutputFieldType {
  if (!cache.has(schema)) {
    const type = getOutputGraphQLTypeInner(name, schema, cache, meta)
    cache.set(schema, type)
  }
  return graphql.field({
    type: cache.get(schema)! as any,
    resolve(source: any) {
      return source
    },
  }) as any
}

function getOutputGraphQLTypeInner(
  name: string,
  schema: ComponentSchema,
  cache: Map<ComponentSchema, GraphQLOutputType>,
  meta: FieldData
): GraphQLOutputType {
  if (schema.kind === 'form') {
    if (!schema.graphql) {
      throw new Error(`Field at ${name} is missing a graphql field`)
    }
    return schema.graphql.output as any
  }
  if (schema.kind === 'object') {
    const output = graphql.object<Record<string, unknown>>()({
      name: `${name}Output`,
      fields: (() =>
        Object.fromEntries(
          Object.entries(schema.fields).map(([key, val]): [string, OutputFieldType] => {
            const type = getOutputGraphQLTypeInner(
              `${name}${key[0].toUpperCase()}${key.slice(1)}`,
              val,
              cache,
              meta
            )
            return [
              key,
              graphql.field({
                type: type as any,
                resolve(rootVal: Record<string, unknown>) {
                  return rootVal[key]
                },
              }) as any,
            ]
          })
        )) as any,
    })
    return output as any
  }
  if (schema.kind === 'array') {
    const innerType = getOutputGraphQLTypeInner(name, schema.element, cache, meta)
    return graphql.list(innerType as any) as any
  }
  if (schema.kind === 'conditional') {
    const output = graphql.object<{ discriminant: string | boolean; value: unknown }>()({
      name: `${name}Output`,
      fields: () => ({
        discriminant: graphql.field({
          type: schema.discriminant.graphql?.output ?? graphql.String,
          resolve(rootVal) {
            return rootVal.discriminant
          },
        }),
        value: graphql.field({
          type: getOutputGraphQLTypeInner(name, schema.values[Object.keys(schema.values)[0]], cache, meta) as any,
          resolve(rootVal: any) {
            return rootVal.value
          },
        }) as any,
      }),
    })
    return output as any
  }
  if (schema.kind === 'relationship') {
    return meta.lists[schema.listKey].types.output as any
  }
  if (schema.kind === 'child') {
    throw new Error(`Child fields are not supported in the structure field, found one at ${name}`)
  }

  assertNever(schema)
}

export async function traverseResolvedComponentBlocks(
  schema: ComponentSchema,
  value: any,
  context: KeystoneContext,
  path: ReadonlyPropPath,
  info: GraphQLResolveInfo
): Promise<MaybePromise<any>> {
  if (schema.kind === 'form') {
    return value
  }
  if (value === null) {
    throw new Error(
      `${schema.kind[0].toUpperCase() + schema.kind.slice(1)} fields cannot be set to null but the field at '${path.join('.')}' is null`
    )
  }
  if (schema.kind === 'object') {
    return Object.fromEntries(
      await Promise.all(
        Object.entries(schema.fields).map(async ([key, val]) => {
          return [
            key,
            await traverseResolvedComponentBlocks(val, value[key], context, path.concat(key), info),
          ]
        })
      )
    )
  }
  if (schema.kind === 'array') {
    return Promise.all(
      (value as any[]).map((val, i) =>
        traverseResolvedComponentBlocks(schema.element, val, context, path.concat(i), info)
      )
    )
  }
  if (schema.kind === 'relationship') {
    if (schema.many) {
      return Promise.all(
        (value as { id: string }[]).map(({ id }) =>
          context.query[schema.listKey].findOne({
            where: { id },
            query: `id
              ${info.fieldNodes[0]?.selectionSet?.selections.map(s => (s as any).name.value).join('\n') || ''}`,
          })
        )
      )
    } else {
      if (value === null) return null
      return context.query[schema.listKey].findOne({
        where: { id: value.id },
        query: `id
          ${info.fieldNodes[0]?.selectionSet?.selections.map(s => (s as any).name.value).join('\n') || ''}`,
      })
    }
  }
  if (schema.kind === 'conditional') {
    return {
      discriminant: value.discriminant,
      value: await traverseResolvedComponentBlocks(
        (schema.values as any)[value.discriminant],
        value.value,
        context,
        path.concat('value'),
        info
      ),
    }
  }
  if (schema.kind === 'child') {
    throw new Error(
      `Child fields are not supported in the structure field, found one at ${path.join('.')}`
    )
  }

  assertNever(schema)
}
