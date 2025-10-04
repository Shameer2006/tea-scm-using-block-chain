import { supabase, TABLES } from './supabase'

export const stakeholderService = {
  // Save stakeholder profile data
  async saveProfile(walletAddress, profileData) {
    const { data, error } = await supabase
      .from(TABLES.STAKEHOLDER_PROFILES)
      .upsert({
        wallet_address: walletAddress,
        email: profileData.email,
        phone: profileData.phone,
        established: profileData.established,
        description: profileData.description,
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) throw error
    return data[0]
  },

  // Get stakeholder profile data
  async getProfile(walletAddress) {
    const { data, error } = await supabase
      .from(TABLES.STAKEHOLDER_PROFILES)
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Update profile data
  async updateProfile(walletAddress, updates) {
    const { data, error } = await supabase
      .from(TABLES.STAKEHOLDER_PROFILES)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()

    if (error) throw error
    return data[0]
  }
}