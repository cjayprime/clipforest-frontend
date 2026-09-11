import { AuthForm } from '@/components/auth-form';
import type { ClipForestPage } from './_app';

const SignInPage: ClipForestPage = () => <AuthForm mode="sign-in" />;
SignInPage.public = true;

export default SignInPage;
