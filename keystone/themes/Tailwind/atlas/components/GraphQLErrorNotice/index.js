import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@keystone/primitives/default/ui/alert";

export function GraphQLErrorNotice({ errors, networkError }) {
  if (networkError) {
    return <Alert variant="destructive">{networkError.message}</Alert>;
  }
  if (errors?.length) {
    return (
      <div className="mb-6 space-y-2">
        {errors.map((err, idx) => (
          <Alert key={idx} variant="destructive">
            <AlertTitle>System Error</AlertTitle>
            <AlertDescription>{err.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }
  return null;
}
