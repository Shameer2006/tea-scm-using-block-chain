import { supabase, TABLES } from './supabase'

export const chatService = {
  // Create or get conversation
  async getOrCreateConversation(participant1, participant2, productInfo = null) {
    const conversationId = [participant1, participant2].sort().join('_')
    
    const { data, error } = await supabase
      .from(TABLES.CHAT_CONVERSATIONS)
      .upsert({
        id: conversationId,
        participant1: participant1 < participant2 ? participant1 : participant2,
        participant2: participant1 < participant2 ? participant2 : participant1,
        product_info: productInfo,
        last_activity: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data[0]
  },

  // Send message
  async sendMessage(conversationId, sender, message, productInfo = null) {
    const { data, error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .insert({
        conversation_id: conversationId,
        sender_address: sender,
        message: message,
        product_info: productInfo,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) throw error

    // Update conversation last activity
    await supabase
      .from(TABLES.CHAT_CONVERSATIONS)
      .update({ last_activity: new Date().toISOString() })
      .eq('id', conversationId)

    return data[0]
  },

  // Get messages for conversation
  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  // Get conversations for user
  async getConversations(walletAddress) {
    const { data, error } = await supabase
      .from(TABLES.CHAT_CONVERSATIONS)
      .select('*')
      .or(`participant1.eq.${walletAddress},participant2.eq.${walletAddress}`)
      .order('last_activity', { ascending: false })

    if (error) throw error
    return data
  },

  // Mark messages as read
  async markAsRead(conversationId, readerAddress) {
    const { error } = await supabase
      .from(TABLES.CHAT_MESSAGES)
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_address', readerAddress)

    if (error) throw error
  },

  // Subscribe to new messages
  subscribeToMessages(conversationId, callback) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: TABLES.CHAT_MESSAGES,
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe()
  }
}