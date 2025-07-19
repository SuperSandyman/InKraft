# InKraft Webhook Integration

InKraft supports webhook integration to automatically trigger deployments and other actions when content is updated in your GitHub repository.

## Quick Setup

1. Add webhook configuration to your `cms.config.json`:

```json
{
    "webhooks": {
        "enabled": true,
        "secret": "your-webhook-secret-here",
        "endpoints": [
            {
                "name": "vercel-deploy",
                "url": "https://api.vercel.com/v1/integrations/deploy/your-deploy-hook-url",
                "type": "vercel",
                "events": ["push"]
            }
        ]
    }
}
```

2. Set up GitHub webhook:
   - Go to your content repository Settings → Webhooks
   - Add webhook with URL: `https://your-inkraft-domain.com/api/webhook`
   - Set Content type: `application/json`
   - Select "Push" events

3. Configure your platform deploy hooks (Vercel/Netlify)

## Configuration Options

### Webhook Config
- **enabled** (boolean): Enable/disable webhook functionality
- **secret** (string, optional): GitHub webhook secret for signature verification
- **endpoints** (array): List of webhook endpoints to trigger

### Endpoint Configuration
- **name** (string): Human-readable name for the endpoint
- **url** (string): The webhook URL to call
- **type** (string): Type of webhook (`vercel`, `netlify`, or `custom`)
- **events** (array, optional): GitHub events to process (defaults to all if not specified)

## Platform Setup

### Vercel
1. Go to project settings → Git → Deploy Hooks
2. Create a new deploy hook
3. Copy the URL to your webhook configuration

### Netlify
1. Go to site settings → Build & deploy → Build hooks
2. Create a new build hook
3. Copy the URL to your webhook configuration

## Supported Events
- **push**: Code pushed to repository
- **create**: Branch or tag created
- **delete**: Branch or tag deleted

## Security
- Use webhook secrets for signature verification
- Only enable for trusted repositories
- Monitor logs for suspicious activity

## Example Complete Configuration

```json
{
    "targetRepository": "username/content-repo",
    "draftDirectory": "draft",
    "content": [
        {
            "directory": "posts",
            "articleFile": "index.md",
            "imageDirInsideContent": true,
            "metaCache": {
                "type": "json",
                "path": "posts/index.json"
            }
        }
    ],
    "webhooks": {
        "enabled": true,
        "secret": "your-github-webhook-secret",
        "endpoints": [
            {
                "name": "vercel-production",
                "url": "https://api.vercel.com/v1/integrations/deploy/your-hook-id",
                "type": "vercel",
                "events": ["push"]
            },
            {
                "name": "netlify-preview",
                "url": "https://api.netlify.com/build_hooks/your-hook-id",
                "type": "netlify",
                "events": ["push", "create"]
            }
        ]
    }
}
```