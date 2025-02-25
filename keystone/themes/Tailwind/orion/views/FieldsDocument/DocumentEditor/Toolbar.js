import {
  Fragment,
  forwardRef,
  useState,
  useMemo,
  useContext,
  createContext,
} from "react";
import { Editor, Transforms } from "slate";
import { applyRefs } from "apply-ref";
import { cn } from "@keystone/utils/cn";

import { useControlledPopover } from "./use-controlled-popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/popover";
import { Button, buttonVariants } from "@ui/button";

import {
  Bold,
  Italic,
  Plus,
  ChevronDown,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  List,
  ListOrdered,
} from "lucide-react";

import { InlineDialog } from "./primitives";
import { linkButton } from "./link";
import {
  BlockComponentsButtons,
  ComponentBlockContext,
} from "./component-blocks";
import { clearFormatting, modifierKeyText } from "./utils";
import { LayoutsButton } from "./layouts";
import { ListButton, unorderedListButton, orderedListButton } from "./lists";
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
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@ui/select";
import { Separator } from "../../../primitives/default/ui/separator";

// Add this near the top of the file
const isMac =
  typeof window !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(window.navigator.platform);

// Toolbar Primitives
// ------------------------------

export const ToolbarSpacer = () => {
  return <span className="inline-block w-6" />;
};

export const ToolbarSeparator = () => {
  return (
    <span className="inline-block w-px h-full mx-2 bg-border self-stretch" />
  );
};

const directionToAlignment = {
  row: "center",
  column: "start",
};

const ToolbarGroupContext = createContext({ direction: "row" });
const useToolbarGroupContext = () => useContext(ToolbarGroupContext);

