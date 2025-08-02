/**
 * GraphQL utilities for data fetching with SWR
 */

import { getAuthHeaders } from '@/features/dashboard/lib/cookies';
import { GraphQLClient, ClientError } from 'graphql-request';
import { getGraphQLEndpoint } from '@/features/dashboard/lib/getBaseUrl';

// Define response type for keystoneClient
export type KeystoneResponse<T = any> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; errors?: any[]; data?: never };

/**
 * Create a GraphQL client with authentication headers
 */
async function createGraphQLClient(): Promise<GraphQLClient> {
  const endpoint = await getGraphQLEndpoint();
  const authHeaders = await getAuthHeaders();
  return new GraphQLClient(endpoint, {
    credentials: 'include',
    headers: authHeaders || {},
  });
}

/**
 * Format GraphQL error messages in a more readable way
 */
function formatGraphQLErrors(error: ClientError): { message: string; errors?: any[] } {
  if (!error.response) {
    return { message: error.message };
  }

  const errors = error.response.errors;
  if (!errors) {
    return { message: error.message };
  }

  // Extract detailed error information
  const formattedErrors = errors.map(err => {
    const extensions = err.extensions || {};
    const path = err.path?.join('.') || '';
    const code = extensions.code || '';
    
    // Get original error if available
    const originalError = (extensions.originalError as any)?.message || (extensions.exception as any)?.message || '';
    
    // Include validation errors if present
    const validation = extensions.validation || {};
    const validationErrors = Object.entries(validation)
      .map(([field, error]) => `${field}: ${error}`)
      .join(', ');

    // Build detailed error message
    const details = [
      originalError && `Original Error: ${originalError}`,
      path && `Path: ${path}`,
      code && `Code: ${code}`,
      validationErrors && `Validation: ${validationErrors}`
    ].filter(Boolean).join(' | ');

    return {
      message: err.message,
      details: details || undefined
    };
  });

  // Create a detailed error message
  const message = formattedErrors
    .map(err => `${err.message}${err.details ? ` (${err.details})` : ''}`)
    .join('\n');

  return { 
    message,
    errors: errors 
  };
}

/**
 * Fetch data from the GraphQL API
 * Automatically handles file uploads by detecting File/Blob objects in variables
 * @param query GraphQL query or mutation
 * @param variables Variables for the query
 * @param cacheOptions Optional cache configuration for the fetch request
 * @returns Structured response with success/error information
 */
export async function keystoneClient<T = any>(
  query: string,
  variables: Record<string, unknown> = {},
  // Allow passing standard RequestInit options, including 'cache'
  requestOptions?: RequestInit
): Promise<KeystoneResponse<T>> {
  try {
    // Check if we have any file uploads in the variables
    const hasUploads = checkForFileUploads(variables);

    if (hasUploads) {
      // If we found files, use the multipart implementation
      return await _fetchGraphQLWithFiles(query, variables);
    }

    // Create GraphQL client with auth headers
    const client = await createGraphQLClient();

    // Make the request
    const data = await client.request<T>(query, variables);

    return {
      success: true,
      data
    };

  } catch (error) {
    console.error("Error fetching GraphQL data:", error);

    if (error instanceof ClientError) {
      const { message, errors } = formatGraphQLErrors(error);
      return {
        success: false,
        error: message,
        errors
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Internal implementation for handling file uploads using multipart form data
 * Following the GraphQL multipart request specification
 */
async function _fetchGraphQLWithFiles(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<any> {
  try {
    const endpoint = await getGraphQLEndpoint();
    const authHeaders = await getAuthHeaders();

    // Clone the variables to avoid modifying the original
    const variablesCopy = structuredClone(variables);

    // Create a map of file paths to their corresponding variables
    const uploadFiles: File[] = [];
    const map: Record<string, string[]> = {};

    // First pass: identify uploads and set them to null in the variables copy
    nullifyUploads(variablesCopy);

    // Second pass: collect the files and build the map
    collectFileUploads(variables, variablesCopy, "", uploadFiles, map);

    // Handle multipart form data for uploads
    const operations = {
      variables: variablesCopy,
      query,
    };

    // Create form data
    const formData = new FormData();
    formData.append("operations", JSON.stringify(operations));
    formData.append("map", JSON.stringify(map));

    // Add each file to the form
    uploadFiles.forEach((file, index) => {
      formData.append(`${index + 1}`, file);
    });

    // Prepare headers
    const headers: Record<string, string> = {};

    // Add auth headers if they exist
    if (authHeaders) {
      Object.assign(headers, authHeaders);
    }

    // Send the multipart request
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `GraphQL request failed: ${response.statusText}`
      };
    }

    const json = await response.json();

    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      return {
        success: false,
        error: `GraphQL Error: ${json.errors
          .map((e: { message: string }) => e.message)
          .join(", ")}`
      };
    }

    return {
      success: true,
      data: json.data
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Recursively check if an object contains file uploads
 */
function checkForFileUploads(obj: any): boolean {
  // Revert unknown to any for property access
  if (!obj || typeof obj !== "object") return false;

  // If it's a File, we found an upload
  if (obj instanceof File) return true;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.some((item) => checkForFileUploads(item));
  }

  // Handle upload object structure from Keystone
  if (obj.upload && obj.upload instanceof File) {
    return true;
  }

  // Recursively check object properties
  return Object.values(obj).some((value) => checkForFileUploads(value));
}

/**
 * Recursively set all file uploads to null in the cloned variables object
 */
function nullifyUploads(obj: any): void {
  // Revert unknown to any for property access
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    obj.forEach((item) => nullifyUploads(item));
    return;
  }

  // Handle KeystoneJS image field structure
  if (obj.upload && typeof obj.upload === "object") {
    obj.upload = null;
    return;
  }

  // Regular object traversal
  Object.entries(obj).forEach(([, value]) => {
    // Keep unused key removal
    if (typeof value === "object" && value !== null) {
      nullifyUploads(value);
    }
  });
}

/**
 * Recursively collect file uploads from variables and build the map
 */
function collectFileUploads(
  originalObj: any, // Revert unknown to any
  nullifiedObj: any, // Revert unknown to any
  path: string,
  uploadFiles: File[],
  map: Record<string, string[]>
): void {
  if (!originalObj || typeof originalObj !== "object") return;

  if (Array.isArray(originalObj)) {
    originalObj.forEach((item, index) => {
      collectFileUploads(
        item,
        nullifiedObj[index],
        `${path}[${index}]`,
        uploadFiles,
        map
      );
    });
    return;
  }

  // Handle KeystoneJS image field structure
  if (originalObj.upload && originalObj.upload instanceof File) {
    const fileIndex = uploadFiles.length;
    uploadFiles.push(originalObj.upload);

    // Format exactly like the working example
    const uploadPath = path ? `variables.${path}.upload` : `variables.upload`;
    map[fileIndex + 1] = [uploadPath];
    return;
  }

  // Regular object traversal
  Object.entries(originalObj).forEach(([key, value]) => {
    const newPath = path ? `${path}.${key}` : key;

    if (value instanceof File) {
      const fileIndex = uploadFiles.length;
      uploadFiles.push(value);

      // Format exactly like the working example
      const uploadPath = `variables.${newPath}`;
      map[fileIndex + 1] = [uploadPath];
    } else if (
      typeof value === "object" &&
      value !== null &&
      nullifiedObj[key] !== undefined
    ) {
      collectFileUploads(value, nullifiedObj[key], newPath, uploadFiles, map);
    }
  });
}