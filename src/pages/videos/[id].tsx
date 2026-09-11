import { useRouter } from 'next/router';
import { Spinner } from '@/components/ui';
import { VideoScreen } from '@/components/video-screen';

export default function VideoPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;
  if (!router.isReady || !id) return <Spinner label="Loading video" />;
  // Keyed so switching videos resets local UI state.
  return <VideoScreen key={id} id={id} />;
}
