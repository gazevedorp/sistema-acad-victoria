// Exemplo de Edge Function para atualizar senha
// Arquivo: supabase/functions/update-user-password/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Criar cliente com service role key (admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, password } = await req.json()

    // Verificar se o usuário atual tem permissão de admin
    const authHeader = req.headers.get('authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    
    if (!user) {
      throw new Error('Não autorizado')
    }

    // Verificar se o usuário logado é admin
    const { data: userPermission } = await supabaseAdmin
      .from('usuarios')
      .select('permissao')
      .eq('id', user.id)
      .single()

    if (userPermission?.permissao !== 'admin') {
      throw new Error('Sem permissão para alterar senhas')
    }

    // Atualizar senha do usuário
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    )

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
