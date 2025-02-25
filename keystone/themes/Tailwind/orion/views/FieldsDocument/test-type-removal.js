const fs = require('fs').promises;
const https = require('https');

function removeTypeImports(content) {
  let result = content;
  
  // Remove type-only imports
  result = result.replace(/import\s+type\s*{[^}]*}\s*from\s*['"][^'"]*['"]\s*;?\s*\n?/g, '');
  
  // Handle mixed imports - remove type keywords and type-only imports
  result = result.replace(/import\s*{([^}]*)}\s*from\s*['"][^'"]*['"]\s*;?/g, (match, importList) => {
    // Split the imports by comma and clean up whitespace
    const imports = importList.split(',').map(i => i.trim());
    
    // Filter out type imports and remove 'type' keyword from remaining imports
    const cleanedImports = imports
      .filter(i => !i.startsWith('type '))
      .map(i => i.replace(/^type\s+/, ''))
      .filter(i => i); // Remove empty strings
    
    // If no imports remain, return empty string
    if (cleanedImports.length === 0) return '';
    
    // Reconstruct the import statement
    return `import { ${cleanedImports.join(', ')} } from ${match.split('from')[1]}`;
  });
  
  return result;
}

async function convertTsToJs(tsContent) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'transform.tools',
      path: '/api/typescript-to-javascript',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:134.0) Gecko/20100101 Firefox/134.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'plain/text',
        'Sec-GPC': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Priority': 'u=0',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'Referer': 'https://transform.tools/typescript-to-javascript'
      }
    };

    const req = https.request(options, (res) => {
      console.log('\nResponse status:', res.statusCode);
      console.log('Response headers:', res.headers);
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('\nAPI returned:');
          console.log('----------------------------------------');
          console.log(data);
          console.log('----------------------------------------');
          resolve(data);
        } else {
          console.error('\nAPI Error:', data);
          reject(new Error(`API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(new Error(`Request failed: ${error.message}`));
    });

    // Send exactly the same body format as the browser
    req.write(tsContent);
    req.end();
  });
}

// Test input
const testInput = `import {
  type BaseListTypeInfo,
  type FieldTypeFunc,
  type CommonFieldConfig,
  jsonFieldTypePolyfilledForSQLite,
  type JSONValue,
} from '@keystone-6/core/types'
import { graphql } from '@keystone-6/core'
import { getInitialPropsValue } from './DocumentEditor/component-blocks/initial-values'
import { getOutputGraphQLField } from './structure-graphql-output'
import { type ComponentSchemaForGraphQL } from './DocumentEditor/component-blocks/api'
import {
  getGraphQLInputType,
  getValueForCreate,
  getValueForUpdate,
} from './structure-graphql-input'
import { assertValidComponentSchema } from './DocumentEditor/component-blocks/field-assertions'
import { addRelationshipDataToComponentProps, fetchRelationshipData } from './relationship-data'

export type StructureFieldConfig<ListTypeInfo extends BaseListTypeInfo> =
  CommonFieldConfig<ListTypeInfo> & {
    db?: { map?: string }
    schema: ComponentSchemaForGraphQL
  }

export const structure =
  <ListTypeInfo extends BaseListTypeInfo>({
    schema,
    ...config
  }: StructureFieldConfig<ListTypeInfo>): FieldTypeFunc<ListTypeInfo> =>
  meta => {
    if ((config as any).isIndexed === 'unique') {
      throw Error("isIndexed: 'unique' is not a supported option for field type structure")
    }
    const lists = new Set(Object.keys(meta.lists))
    try {
      assertValidComponentSchema(schema, lists)
    } catch (err) {
      throw new Error(\`\${meta.listKey}.\${meta.fieldKey}: \${(err as any).message}\`)
    }

    const defaultValue = getInitialPropsValue(schema)

    const unreferencedConcreteInterfaceImplementations: graphql.ObjectType<any>[] = []

    const name = meta.listKey + meta.fieldKey[0].toUpperCase() + meta.fieldKey.slice(1)
    return jsonFieldTypePolyfilledForSQLite(
      meta.provider,
      {
        ...config,
        hooks: {
          ...config.hooks,
          async resolveInput (args) {
            let val = args.resolvedData[meta.fieldKey]
            if (args.operation === 'update') {
              let prevVal = args.item[meta.fieldKey]
              if (meta.provider === 'sqlite') {
                prevVal = JSON.parse(prevVal as any)
                val = args.inputData[meta.fieldKey]
              }
              val = await getValueForUpdate(schema, val, prevVal, args.context, [])
              if (meta.provider === 'sqlite') {
                val = JSON.stringify(val)
              }
            }

            return config.hooks?.resolveInput
              ? config.hooks.resolveInput({
                  ...args,
                  resolvedData: { ...args.resolvedData, [meta.fieldKey]: val },
                })
              : val
          },
        },
        input: {
          create: {
            arg: graphql.arg({
              type: getGraphQLInputType(name, schema, 'create', new Map(), meta),
            }),
            async resolve (val, context) {
              return await getValueForCreate(schema, val, context, [])
            },
          },
          update: {
            arg: graphql.arg({
              type: getGraphQLInputType(name, schema, 'update', new Map(), meta),
            }),
          },
        },
        output: graphql.field({
          type: graphql.object<{ value: JSONValue }>()({
            name: \`\${name}Output\`,
            fields: {
              structure: getOutputGraphQLField(
                name,
                schema,
                unreferencedConcreteInterfaceImplementations,
                new Map(),
                meta
              ),
              json: graphql.field({
                type: graphql.JSON,
                args: {
                  hydrateRelationships: graphql.arg({
                    type: graphql.nonNull(graphql.Boolean),
                    defaultValue: false,
                  }),
                },
                resolve ({ value }, args, context) {
                  if (args.hydrateRelationships) {
                    return addRelationshipDataToComponentProps(schema, value, (schema, value) =>
                      fetchRelationshipData(
                        context,
                        schema.listKey,
                        schema.many,
                        schema.selection || '',
                        value
                      )
                    )
                  }
                  return value
                },
              }),
            },
          }),
          resolve (source) {
            return source
          },
        }),
        __ksTelemetryFieldTypeName: '@keystone-6/structure',
        views: '@keystone-6/fields-document/structure-views',
        getAdminMeta: () => ({}),
        unreferencedConcreteInterfaceImplementations,
      },
      {
        default: {
          kind: 'literal',
          value: JSON.stringify(defaultValue),
        },
        map: config.db?.map,
        mode: 'required',
      }
    )
  }`;

// Run the test
console.log('Original content:');
console.log('----------------------------------------');
console.log(testInput);
console.log('----------------------------------------');

console.log('\nAfter type removal:');
console.log('----------------------------------------');
const cleanedCode = removeTypeImports(testInput);
console.log(cleanedCode);
console.log('----------------------------------------');

// Try converting with API
console.log('\nTrying API conversion...');
convertTsToJs(cleanedCode).then(() => {
  console.log('Test completed successfully!');
}).catch(error => {
  console.error('Test failed:', error.message);
}); 