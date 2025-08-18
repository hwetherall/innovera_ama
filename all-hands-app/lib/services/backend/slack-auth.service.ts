import crypto from 'crypto';
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
 * Computes the HMAC-SHA256 signature for the given base string
 * @param sigBaseString - The signature base string (v0:timestamp:body)
 * @returns The computed signature with v0= prefix
 */
function computeSignature(sigBaseString: string): string {
    const hmac = crypto.createHmac('sha256', SLACK_SIGNING_SECRET!);
    hmac.update(sigBaseString);
    const hash = hmac.digest('hex');
    return `v0=${hash}`;
}

/**
 * Compares two signatures using timing-safe comparison to prevent timing attacks
 * @param expectedSignature - The signature we computed
 * @param receivedSignature - The signature from the request
 * @returns true if signatures match, false otherwise
 */
function compareSignatures(expectedSignature: string, receivedSignature: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(receivedSignature)
  );
}

export const SlackAuthService = {
  /**
   * Verifies that a request is coming from Slack by validating the signature
   * @param body - The raw request body as a string
   * @param headers - The request headers containing Slack signature and timestamp
   * @returns true if the request is verified to be from Slack, false otherwise
   */
  verifySlackRequest(body: string, headers: SlackRequestHeaders): boolean {
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
      const expectedSignature = computeSignature(sigBaseString);

      // Compare signatures using timing-safe comparison
      return compareSignatures(expectedSignature, slackSignature);
    } catch (error) {
      console.error('Error verifying Slack request:', error);
      return false;
    }
  }
};
