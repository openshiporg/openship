'use server';

import { cookies } from 'next/headers';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import { redirect } from 'next/navigation';
import { removeAuthToken } from '@/features/dashboard/lib/cookies';
import { revalidatePath } from 'next/cache';

// Define types for GraphQL responses
interface RedeemTokenResponse {
  redeemUserPasswordResetToken?: {
    code: string;
    message: string;
  } | null;
}

interface SendLinkResponse {
  sendUserPasswordResetLink?: boolean | null;
}

export async function signIn(prevState: { message: string | null, formData: { email: string, password: string } }, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const from = formData.get('from') as string || '/dashboard';

  const query = `
    mutation($email: String!, $password: String!) {
      authenticate: authenticateUserWithPassword(email: $email, password: $password) {
        ... on UserAuthenticationWithPasswordSuccess {
          sessionToken
          item {
            id
            name
            email
          }
        }
        ... on UserAuthenticationWithPasswordFailure {
          message
        }
      }
    }
  `;

  try {
    const response = await keystoneClient(query, { email, password });

    if (!response.success) {
      return {
        message: `Authentication failed: ${response.error}`,
        formData: { email, password }
      };
    }

    // If we have a message, it's an authentication failure
    if (response.data?.authenticate?.message) {
      return {
        message: response.data.authenticate.message,
        formData: { email, password }
      };
    }

    // Check if we have a sessionToken in the response
    if (!response.data?.authenticate?.sessionToken) {
      return {
        message: 'An unexpected error occurred',
        formData: { email, password }
      };
    }

    // Set the auth token cookie
    await (await cookies()).set('keystonejs-session', response.data.authenticate.sessionToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to authenticate',
      formData: { email, password }
    };
  }

  // Validate and sanitize the from URL to prevent open redirect vulnerabilities

  // Redirect must be outside of try/catch
  redirect(from);
}

export async function signUp(prevState: { message: string | null, formData: { email: string, password: string } }, formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = email.split('@')[0]; // Simple name derivation

    // Create user
    const createQuery = `
      mutation($email: String!, $name: String!, $password: String!) {
        createUser(data: { email: $email, name: $name, password: $password }) {
          id
          email
          name
        }
      }
    `;

    const response = await keystoneClient(createQuery, { email, name, password });

    if (!response.success) {
      return {
        message: `Failed to create user: ${response.error}`,
        formData: { email, password }
      };
    }

    // Sign them in after creation
    return signIn({ message: null, formData: { email, password } }, formData);
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'An error occurred',
      formData: {
        email: formData.get('email') as string,
        password: formData.get('password') as string
      }
    };
  }
}

export async function signOut() {
  try {
    const query = `
      mutation {
        endSession
      }
    `;

    const response = await keystoneClient(query);

    // Always remove the auth token cookie, even if the mutation fails
    // This ensures the user is signed out locally
    await removeAuthToken();

    // CRITICAL: Clear Next.js router cache to prevent stale data
    revalidatePath("/", "layout");

    if (!response.success) {
      console.error(`Failed to sign out: ${response.error}`);
      // Still redirect even if server logout fails, since we cleared the cookie
    }
  } catch (error) {
    // Still remove the cookie even if there's an error
    await removeAuthToken();
    // Clear cache even on error
    revalidatePath("/", "layout");
    console.error("Logout error:", error instanceof Error ? error.message : 'An error occurred');
  }
  
  // Always redirect after logout attempt
  redirect("/dashboard/signin");
}

export async function createInitialUser(prevState: { message: string | null, formData: { name: string, email: string, password: string } }, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const listKey = "User";

  const query = `
    mutation($data: CreateInitial${listKey}Input!) {
      authenticate: createInitial${listKey}(data: $data) {
        ... on ${listKey}AuthenticationWithPasswordSuccess {
          item {
            id
          }
        }
      }
    }
  `;

  try {
    const response = await keystoneClient(query, {
      data: { name, email, password }
    });

    if (!response.success) {
      return {
        message: `Failed to create initial user: ${response.error}`,
        formData: { name, email, password }
      };
    }

    return {
      data: response.data,
      formData: { name, email, password }
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Failed to create initial user',
      formData: { name, email, password }
    };
  }
}

export async function resetPassword(prevState: { message: string | null, success: string | null, formData: { email: string, password: string } }, formData: FormData, mode: 'reset' | 'request') {
  const email = formData.get('email') as string;

  if (mode === 'reset') {
    const password = formData.get('password') as string;
    const token = formData.get('token') as string;

    const query = `
      mutation($email: String!, $password: String!, $token: String!) {
        redeemUserPasswordResetToken(
          email: $email
          token: $token
          password: $password
        ) {
          code
          message
        }
      }
    `;

    try {
      const response = await keystoneClient<RedeemTokenResponse>(query, { email, password, token });

      if (!response.success) {
        return {
          message: `Password reset failed: ${response.error}`,
          formData: { email, password }
        };
      }

      if (response.data?.redeemUserPasswordResetToken?.code) {
        return {
          message: response.data.redeemUserPasswordResetToken.message,
          formData: { email, password }
        };
      }

      return {
        success: 'Password has been reset. You can now sign in.',
        formData: { email, password }
      };
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Reset operation failed',
        formData: { email, password }
      };
    }
  } else {
    // Request reset
    const query = `
      mutation($email: String!) {
        sendUserPasswordResetLink(email: $email)
      }
    `;

    try {
      const response = await keystoneClient<SendLinkResponse>(query, { email });

      if (!response.success) {
        return {
          message: `Password reset request failed: ${response.error}`,
          formData: { email, password: '' }
        };
      }

      if (response.data?.sendUserPasswordResetLink === true) {
        return {
          success: 'Password reset link has been sent to your email.',
          formData: { email, password: '' }
        };
      } else {
        return {
          message: 'Password reset request failed',
          formData: { email, password: '' }
        };
      }
    } catch (error) {
      return {
        message: error instanceof Error ? error.message : 'Reset operation failed',
        formData: { email, password: '' }
      };
    }
  }
}

export async function getAuthenticatedUser() {
  const query = `
    query AuthenticatedUser {
      authenticatedItem {
        ... on User {
          id
          email
          name
          role {
            canAccessDashboard
          }
        }
      }
    }
  `;

  const response = await keystoneClient(query);

  return response;
}

export async function getAuthHeaders() {
  'use server';
  const cookieStore = await cookies();
  const keystoneCookie = cookieStore.get('keystonejs-session')?.value;
  return keystoneCookie ? {
    Cookie: `keystonejs-session=${keystoneCookie}`
  } : {};
}