"use client";
import React, { useEffect, useState, FormEvent, useRef } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemButton,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ChatMessages from "../components/ChatMessages";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/authContext";
interface ChatRoom {
  id: number;
  name: string;
}
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

export default function ChatRoomsSidebar() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const socket = useRef<Socket | null>(null);
  const [allRooms, setAllRooms] = useState<ChatRoom[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  const { user, setUser } = useAuth();
  const router = useRouter();
  /**
   * React useEffect hooks in this component manage side effects related to:
   *
   * 1. Socket Connection Setup and Cleanup:
   *    - Establishes socket connection when the component mounts.
   *    - Cleans up by disconnecting socket when component unmounts.
   *
   * 2. Joining and Leaving Chat Rooms:
   *    - Emits 'joinRoom' event to socket server whenever the selected chat room changes.
   *    - Cleans up by emitting 'leaveRoom' event for the previously selected room.
   *
   * 3. Socket Event Listeners for Real-time Updates:
   *    - Listens to 'newMessage' and 'onlineUsers' socket events to update local state.
   *    - Removes these listeners when component unmounts to prevent memory leaks.
   *
   * 4. Fetching Chat Messages:
   *    - Retrieves all messages for the currently selected room via HTTP GET.
   *    - Runs on initialization and whenever selected room changes.
   *
   * 5. Fetching User's Chat Rooms on Component Mount:
   *    - Loads the list of chat rooms that the current user is a member of.
   *    - Sets the first room as selected by default.
   *
   * 6. Rejoining Room On User or Room Change:
   *    - Re-emits 'joinRoom' if either the selected room or authenticated user changes.
   *    - Cleans up by leaving the old room to avoid duplicate socket presence.
   *
   * Together, these effects maintain synchronization between the UI state and backend/socket server,
   * ensuring real-time chat data correctness and resource cleanup.
   */
  useEffect(() => {
    socket.current = io("http://localhost:5001", { withCredentials: true });

    socket.current.on("connect", () => {
      console.log("Connected with socket ID:", socket.current?.id);
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedRoom || !socket.current) return;

    socket.current.emit("joinRoom", selectedRoom.id, {
      id: user?.id,
      name: user?.name,
      photoUrl: user?.photoUrl,
    });

    return () => {
      socket.current?.emit("leaveRoom", selectedRoom.id);
    };
  }, [selectedRoom]);

  useEffect(() => {
    if (!socket.current) return;

    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };
    const handleOnlineUsers = (users: User[]) => {
      setOnlineUsers(users);
    };

    socket.current.on("newMessage", handleNewMessage);
    socket.current.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.current?.off("newMessage", handleNewMessage);
      socket.current?.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    fetch(`http://localhost:5001/chatRooms/${selectedRoom.id}/messages`, {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error("Fetch messages error:", err));
  }, [selectedRoom]);

  useEffect(() => {
    fetch("http://localhost:5001/chatRooms/myRooms", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch chat rooms");
        return res.json();
      })
      .then((response) => {
        // The chat rooms array is inside response.data

        const rooms: ChatRoom[] = response.data.map((item: any) => ({
          id: item.room.id,
          name: item.room.name,
        }));

        setChatRooms(rooms);
        if (rooms.length > 0) {
          setSelectedRoom(rooms[0]); // Select the first room automatically
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedRoom || !socket.current || !user) return;

    socket.current.emit("joinRoom", selectedRoom.id, {
      id: user.id,
      name: user.name,
      photoUrl: user?.photoUrl,
    });

    return () => {
      socket.current?.emit("leaveRoom", selectedRoom.id);
    };
  }, [selectedRoom, user]);
  /**
   * Creates a new chat room by sending a POST request to the server.
   *
   * @param {FormEvent} e - The form submission event.
   * @returns {Promise<void>} Resolves when the room is created and state is updated.
   *
   * @throws Will alert the user if the server responds with an error or
   *         if the room name input is empty.
   */
  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await fetch("http://localhost:5001/chatRooms", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error creating room");
      }

      const createdRoom: ChatRoom = await res.json();
      setChatRooms((prev) => [...prev, createdRoom]);
      setSelectedRoom(createdRoom);
      setNewRoomName("");
      setShowAddDialog(false);
    } catch (err: any) {
      alert(err.message);
    }
  };
  /**
   * Sends a message to the currently selected chat room.
   *
   * @param {string} text - The content of the message to send.
   * @returns {Promise<void>} Resolves when message is successfully sent.
   *
   * @throws Logs error to console if sending fails.
   */
  const handleSendMessage = async (text: string) => {
    if (!selectedRoom) return;

    try {
      await fetch(
        `http://localhost:5001/chatRooms/${selectedRoom.id}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );
      // Don't manually update messages here
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };
  /**
   * Fetches all available chat rooms and opens the dialog
   * allowing users to join or create chat rooms.
   *
   * @returns {Promise<void>} Resolves when rooms are fetched and dialog is shown.
   *
   * @throws Alerts the user if fetching rooms fails.
   */
  const handleAddChatRoom = async () => {
    setShowAddDialog(true);
    try {
      const res = await fetch("http://localhost:5001/chatRooms/allRooms", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setAllRooms(data);
      setShowAddDialog(true);
    } catch (err) {
      alert("Failed to load rooms: " + (err as Error).message);
    }
  };
  /**
   * Joins an existing chat room by its ID, adding it to the user's chat rooms list.
   *
   * @param {ChatRoom} room - The chat room to join.
   * @returns {Promise<void>} Resolves when successfully joined and state updated.
   *
   * @throws Alerts the user if joining the room fails or server returns error.
   */
  const handleJoinRoom = async (room: ChatRoom) => {
    try {
      const res = await fetch(
        `http://localhost:5001/chatRooms/${room.id}/join`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to join room");
      }

      const joinedRoom = await res.json();
      setChatRooms((prev) => [...prev, joinedRoom]);

      setSelectedRoom(joinedRoom);
      setNewRoomName("");
      setShowAddDialog(false);
    } catch (err: any) {
      alert(`Error joining room: ${err.message}`);
    }
  };
  /**
   * Logs the current user out by calling the logout API.
   * Clears user session from context and navigates to the home page.
   *
   * @returns {Promise<void>} Resolves when logout completes.
   *
   * @throws Logs errors to the console if logout fails.
   */
  const handleLogout = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      setUser(null);

      if (response.ok) {
        router.push("/");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          height: "100vh",
          bgcolor: "#FFFFFF",
        }}
      >
        <Box sx={{ width: 280, bgcolor: "#93C572" }}>
          <Drawer variant="permanent" anchor="left" open>
            <Box sx={{ width: 280, p: 2, height: "100vh", bgcolor: "#93C572" }}>
              {user && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                    bgcolor: "#82b74b",
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <Avatar src={user.photoUrl} alt={user.name} />
                  <Typography variant="subtitle1" sx={{ color: "#000" }}>
                    {user.name}
                  </Typography>
                </Box>
              )}

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Chat Rooms</Typography>
                <IconButton size="small" onClick={handleAddChatRoom}>
                  <AddIcon />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Typography>Loading...</Typography>
              ) : chatRooms.length === 0 ? (
                <Typography
                  align="center"
                  sx={{ color: "text.secondary", mt: 4 }}
                >
                  No chat rooms
                </Typography>
              ) : (
                <List>
                  {chatRooms.map((room, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => {
                        setSelectedRoom(room); // This triggers useEffect below
                      }}
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.08)", // subtle hover color
                          cursor: "pointer",
                        },
                      }}
                    >
                      <ListItemText primary={room?.name} />
                    </ListItemButton>
                  ))}
                </List>
              )}

              {error && <Typography color="error">Error: {error}</Typography>}
            </Box>
            <Box
              sx={{ position: "absolute", bottom: 16, width: "100%", px: 2 }}
            >
              <Button
                variant="outlined"
                fullWidth
                sx={{ backgroundColor: "#000000", color: "#FFFFFF" }}
                onClick={handleLogout} // Your logout handler function
              >
                Logout
              </Button>
            </Box>
          </Drawer>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            height: "100vh",
            bgcolor: "#fff",
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            px={2}
            mb={2}
            sx={{ flexShrink: 0 }}
          >
            <Typography variant="h6" color="#000000">
              {selectedRoom?.name || "Select Room"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {onlineUsers.map((user, index) => (
                <Avatar
                  key={index}
                  src={user.photoUrl}
                  alt={user.name}
                  sx={{ width: 32, height: 32 }}
                />
              ))}
            </Box>
          </Box>
          <Box
            sx={{
              flexGrow: 1, // fill remaining space
              overflowY: "auto",
            }}
          >
            <ChatMessages
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          </Box>
        </Box>
      </Box>

      {/* Add Room Dialog Modal */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Join Chat Room</DialogTitle>
        <form onSubmit={handleCreateRoom}>
          <DialogContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <TextField
                margin="dense"
                label="Room Name"
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                sx={{ width: "70%" }}
                required
              />
              <Button type="submit" variant="contained" color="primary">
                Create
              </Button>
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Or join an existing room:
            </Typography>
            <List dense sx={{ maxHeight: 200, overflowY: "auto" }}>
              {allRooms.map((room) => (
                <ListItem
                  key={room.id}
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleJoinRoom(room)}
                    >
                      Join
                    </Button>
                  }
                  disablePadding
                >
                  <ListItemText primary={room.name} />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
