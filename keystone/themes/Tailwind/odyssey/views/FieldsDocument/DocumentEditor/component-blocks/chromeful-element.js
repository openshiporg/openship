import { useMemo, useState, useCallback, Fragment } from "react";
import { useSelected } from "slate-react";
import { ToolbarGroup, ToolbarButton, ToolbarSeparator } from "../primitives";
import { NotEditable } from "./api";
import { clientSideValidateProp } from "./utils";
import { FormValueContentFromPreviewProps } from "./form-from-preview";
import { Trash2Icon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/primitives/default/ui/tooltip";
import { Button } from "@keystone/primitives/default/ui/button";

export function ChromefulComponentBlockElement(props) {
  const selected = useSelected();

  const isValid = useMemo(
    () =>
      clientSideValidateProp(
        { kind: "object", fields: props.componentBlock.schema },
        props.elementProps
      ),
    [props.componentBlock, props.elementProps]
  );

  const [editMode, setEditMode] = useState(false);
  const onCloseEditMode = useCallback(() => {
    setEditMode(false);
  }, []);
  const onShowEditMode = useCallback(() => {
    setEditMode(true);
  }, []);

  const ChromefulToolbar =
    props.componentBlock.toolbar ?? DefaultToolbarWithChrome;
  return (
    <div {...props.attributes}>
      <NotEditable>{props.componentBlock.label}</NotEditable>
      {editMode ? (
        <Fragment>
          <FormValue
            isValid={isValid}
            props={props.previewProps}
            onClose={onCloseEditMode}
          />
          <div>{props.children}</div>
        </Fragment>
      ) : (
        <Fragment>
          {props.renderedBlock}
          <ChromefulToolbar
            isValid={isValid}
            onRemove={props.onRemove}
            onShowEditMode={onShowEditMode}
            props={props.previewProps}
          />
        </Fragment>
      )}
    </div>
  );
}

function DefaultToolbarWithChrome({ onShowEditMode, onRemove, isValid }) {
  return (
    <ToolbarGroup as={NotEditable} marginTop="small">
      <ToolbarButton
        onClick={() => {
          onShowEditMode();
        }}
      >
        Edit
      </ToolbarButton>
      <ToolbarSeparator />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <ToolbarButton
              variant="destructive"
              onClick={() => {
                onRemove();
              }}
            >
              <Trash2Icon size="small" />
            </ToolbarButton>
          </TooltipTrigger>
          <TooltipContent>Remove</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {!isValid && (
        <Fragment>
          <ToolbarSeparator />
          <span>Please edit the form, there are invalid fields.</span>
        </Fragment>
      )}
    </ToolbarGroup>
  );
}

function FormValue({ onClose, props, isValid }) {
  const [forceValidation, setForceValidation] = useState(false);

  return (
    <div className="space-y-2" contentEditable={false}>
      <FormValueContentFromPreviewProps
        {...props}
        forceValidation={forceValidation}
      />
      <Button
        size="small"
        onClick={() => {
          if (isValid) {
            onClose();
          } else {
            setForceValidation(true);
          }
        }}
      >
        Done
      </Button>
    </div>
  );
}
