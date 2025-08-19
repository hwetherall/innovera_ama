import { SlackRequestHeaders } from '@/types/slack';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
const MAX_REQUEST_AGE_MINUTES = 5;

/**
 * Validates that the request timestamp is recent (within 5 minutes)
 * @param timestamp - The timestamp from the Slack request
 * @returns true if the timestamp is valid, false otherwise
 */
function isTimestampValid(timestamp: string): boolean {
  const requestTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(currentTime - requestTime);
  
  return timeDifference <= MAX_REQUEST_AGE_MINUTES * 60;
}

/**
 * Computes the HMAC-SHA256 signature for the given base string using Web Crypto API
 * @param sigBaseString - The signature base string (v0:timestamp:body)
 * @returns The computed signature with v0= prefix
 */
async function computeSignature(sigBaseString: string): Promise<string> {
    // Convert secret and message to Uint8Array
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SLACK_SIGNING_SECRET!);
    const messageData = encoder.encode(sigBaseString);
    
    // Import the key for HMAC
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    // Sign the message
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `v0=${hashHex}`;
}

/**
 * Compares two signatures using timing-safe comparison to prevent timing attacks
 * Edge Runtime compatible implementation
 * @param expectedSignature - The signature we computed
 * @param receivedSignature - The signature from the request
 * @returns true if signatures match, false otherwise
 */
function compareSignatures(expectedSignature: string, receivedSignature: string): boolean {
  // Ensure both strings are the same length
  if (expectedSignature.length !== receivedSignature.length) {
    return false;
  }
  
  // Timing-safe comparison
  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ receivedSignature.charCodeAt(i);
  }
  
  return result === 0;
}

export const SlackAuthService = {
  /**
   * Verifies that a request is coming from Slack by validating the signature
   * @param body - The raw request body as a string
   * @param headers - The request headers containing Slack signature and timestamp
   * @returns true if the request is verified to be from Slack, false otherwise
   */
  async verifySlackRequest(body: string, headers: SlackRequestHeaders): Promise<boolean> {
    try {
      // Check if signing secret is configured
      if (!SLACK_SIGNING_SECRET) {
        console.error('SLACK_SIGNING_SECRET is not configured');
        return false;
      }

      const slackSignature = headers['x-slack-signature'];
      const timestamp = headers['x-slack-request-timestamp'];

      // Validate required headers are present
      if (!slackSignature || !timestamp) {
        console.error('Missing required Slack headers');
        return false;
      }

      // Check timestamp to prevent replay attacks
      if (!isTimestampValid(timestamp)) {
        console.error('Request timestamp is too old or invalid');
        return false;
      }

      // Create the signature base string
      const sigBaseString = `v0:${timestamp}:${body}`;

      // Compute the expected signature
      const expectedSignature = await computeSignature(sigBaseString);

      // Compare signatures using timing-safe comparison
      return compareSignatures(expectedSignature, slackSignature);
    } catch (error) {
      console.error('Error verifying Slack request:', error);
      return false;
    }
  }
};
