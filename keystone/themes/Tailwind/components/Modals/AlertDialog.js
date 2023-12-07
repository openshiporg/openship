import { DialogBase } from "./DialogBase";
import { Button } from "@keystone/primitives/default/ui/button";

function randomId(prefix = "") {
  return `${prefix}${Math.random().toString(36).substr(2, 9)}`;
}

export const AlertDialog = ({ actions, isOpen, children, title, id }) => {
  const { cancel, confirm } = actions;
  const instanceId = id || randomId();
  const headingId = `${instanceId}-heading`;

  const onClose = () => {
    if (actions.cancel) {
      actions.cancel.action();
    } else {
      actions.confirm.action();
    }
  };

  return (
    <DialogBase
      isOpen={isOpen}
      onClose={onClose}
      width={440}
      aria-labelledby={headingId}
    >
      <div className="p-10">
        <h4 id={headingId}>{title}</h4>

        <div className="my-8">{children}</div>

        <div className="flex justify-end">
          {cancel && (
            <Button
              disabled={confirm.loading}
              key={cancel.label}
              onClick={cancel.action}
            >
              {cancel.label}
            </Button>
          )}
          <Button
            className="ml-3"
            key={confirm.label}
            isLoading={confirm.loading}
            onClick={confirm.action}
          >
            {confirm.label}
          </Button>
        </div>
      </div>
    </DialogBase>
  );
};
