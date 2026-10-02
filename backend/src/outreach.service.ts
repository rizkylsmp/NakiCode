// Compatibility guard for older local callers.
export async function sendOutreachTemplate(_id: number): Promise<never> {
  throw new Error('Pengiriman WhatsApp dinonaktifkan. Client Outreach hanya untuk riset dan pencatatan.');
}
