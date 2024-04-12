import { forwardRef, useEffect, useMemo, useState } from "react";
import {
  AlertOctagonIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XIcon,
} from "lucide-react";
import { useToast } from "@keystone/primitives/default/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as TP,
  ToastTitle,
  ToastViewport,
} from "@keystone/primitives/default/ui/toast";
// Provider
// ------------------------------

export const ToastProvider = ({ children }) => {
  const { toasts } = useToast();

  return (
    <>
      {children}
      <TP>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          );
        })}
        <ToastViewport />
      </TP>
    </>
  );
};
// Utils
// ------------------------------

let idCount = -1;
let genId = () => ++idCount;
function populateDefaults(props) {
  return {
    title: props.title,
    message: props.message,
    preserve: Boolean(props.preserve),
    id: props.id || String(genId()),
    tone: props.tone || "help",
  };
}

// Styled Components
// ------------------------------

// Container

const ToastContainer = (props) => {
  return (
    <div
      role="alert"
      className="fixed right-4 bottom-4 z-50" // Tailwind CSS classes
      {...props}
    />
  );
};
// Element

const AUTO_DISMISS_DURATION = 6000;

export const ToastElement = forwardRef((props, ref) => {
  const { message, onDismiss, preserve, title, tone, ...rest } = props;

  useEffect(() => {
    if (!preserve) {
      const timer = setTimeout(onDismiss, AUTO_DISMISS_DURATION);
      return () => clearTimeout(timer);
    }
  }, [preserve, onDismiss]);

  const iconElement = {
    positive: <CheckCircleIcon />,
    negative: <AlertOctagonIcon />,
    warning: <AlertTriangleIcon />,
    help: <InfoIcon />,
  }[tone];

  // Tailwind CSS classes can be adjusted as needed
  return (
    <div
      ref={ref}
      className={`flex items-center justify-between p-4 border-l-4 ${
        tone === "positive" ? "bg-green-100 border-green-500" : ""
      } ${tone === "negative" ? "bg-red-100 border-red-500" : ""} ${
        tone === "warning" ? "bg-yellow-100 border-yellow-500" : ""
      } ${tone === "help" ? "bg-blue-100 border-blue-500" : ""}`}
      {...rest}
    >
      {iconElement}
      <div className="flex-1 px-4">
        <h3 className="text-lg font-bold">{title}</h3>
        {message && <div className="mt-1 text-sm">{message}</div>}
      </div>
      <button
        onClick={onDismiss}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200"
      >
        <XIcon size="small" />
      </button>
    </div>
  );
});
