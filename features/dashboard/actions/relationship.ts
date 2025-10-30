"use server";

import { keystoneClient, type KeystoneResponse } from "@/features/dashboard/lib/keystoneClient";

// Relationship Options Server Action
export async function getRelationshipOptions(
  listKey: string,
  where: Record<string, unknown>,
  take: number,
  skip: number,
  labelField: string,
  extraSelection: string,
  gqlNames: {
    whereInputName: string;
    listQueryName: string;
    listQueryCountName: string;
  }
): Promise<KeystoneResponse<any>> {
  try {
    const query = `
      query GetOptions($where: ${gqlNames.whereInputName}!, $take: Int!, $skip: Int!) {
        items: ${gqlNames.listQueryName}(where: $where, take: $take, skip: $skip) {
          id
          ${labelField}
          ${extraSelection}
        }
        count: ${gqlNames.listQueryCountName}(where: $where)
      }
    `;

    const response = await keystoneClient(query, {
      where,
      take,
      skip,
    });

    // Return the entire response object directly
    return response;
  } catch (error) {
    console.error("Error fetching relationship options:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while fetching relationship options";
    return { success: false, error: errorMessage } as KeystoneResponse<any>;
  }
}

