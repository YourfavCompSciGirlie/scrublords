import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Send, Plus, User, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOnline, storeOfflineData } = useOfflineStorage();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiverId: '',
    content: ''
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/users/doctors'],
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['/api/messages/unread/count'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/messages/conversation', selectedConversation],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      if (!isOnline) {
        storeOfflineData('message', data);
        toast({
          title: 'Message Queued',
          description: 'Message saved offline and will send when online',
        });
        return { id: Date.now().toString(), ...data, offline: true, createdAt: new Date().toISOString() };
      }
      const response = await apiRequest('POST', '/api/messages', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (!data.offline) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        if (selectedConversation) {
          queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', selectedConversation] });
        }
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
        toast({
          title: 'Success',
          description: 'Message sent successfully',
        });
      }
      setMessageContent('');
      setNewMessage({ receiverId: '', content: '' });
      setIsNewMessageModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest('PUT', `/api/messages/${messageId}/read`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
    },
  });

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedConversation,
      content: messageContent.trim()
    });
  };

  const handleNewMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.receiverId || !newMessage.content.trim()) return;
    
    sendMessageMutation.mutate(newMessage);
  };

  const handleSelectConversation = (userId: string) => {
    setSelectedConversation(userId);
    // Mark messages as read
    if (conversation) {
      conversation.forEach((msg: any) => {
        if (msg.receiverId === user?.id && !msg.isRead) {
          markAsReadMutation.mutate(msg.id);
        }
      });
    }
  };

  // Group messages by conversation
  const conversations = messages?.reduce((acc: any, message: any) => {
    const otherUserId = message.senderId === user?.id ? message.receiverId : message.senderId;
    if (!acc[otherUserId]) {
      acc[otherUserId] = {
        userId: otherUserId,
        messages: [],
        lastMessage: message,
        unreadCount: 0
      };
    }
    acc[otherUserId].messages.push(message);
    if (message.createdAt > acc[otherUserId].lastMessage.createdAt) {
      acc[otherUserId].lastMessage = message;
    }
    if (message.receiverId === user?.id && !message.isRead) {
      acc[otherUserId].unreadCount++;
    }
    return acc;
  }, {}) || {};

  const conversationList = Object.values(conversations).sort((a: any, b: any) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold">Messages</h2>
          {unreadCount?.count > 0 && (
            <Badge variant="default" data-testid="badge-unread-count">
              {unreadCount.count} unread
            </Badge>
          )}
        </div>
        <Dialog open={isNewMessageModalOpen} onOpenChange={setIsNewMessageModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-message">
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send New Message</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewMessage} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient</Label>
                <Select
                  value={newMessage.receiverId}
                  onValueChange={(value) => setNewMessage({ ...newMessage, receiverId: value })}
                >
                  <SelectTrigger data-testid="select-message-recipient">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  rows={4}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  placeholder="Type your message..."
                  data-testid="textarea-new-message"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewMessageModalOpen(false)}
                  data-testid="button-cancel-message"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={sendMessageMutation.isPending || !newMessage.receiverId || !newMessage.content.trim()}
                  data-testid="button-send-new-message"
                >
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connection Status */}
      {!isOnline && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-700">
                Working offline - Messages will send when connection is restored
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {messagesLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="loading-skeleton h-16"></div>
                  ))}
                </div>
              ) : conversationList.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversationList.map((conv: any) => {
                    const otherUser = users?.find((u: any) => u.id === conv.userId);
                    return (
                      <div
                        key={conv.userId}
                        className={`p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors ${
                          selectedConversation === conv.userId ? 'bg-accent' : ''
                        } ${conv.unreadCount > 0 ? 'message-unread' : 'message-read'}`}
                        onClick={() => handleSelectConversation(conv.userId)}
                        data-testid={`conversation-${conv.userId}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate">
                                {otherUser?.fullName || 'Unknown User'}
                              </h4>
                              {conv.unreadCount > 0 && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedConversation ? 
                users?.find((u: any) => u.id === selectedConversation)?.fullName || 'Conversation' :
                'Select a conversation'
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {selectedConversation ? (
              <div className="flex flex-col h-[500px]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {conversationLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="loading-skeleton h-16"></div>
                      ))}
                    </div>
                  ) : conversation?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversation?.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.senderId === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === user?.id 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-border p-4">
                  <div className="flex space-x-2">
                    <Input
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder="Type a message..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      data-testid="input-message-content"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
