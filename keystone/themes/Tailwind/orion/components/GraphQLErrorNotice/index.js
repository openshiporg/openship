import React from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../primitives/default/ui/alert";

export function GraphQLErrorNotice({ errors, networkError }) {
  if (networkError) {
    return <Alert variant="destructive">{networkError.message}</Alert>;
  }

  if (errors?.length) {
    return (
      <div className="space-y-2">
        {errors.map((err, idx) => (
          <Alert key={idx} variant="destructive">
            <AlertTitle>System Error</AlertTitle>
            <AlertDescription>{err?.extensions?.originalError?.message || err.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }
  return null;
}
