# Setting Up Automated Monthly Sessions

This document explains how to set up the automatic creation of monthly sessions for the All Hands application.

## How It Works

The application includes an API endpoint that creates a new session for the current month if one doesn't already exist. This endpoint can be triggered in two ways:

1. Manually through the command line
2. Automatically using a cron job service

## Manual Triggering

To manually create a session for the current month:

```bash
npm run create-session
```

This script will:
- Check if a session for the current month already exists
- If not, create a new active session for the current month
- Deactivate any previously active sessions

## Setting Up a Cron Job

### Using a Cron Job Service (recommended)

You can use services like Vercel Cron Jobs, AWS Lambda with EventBridge, or similar providers:

#### Vercel Cron Jobs (if deploying on Vercel)

1. Add the following to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-session",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

This will trigger the endpoint at midnight on the first day of every month.

#### AWS EventBridge with Lambda (alternative)

1. Create a Lambda function that makes an HTTP request to your API endpoint
2. Set up an EventBridge rule to trigger the Lambda on a schedule (first day of each month)
3. Make sure to include the `x-api-key` header in your request with the value from your environment variables

### Using Traditional Cron (self-hosted)

If you're self-hosting, add a cron job to your server:

```bash
# Run at midnight on the first day of each month
0 0 1 * * curl -X GET https://your-domain.com/api/cron/monthly-session -H "x-api-key: your-api-key"
```

Replace `your-domain.com` with your actual domain and `your-api-key` with the value of `CRON_API_KEY` from your environment variables.

## Security Considerations

- The API endpoint is protected with an API key. Make sure to set a strong, random value for `CRON_API_KEY` in your environment variables.
- Keep your API key secret and never expose it in client-side code.
- In production, use HTTPS for all API calls to ensure the API key is transmitted securely. 