export const ToolbarGroup = forwardRef(
  ({ children, direction = "row", className, ...props }, ref) => {
    return (
      <ToolbarGroupContext.Provider value={{ direction }}>
        <div
          ref={ref}
          className={cn(
            "flex gap-1",
            direction === "row"
              ? "flex-row items-center"
              : "flex-col items-start",
            "h-full overflow-x-auto",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ToolbarGroupContext.Provider>
    );
  }
);

ToolbarGroup.displayName = "ToolbarGroup";

export const ToolbarButton = forwardRef(function ToolbarButton(
  { isDisabled, isPressed, isSelected, variant = "ghost", className, ...props },
  ref
) {
  const { direction: groupDirection } = useToolbarGroupContext();

  // Determine the actual variant based on state
  const actualVariant = isSelected ? "secondary" : variant;

  return (
    <Button
      ref={ref}
      disabled={isDisabled}
      data-pressed={isPressed}
      data-selected={isSelected}
      data-display-mode={groupDirection}
      variant={actualVariant}
      size={groupDirection === "row" ? "icon" : "sm"}
      className={cn(
        // Base styles for all toolbar buttons
        "h-8",
        groupDirection === "row"
          ? "w-8 justify-center" // Icon buttons in toolbar
          : "w-full justify-start text-left", // Menu items in dropdowns
        className
      )}
      {...props}
    />
  );
});

ToolbarButton.displayName = "ToolbarButton";

export function KeyboardInTooltip({ children }) {
  return (
    <kbd className="ml-auto px-1 py-0 text-[10px] font-sans font-medium bg-muted text-foreground/80 rounded">
      {children}
    </kbd>
  );
}

export function Toolbar({ documentFeatures, viewState }) {
  const relationship = useContext(DocumentFieldRelationshipsContext);
  const blockComponent = useContext(ComponentBlockContext);
  const hasBlockItems =
    Object.entries(relationship).length || Object.keys(blockComponent).length;
  const hasMarks = Object.values(documentFeatures.formatting.inlineMarks).some(
    (x) => x
  );

  return (
    <TooltipProvider>
      <ToolbarContainer>
        <ToolbarGroup>
          {!!documentFeatures.formatting.headingLevels.length && (
            <HeadingMenu
              headingLevels={documentFeatures.formatting.headingLevels}
            />
          )}
          {hasMarks && (
            <InlineMarks marks={documentFeatures.formatting.inlineMarks} />
          )}
          {hasMarks && <Separator orientation="vertical" />}
          {(documentFeatures.formatting.alignment.center ||
            documentFeatures.formatting.alignment.end) && (
            <TextAlignMenu alignment={documentFeatures.formatting.alignment} />
          )}
          {documentFeatures.formatting.listTypes.unordered && (
            <Tooltip>
              <TooltipTrigger>
                <ListButton type="unordered-list">
                  <List size={16} />
                </ListButton>
              </TooltipTrigger>

              <TooltipWithShortcut shortcut="-">
                Bullet List
              </TooltipWithShortcut>
            </Tooltip>
          )}
          {documentFeatures.formatting.listTypes.ordered && (
            <Tooltip>
              <TooltipTrigger>
                <ListButton type="ordered-list">
                  <ListOrdered size={16} />
                </ListButton>
              </TooltipTrigger>
              <TooltipWithShortcut shortcut="1.">
                Numbered List
              </TooltipWithShortcut>
            </Tooltip>
          )}
          {(documentFeatures.formatting.alignment.center ||
            documentFeatures.formatting.alignment.end ||
            documentFeatures.formatting.listTypes.unordered ||
            documentFeatures.formatting.listTypes.ordered) && (
            <Separator orientation="vertical"/>
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
        <Separator orientation="vertical" className="mr-2"/>
          {useMemo(() => {
            const ExpandIcon = viewState?.expanded ? Minimize2 : Maximize2;
            return (
              viewState && (
                <Tooltip>
                  <TooltipTrigger>
                    <ToolbarButton
                      onMouseDown={(event) => {
                        event.preventDefault();
                        viewState.toggle();
                      }}
                    >
                      <ExpandIcon />
                    </ToolbarButton>
                  </TooltipTrigger>
                  <TooltipWithShortcut>
                    {viewState.expanded ? "Collapse" : "Expand"}
                  </TooltipWithShortcut>
                </Tooltip>
              )
            );
          }, [viewState])}
      </ToolbarContainer>
    </TooltipProvider>
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
    <div className="sticky top-0 z-20 border-b">
      <div className="flex flex-row justify-between items-center h-10 px-2">
        {children}
      </div>
    </div>
  );
};

const downIcon = <ChevronDown size="small" />;

function HeadingMenu({ headingLevels }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Fragment>
      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger>
          <HeadingButton showMenu={showMenu} />
        </PopoverTrigger>
        <HeadingDialog
          headingLevels={headingLevels}
          onSelect={() => setShowMenu(false)}
        />
      </Popover>
    </Fragment>
  );
}

function HeadingButton({ showMenu }) {
  const { textStyles } = useToolbarState();
  const isDisabled = textStyles.allowedHeadingLevels.length === 0;
  const buttonLabel =
    textStyles.selected === "normal"
      ? "Normal text"
      : "Heading " + textStyles.selected;

  return useMemo(
    () => (
      <ToolbarButton
        isDisabled={isDisabled}
        isPressed={showMenu}
        variant="outline"
        className="w-[116px] px-2 flex items-center justify-between"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        <span className="flex-1 text-left">{buttonLabel}</span>
        <ChevronDown size={16} />
      </ToolbarButton>
    ),
    [buttonLabel, isDisabled, showMenu]
  );
}

function HeadingDialog({ headingLevels, onSelect }) {
  const { editor, textStyles } = useToolbarState();

  return (
    <PopoverContent align="start" className="p-1">
      <ToolbarGroup direction="column">
        {headingLevels.map((hNum) => {
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
                onSelect();
              }}
            >
              {hNum === 1 ? (
                <span className="text-2xl font-bold">Heading 1</span>
              ) : hNum === 2 ? (
                <span className="text-xl font-bold">Heading 2</span>
              ) : hNum === 3 ? (
                <span className="text-lg font-bold">Heading 3</span>
              ) : hNum === 4 ? (
                <span className="text-base font-bold">Heading 4</span>
              ) : hNum === 5 ? (
                <span className="text-sm font-bold">Heading 5</span>
              ) : (
                <span className="text-xs font-bold">Heading 6</span>
              )}
            </ToolbarButton>
          );
        })}
        <ToolbarButton
          isSelected={textStyles.selected === "normal"}
          onMouseDown={(event) => {
            event.preventDefault();
            Transforms.unwrapNodes(editor, {
              match: (n) => n.type === "heading",
            });
            onSelect();
          }}
        >
          <span className="text-sm">Normal text</span>
        </ToolbarButton>
      </ToolbarGroup>
    </PopoverContent>
  );
}

