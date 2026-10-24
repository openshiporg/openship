'use server';

import { cookies } from 'next/headers';
import { keystoneClient } from '@/features/dashboard/lib/keystoneClient';
import { redirect } from 'next/navigation';
import { removeAuthToken } from '@/features/dashboard/lib/cookies';
import { revalidatePath } from 'next/cache';
import { PUBLIC_REQUEST_ERROR, safeErrorSummary, sanitizeDashboardRedirect } from '../lib/security';
import { passwordResetEmailAvailable, RESET_EMAIL_UNAVAILABLE } from '../lib/authFlow';

// Legacy storefront callers may pass a password in previous state; never return it.
type AuthState = { message: string | null; formData: { email: string; password?: string } };
const SIGN_IN_ERROR = 'Unable to sign in. Check your email and password and try again.';
const INITIAL_USER_ERROR = 'Unable to create the initial user.';

// keystoneClient errors are already reduced to Keystone's user-facing validation text
function withReason(base: string, error: string | undefined) {
  return error && error !== PUBLIC_REQUEST_ERROR ? `${base} ${error}` : `${base} Please try again.`;
}

export async function signIn(prevState: AuthState, formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const from = sanitizeDashboardRedirect(formData.get('from'));

  try {
    const response = await keystoneClient(`
      mutation($email: String!, $password: String!) {
        authenticate: authenticateUserWithPassword(email: $email, password: $password) {
          ... on UserAuthenticationWithPasswordSuccess { sessionToken }
          ... on UserAuthenticationWithPasswordFailure { message }
        }
      }
    `, { email, password });

    if (!response.success || response.data?.authenticate?.message || !response.data?.authenticate?.sessionToken) {
      return { message: SIGN_IN_ERROR, formData: { email } };
    }

    const cookieStore = await cookies();
    cookieStore.set('keystonejs-session', response.data.authenticate.sessionToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (error) {
    console.error('Sign-in failed:', safeErrorSummary(error));
    return { message: SIGN_IN_ERROR, formData: { email } };
  }

  // Next.js redirects throw; keep this outside the catch.
  redirect(from);
}

export async function signUp(prevState: AuthState, formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const name = email.split('@')[0];
  try {
    const response = await keystoneClient(`
      mutation($email: String!, $name: String!, $password: String!) {
        createUser(data: { email: $email, name: $name, password: $password }) { id }
      }
    `, { email, name, password });
    if (!response.success) {
      return { message: 'Unable to create an account. Please try again.', formData: { email } };
    }
  } catch (error) {
    console.error('Sign-up failed:', safeErrorSummary(error));
    return { message: 'Unable to create an account. Please try again.', formData: { email } };
  }
  return signIn({ message: null, formData: { email } }, formData);
}

export async function signOut() {
  try {
    await keystoneClient('mutation { endSession }');
  } catch (error) {
    console.error('Logout failed:', safeErrorSummary(error));
  }
  await removeAuthToken();
  revalidatePath('/', 'layout');
  redirect('/dashboard/signin');
}

export async function createInitialUser(
  prevState: { message: string | null; formData: { name: string; email: string } },
  formData: FormData
) {
  const name = String(formData.get('name') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  try {
    const response = await keystoneClient(`
      mutation($data: CreateInitialUserInput!) {
        authenticate: createInitialUser(data: $data) {
          ... on UserAuthenticationWithPasswordSuccess { item { id } }
        }
      }
    `, { data: { name, email, password } });
    if (!response.success) {
      return { message: withReason(INITIAL_USER_ERROR, response.error), formData: { name, email } };
    }
    return { data: response.data, formData: { name, email } };
  } catch (error) {
    console.error('Initial user creation failed:', safeErrorSummary(error));
    return { message: withReason(INITIAL_USER_ERROR, undefined), formData: { name, email } };
  }
}

export async function resetPassword(
  prevState: { message: string | null; success: string | null; formData: { email: string } },
  formData: FormData,
  mode: 'reset' | 'request'
) {
  const email = String(formData.get('email') || '');
  const failure = { message: 'Unable to reset your password. Please try again.', formData: { email } };
  try {
    if (mode === 'reset') {
      const response = await keystoneClient(`
        mutation($email: String!, $password: String!, $token: String!) {
          redeemUserPasswordResetToken(email: $email, token: $token, password: $password) { code }
        }
      `, { email, password: String(formData.get('password') || ''), token: String(formData.get('token') || '') });
      if (!response.success) {
        return { message: withReason('Unable to reset your password.', response.error), formData: { email } };
      }
      if (response.data?.redeemUserPasswordResetToken?.code) {
        return { message: 'This reset link is invalid or has expired. Request a new one.', formData: { email } };
      }
      return { success: 'Password has been reset. You can now sign in.', formData: { email } };
    }
    if (!passwordResetEmailAvailable()) {
      return { message: RESET_EMAIL_UNAVAILABLE, formData: { email } };
    }
    const response = await keystoneClient(`
      mutation($email: String!) { sendUserPasswordResetLink(email: $email) }
    `, { email });
    if (!response.success || response.data?.sendUserPasswordResetLink !== true) {
      return { message: 'Unable to send the reset email. Please try again, or ask an administrator to set a new password for you.', formData: { email } };
    }
    return { success: 'If an account exists for that email, a reset link has been sent to it.', formData: { email } };
  } catch (error) {
    console.error('Password reset failed:', safeErrorSummary(error));
    return failure;
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