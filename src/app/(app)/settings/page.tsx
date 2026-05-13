import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('tenant_members')
    .select('tenant_id, role, tenants(name)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/onboarding')

  const tenantId = membership.tenant_id
  const isAdmin = membership.role === 'admin'
  const tenantName = (membership.tenants as unknown as { name: string })?.name ?? ''

  const [{ data: config }, { data: members }, { count: docCount }] = await Promise.all([
    supabase.from('tenant_config').select('agencies, signers').eq('tenant_id', tenantId).single(),
    supabase.from('tenant_members').select('user_id, role').eq('tenant_id', tenantId),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ])

  return (
    <SettingsClient
      tenantId={tenantId}
      tenantName={tenantName}
      isAdmin={isAdmin}
      agencies={config?.agencies ?? []}
      signers={config?.signers ?? []}
      memberCount={members?.length ?? 0}
      documentCount={docCount ?? 0}
    />
  )
}
