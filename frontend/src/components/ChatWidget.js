import React, { useState, useEffect, useRef } from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  UserIcon,
  CheckIcon,
  CheckCircleIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { useWeb3 } from '../context/Web3Context';
import { useSupabase } from '../context/SupabaseContext';

const ChatWidget = ({ productId = null, ownerAddress = null }) => {
  const { account, checkStakeholderStatus } = useWeb3();
  const { getOrCreateConversation, sendMessage, getMessages, getConversations, markAsRead } = useSupabase();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [conversations, setConversations] = useState({});
  const [inputText, setInputText] = useState('');
  const [stakeholderInfo, setStakeholderInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (account) {
      loadStakeholderInfo();
      loadConversations();
    }
  }, [account]);

  const loadStakeholderInfo = async () => {
    try {
      const info = await checkStakeholderStatus(account);
      setStakeholderInfo(info);
    } catch (error) {
      console.error('Error loading stakeholder info:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await getConversations();
      const conversationsObj = {};
      
      for (const conv of convs) {
        const messages = await getMessages(conv.id);
        conversationsObj[conv.id] = {
          id: conv.id,
          participants: [conv.participant1, conv.participant2],
          productInfo: conv.product_info,
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender_address,
            time: msg.created_at,
            status: msg.read ? 'read' : 'delivered'
          })),
          lastActivity: conv.last_activity
        };
      }
      
      setConversations(conversationsObj);
      
      // Count unread messages
      let unread = 0;
      Object.values(conversationsObj).forEach(conv => {
        unread += conv.messages.filter(msg => msg.status !== 'read' && msg.sender !== account).length;
      });
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const saveConversations = (newConversations) => {
    localStorage.setItem(`conversations_${account}`, JSON.stringify(newConversations));
    setConversations(newConversations);
  };

  const startConversation = async (targetAddress, productInfo = null) => {
    try {
      const conversation = await getOrCreateConversation(targetAddress, productInfo);
      const chatId = conversation.id;
      
      if (!conversations[chatId]) {
        const messages = await getMessages(chatId);
        const newConv = {
          id: chatId,
          participants: [conversation.participant1, conversation.participant2],
          productInfo: conversation.product_info,
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.message,
            sender: msg.sender_address,
            time: msg.created_at,
            status: msg.read ? 'read' : 'delivered'
          })),
          lastActivity: conversation.last_activity
        };
        
        setConversations(prev => ({ ...prev, [chatId]: newConv }));
      }
      
      setActiveChat(chatId);
      setIsOpen(true);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      const productInfo = conversations[activeChat]?.productInfo;
      await sendMessage(activeChat, messageText, productInfo);
      
      // Update local state
      const newMessage = {
        id: Date.now(),
        text: messageText,
        sender: account,
        time: new Date().toISOString(),
        status: 'sent'
      };

      setConversations(prev => ({
        ...prev,
        [activeChat]: {
          ...prev[activeChat],
          messages: [...prev[activeChat].messages, newMessage],
          lastActivity: new Date().toISOString()
        }
      }));
      
      // Auto-scroll to bottom
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageText); // Restore message on error
    }
  };

  const updateMessageStatus = (messageId, status) => {
    const updated = { ...conversations };
    if (updated[activeChat]) {
      const messageIndex = updated[activeChat].messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        updated[activeChat].messages[messageIndex].status = status;
        saveConversations(updated);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Simulate typing indicator for other party
    const otherParty = conversations[activeChat]?.participants.find(p => p !== account);
    if (otherParty) {
      const typingKey = `typing_${activeChat}_${account}`;
      localStorage.setItem(typingKey, Date.now().toString());
      
      typingTimeoutRef.current = setTimeout(() => {
        localStorage.removeItem(typingKey);
      }, 3000);
    }
  };

  const checkTypingStatus = () => {
    if (!activeChat) return false;
    
    const otherParty = conversations[activeChat]?.participants.find(p => p !== account);
    if (!otherParty) return false;
    
    const typingKey = `typing_${activeChat}_${otherParty}`;
    const typingTime = localStorage.getItem(typingKey);
    
    if (typingTime) {
      const timeDiff = Date.now() - parseInt(typingTime);
      return timeDiff < 3000;
    }
    
    return false;
  };

  const getMessageStatusIcon = (message) => {
    if (message.sender !== account) return null;
    
    switch (message.status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />;
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCircleIcon className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCircleIcon className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const markMessagesAsRead = async (chatId) => {
    try {
      await markAsRead(chatId);
      
      // Update local state
      setConversations(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          messages: prev[chatId].messages.map(msg => 
            msg.sender !== account ? { ...msg, status: 'read' } : msg
          )
        }
      }));
      
      loadConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getOtherPartyAddress = (chatId) => {
    const conv = conversations[chatId];
    return conv ? conv.participants.find(p => p !== account) : null;
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const [userNames, setUserNames] = useState({});

  const getUserName = async (address) => {
    if (userNames[address]) return userNames[address];
    
    try {
      const stakeholder = await checkStakeholderStatus(address);
      const name = stakeholder.isRegistered && stakeholder.name ? stakeholder.name : formatAddress(address);
      setUserNames(prev => ({ ...prev, [address]: name }));
      return name;
    } catch (error) {
      const fallback = formatAddress(address);
      setUserNames(prev => ({ ...prev, [address]: fallback }));
      return fallback;
    }
  };

  useEffect(() => {
    // Load user names for all conversation participants
    const loadUserNames = async () => {
      const addresses = new Set();
      Object.values(conversations).forEach(conv => {
        conv.participants.forEach(addr => addresses.add(addr));
      });
      
      for (const address of addresses) {
        if (!userNames[address]) {
          await getUserName(address);
        }
      }
    };
    
    if (Object.keys(conversations).length > 0) {
      loadUserNames();
    }
  }, [conversations]);

  // Auto-start conversation if productId and ownerAddress provided
  useEffect(() => {
    if (productId && ownerAddress && account && ownerAddress !== account) {
      const productInfo = { id: productId, owner: ownerAddress };
      startConversation(ownerAddress, productInfo);
    }
  }, [productId, ownerAddress, account]);

  // Listen for batch request events
  useEffect(() => {
    const handleBatchRequest = (event) => {
      const { ownerAddress: targetAddress, productInfo } = event.detail;
      if (account && targetAddress && targetAddress !== account) {
        startConversation(targetAddress, productInfo);
      }
    };

    window.addEventListener('startBatchRequest', handleBatchRequest);
    return () => window.removeEventListener('startBatchRequest', handleBatchRequest);
  }, [account]);

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-40 ${isOpen ? 'hidden' : 'block'}`}
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50">
          {!activeChat ? (
            // Conversation List
            <>
              <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Messages</h3>
                  <p className="text-xs opacity-90">{stakeholderInfo?.type || 'Stakeholder'}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {Object.values(conversations).length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-xs">Start by requesting a batch from available products</p>
                  </div>
                ) : (
                  Object.values(conversations)
                    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
                    .map((conv) => {
                      const otherParty = getOtherPartyAddress(conv.id);
                      const lastMessage = conv.messages[conv.messages.length - 1];
                      const unreadInConv = conv.messages.filter(msg => msg.status !== 'read' && msg.sender !== account).length;
                      const displayName = userNames[otherParty] || formatAddress(otherParty);
                      const lastSeen = new Date(conv.lastActivity);
                      const isToday = lastSeen.toDateString() === new Date().toDateString();
                      
                      return (
                        <div
                          key={conv.id}
                          onClick={() => {
                            setActiveChat(conv.id);
                            markMessagesAsRead(conv.id);
                          }}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-sm text-gray-900 truncate">{displayName}</p>
                                <div className="flex items-center space-x-1">
                                  {lastMessage && (
                                    <span className="text-xs text-gray-500">
                                      {isToday 
                                        ? lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric' })
                                      }
                                    </span>
                                  )}
                                  {unreadInConv > 0 && (
                                    <span className="bg-primary-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                      {unreadInConv > 99 ? '99+' : unreadInConv}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {conv.productInfo && (
                                <p className="text-xs text-blue-600 font-medium">📦 {conv.productInfo.batchId || conv.productInfo.id}</p>
                              )}
                              
                              {lastMessage ? (
                                <div className="flex items-center space-x-1">
                                  {lastMessage.sender === account && (
                                    <div className="flex-shrink-0">
                                      {getMessageStatusIcon(lastMessage)}
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-600 truncate">
                                    {lastMessage.sender === account ? 'You: ' : ''}
                                    {lastMessage.text.length > 35 ? `${lastMessage.text.substring(0, 35)}...` : lastMessage.text}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 italic">No messages yet</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </>
          ) : (
            // Active Conversation
            <>
              <div className="bg-primary-600 text-white p-4 rounded-t-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveChat(null)}
                    className="text-white hover:text-gray-200"
                  >
                    ←
                  </button>
                  <div>
                    <h3 className="font-semibold">{userNames[getOtherPartyAddress(activeChat)] || formatAddress(getOtherPartyAddress(activeChat))}</h3>
                    {conversations[activeChat]?.productInfo && (
                      <p className="text-xs opacity-90">Batch: {conversations[activeChat].productInfo.batchId || conversations[activeChat].productInfo.id}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {conversations[activeChat]?.messages.map((message, index) => {
                  const isOwn = message.sender === account;
                  const prevMessage = conversations[activeChat]?.messages[index - 1];
                  const showTime = !prevMessage || 
                    new Date(message.time).getTime() - new Date(prevMessage.time).getTime() > 300000; // 5 minutes
                  
                  return (
                    <div key={message.id}>
                      {showTime && (
                        <div className="text-center text-xs text-gray-500 my-2">
                          {new Date(message.time).toLocaleDateString() === new Date().toLocaleDateString() 
                            ? new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : new Date(message.time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          }
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm relative ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}>
                          <div>{message.text}</div>
                          <div className={`flex items-center justify-end space-x-1 mt-1 ${
                            isOwn ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">
                              {new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {getMessageStatusIcon(message)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing Indicator */}
                {checkTypingStatus() && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                      maxLength={1000}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      {inputText.length}/1000
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`p-2 rounded-full transition-colors ${
                      inputText.trim() 
                        ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Quick Actions */}
                {conversations[activeChat]?.productInfo && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setInputText('I would like to request this batch for transfer.')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200"
                    >
                      Request Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText('What is the price for this batch?')}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200"
                    >
                      Ask Price
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText('Can you provide quality details?')}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200"
                    >
                      Quality Info
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;

// Export function to start conversation from other components
export const startBatchRequest = (ownerAddress, productInfo) => {
  const event = new CustomEvent('startBatchRequest', {
    detail: { ownerAddress, productInfo }
  });
  window.dispatchEvent(event);
};