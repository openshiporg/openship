import { applyRefs } from "apply-ref";
import { useState, useMemo } from "react";
import { Transforms } from "slate";
import { ToolbarButton, ToolbarGroup } from "./primitives";
import { useToolbarState } from "./toolbar-state";
import {
  ChevronDownIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignCenterIcon,
} from "lucide-react";
import { Popover } from "@keystone/primitives/default/ui/popover";
import { Tooltip } from "@keystone/primitives/default/ui/tooltip";

export const TextAlignMenu = ({ alignment }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      <Popover
        open={showMenu}
        onOpenChange={setShowMenu}
        content={
          <TextAlignDialog
            alignment={alignment}
            onClose={() => setShowMenu(false)}
          />
        }
        trigger={
          <Tooltip content="Text alignment">
            <TextAlignButton
              onToggle={() => setShowMenu((x) => !x)}
              showMenu={showMenu}
            />
          </Tooltip>
        }
        placement="bottom-start"
      />
    </div>
  );
};

function TextAlignDialog({ alignment, onClose }) {
  const {
    alignment: { selected },
    editor,
  } = useToolbarState();
  const alignments = [
    "start",
    ...Object.keys(alignment).filter((key) => alignment[key]),
  ];

  return (
    <ToolbarGroup>
      {alignments.map((alignment) => (
        <Tooltip content={`Align ${alignment}`}>
          <ToolbarButton
            isSelected={selected === alignment}
            onMouseDown={(event) => {
              event.preventDefault();
              handleAlignmentChange(alignment, editor);
              onClose();
            }}
          >
            {alignmentIcons[alignment]}
          </ToolbarButton>
        </Tooltip>
      ))}
    </ToolbarGroup>
  );
}

const handleAlignmentChange = (alignment, editor) => {
  if (alignment === "start") {
    Transforms.unsetNodes(editor, "textAlign", {
      match: (node) => node.type === "paragraph" || node.type === "heading",
    });
  } else {
    Transforms.setNodes(
      editor,
      { textAlign: alignment },
      { match: (node) => node.type === "paragraph" || node.type === "heading" }
    );
  }
};

const alignmentIcons = {
  start: <AlignLeftIcon size="small" />,
  center: <AlignCenterIcon size="small" />,
  end: <AlignRightIcon size="small" />,
};

function TextAlignButton({ onToggle, showMenu }) {
  const {
    alignment: { isDisabled, selected },
  } = useToolbarState();

  return useMemo(
    () => (
      <ToolbarButton
        isDisabled={isDisabled}
        isPressed={showMenu}
        onMouseDown={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        {alignmentIcons[selected]}
        <ChevronDownIcon size="small" />
      </ToolbarButton>
    ),
    [isDisabled, selected, onToggle, showMenu]
  );
}