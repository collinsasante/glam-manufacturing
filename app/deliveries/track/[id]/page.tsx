import { DeliveryTrackingClient } from './delivery-tracking-client';

export function generateStaticParams() {
  return [];
}

export const dynamic = 'force-static';
export const dynamicParams = true;

export default function DeliveryTrackingPage() {
  return <DeliveryTrackingClient />;
}
