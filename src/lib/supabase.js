import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for common operations
export const uploadImage = async (file, bucket = 'pollen-images') => {
  const fileName = `${Date.now()}-${file.name}`
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return { fileName, publicUrl }
}

export const saveSubmission = async (submissionData) => {
  const { data, error } = await supabase
    .from('submissions')
    .insert(submissionData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getSubmissions = async (filters = {}) => {
  let query = supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}
