import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { stakeholderService } from '../services/stakeholderService'
import { chatService } from '../services/chatService'
import { useWeb3 } from './Web3Context'

const SupabaseContext = createContext()

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const SupabaseProvider = ({ children }) => {
  const { account } = useWeb3()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign in with wallet address (custom auth)
  const signInWithWallet = async (walletAddress) => {
    try {
      // Create a custom user session using wallet address
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            wallet_address: walletAddress
          }
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Profile methods
  const saveProfile = async (profileData) => {
    if (!account) throw new Error('No wallet connected')
    return await stakeholderService.saveProfile(account, profileData)
  }

  const getProfile = async () => {
    if (!account) return null
    return await stakeholderService.getProfile(account)
  }

  const updateProfile = async (updates) => {
    if (!account) throw new Error('No wallet connected')
    return await stakeholderService.updateProfile(account, updates)
  }

  // Chat methods
  const getOrCreateConversation = async (otherParticipant, productInfo) => {
    if (!account) throw new Error('No wallet connected')
    return await chatService.getOrCreateConversation(account, otherParticipant, productInfo)
  }

  const sendMessage = async (conversationId, message, productInfo) => {
    if (!account) throw new Error('No wallet connected')
    return await chatService.sendMessage(conversationId, account, message, productInfo)
  }

  const getMessages = async (conversationId) => {
    return await chatService.getMessages(conversationId)
  }

  const getConversations = async () => {
    if (!account) return []
    return await chatService.getConversations(account)
  }

  const markAsRead = async (conversationId) => {
    if (!account) return
    return await chatService.markAsRead(conversationId, account)
  }

  const subscribeToMessages = (conversationId, callback) => {
    return chatService.subscribeToMessages(conversationId, callback)
  }

  const value = {
    user,
    loading,
    signInWithWallet,
    signOut,
    saveProfile,
    getProfile,
    updateProfile,
    getOrCreateConversation,
    sendMessage,
    getMessages,
    getConversations,
    markAsRead,
    subscribeToMessages
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}