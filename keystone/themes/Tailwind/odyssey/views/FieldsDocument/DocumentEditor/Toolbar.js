import { Fragment, forwardRef, useState, useMemo, useContext } from "react";
import { Editor, Transforms } from "slate";
import { applyRefs } from "apply-ref";

import {
  InlineDialog,
  KeyboardInTooltip,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "./primitives";
import { linkButton } from "./link";
import {
  BlockComponentsButtons,
  ComponentBlockContext,
} from "./component-blocks";
import { clearFormatting, modifierKeyText } from "./utils";
import { LayoutsButton } from "./layouts";
import { ListButton } from "./lists";
import { blockquoteButton } from "./blockquote";
import {
  DocumentFieldRelationshipsContext,
  RelationshipButton,
} from "./relationship";
import { codeButton } from "./code-block";
import { TextAlignMenu } from "./alignment";
import { dividerButton } from "./divider";
import { useToolbarState } from "./toolbar-state";
import {
  BoldIcon,
  ChevronDownIcon,
  ItalicIcon,
  Maximize2Icon,
  Minimize2Icon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/primitives/default/ui/tooltip";

export function Toolbar({ documentFeatures, viewState }) {
  const relationship = useContext(DocumentFieldRelationshipsContext);
  const blockComponent = useContext(ComponentBlockContext);
  const hasBlockItems =
    Object.entries(relationship).length || Object.keys(blockComponent).length;
  const hasMarks = Object.values(documentFeatures.formatting.inlineMarks).some(
    (x) => x
  );
  return (
    <ToolbarContainer>
      <TooltipProvider>
        <ToolbarGroup>
          {!!documentFeatures.formatting.headingLevels.length && (
            <HeadingMenu
              headingLevels={documentFeatures.formatting.headingLevels}
            />
          )}
          {hasMarks && (
            <InlineMarks marks={documentFeatures.formatting.inlineMarks} />
          )}
          {hasMarks && <ToolbarSeparator />}
          {(documentFeatures.formatting.alignment.center ||
            documentFeatures.formatting.alignment.end) && (
            <TextAlignMenu alignment={documentFeatures.formatting.alignment} />
          )}
          {documentFeatures.formatting.listTypes.unordered && (
            <Tooltip>
              <TooltipTrigger>
                <ListButton type="unordered-list">
                  <BulletListIcon />
                </ListButton>
              </TooltipTrigger>
              <TooltipContent>
                <Fragment>
                  Bullet List <KeyboardInTooltip>- </KeyboardInTooltip>
                </Fragment>
              </TooltipContent>
            </Tooltip>
          )}
          {documentFeatures.formatting.listTypes.ordered && (
            <Tooltip>
              <TooltipTrigger>
                <ListButton type="ordered-list">
                  <NumberedListIcon />
                </ListButton>
              </TooltipTrigger>
              <TooltipContent>
                <Fragment>
                  Numbered List <KeyboardInTooltip>1. </KeyboardInTooltip>
                </Fragment>
              </TooltipContent>
            </Tooltip>
          )}
          {(documentFeatures.formatting.alignment.center ||
            documentFeatures.formatting.alignment.end ||
            documentFeatures.formatting.listTypes.unordered ||
            documentFeatures.formatting.listTypes.ordered) && (
            <ToolbarSeparator />
          )}

          {documentFeatures.dividers && dividerButton}
          {documentFeatures.links && linkButton}
          {documentFeatures.formatting.blockTypes.blockquote &&
            blockquoteButton}
          {!!documentFeatures.layouts.length && (
            <LayoutsButton layouts={documentFeatures.layouts} />
          )}
          {documentFeatures.formatting.blockTypes.code && codeButton}
          {!!hasBlockItems && <InsertBlockMenu />}
        </ToolbarGroup>
        {useMemo(() => {
          const ExpandIcon = viewState?.expanded
            ? Minimize2Icon
            : Maximize2Icon;
          return (
            viewState && (
              <ToolbarGroup>
                <ToolbarSeparator />
                <Tooltip>
                  <TooltipTrigger>
                    <ToolbarButton
                      onMouseDown={(event) => {
                        event.preventDefault();
                        viewState.toggle();
                      }}
                    >
                      <ExpandIcon size="small" />
                    </ToolbarButton>
                  </TooltipTrigger>
                  <TooltipContent>
                    {viewState.expanded ? "Collapse" : "Expand"}
                  </TooltipContent>
                </Tooltip>
              </ToolbarGroup>
            )
          );
        }, [viewState])}
      </TooltipProvider>
    </ToolbarContainer>
  );
}

/* UI Components */

const MarkButton = forwardRef(function MarkButton(props, ref) {
  const {
    editor,
    marks: {
      [props.type]: { isDisabled, isSelected },
    },
  } = useToolbarState();
  return useMemo(() => {
    const { type, ...restProps } = props;
    return (
      <ToolbarButton
        ref={ref}
        isDisabled={isDisabled}
        isSelected={isSelected}
        onMouseDown={(event) => {
          event.preventDefault();
          if (isSelected) {
            Editor.removeMark(editor, props.type);
          } else {
            Editor.addMark(editor, props.type, true);
          }
        }}
        {...restProps}
      />
    );
  }, [editor, isDisabled, isSelected, props, ref]);
});

const ToolbarContainer = ({ children }) => {
  return (
    <div>
      <div>{children}</div>
    </div>
  );
};

const downIcon = <ChevronDownIcon size="small" />;

function HeadingButton({ onToggleShowMenu, showMenu }) {
  const { textStyles } = useToolbarState();
  let buttonLabel =
    textStyles.selected === "normal"
      ? "Normal text"
      : "Heading " + textStyles.selected;
  const isDisabled = textStyles.allowedHeadingLevels.length === 0;
  return (
    <Tooltip>
      <TooltipTrigger as={Fragment}>
        <ToolbarButton
          onClick={onToggleShowMenu}
          isPressed={showMenu}
          isDisabled={isDisabled}
        >
          <span>{buttonLabel}</span>
          <ChevronDownIcon />
        </ToolbarButton>
      </TooltipTrigger>
      <TooltipContent>Choose heading level</TooltipContent>
    </Tooltip>
  );
}

const HeadingMenu = ({ headingLevels }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      <HeadingButton
        headingLevels={headingLevels}
        showMenu={showMenu}
        onToggleShowMenu={() => setShowMenu(!showMenu)}
      />
      {showMenu && (
        <HeadingDialog
          headingLevels={headingLevels}
          onCloseMenu={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

function HeadingDialog({ headingLevels, onCloseMenu }) {
  const { editor, textStyles } = useToolbarState();
  return (
    <ToolbarGroup direction="column">
      {headingLevels.map((hNum) => {
        let Tag = `h${hNum}`;
        const isSelected = textStyles.selected === hNum;
        return (
          <ToolbarButton
            key={hNum}
            isSelected={isSelected}
            onMouseDown={(event) => {
              event.preventDefault();

              if (isSelected) {
                Transforms.unwrapNodes(editor, {
                  match: (n) => n.type === "heading",
                });
              } else {
                Transforms.setNodes(
                  editor,
                  { type: "heading", level: hNum },
                  {
                    match: (node) =>
                      node.type === "paragraph" || node.type === "heading",
                  }
                );
              }
              onCloseMenu();
            }}
          >
            <Tag>Heading {hNum}</Tag>
          </ToolbarButton>
        );
      })}
    </ToolbarGroup>
  );
}

function InsertBlockMenu() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger as={Fragment}>
          <ToolbarButton onClick={() => setShowMenu((v) => !v)}>
            <PlusIcon size="small" style={{ strokeWidth: 3 }} />
            <ChevronDownIcon size="small" />
          </ToolbarButton>
        </PopoverTrigger>
        <PopoverContent>
          <ToolbarGroup direction="column">
            <RelationshipButton onClose={() => setShowMenu(false)} />
            <BlockComponentsButtons onClose={() => setShowMenu(false)} />
          </ToolbarGroup>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function InlineMarks({ marks }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Fragment>
      <TooltipProvider>
        {marks.bold && (
          <Tooltip>
            <TooltipTrigger>
              <MarkButton type="bold">
                <BoldIcon size="small" />
              </MarkButton>
            </TooltipTrigger>
            <TooltipContent>
              Bold {/* Keyboard Shortcut can be added here if needed */}
            </TooltipContent>
          </Tooltip>
        )}
        {marks.italic && (
          <Tooltip>
            <TooltipTrigger>
              <MarkButton type="italic">
                <ItalicIcon size="small" />
              </MarkButton>
            </TooltipTrigger>
            <TooltipContent>
              Italic {/* Keyboard Shortcut can be added here if needed */}
            </TooltipContent>
          </Tooltip>
        )}

        <Popover open={showMenu} onOpenChange={setShowMenu}>
          <PopoverTrigger as={Fragment}>
            <MoreFormattingButton isOpen={showMenu} />
          </PopoverTrigger>
          <PopoverContent>
            <MoreFormattingDialog marks={marks} onCloseMenu={() => setShowMenu(false)} />
          </PopoverContent>
        </Popover>
      </TooltipProvider>
    </Fragment>
  );
}

function MoreFormattingDialog({ dialog, marks, onCloseMenu }) {
  // not doing optimisations in here because this will only render when it's open
  // which will be rare and you won't be typing while it's open
  const {
    editor,
    clearFormatting: { isDisabled },
  } = useToolbarState();
  return (
    <InlineDialog
      onMouseDown={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest("button")
        ) {
          onCloseMenu();
        }
      }}
      ref={dialog.ref}
      {...dialog.props}
    >
      <ToolbarGroup direction="column">
        {marks.underline && (
          <MarkButton type="underline">
            <ContentInButtonWithShortcut
              content="Underline"
              shortcut={`${modifierKeyText}U`}
            />
          </MarkButton>
        )}
        {marks.strikethrough && (
          <MarkButton type="strikethrough">Strikethrough</MarkButton>
        )}
        {marks.code && <MarkButton type="code">Code</MarkButton>}
        {marks.keyboard && <MarkButton type="keyboard">Keyboard</MarkButton>}
        {marks.subscript && <MarkButton type="subscript">Subscript</MarkButton>}
        {marks.superscript && (
          <MarkButton type="superscript">Superscript</MarkButton>
        )}
        <ToolbarButton
          isDisabled={isDisabled}
          onMouseDown={(event) => {
            event.preventDefault();
            clearFormatting(editor);
          }}
        >
          <ContentInButtonWithShortcut
            content="Clear Formatting"
            shortcut={`${modifierKeyText}\\`}
          />
        </ToolbarButton>
      </ToolbarGroup>
    </InlineDialog>
  );
}

function ContentInButtonWithShortcut({ content, shortcut }) {
  return (
    <span>
      <span>{content}</span>
      <kbd>{shortcut}</kbd>
    </span>
  );
}

function MoreFormattingButton({ onToggle, isOpen, trigger, attrs }) {
  const { marks } = useToolbarState();
  const isActive =
    marks.strikethrough.isSelected ||
    marks.underline.isSelected ||
    marks.code.isSelected ||
    marks.keyboard.isSelected ||
    marks.subscript.isSelected ||
    marks.superscript.isSelected;
  return useMemo(
    () => (
      <ToolbarButton
        isPressed={isOpen}
        isSelected={isActive}
        onMouseDown={(event) => {
          event.preventDefault();
          onToggle();
        }}
        {...trigger.props}
        {...attrs}
        ref={applyRefs(attrs.ref, trigger.ref)}
      >
        <MoreHorizontalIcon size="small" />
      </ToolbarButton>
    ),
    [isActive, onToggle, isOpen, trigger, attrs]
  );
}

// Custom (non-feather) Icons
// ------------------------------

export const IconBase = (props) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    focusable="false"
    height="16"
    role="presentation"
    viewBox="0 0 16 16"
    width="16"
    {...props}
  />
);

const BulletListIcon = () => (
  <IconBase>
    <path d="M2 4a1 1 0 100-2 1 1 0 000 2zm3.75-1.5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm0 5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm0 5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zM3 8a1 1 0 11-2 0 1 1 0 012 0zm-1 6a1 1 0 100-2 1 1 0 000 2z" />
  </IconBase>
);
const NumberedListIcon = () => (
  <IconBase>
    <path d="M2.003 2.5a.5.5 0 00-.723-.447l-1.003.5a.5.5 0 00.446.895l.28-.14V6H.5a.5.5 0 000 1h2.006a.5.5 0 100-1h-.503V2.5zM5 3.25a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 3.25zm0 5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5A.75.75 0 015 8.25zm0 5a.75.75 0 01.75-.75h8.5a.75.75 0 010 1.5h-8.5a.75.75 0 01-.75-.75zM.924 10.32l.003-.004a.851.851 0 01.144-.153A.66.66 0 011.5 10c.195 0 .306.068.374.146a.57.57 0 01.128.376c0 .453-.269.682-.8 1.078l-.035.025C.692 11.98 0 12.495 0 13.5a.5.5 0 00.5.5h2.003a.5.5 0 000-1H1.146c.132-.197.351-.372.654-.597l.047-.035c.47-.35 1.156-.858 1.156-1.845 0-.365-.118-.744-.377-1.038-.268-.303-.658-.484-1.126-.484-.48 0-.84.202-1.068.392a1.858 1.858 0 00-.348.384l-.007.011-.002.004-.001.002-.001.001a.5.5 0 00.851.525zM.5 10.055l-.427-.26.427.26z" />
  </IconBase>
);
