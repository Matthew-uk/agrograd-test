"use client";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Heart, Send, Smile } from "lucide-react";
import io from "socket.io-client";

type Message = {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  reactions: number;
  userName: string;
};

type User = {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
};

const users: User[] = [
  {
    id: "1",
    name: "Alice",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "online",
  },
  {
    id: "2",
    name: "Bob",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "offline",
  },
  {
    id: "3",
    name: "Charlie",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "online",
  },
  {
    id: "4",
    name: "Diana",
    avatar: "/placeholder.svg?height=32&width=32",
    status: "offline",
  },
];

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<any>(null);

  // Connect to Socket.IO server
  useEffect(() => {
    socket.current = io("http://localhost:3001"); // replace with your backend URL

    // Join room
    socket.current.emit("joinRoom", {
      roomId: "general",
      userId: currentUser.id,
    });

    // Listen for messages from the server
    socket.current.on("message", (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Cleanup on component unmount
    return () => {
      socket.current.disconnect();
    };
  }, [currentUser]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: String(new Date().getTime()),
        roomId: "general",
        userId: currentUser.id,
        content: newMessage.trim(),
        timestamp: new Date(),
        reactions: 0,
        userName: currentUser.name,
      };
      // Emit the message to the backend
      socket.current.emit("sendMessage", message);
      setMessages((prevMessages) => [...prevMessages, message]);
      setNewMessage("");
      setIsTyping(false);
    }
  };

  const addReaction = (messageId: string) => {
    // Emit the reaction to the server or update locally
    setMessages(
      messages.map((msg) =>
        msg.id === messageId ? { ...msg, reactions: msg.reactions + 1 } : msg,
      ),
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className='flex h-screen bg-gray-100'>
      <div className='w-64 bg-white border-r border-gray-200 flex flex-col'>
        <div className='p-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold'>Users</h2>
        </div>
        <ScrollArea className='flex-grow'>
          {users.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center space-x-4 p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200",
                currentUser.id === user.id && "bg-blue-100",
              )}
              onClick={() => setCurrentUser(user)}>
              <Avatar>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className='flex-grow'>
                <p className='font-medium'>{user.name}</p>
                <p
                  className={cn(
                    "text-sm",
                    user.status === "online"
                      ? "text-green-500"
                      : "text-gray-500",
                  )}>
                  {user.status}
                </p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className='flex-grow flex flex-col'>
        <div className='p-4 border-b border-gray-200 bg-white'>
          <h1 className='text-2xl font-bold'>Chat Room</h1>
        </div>
        <ScrollArea className='flex-grow p-4'>
          {messages.map((message) => {
            const user = users.find((u) => u.id === message.userId);
            const isCurrentUser = user?.id === currentUser.id;
            return (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-2 mb-4 animate-fadeIn",
                  isCurrentUser && "flex-row-reverse space-x-reverse",
                )}>
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{user?.name[0]}</AvatarFallback>
                </Avatar>
                <div
                  className={cn("flex flex-col", isCurrentUser && "items-end")}>
                  <span className='font-semibold'>{user?.name}</span>
                  <span className='text-xs text-gray-500 mb-1'>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  <Card
                    className={cn(
                      "max-w-md",
                      isCurrentUser ? "bg-blue-500 text-white" : "bg-white",
                    )}>
                    <CardContent className='p-3'>
                      <p>{message.content}</p>
                    </CardContent>
                  </Card>
                  <div className='flex items-center mt-1 space-x-2'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='text-gray-500 hover:text-red-500'
                            onClick={() => addReaction(message.id)}>
                            <Heart className='w-4 h-4 mr-1' />
                            {message.reactions}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>React to message</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <Separator />
        <div className='p-4 bg-white'>
          {isTyping && (
            <p className='text-sm text-gray-500 mb-2'>
              {currentUser.name} is typing...
            </p>
          )}
          <div className='flex space-x-2'>
            <Input
              placeholder='Type your message...'
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                setIsTyping(true);
              }}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className='flex-grow'
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size='icon' onClick={sendMessage}>
                    <Send className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size='icon' variant='outline'>
                    <Smile className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add emoji</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
