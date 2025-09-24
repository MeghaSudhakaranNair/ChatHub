"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Paper,
  Avatar,
  keyframes,
} from "@mui/material";
import { useAuth } from "../context/authContext";
import { CircularProgress } from "@mui/material";
export interface User {
  id: number;
  email: string;
  name: string;
  photoUrl: string;
  createdAt: string;
}
export interface Message {
  id: number;
  content: string;
  createdAt: string;
  user: User;
}

interface ChatMessagesProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export default function ChatMessages({
  messages,
  onSendMessage,
}: ChatMessagesProps) {
  const [input, setInput] = useState("");
  const { user, isLoading } = useAuth(); // get user from context
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loggedInUserName = user?.name;
  const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(214, 230, 248, 0.7);
  }
  70% {
    transform: scale(.75);
    box-shadow: 0 0 0 10px rgba(214, 230, 248, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(214, 230, 248, 0);
  }
`;
  /**
   * Smoothly scrolls the chat container to the bottom whenever the messages array updates.
   * This ensures the latest messages are always visible without user intervention.
   *
   * Dependencies:
   * - messages: scrolls on any new message added.
   */
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);
  /**
   * Handles the event when the user clicks the "Send" button.
   * It triggers sending the message if input is not empty, then clears the input field.
   *
   * No parameters or return value.
   */
  const handleSendClick = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };
  const memoizedMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return (
        <Typography color="text.secondary" align="center">
          No conversations
        </Typography>
      );
    }
    return (
      <List>
        {messages.map((message) => {
          const isOwnMessage = user ? message.user.id === user.id : false;
          const isAssistantMessage = message.user.id === 4;
          return (
            <Box
              key={message.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: isOwnMessage ? "flex-end" : "flex-start",
                mb: 1,
              }}
            >
              <Avatar
                alt={message.user.name}
                src={message.user.photoUrl}
                sx={{
                  width: 36,
                  height: 36,
                  marginBottom: "5px", // Apply conditional styles for the AI avatar
                  marginLeft: "5px",
                  bgcolor: isAssistantMessage ? "#D6E6F8" : undefined,
                  color: isAssistantMessage ? "black" : undefined,
                  animation: isAssistantMessage
                    ? `${pulseAnimation} 2s infinite ease-out`
                    : undefined,
                }}
              >
                {isAssistantMessage && "AI"}
              </Avatar>
              <Paper
                sx={{
                  bgcolor: isOwnMessage
                    ? "#DCF8C6"
                    : isAssistantMessage
                    ? "#D6E6F8"
                    : "#E5E5EA",
                  color: "black",
                  p: 2,
                  borderRadius: 6,
                  boxShadow: "none",
                  wordWrap: "break-word",
                }}
              >
                <Typography variant="body1">{message.content}</Typography>
              </Paper>
              <Typography
                variant="caption"
                sx={{
                  alignSelf: isOwnMessage ? "flex-end" : "flex-start",
                  color: "#000000",
                }}
              >
                {new Date(message.createdAt).toLocaleTimeString()}
              </Typography>
            </Box>
          );
        })}
      </List>
    );
  }, [messages, user]);
  if (isLoading || !user) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          bgcolor: "#ffffff",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          mb: 2,
          "&::-webkit-scrollbar": {
            display: "none",
          },

          msOverflowStyle: "none",

          scrollbarWidth: "none",
        }}
      >
        {memoizedMessages}
      </Box>

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendClick();
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <TextField
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message"
            fullWidth
            multiline
            maxRows={4}
          />
          <Button onClick={handleSendClick} variant="contained" sx={{ mt: 1 }}>
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
