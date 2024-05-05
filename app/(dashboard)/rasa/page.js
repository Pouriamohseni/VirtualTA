'use client';

import { useState, useEffect } from 'react';
import Rasa from '/components/Rasa';
import { useRouter } from 'next/navigation'; 
import { QueryClient, HydrationBoundary, dehydrate } from '@tanstack/react-query';

const Page = () => {
    const router = useRouter(); // This is the correct hook for client components
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 0,  // Ensure data is not considered fresh on new render
            },
        },
    });
    
    const [threadId, setThreadId] = useState(null);

    useEffect(() => {
        console.log('Router ready state:', router.isReady);
        console.log('Current URL query:', router.query);
        if (router.isReady) {
            const newThreadId = router.query.thread;
            if (newThreadId !== threadId) {  // Only update if there's a real change
                console.log('Updating threadId to:', newThreadId);
                setThreadId(newThreadId);
            }
        }
    }, [router.isReady, router.query, threadId]);    
    
    // known issue where threadId is not being passed to Rasa component
    return (
        <HydrationBoundary key={threadId} state={dehydrate(queryClient)}>
            <Rasa threadId={threadId} /> 
        </HydrationBoundary>
    );
}

export default Page;