function InsertBlockMenu() {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="inline-block relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover open={showMenu} onOpenChange={setShowMenu}>
            <PopoverTrigger>
              <ToolbarButton
                isPressed={showMenu}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setShowMenu((v) => !v);
                }}
              >
                <Plus className="stroke-[3]" size={16} />
                <ChevronDown size={16} />
              </ToolbarButton>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-1">
              <ToolbarGroup direction="column">
                <RelationshipButton onClose={() => setShowMenu(false)} />
                <BlockComponentsButtons onClose={() => setShowMenu(false)} />
              </ToolbarGroup>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipWithShortcut shortcut="/">Insert</TooltipWithShortcut>
      </Tooltip>
    </div>
  );
}

function InlineMarks({ marks }) {
  const [showMenu, setShowMenu] = useState(false);
  const {
    editor,
    clearFormatting: { isDisabled },
  } = useToolbarState();

  return (
    <Fragment>
      {marks.bold && (
        <Tooltip>
          <TooltipTrigger>
            <MarkButton type="bold">
              <Bold className="stroke-[3]" size={16} />
            </MarkButton>
          </TooltipTrigger>
          <TooltipWithShortcut shortcut={isMac ? "⌘B" : "Ctrl+B"}>
            Bold
          </TooltipWithShortcut>
        </Tooltip>
      )}
      {marks.italic && (
        <Tooltip>
          <TooltipTrigger>
            <MarkButton type="italic">
              <Italic size={16} />
            </MarkButton>
          </TooltipTrigger>
          <TooltipWithShortcut shortcut={isMac ? "⌘I" : "Ctrl+I"}>
            Italic
          </TooltipWithShortcut>
        </Tooltip>
      )}

      <Popover open={showMenu} onOpenChange={setShowMenu}>
        <PopoverTrigger>
          <Tooltip>
            <TooltipTrigger>
              <MoreFormattingButton showMenu={showMenu} />
            </TooltipTrigger>
            <TooltipWithShortcut>More Formatting</TooltipWithShortcut>
          </Tooltip>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-1">
          <ToolbarGroup direction="column">
            {marks.underline && (
              <MarkButton type="underline">
                <ContentInButtonWithShortcut
                  content="Underline"
                  shortcut="Ctrl+U"
                />
              </MarkButton>
            )}
            {marks.strikethrough && (
              <MarkButton type="strikethrough">
                <ContentInButtonWithShortcut content="Strikethrough" />
              </MarkButton>
            )}
            {marks.code && (
              <MarkButton type="code">
                <ContentInButtonWithShortcut content="Code" />
              </MarkButton>
            )}
            {marks.keyboard && (
              <MarkButton type="keyboard">
                <ContentInButtonWithShortcut content="Keyboard" />
              </MarkButton>
            )}
            {marks.subscript && (
              <MarkButton type="subscript">
                <ContentInButtonWithShortcut content="Subscript" />
              </MarkButton>
            )}
            {marks.superscript && (
              <MarkButton type="superscript">
                <ContentInButtonWithShortcut content="Superscript" />
              </MarkButton>
            )}
            <ToolbarButton
              isDisabled={isDisabled}
              onMouseDown={(event) => {
                event.preventDefault();
                clearFormatting(editor);
                setShowMenu(false);
              }}
            >
              <ContentInButtonWithShortcut
                content="Clear Formatting"
                shortcut="Ctrl+\\"
              />
            </ToolbarButton>
          </ToolbarGroup>
        </PopoverContent>
      </Popover>
    </Fragment>
  );
}

function MoreFormattingButton({ onToggle, isOpen, ...props }) {
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
        {...props}
        isPressed={isOpen}
        isSelected={isActive}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        <MoreHorizontal size={16} />
      </ToolbarButton>
    ),
    [isActive, isOpen, props]
  );
}

function ContentInButtonWithShortcut({ content, shortcut }) {
  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-sm">{content}</span>
      {shortcut && (
        <KeyboardInTooltip>
          {isMac ? shortcut.replace("Ctrl+", "⌘") : shortcut}
        </KeyboardInTooltip>
      )}
    </div>
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

export function TooltipWithShortcut({ children, shortcut }) {
  return (
    <TooltipContent className="flex items-center justify-center py-0.5 pl-1 px-0.5 dark">
      <span className="text-[10px] tracking-wide font-medium uppercase px-1">
        {children}
      </span>
      {shortcut && <KeyboardInTooltip>{shortcut}</KeyboardInTooltip>}
    </TooltipContent>
  );
}
