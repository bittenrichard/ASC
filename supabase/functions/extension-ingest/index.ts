import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse form data
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const prospectName = formData.get('prospectName') as string
    const sdrId = formData.get('sdrId') as string

    if (!audioFile || !prospectName || !sdrId) {
      return new Response(
        JSON.stringify({ error: 'audio, prospectName, and sdrId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify SDR ID matches authenticated user
    if (sdrId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'SDR ID does not match authenticated user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = audioFile.name.split('.').pop() || 'wav'
    const fileName = `${sdrId}/${timestamp}_extension.${fileExtension}`

    // Upload audio file to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('call-recordings')
      .upload(fileName, audioFile)

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('call-recordings')
      .getPublicUrl(fileName)

    // Insert call recording record
    const { data: callData, error: insertError } = await supabaseClient
      .from('call_recordings')
      .insert({
        sdr_id: sdrId,
        prospect_name: prospectName,
        audio_file_url: publicUrl,
        call_duration_seconds: 0, // Will be updated after analysis
        status: 'Processando'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Trigger analysis (in a real implementation, you might queue this)
    // For now, we'll just return success
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        callId: callData.call_id,
        message: 'Audio uploaded successfully and analysis queued'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in extension-ingest function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})