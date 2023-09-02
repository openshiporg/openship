import { updateValue } from "./initial-values";

const arrayValuesToElementKeys = new WeakMap();

let counter = 0;

export function getKeysForArrayValue(value) {
  if (!arrayValuesToElementKeys.has(value)) {
    arrayValuesToElementKeys.set(
      value,
      Array.from({ length: value.length }, getNewArrayElementKey)
    );
  }
  return arrayValuesToElementKeys.get(value);
}

export function setKeysForArrayValue(value, elementIds) {
  arrayValuesToElementKeys.set(value, elementIds);
}

export function getNewArrayElementKey() {
  return (counter++).toString();
}

function castToMemoizedInfoForSchema(val) {
  return val;
}

function getOrInsert(map, key, val) {
  if (!map.has(key)) {
    map.set(key, val(key));
  }
  return map.get(key);
}

export function createGetPreviewProps(
  rootSchema,
  rootOnChange,
  getChildFieldElement
) {
  const memoizedInfoForSchema = castToMemoizedInfoForSchema({
    form(schema, onChange) {
      return (newVal) => onChange(() => newVal);
    },
    array(schema, onChange) {
      return {
        rawOnChange: onChange,
        inner: new Map(),
        onChange(updater) {
          onChange((value) => updateValue(schema, value, updater));
        },
      };
    },
    child() {},
    conditional(schema, onChange) {
      return {
        onChange: (discriminant, value) =>
          onChange((val) => updateValue(schema, val, { discriminant, value })),
        onChangeForValue: (cb) =>
          onChange((val) => ({
            discriminant: val.discriminant,
            value: cb(val.value),
          })),
      };
    },
    object(schema, onChange) {
      return {
        onChange: (updater) => {
          onChange((value) => updateValue(schema, value, updater));
        },
        innerOnChanges: Object.fromEntries(
          Object.keys(schema.fields).map((key) => {
            return [
              key,
              (newVal) => {
                onChange((val) => ({ ...val, [key]: newVal(val[key]) }));
              },
            ];
          })
        ),
      };
    },
    relationship(schema, onChange) {
      return (newVal) => onChange(() => newVal);
    },
  });

  const previewPropsFactories = {
    form(schema, value, onChange) {
      return {
        value: value,
        onChange,
        options: schema.options,
        schema: schema,
      };
    },
    child(schema, value, onChange, path) {
      return { element: getChildFieldElement(path), schema: schema };
    },
    object(schema, value, memoized, path, getInnerProp) {
      const fields = {};

      for (const key of Object.keys(schema.fields)) {
        fields[key] = getInnerProp(
          schema.fields[key],
          value[key],
          memoized.innerOnChanges[key],
          key
        );
      }

      const previewProps = {
        fields,
        onChange: memoized.onChange,
        schema: schema,
      };
      return previewProps;
    },
    array(schema, value, memoized, path, getInnerProp) {
      const arrayValue = value;
      const keys = getKeysForArrayValue(arrayValue);

      const unusedKeys = new Set(getKeysForArrayValue(value));

      const props = {
        elements: arrayValue.map((val, i) => {
          const key = keys[i];
          unusedKeys.delete(key);
          const element = getOrInsert(memoized.inner, key, () => {
            const onChange = (val) => {
              memoized.rawOnChange((prev) => {
                const keys = getKeysForArrayValue(prev);
                const index = keys.indexOf(key);
                const newValue = [...prev];
                newValue[index] = val(newValue[index]);
                setKeysForArrayValue(newValue, keys);
                return newValue;
              });
            };
            const element = getInnerProp(schema.element, val, onChange, key);
            return {
              element,
              elementWithKey: {
                ...element,
                key,
              },
              onChange,
            };
          });
          const currentInnerProp = getInnerProp(
            schema.element,
            val,
            element.onChange,
            key
          );
          if (element.element !== currentInnerProp) {
            element.element = currentInnerProp;
            element.elementWithKey = {
              ...currentInnerProp,
              key,
            };
          }
          return element.elementWithKey;
        }),
        schema: schema,
        onChange: memoized.onChange,
      };
      for (const key of unusedKeys) {
        memoized.inner.delete(key);
      }
      return props;
    },
    relationship(schema, value, onChange) {
      const props = {
        value: value,
        onChange,
        schema: schema,
      };
      return props;
    },
    conditional(schema, value, memoized, path, getInnerProp) {
      const props = {
        discriminant: value.discriminant,
        onChange: memoized.onChange,
        options: schema.discriminant.options,
        value: getInnerProp(
          schema.values[value.discriminant.toString()],
          value.value,
          memoized.onChangeForValue,
          "value"
        ),
        schema: schema,
      };
      return props;
    },
  };

  function getPreviewPropsForProp(
    schema,
    value,
    memoedThing,
    path,
    getInnerProp
  ) {
    return previewPropsFactories[schema.kind](
      schema,
      value,
      memoedThing,
      path,
      getInnerProp
    );
  }

  function getInitialMemoState(schema, value, onChange, path) {
    const innerState = new Map();
    const memoizedInfo = memoizedInfoForSchema[schema.kind](schema, onChange);
    const state = {
      value,
      inner: innerState,
      props: getPreviewPropsForProp(
        schema,
        value,
        memoizedInfo,
        path,
        (schema, value, onChange, key) => {
          const state = getInitialMemoState(
            schema,
            value,
            onChange,
            path.concat(key)
          );
          innerState.set(key, state);
          return state.props;
        }
      ),
      schema: schema,
      cached: memoizedInfo,
    };
    return state;
  }
  function getUpToDateProps(schema, value, onChange, memoState, path) {
    if (memoState.schema !== schema) {
      Object.assign(
        memoState,
        getInitialMemoState(schema, value, onChange, path)
      );
      return memoState.props;
    }
    if (memoState.value === value) {
      return memoState.props;
    }
    memoState.value = value;
    const unusedKeys = new Set(memoState.inner.keys());
    memoState.props = getPreviewPropsForProp(
      schema,
      value,
      memoState.cached,
      path,
      (schema, value, onChange, innerMemoStateKey) => {
        unusedKeys.delete(innerMemoStateKey);
        if (!memoState.inner.has(innerMemoStateKey)) {
          const innerState = getInitialMemoState(
            schema,
            value,
            onChange,
            path.concat(innerMemoStateKey)
          );
          memoState.inner.set(innerMemoStateKey, innerState);
          return innerState.props;
        }
        return getUpToDateProps(
          schema,
          value,
          onChange,
          memoState.inner.get(innerMemoStateKey),
          path.concat(innerMemoStateKey)
        );
      }
    );
    for (const key of unusedKeys) {
      memoState.inner.delete(key);
    }
    return memoState.props;
  }

  let memoState;

  return (value) => {
    if (memoState === undefined) {
      memoState = getInitialMemoState(rootSchema, value, rootOnChange, []);
      return memoState.props;
    }
    return getUpToDateProps(rootSchema, value, rootOnChange, memoState, []);
  };
}
