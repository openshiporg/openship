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
import Head from "next/head";
import { Fields } from "@keystone/components/Fields";
import { GraphQLErrorNotice } from "@keystone/components/GraphQLErrorNotice";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@keystone/primitives/default/ui/card";
import { Button } from "@keystone/primitives/default/ui/button";
import { Logo } from "@keystone/logo";
import { Outfit } from "next/font/google";

const montserrat = Outfit({ subsets: ["latin"] });


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
    <div className={`h-screen flex flex-col justify-center items-center bg-slate-50/75 dark:bg-background`}>
      <div className="flex flex-col gap-2 md:gap-4 w-[350px]">
        <div className="mx-auto">
          <Logo size="lg" />
        </div>
        <form onSubmit={onSubmit}>
          <Card className="shadow-sm dark:bg-gray-900/25">
            <CardHeader>
              <CardTitle className="text-slate-700 dark:text-white text-xl">Create Admin</CardTitle>
              <CardDescription className="text-sm">
                Create the first user on this instance
              </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                className="w-full tracking-wider h-11 md:h-12"
                color="emerald"
                isLoading={
                  loading ||
                  data?.authenticate?.__typename ===
                    `${listKey}AuthenticationWithPasswordSuccess`
                }
                type="submit"
              >
                GET STARTED
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
