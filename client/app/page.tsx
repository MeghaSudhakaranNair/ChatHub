"use client";

import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
// import { useState } from "react";
import { Button, Box, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/authContext";

// You must replace this with your actual Google Client ID
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

// A separate component to contain the login logic and button
const GoogleLoginButton = () => {
  // const [message, setMessage] = useState(
  //   "Click the button to sign in with Google"
  // );
  const router = useRouter();
  const { setUser } = useAuth();
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log(tokenResponse);
      // setMessage("Token received, sending to backend...");
      try {
        console.log("testing");
        const response = await fetch(
          "http://localhost:5001/api/auth/google-auth",
          {
            method: "POST",
            credentials: "include", // send cookies
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
          setUser(userData.user); // <- critical to update context state here!
        }
      } catch (error) {
        // setMessage(`Error: ${error.response?.data?.message || error.message}`);
        console.error("Backend error:", error);
      }
    },
    onError: (error: unknown) => {
      // setMessage("Login Failed!");
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
