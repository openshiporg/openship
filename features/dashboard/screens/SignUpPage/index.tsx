import { redirect } from "next/navigation";
import { SignUpForm } from "./SignUpForm";

export function SignUpPage() {
  const publicSignUpsAllowed = process.env.PUBLIC_SIGNUPS_ALLOWED === 'true';
  
  if (!publicSignUpsAllowed) {
    redirect('/dashboard/signin');
  }

  return <SignUpForm />;
}

export default SignUpPage;