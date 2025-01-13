import React, { createContext, useContext, useMemo, useRef } from "react";
import { keystoneDefinitions } from "./keystoneDefinitions";
import { createUploadLink } from "apollo-upload-client";
import { useAdminMeta } from "./utils/useAdminMeta";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
} from "@keystone-6/core/admin-ui/apollo";
import { useLazyMetadata } from "./utils/useLazyMetadata";
import { fieldViews } from "./fieldViews";
import { Logo, LogoIcon } from "./logo";
import { LoadingIcon, ErrorBoundary } from "./screens";

const KeystoneContext = createContext(undefined);

function InternalKeystoneProvider({
  adminConfig,
  fieldViews,
  adminMetaHash,
  children,
  lazyMetadataQuery,
  apiPath,
}) {
  const adminMeta = useAdminMeta(adminMetaHash, fieldViews);
  const { authenticatedItem, visibleLists, createViewFieldModes, refetch } =
    useLazyMetadata(lazyMetadataQuery);
  const reinitContext = async () => {
    await adminMeta?.refetch?.();
    await refetch();
  };

  // if (adminMeta.state === "loading") {
  //   return <LoadingIcon label="Loading Admin Metadata" size="large" />;
  // }

  if (adminMeta.state === "loading") {
    return null;
  }
  
  return (
    <KeystoneContext.Provider
      value={{
        adminConfig,
        adminMeta,
        fieldViews,
        authenticatedItem,
        reinitContext,
        visibleLists,
        createViewFieldModes,
        apiPath,
      }}
    >
      {children}
    </KeystoneContext.Provider>
  );
}

export const Provider = (props) => {
  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        link: createUploadLink({
          uri: props.apiPath,
          headers: { "Apollo-Require-Preflight": "true" },
        }),
      }),
    [props.apiPath]
  );

  return (
    <ApolloProvider client={apolloClient}>
      <InternalKeystoneProvider {...props} />
    </ApolloProvider>
  );
};

export const KeystoneProvider = ({ children }) => {
  const lazyMetadataQueryRef = useRef({
    kind: "Document",
    definitions: keystoneDefinitions,
  });

  const adminConfigRef = useRef({
    components: { Logo, LogoIcon },
  });

  return (
    <Provider
      lazyMetadataQuery={lazyMetadataQueryRef.current}
      fieldViews={fieldViews}
      adminMetaHash="p7mmo"
      adminConfig={adminConfigRef.current}
      apiPath="/api/graphql"
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </Provider>
  );
};

export const useKeystone = () => {
  const value = useContext(KeystoneContext);
  if (!value) {
    throw new Error(
      "useKeystone must be called inside a KeystoneProvider component"
    );
  }
  if (value.adminMeta.state === "error") {
    throw new Error("An error occurred when loading Admin Metadata");
  }
  return {
    adminConfig: value.adminConfig,
    adminMeta: value.adminMeta.value,
    authenticatedItem: value.authenticatedItem,
    visibleLists: value.visibleLists,
    createViewFieldModes: value.createViewFieldModes,
    apiPath: value.apiPath,
  };
};

export const useReinitContext = () => {
  const value = useContext(KeystoneContext);
  if (!value) {
    throw new Error(
      "useReinitContext must be called inside a KeystoneProvider component"
    );
  }
  return value.reinitContext;
};

export const useRawKeystone = () => {
  const value = useContext(KeystoneContext);
  if (!value) {
    throw new Error(
      "useRawKeystone must be called inside a KeystoneProvider component"
    );
  }
  return value;
};

export const useList = (key) => {
  const {
    adminMeta: { lists },
  } = useKeystone();
  if (lists[key]) {
    return lists[key];
  } else {
    throw new Error(`Invalid list key provided to useList: ${key}`);
  }
};
