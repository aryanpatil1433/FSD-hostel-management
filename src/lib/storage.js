import { supabase } from './supabase'

const BUCKET_NAME = 'complaint-attachments'

/**
 * Uploads an optional complaint attachment image to Supabase Storage
 * @param {File} file - Image file from input
 * @returns {Promise<string|null>} - Public URL of uploaded image or null
 */
export async function uploadComplaintImage(file) {
  if (!file) return null
  if (!supabase) {
    throw new Error('Supabase is not configured. Please check your .env credentials.')
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    throw new Error('Image size exceeds 5MB limit. Please upload a smaller photo.')
  }

  // Validate MIME type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Invalid file format. Only JPEG, PNG, and WebP images are supported.')
  }

  // Generate safe sanitized filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  const filePath = `complaints/${timestamp}_${randomStr}_${cleanName}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Storage upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}
