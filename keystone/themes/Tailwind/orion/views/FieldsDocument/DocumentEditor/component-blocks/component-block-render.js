import React, { useContext } from "react";
import { useMemo } from "react";
import { createGetPreviewProps, getKeysForArrayValue } from "./preview-props";

export const ChildrenByPathContext = React.createContext({});

export function ChildFieldEditable({ path }) {
  const childrenByPath = useContext(ChildrenByPathContext);
  const child = childrenByPath[JSON.stringify(path)];
  if (child === undefined) {
    return null;
  }
  return child;
}

export function ComponentBlockRender({
  componentBlock,
  element,
  onChange,
  children,
}) {
  const getPreviewProps = useMemo(() => {
    return createGetPreviewProps(
      { kind: "object", fields: componentBlock.schema },
      onChange,
      (path) => <ChildFieldEditable path={path} />
    );
  }, [onChange, componentBlock]);

  const previewProps = getPreviewProps(element.props);

  const childrenByPath = {};
  let maybeChild;
  children.forEach((child) => {
    const propPath = child.props.children.props.element.propPath;
    if (propPath === undefined) {
      maybeChild = child;
    } else {
      childrenByPath[
        JSON.stringify(propPathWithIndiciesToKeys(propPath, element.props))
      ] = child;
    }
  });

  const ComponentBlockPreview = componentBlock.preview;

  return (
    <ChildrenByPathContext.Provider value={childrenByPath}>
      {useMemo(
        () => (
          <ComponentBlockPreview {...previewProps} />
        ),
        [previewProps, ComponentBlockPreview]
      )}
      <span>{maybeChild}</span>
    </ChildrenByPathContext.Provider>
  );
}

// note this is written to avoid crashing when the given prop path doesn't exist in the value
// this is because editor updates happen asynchronously but we have some logic to ensure
// that updating the props of a component block synchronously updates it
// (this is primarily to not mess up things like cursors in inputs)
// this means that sometimes the child elements will be inconsistent with the values
// so to deal with this, we return a prop path this is "wrong" but won't break anything
function propPathWithIndiciesToKeys(propPath, val) {
  return propPath.map((key) => {
    if (typeof key === "string") {
      val = val?.[key];
      return key;
    }
    if (!Array.isArray(val)) {
      val = undefined;
      return "";
    }
    const keys = getKeysForArrayValue(val);
    val = val?.[key];
    return keys[key];
  });
}
