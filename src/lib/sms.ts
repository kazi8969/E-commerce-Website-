export interface SMSProviderConfig {
  apiKey: string;
  senderId: string;
  isActive: boolean;
}

// Mock Bangladesh SMS Gateway API
export async function sendSMS(phone: string, message: string, config: SMSProviderConfig): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`[SMS Gateway] Sending SMS to ${phone}...`);
  
  if (!config.isActive) {
    console.warn('[SMS Gateway] SMS provider is disabled. Message not sent.');
    return { success: false, error: 'SMS provider is disabled' };
  }

  if (!config.apiKey || !config.senderId) {
    console.error('[SMS Gateway] Missing API Key or Sender ID.');
    return { success: false, error: 'Invalid configuration' };
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Simulate sending success
  console.log(`[SMS Gateway] Successfully sent message via ${config.senderId} to ${phone}`);
  console.log(`[SMS Gateway] Content: "${message}"`);
  
  return { 
    success: true, 
    messageId: `BD-SMS-${Math.floor(Math.random() * 1000000)}` 
  };
}
