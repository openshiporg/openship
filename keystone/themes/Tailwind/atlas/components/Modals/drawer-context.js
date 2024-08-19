import React, { useCallback, useEffect, useState, createContext, useContext } from "react";
import { EditItemDrawer } from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";

const DrawerContext = createContext(null);

export const DrawerProvider = ({ children }) => {
  const [drawerStack, setDrawerStack] = useState([]);
  const [editDrawerState, setEditDrawerState] = useState({
    itemId: null,
    listKey: null,
  });

  const pushToDrawerStack = useCallback((key) => {
    setDrawerStack((stack) => [...stack, key]);
  }, []);

  const popFromDrawerStack = useCallback(() => {
    setDrawerStack((stack) => stack.slice(0, -1));
  }, []);

  const openEditDrawer = useCallback((itemId, listKey) => {
    setEditDrawerState({ itemId, listKey });
  }, []);

  const closeEditDrawer = useCallback(() => {
    setEditDrawerState({ itemId: null, listKey: null });
  }, []);

  const context = {
    drawerStack,
    pushToDrawerStack,
    popFromDrawerStack,
    openEditDrawer,
    closeEditDrawer,
  };

  return (
    <DrawerContext.Provider value={context}>
      {children}
      {editDrawerState.listKey && editDrawerState.itemId && (
        <EditItemDrawer
          listKey={editDrawerState.listKey}
          itemId={editDrawerState.itemId}
          closeDrawer={closeEditDrawer}
          open={true}
        />
      )}
    </DrawerContext.Provider>
  );
};

export const useDrawerManager = (uniqueKey) => {
  const drawerContext = useContext(DrawerContext);

  if (drawerContext === null) {
    throw new Error(
      "This component must have a <DrawerProvider/> ancestor in the same React tree."
    );
  }

  useEffect(() => {
    drawerContext.pushToDrawerStack(uniqueKey);
    return () => {
      drawerContext.popFromDrawerStack();
    };
  }, [uniqueKey, drawerContext]);

  let depth = drawerContext.drawerStack
    .slice()
    .reverse()
    .indexOf(uniqueKey);

  return depth === -1 ? 0 : depth;
};

export const useDrawer = () => {
  const drawerContext = useContext(DrawerContext);

  if (drawerContext === null) {
    throw new Error(
      "useDrawer must be used within a DrawerProvider"
    );
  }

  return {
    openEditDrawer: drawerContext.openEditDrawer,
    closeEditDrawer: drawerContext.closeEditDrawer,
  };
};