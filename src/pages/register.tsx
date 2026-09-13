import { AuthForm } from '@/components/auth-form';
import type { ClipRoverPage } from './_app';

const RegisterPage: ClipRoverPage = () => <AuthForm mode="register" />;
RegisterPage.public = true;

export default RegisterPage;
