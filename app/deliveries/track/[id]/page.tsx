import { DeliveryTrackingClient } from './delivery-tracking-client';

// Generate a placeholder param to satisfy static export requirements
// Actual delivery IDs will be handled client-side
export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function DeliveryTrackingPage() {
  return <DeliveryTrackingClient />;
}
