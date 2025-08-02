import { useMemo } from 'react';

export type Value = Record<
  string,
  | { kind: 'error'; errors: readonly any[] }
  | { kind: 'value'; value: unknown }
>;

export function useChangedFieldsAndDataForUpdate(
  initialValue: Value,
  value: Value,
  fields: Record<string, any>
) {
  return useMemo(() => {
    const dataForUpdate: Record<string, unknown> = {};
    
    Object.keys(value).forEach(fieldKey => {
      const currentValue = value[fieldKey];
      const initialFieldValue = initialValue[fieldKey];
      
      // Only include changed fields
      if (currentValue.kind === 'value' && 
          (!initialFieldValue || 
           initialFieldValue.kind !== 'value' || 
           currentValue.value !== initialFieldValue.value)) {
        
        const field = fields[fieldKey];
        if (field?.controller?.serialize) {
          try {
            const serialized = field.controller.serialize(currentValue.value);
            Object.assign(dataForUpdate, serialized);
          } catch (error) {
            console.error(`Error serializing field ${fieldKey}:`, error);
          }
        }
      }
    });
    
    return { dataForUpdate };
  }, [initialValue, value, fields]);
}