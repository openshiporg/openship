import { redirect } from "next/navigation";
import { SignUpForm } from "./SignUpForm";
import { publicSignUpsAllowed } from "../../lib/authFlow";

export function SignUpPage() {
  if (!publicSignUpsAllowed()) {
    redirect('/dashboard/signin');
  }

  return <SignUpForm />;
}

export default SignUpPage;