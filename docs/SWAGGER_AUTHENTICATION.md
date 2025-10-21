# Swagger Authentication

This document explains how to configure and use the Swagger authentication feature for the EduWorldWide API documentation.

## Overview

The Swagger documentation is protected with Basic Authentication to prevent unauthorized access. This ensures that only authorized users can view the API documentation.

## Configuration

### Local Development

1. Add the following environment variables to your `.env` file:
   ```
   SWAGGER_USER="admin"
   SWAGGER_PASSWORD="your-secure-password"
   ```

2. If you don't have these variables set, the authentication will be skipped (useful for development).

### Production Deployment

The deployment workflow automatically includes these environment variables from GitHub Secrets:

1. Set the following secrets in your GitHub repository:
   - `SWAGGER_USER`: The username for Swagger authentication
   - `SWAGGER_PASSWORD`: The password for Swagger authentication

2. The deployment workflow (`.github/workflows/deploy.yml`) will automatically add these to the production environment.

## Accessing Swagger Documentation

1. Navigate to `/api` on your running application (e.g., `http://localhost:3000/api`)
2. You will be prompted for a username and password
3. Enter the credentials configured in your environment variables
4. You will now have access to the Swagger UI documentation

## Security Considerations

1. **Use strong passwords**: Always use strong, unique passwords for Swagger authentication
2. **Environment variables**: Never commit credentials to your repository
3. **HTTPS**: In production, ensure your application is served over HTTPS to protect the Basic Authentication credentials
4. **Regular rotation**: Consider rotating your Swagger credentials periodically

## Testing

You can test the authentication using the provided test script:

```bash
node test-swagger-auth.js
```

This script will:
1. Test without credentials (should return 401)
2. Test with correct credentials (should return 200)

## Implementation Details

The authentication is implemented using:
- A custom middleware (`src/common/middleware/swagger-auth.middleware.ts`)
- Applied only to the `/api` route in `src/main.ts`
- Uses HTTP Basic Authentication standard
- Gracefully handles missing environment variables

## Troubleshooting

### Authentication Not Working
1. Verify the environment variables are set correctly
2. Check that there are no typos in the username/password
3. Ensure the server has been restarted after adding the environment variables

### Can't Access Swagger
1. Verify you're using the correct URL (`/api`)
2. Check if your browser has cached old credentials (try incognito mode)
3. Ensure the server is running and accessible

### Deployment Issues
1. Verify the GitHub secrets are set correctly
2. Check the deployment logs for any errors
3. Ensure the environment variables are being passed to the Docker container