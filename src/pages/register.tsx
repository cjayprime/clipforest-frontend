import { AuthForm } from '@/components/auth-form';
import type { ClipForestPage } from './_app';

const RegisterPage: ClipForestPage = () => <AuthForm mode="register" />;
RegisterPage.public = true;

export default RegisterPage;
