import React, { useContext } from "react";

const DrawerControllerContext = React.createContext(null);

export const DrawerControllerContextProvider = DrawerControllerContext.Provider;

export const useDrawerControllerContext = () => {
  let context = useContext(DrawerControllerContext);
  if (!context) {
    throw new Error(
      "Drawers must be wrapped in a <DrawerController>. You should generally do this outside of the component that renders the <Drawer> or <TabbedDrawer>."
    );
  }

  return context;
};

export const DrawerController = ({ isOpen, children }) => {
  return (
    <DrawerControllerContextProvider>
      {children}
    </DrawerControllerContextProvider>
  );
};
