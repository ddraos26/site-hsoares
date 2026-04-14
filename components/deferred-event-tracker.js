'use client';

import dynamic from 'next/dynamic';

const EventTracker = dynamic(() => import('@/components/event-tracker').then((mod) => mod.EventTracker), {
  ssr: false
});

export function DeferredEventTracker() {
  return <EventTracker />;
}
