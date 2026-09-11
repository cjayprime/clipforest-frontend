import { useRouter } from 'next/router';
import { ClipEditor } from '@/components/clip-editor';
import { Spinner } from '@/components/ui';

export default function ClipPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  if (!router.isReady || !id) return <Spinner label="Loading clip" />;
  return <ClipEditor key={id} id={id} />;
}
