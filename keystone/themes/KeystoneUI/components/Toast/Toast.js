/** @jsxRuntime classic */
/** @jsx jsx */

import { forwardRef, useEffect, useMemo, useState } from "react";
import { jsx, keyframes, Portal, useTheme } from "@keystone-ui/core";
import { AlertOctagonIcon } from "@keystone-ui/icons/icons/AlertOctagonIcon";
import { AlertTriangleIcon } from "@keystone-ui/icons/icons/AlertTriangleIcon";
import { CheckCircleIcon } from "@keystone-ui/icons/icons/CheckCircleIcon";
import { InfoIcon } from "@keystone-ui/icons/icons/InfoIcon";
import { XIcon } from "@keystone-ui/icons/icons/XIcon";

import { ToastContext } from "./context";

// Provider
// ------------------------------

export const ToastProvider = ({ children }) => {
  const [toastStack, setToastStack] = useState([]);

  const context = useMemo(
    () => ({
      addToast: (options) => {
        setToastStack((currentStack) => {
          // only allow unique IDs in the toast stack
          if (currentStack.some((toast) => toast.id === options.id)) {
            console.error(
              `You cannot add more than one toast with the same id ("${options.id}").`
            );
            return currentStack;
          }

          // populate defaults and update state
          let toast = populateDefaults(options);
          return [...currentStack, toast];
        });
      },
      removeToast: (id) => {
        setToastStack((currentStack) =>
          currentStack.filter((t) => t.id !== id)
        );
      },
    }),
    []
  );

  return (
    <ToastContext.Provider value={context}>
      {children}
      <ToastContainer>
        {toastStack.map((props) => {
          const { id, message, preserve, title, tone } = props;
          const onDismiss = () => context.removeToast(id);

          return (
            <ToastElement
              key={id}
              message={message}
              preserve={preserve}
              onDismiss={onDismiss}
              title={title}
              tone={tone}
            />
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
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
  const { elevation, spacing } = useTheme();

  return (
    <Portal>
      <div
        role="alert"
        css={{
          position: "fixed",
          right: spacing.medium,
          bottom: spacing.medium,
          zIndex: elevation.e500,
        }}
        {...props}
      />
    </Portal>
  );
};

// Element

const AUTO_DISMISS_DURATION = 6000;
const slideInFrames = keyframes({
  from: { transform: "translateY(100%)" },
  to: { transform: "translateY(0)" },
});

export const ToastElement = forwardRef((props, ref) => {
  const { message, onDismiss, preserve, title, tone, ...rest } = props;
  const { radii, shadow, spacing, typography, sizing, tones } = useTheme();

  // auto-dismiss functionality
  useEffect(() => {
    if (!preserve) {
      const timer = setTimeout(onDismiss, AUTO_DISMISS_DURATION);
      return () => clearTimeout(timer);
    }
    // this is not like other components because the consumer cannot update the props once they `addToast()`
    // we intentionally only want this to be run when the toast element mounts/unmounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iconElement = {
    positive: <CheckCircleIcon />,
    negative: <AlertOctagonIcon />,
    warning: <AlertTriangleIcon />,
    help: <InfoIcon />,
  }[tone];
  const backgroundColor = {
    positive: tones.positive.fill[0],
    negative: tones.negative.fill[0],
    warning: tones.warning.fill[0],
    help: tones.help.fill[0],
  }[tone];
  const foregroundColor = {
    positive: tones.positive.fillForeground[0],
    negative: tones.negative.fillForeground[0],
    warning: tones.warning.fillForeground[0],
    help: tones.help.fillForeground[0],
  }[tone];

  return (
    <div
      ref={ref}
      css={{
        alignItems: "center",
        animation: `${slideInFrames} 150ms cubic-bezier(0.2, 0, 0, 1)`,
        background: backgroundColor,
        borderRadius: radii.medium,
        boxShadow: shadow.s300,
        color: foregroundColor,
        display: "flex",
        fontSize: typography.fontSize.small,
        lineHeight: 1,
        margin: spacing.medium,
        width: 380, // less than desirable magic number, but not sure if this needs to be in theme...
        maxWidth: "100%",
        padding: spacing.large,
        whiteSpace: "pre-wrap",
      }}
      {...rest}
    >
      {iconElement}
      <div
        css={{
          flex: 1,
          paddingLeft: spacing.large,
          paddingRight: spacing.large,
        }}
      >
        <h3
          css={{
            color: foregroundColor,
            fontSize: typography.fontSize.medium,
            fontWeight: typography.fontWeight.bold,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {message && (
          <div
            css={{
              color: foregroundColor,
              lineHeight: typography.leading.base,
              marginTop: spacing.small,
            }}
          >
            {message}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        css={{
          alignItems: "center",
          background: 0,
          border: 0,
          borderRadius: "50%",
          color: foregroundColor,
          cursor: "pointer",
          display: "flex",
          height: sizing.medium,
          justifyContent: "center",
          outline: 0,
          padding: 0,
          width: sizing.medium,

          ":hover, &.focus-visible": {
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          },
          ":active": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <XIcon size="small" />
      </button>
    </div>
  );
});
