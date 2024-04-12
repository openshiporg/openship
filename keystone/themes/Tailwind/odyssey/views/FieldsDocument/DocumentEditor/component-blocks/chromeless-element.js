import { Trash2Icon } from "lucide-react";
import { ToolbarButton } from "../primitives";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/primitives/default/ui/tooltip";

export function ChromelessComponentBlockElement(props) {
  const ChromelessToolbar =
    props.componentBlock.toolbar ?? DefaultToolbarWithoutChrome;

  return (
    <div {...props.attributes}>
      <Popover open={props.isOpen} onOpenChange={() => {}}>
        <PopoverTrigger as="div">
          {props.renderedBlock}
        </PopoverTrigger>
        <PopoverContent>
          <ChromelessToolbar
            onRemove={props.onRemove}
            props={props.previewProps}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DefaultToolbarWithoutChrome({ onRemove }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolbarButton
            variant="destructive"
            onMouseDown={(event) => {
              event.preventDefault();
              onRemove();
            }}
          >
            <Trash2Icon size="small" />
          </ToolbarButton>
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
