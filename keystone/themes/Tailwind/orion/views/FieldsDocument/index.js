import { GraphQLError } from  'graphql'
import { jsonFieldTypePolyfilledForSQLite } from  '@keystone-6/core/types'
import { graphql } from  '@keystone-6/core'
import { validateAndNormalizeDocument } from  './validation'
import { addRelationshipData } from  './relationship-data'
import { assertValidComponentSchema } from  './DocumentEditor/component-blocks/field-assertions'

export function document(
  {
    componentBlocks = {},
    dividers,
    formatting,
    layouts,
    relationships: configRelationships,
    links,
    ...config
  } = {}
) {
  return meta => {
    const documentFeatures = normaliseDocumentFeatures({
      dividers,
      formatting,
      layouts,
      links,
    })
    const relationships = normaliseRelationships(configRelationships, meta)
    const inputResolver = data => {
      if (data === null) throw new GraphQLError('Input error: Document fields cannot be set to null')
      if (data === undefined) return data

      return validateAndNormalizeDocument(data, documentFeatures, componentBlocks, relationships);
    }

    if ((config).isIndexed === 'unique') {
      throw Error("isIndexed: 'unique' is not a supported option for field type document")
    }

    const lists = new Set(Object.keys(meta.lists))
    for (const [name, block] of Object.entries(componentBlocks)) {
      try {
        assertValidComponentSchema({ kind: 'object', fields: block.schema }, lists)
      } catch (err) {
        throw new Error(
          `Component block ${name} in ${meta.listKey}.${meta.fieldKey}: ${(err).message}`
        )
      }
    }

    return jsonFieldTypePolyfilledForSQLite(meta.provider, {
      ...config,
      __ksTelemetryFieldTypeName: '@keystone-6/document',
      input: {
        create: {
          arg: graphql.arg({ type: graphql.JSON }),
          resolve (val) {
            if (val === undefined) {
              val = [{ type: 'paragraph', children: [{ text: '' }] }]
            }
            return inputResolver(val);
          },
        },
        update: { arg: graphql.arg({ type: graphql.JSON }), resolve: inputResolver },
      },
      output: graphql.field({
        type: graphql.object()({
          name: `${meta.listKey}_${meta.fieldKey}_Document`,
          fields: {
            document: graphql.field({
              args: {
                hydrateRelationships: graphql.arg({
                  type: graphql.nonNull(graphql.Boolean),
                  defaultValue: false,
                }),
              },
              type: graphql.nonNull(graphql.JSON),
              resolve ({ document }, { hydrateRelationships }, context) {
                return hydrateRelationships
                  ? addRelationshipData(document, context, relationships, componentBlocks)
                  : (document);
              },
            }),
          },
        }),
        resolve ({ value }) {
          if (value === null) {
            return null
          }
          return { document: value }
        },
      }),
      views: '@keystone-6/fields-document/views',
      getAdminMeta() {
        return {
          relationships,
          documentFeatures,
          componentBlocksPassedOnServer: Object.keys(componentBlocks),
        };
      },
    }, {
      mode: 'required',
      default: {
        kind: 'literal',
        value: JSON.stringify([{ type: 'paragraph', children: [{ text: '' }] }]),
      },
      map: config.db?.map,
      extendPrismaSchema: config.db?.extendPrismaSchema,
    });
  };
}

function normaliseRelationships (
  configRelationships,
  meta
) {
  const relationships = {}
  if (configRelationships) {
    Object.keys(configRelationships).forEach(key => {
      const relationship = configRelationships[key]
      if (meta.lists[relationship.listKey] === undefined) {
        throw new Error(
          `An inline relationship ${relationship.label} (${key}) in the field at ${meta.listKey}.${meta.fieldKey} has listKey set to "${relationship.listKey}" but no list named "${relationship.listKey}" exists.`
        )
      }
      relationships[key] = { ...relationship, selection: relationship.selection ?? null }
    })
  }
  return relationships
}

function normaliseDocumentFeatures (
  config
) {
  const formatting =
    config.formatting === true
      ? {
          alignment: true,
          blockTypes: true,
          headingLevels: true,
          inlineMarks: true,
          listTypes: true,
          softBreaks: true,
        }
      : config.formatting ?? {}
  const documentFeatures = {
    formatting: {
      alignment:
        formatting.alignment === true
          ? {
              center: true,
              end: true,
            }
          : {
              center: !!formatting.alignment?.center,
              end: !!formatting.alignment?.end,
            },
      blockTypes:
        formatting?.blockTypes === true
          ? { blockquote: true, code: true }
          : {
              blockquote: !!formatting.blockTypes?.blockquote,
              code: !!formatting.blockTypes?.code,
            },
      headingLevels:
        formatting?.headingLevels === true
          ? [1, 2, 3, 4, 5, 6]
          : [...new Set(formatting?.headingLevels)].sort(),
      inlineMarks:
        formatting.inlineMarks === true
          ? {
              bold: true,
              code: true,
              italic: true,
              keyboard: true,
              strikethrough: true,
              subscript: true,
              superscript: true,
              underline: true,
            }
          : {
              bold: !!formatting.inlineMarks?.bold,
              code: !!formatting.inlineMarks?.code,
              italic: !!formatting.inlineMarks?.italic,
              strikethrough: !!formatting.inlineMarks?.strikethrough,
              underline: !!formatting.inlineMarks?.underline,
              keyboard: !!formatting.inlineMarks?.keyboard,
              subscript: !!formatting.inlineMarks?.subscript,
              superscript: !!formatting.inlineMarks?.superscript,
            },
      listTypes:
        formatting.listTypes === true
          ? { ordered: true, unordered: true }
          : {
              ordered: !!formatting.listTypes?.ordered,
              unordered: !!formatting.listTypes?.unordered,
            },
      softBreaks: !!formatting.softBreaks,
    },
    links: !!config.links,
    layouts: [...new Set((config.layouts || []).map(x => JSON.stringify(x)))].map(x =>
      JSON.parse(x)),
    dividers: !!config.dividers,
  }
  return documentFeatures
}

export { structure } from './structure'
