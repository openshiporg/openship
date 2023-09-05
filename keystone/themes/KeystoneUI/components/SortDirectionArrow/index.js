export const SortDirectionArrow = ({ direction }) => {
  const size = "0.25em";
  return (
    <span
      css={{
        borderLeft: `${size} solid transparent`,
        borderRight: `${size} solid transparent`,
        borderTop: `${size} solid`,
        display: "inline-block",
        height: 0,
        marginLeft: "0.33em",
        marginTop: "-0.125em",
        verticalAlign: "middle",
        width: 0,
        transform: `rotate(${direction === "DESC" ? "0deg" : "180deg"})`
      }} />
  );
};
