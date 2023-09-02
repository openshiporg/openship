import { useMemo, useState } from "react";

import isDeepEqual from "fast-deep-equal";
import { useRouter } from "next/navigation";

import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import {
  serializeValueToObjByFieldKey,
  useInvalidFields,
} from "@keystone-6/core/admin-ui/utils";
import { useRedirect } from "@keystone/utils/useRedirect";
import { useReinitContext, useKeystone } from "@keystone/keystoneProvider";
import { Box, Center, H1, Stack, useTheme } from "@keystone-ui/core";
import { Button } from "@keystone-ui/button";
import Head from "next/head";
import { Fields } from "@keystone/components/Fields";
import { GraphQLErrorNotice } from "@keystone/components/GraphQLErrorNotice";

export function InitPage({
  fieldPaths = ["name", "email", "password"],
  listKey = "User",
  enableWelcome,
}) {
  const { adminMeta } = useKeystone();
  const fields = useMemo(() => {
    const fields = {};
    fieldPaths.forEach((fieldPath) => {
      fields[fieldPath] = adminMeta.lists[listKey].fields[fieldPath];
    });
    return fields;
  }, [fieldPaths, adminMeta.lists, listKey]);

  const [value, setValue] = useState(() => {
    let state = {};
    Object.keys(fields).forEach((fieldPath) => {
      state[fieldPath] = {
        kind: "value",
        value: fields[fieldPath].controller.defaultValue,
      };
    });
    return state;
  });

  const invalidFields = useInvalidFields(fields, value);
  const [forceValidation, setForceValidation] = useState(false);
  const [mode, setMode] = useState("init");

  const [createFirstItem, { loading, error, data }] =
    useMutation(gql`mutation($data: CreateInitial${listKey}Input!) {
    authenticate: createInitial${listKey}(data: $data) {
      ... on ${listKey}AuthenticationWithPasswordSuccess {
        item {
          id
        }
      }
    }
  }`);
  const reinitContext = useReinitContext();
  const router = useRouter();
  const redirect = useRedirect();

  const onSubmit = async (event) => {
    event.preventDefault();
    // Check if there are any invalidFields
    const newForceValidation = invalidFields.size !== 0;
    setForceValidation(newForceValidation);

    // if yes, don't submit the form
    if (newForceValidation) return;

    // If not we serialize the data
    const data = {};
    const allSerializedValues = serializeValueToObjByFieldKey(fields, value);

    for (const fieldPath of Object.keys(allSerializedValues)) {
      const { controller } = fields[fieldPath];
      const serialized = allSerializedValues[fieldPath];
      // we check the serialized values against the default values on the controller
      if (
        !isDeepEqual(serialized, controller.serialize(controller.defaultValue))
      ) {
        // if they're different add them to the data object.
        Object.assign(data, serialized);
      }
    }

    try {
      await createFirstItem({
        variables: {
          data,
        },
      });
    } catch (e) {
      console.error(e);
      return;
    }

    await reinitContext();

    if (enableWelcome) return setMode("welcome");
    router.push(redirect);
  };

  const onComplete = () => {
    router.push(redirect);
  };

  return (
    <InitTemplate
      onSubmit={onSubmit}
      error={error}
      fields={fields}
      forceValidation={forceValidation}
      invalidFields={invalidFields}
      setValue={setValue}
      value={value}
      loading={loading}
      data={data}
      listKey={listKey}
    />
  );
}

export function InitTemplate({
  onSubmit,
  error,
  fields,
  forceValidation,
  invalidFields,
  setValue,
  value,
  loading,
  data,
  listKey,
  title,
}) {
  const { colors, shadow } = useTheme();

  return (
    <div>
      <Head>
        <title>{title || "Keystone"}</title>
      </Head>
      <Center
        css={{
          minWidth: "100vw",
          minHeight: "100vh",
          backgroundColor: colors.backgroundMuted,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        rounding="medium"
      >
        <Box
          css={{
            background: colors.background,
            width: 600,
            boxShadow: shadow.s100,
            margin: 12,
            padding: 24,
            borderRadius: 8,
          }}
          margin="medium"
          rounding="medium"
        >
          <H1>Welcome to KeystoneJS</H1>
          <p>Create your first user to get started</p>
          <form onSubmit={onSubmit}>
            <Stack gap="large">
              {error && (
                <GraphQLErrorNotice
                  errors={error?.graphQLErrors}
                  networkError={error?.networkError}
                />
              )}
              <Fields
                fields={fields}
                forceValidation={forceValidation}
                invalidFields={invalidFields}
                onChange={setValue}
                value={value}
              />
              <Button
                isLoading={
                  loading ||
                  data?.authenticate?.__typename ===
                    `${listKey}AuthenticationWithPasswordSuccess`
                }
                type="submit"
                weight="bold"
                tone="active"
              >
                Get started
              </Button>
            </Stack>
          </form>
        </Box>
      </Center>
    </div>
  );
}
