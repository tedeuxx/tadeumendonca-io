// Amplify Auth configuration (/frontend/authentication). Cognito hosted-UI PKCE (Authorization Code):
// the SDK holds the JWTs and refreshes them; the SPA sends the access token as a Bearer to the BFF,
// and the API Gateway Cognito authorizer validates it. Redirect URLs derive from the live origin so
// the same build works on any host (they must match the Cognito app client's allowed callback/logout).
import { Amplify } from 'aws-amplify';
import { env } from '../env';

export function configureAmplify(): void {
  const origin = window.location.origin;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognito.userPoolId,
        userPoolClientId: env.cognito.clientId,
        loginWith: {
          oauth: {
            domain: env.cognito.domain,
            scopes: ['openid', 'email', 'profile'],
            redirectSignIn: [`${origin}/callback`],
            redirectSignOut: [`${origin}/`],
            responseType: 'code', // PKCE
          },
        },
      },
    },
  });
}
