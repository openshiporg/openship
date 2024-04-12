import React, { Fragment, useMemo } from "react";
import { Editor } from "slate";

import { KeyboardInTooltip, ToolbarButton } from "./primitives";
import { useToolbarState } from "./toolbar-state";
import { insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading } from "./utils";
import { MinusIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@keystone/primitives/default/ui/tooltip";

const minusIcon = <MinusIcon size="small" />;

export function insertDivider(editor) {
  insertNodesButReplaceIfSelectionIsAtEmptyParagraphOrHeading(editor, {
    type: "divider",
    children: [{ text: "" }],
  });
  Editor.insertNode(editor, { type: "paragraph", children: [{ text: "" }] });
}

const DividerButton = ({ attrs }) => {
  const {
    editor,
    dividers: { isDisabled },
  } = useToolbarState();
  return useMemo(
    () => (
      <ToolbarButton
        isDisabled={isDisabled}
        onMouseDown={(event) => {
          event.preventDefault();
          insertDivider(editor);
        }}
        {...attrs}
      >
        {minusIcon}
      </ToolbarButton>
    ),
    [editor, isDisabled, attrs]
  );
};

export const dividerButton = (
  <Tooltip>
    <TooltipTrigger asChild>
      <MinusIcon />
    </TooltipTrigger>
    <TooltipContent>
      <Fragment>
        Divider<KeyboardInTooltip>---</KeyboardInTooltip>
      </Fragment>
    </TooltipContent>
  </Tooltip>
);

export function withDivider(editor) {
  const { isVoid } = editor;
  editor.isVoid = (node) => {
    return node.type === "divider" || isVoid(node);
  };
  return editor;
}
