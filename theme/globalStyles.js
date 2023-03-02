export const globalStyles = {
  "#__next": {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  "#nprogress": { pointerEvents: "none" },
  "#nprogress .bar": {
    background: "#339AF0",
    position: "fixed",
    zIndex: 1031,
    top: "0",
    left: "0",
    width: "100%",
    height: "4px",
  },
  "#nprogress .peg": {
    display: "block",
    position: "absolute",
    right: "0px",
    width: "100px",
    height: "100%",
    // boxShadow: "0 0 10px red, 0 0 5px red",
    opacity: 1,
    WebkitTransform: "rotate(3deg) translate(0px, -4px)",
    msTransform: "rotate(3deg) translate(0px, -4px)",
    transform: "rotate(3deg) translate(0px, -4px)",
  },
  "#nprogress .spinner": {
    display: "block",
    position: "fixed",
    zIndex: 1031,
    top: "15px",
    right: "15px",
  },
  "#nprogress .spinner-icon": {
    width: "18px",
    height: "18px",
    boxSizing: "border-box",
    border: "solid 2px transparent",
    borderTopColor: "#339AF0",
    borderLeftColor: "#339AF0",
    borderRadius: "50%",
    WebkitAnimation: "nprogress-spinner 400ms linear infinite",
    animation: "nprogress-spinner 400ms linear infinite",
  },
  ".nprogress-custom-parent": {
    overflow: "hidden",
    position: "relative",
  },
  ".nprogress-custom-parent #nprogress .spinner,\n.nprogress-custom-parent #nprogress .bar":
    {
      position: "absolute",
    },
  "@-webkit-keyframes nprogress-spinner": {
    "0%": { WebkitTransform: "rotate(0deg)" },
    "100%": { WebkitTransform: "rotate(360deg)" },
  },
  "@keyframes nprogress-spinner": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
};
