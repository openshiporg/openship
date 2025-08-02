import React from "react";
import type { GraphQLFormattedError } from "graphql";
import { Alert, AlertDescription } from "@/components/ui/alert";

type GraphQLErrorNoticeProps = {
  networkError: Error | null | undefined;
  errors: readonly GraphQLFormattedError[] | undefined;
};

export function GraphQLErrorNotice({ errors, networkError }: GraphQLErrorNoticeProps) {
  if (networkError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>{networkError.message}</AlertDescription>
      </Alert>
    );
  }
  
  if (errors?.length) {
    return (
      <div className="space-y-3 mb-6">
        {errors.map((err, idx) => (
          <Alert variant="destructive" key={idx}>
            <AlertDescription>{err.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }
  
  return null;
}