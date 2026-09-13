import { AuthForm } from '@/components/auth-form';
import type { ClipRoverPage } from './_app';

const SignInPage: ClipRoverPage = () => <AuthForm mode="sign-in" />;
SignInPage.public = true;

export default SignInPage;
