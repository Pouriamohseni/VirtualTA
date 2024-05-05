import  Admin  from '/components/admin-event-logs';
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

const page = () => {
    const queryClient = new QueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Admin />
    </HydrationBoundary>
  );
}
export default page