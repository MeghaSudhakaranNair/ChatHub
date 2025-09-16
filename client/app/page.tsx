/**
 * Google OAuth login component for authenticating users via Google accounts.
 *
 * - Wraps the app content inside GoogleOAuthProvider providing the app's Google client ID.
 * - Uses useGoogleLogin hook from '@react-oauth/google' to initiate the OAuth login flow.
 * - On successful login, sends the received Google access token securely to the backend API (/api/auth/google-auth).
 * - Await backend validation and user creation/authentication and retrieves the authenticated user's info.
 * - Sets the authenticated user in the global auth context to share user state app-wide.
 * - Redirects the user to the main chat page after successful login.
 * - Applies styled Material UI Button with custom colors for login action.
 * - Handles and logs errors during login or backend communication.
 *
 * This component enables seamless integration of Google OAuth login in a React app,
 * managing authentication state and routing post-login, using best practices for security,
 * user experience, and state management.
 */
"use client";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

import { Button, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/authContext";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

const GoogleLoginButton = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(
          "http://localhost:5001/api/auth/google-auth",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: tokenResponse.access_token,
            }),
          }
        );

        if (response.ok) {
          router.push("/chat");
          const userData = await response.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error("Backend error:", error);
      }
    },
    onError: (error: unknown) => {
      console.error("Login failed:", error);
    },
  });

  return (
    <>
      <Button
        variant="contained"
        onClick={() => login()}
        sx={{
          mt: 3,
          px: 4,
          py: 1.5,
          backgroundColor: "#000000",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#333333",
          },
        }}
      >
        Login
      </Button>
    </>
  );
};

export default function HomePage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#93C572",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          component="header"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            paddingBottom: "1rem",
            paddingRight: "1rem",
            backgroundColor: "#f5f5f5",
          }}
        >
          <GoogleLoginButton />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#000",
            textAlign: "center",
            px: 2,
          }}
        >
          <Typography variant="h4" component="h2" sx={{ maxWidth: 900 }}>
            Welcome to ChatLive — Connect instantly, communicate seamlessly, and
            experience the power of live conversations.
          </Typography>
        </Box>
      </Box>
    </GoogleOAuthProvider>
  );
}
