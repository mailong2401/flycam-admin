// Logic gửi mail
export async function sendContactEmail(formData) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    console.log('🔧 Debug Info:')
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Supabase Anon Key exists:', !!supabaseAnonKey)
    console.log('Form data to send:', formData)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const functionUrl = `${supabaseUrl}/functions/v1/send-contact-email`
    console.log('Function URL:', functionUrl)
    
    const requestBody = JSON.stringify(formData)
    console.log('Request body:', requestBody)
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: requestBody
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)
    
    // Get response as text first to debug
    const responseText = await response.text()
    console.log('Response text (raw):', responseText)
    
    // Try to parse JSON
    let result
    try {
      result = JSON.parse(responseText)
      console.log('Response JSON:', result)
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError)
      console.error('Raw response:', responseText)
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`)
    }
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}: ${responseText}`)
    }

    return { success: true, data: result }
    
  } catch (error) {
    console.error('❌ Email send error:', error)
    return { 
      success: false, 
      error: error.message,
      rawError: error 
    }
  }
}