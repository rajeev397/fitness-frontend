console.log("🚀 amplifyConfig loaded");
import { Amplify } from "aws-amplify";
import { COGNITO_CONFIG } from "./api/apiConfig";

console.log("Cognito config:", COGNITO_CONFIG);

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: COGNITO_CONFIG.userPoolId,
      userPoolClientId: COGNITO_CONFIG.userPoolClientId,
      loginWith: {
        email: true,
      },
    },
  },
});