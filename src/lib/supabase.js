import { createClient } from '@supabase/supabase-js'

// Use env vars if available, otherwise fall back to build-time constants
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || __SUPA_URL__
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || __SUPA_KEY__

if (!SUPA_URL || SUPA_URL.includes('placeholder')) {
  console.warn('⚠️ Supabase env vars missing — using build-time fallback')
}

export const supabase = createClient(
  SUPA_URL,
  SUPA_KEY,
  {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
    realtime: { params: { eventsPerSecond: 10 } },
  }
)

export const getUser    = () => supabase.auth.getUser()
export const getSession = () => supabase.auth.getSession()

export async function signUp({ email, password, name }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name } },
  })
  if (error) throw error
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id, name, email,
      bio: 'Olá! Estou de volta :)',
      country: 'Brasil', rel_status: 'solteiro(a)', gender: 'prefiro não dizer',
    })
  }
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() { await supabase.auth.signOut() }

export async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function searchUsers(query) {
  const { data } = await supabase.from('profiles')
    .select('id,name,avatar_url,city,country')
    .ilike('name', `%${query}%`).limit(20)
  return data || []
}

export async function getFriends(userId) {
  const { data } = await supabase.from('friendships')
    .select(`id,status,created_at,
      requester:profiles!friendships_requester_id_fkey(id,name,avatar_url,city),
      addressee:profiles!friendships_addressee_id_fkey(id,name,avatar_url,city)`)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status','accepted')
  return (data||[]).map(f=>{
    const other = f.requester.id===userId ? f.addressee : f.requester
    return { ...other, friendship_id: f.id }
  })
}

export async function getFriendRequests(userId) {
  const { data } = await supabase.from('friendships')
    .select(`id,requester:profiles!friendships_requester_id_fkey(id,name,avatar_url)`)
    .eq('addressee_id', userId).eq('status','pending')
  return data || []
}

export async function sendFriendRequest(requesterId, addresseeId) {
  const { error } = await supabase.from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
  if (error) throw error
}

export async function respondFriendRequest(friendshipId, accept) {
  const { error } = await supabase.from('friendships')
    .update({ status: accept ? 'accepted' : 'rejected' }).eq('id', friendshipId)
  if (error) throw error
}

export async function getFriendshipStatus(userId, otherId) {
  const { data } = await supabase.from('friendships').select('id,status,requester_id')
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`)
    .maybeSingle()
  return data
}

export async function getRecados(profileId) {
  const { data } = await supabase.from('recados')
    .select(`id,text,created_at,from:profiles!recados_from_id_fkey(id,name,avatar_url)`)
    .eq('to_id', profileId).order('created_at',{ascending:false}).limit(50)
  return data || []
}

export async function sendRecado(fromId, toId, text) {
  const { error } = await supabase.from('recados').insert({ from_id: fromId, to_id: toId, text })
  if (error) throw error
}

export async function deleteRecado(recadoId, userId) {
  await supabase.from('recados').delete().eq('id', recadoId).eq('to_id', userId)
}

export async function getDepoimentos(profileId) {
  const { data } = await supabase.from('depoimentos')
    .select(`id,text,created_at,from:profiles!depoimentos_from_id_fkey(id,name,avatar_url)`)
    .eq('to_id', profileId).order('created_at',{ascending:false})
  return data || []
}

export async function sendDepoimento(fromId, toId, text) {
  const { error } = await supabase.from('depoimentos').insert({ from_id: fromId, to_id: toId, text })
  if (error) throw error
}

export async function getCommunities() {
  const { data } = await supabase.from('communities').select('*').order('members_count',{ascending:false})
  return data || []
}

export async function getMyCommunities(userId) {
  const { data } = await supabase.from('memberships').select(`community:communities(*)`).eq('user_id', userId)
  return (data||[]).map(m=>m.community)
}

export async function joinCommunity(userId, communityId) {
  await supabase.from('memberships').upsert({ user_id: userId, community_id: communityId })
  await supabase.rpc('increment_members', { community_id: communityId })
}

export async function leaveCommunity(userId, communityId) {
  await supabase.from('memberships').delete().eq('user_id', userId).eq('community_id', communityId)
  await supabase.rpc('decrement_members', { community_id: communityId })
}

export async function getCommunityPosts(communityId) {
  const { data } = await supabase.from('community_posts')
    .select(`id,text,created_at,author:profiles!community_posts_author_id_fkey(id,name,avatar_url)`)
    .eq('community_id', communityId).order('created_at',{ascending:false}).limit(50)
  return data || []
}

export async function createCommunityPost(authorId, communityId, text) {
  const { error } = await supabase.from('community_posts').insert({ author_id: authorId, community_id: communityId, text })
  if (error) throw error
}

export async function getMessages(userId, otherId) {
  const { data } = await supabase.from('messages').select('*')
    .or(`and(from_id.eq.${userId},to_id.eq.${otherId}),and(from_id.eq.${otherId},to_id.eq.${userId})`)
    .order('created_at',{ascending:true}).limit(100)
  return data || []
}

export async function sendMessage(fromId, toId, text) {
  const { error } = await supabase.from('messages').insert({ from_id: fromId, to_id: toId, text })
  if (error) throw error
}

export async function recordVisit(visitorId, profileId) {
  if (visitorId === profileId) return
  await supabase.from('profile_visits')
    .upsert({ visitor_id: visitorId, profile_id: profileId, visited_at: new Date().toISOString() })
}

export async function getVisitors(profileId) {
  const { data } = await supabase.from('profile_visits')
    .select(`visited_at,visitor:profiles!profile_visits_visitor_id_fkey(id,name,avatar_url)`)
    .eq('profile_id', profileId).order('visited_at',{ascending:false}).limit(10)
  return data || []
}

export async function uploadAvatar(userId, file) {
  const ext  = file.name.split('.').pop().toLowerCase()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  // Bucket is private — return storage path, Av component resolves signed URL
  return path
}

/* ── Invites ─────────────────────────────────────────────────── */
export async function validateInviteCode(code) {
  const { data } = await supabase
    .from('invites')
    .select('id, code, used_by, created_by')
    .eq('code', code.toUpperCase().trim())
    .is('used_by', null)
    .maybeSingle()
  return data  // null = invalid/used
}

export async function useInviteCode(code, userId) {
  const { error } = await supabase
    .from('invites')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('code', code.toUpperCase().trim())
    .is('used_by', null)
  if (error) throw error
}

export async function getMyInvites(userId) {
  const { data } = await supabase
    .from('invites')
    .select('id, code, used_by, used_at, used_profile:profiles!invites_used_by_fkey(name)')
    .eq('created_by', userId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function getMemberNumber(userId) {
  // Get rank of this user by signup date
  const { data } = await supabase
    .from('profiles')
    .select('id, created_at')
    .order('created_at', { ascending: true })
  if (!data) return null
  const idx = data.findIndex(p => p.id === userId)
  return idx >= 0 ? idx + 1 : null
}

/* ── Private storage — signed URLs ─────────────────────────── */
export async function getSignedUrl(path) {
  if (!path) return null
  // Already a full URL (old public avatars) — return as-is for backward compat
  if (path.startsWith('http')) return path
  const { data } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 3600) // 1 hour
  return data?.signedUrl || null
}

export async function uploadPhoto(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return path  // return storage path, not URL
}

/* ── Albums ──────────────────────────────────────────────────── */
export async function getAlbums(userId) {
  const { data } = await supabase
    .from('albums')
    .select('id, name, created_at, photo_count:album_photos(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function createAlbum(userId, name) {
  const { data, error } = await supabase
    .from('albums')
    .insert({ user_id: userId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAlbum(albumId) {
  await supabase.from('albums').delete().eq('id', albumId)
}

export async function getAlbumPhotos(albumId) {
  const { data } = await supabase
    .from('album_photos')
    .select('id, storage_path, caption, created_at')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false })
  return data || []
}

export async function addPhotoToAlbum(userId, albumId, storagePath, caption) {
  const { data, error } = await supabase
    .from('album_photos')
    .insert({ user_id: userId, album_id: albumId, storage_path: storagePath, caption })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePhoto(photoId) {
  await supabase.from('album_photos').delete().eq('id', photoId)
}

/* ── Novidades (friends' recent album activity) ─────────────── */
export async function getNovidades(userId) {
  const friends = await getFriends(userId)
  if (!friends.length) return []
  const friendIds = friends.map(f => f.id)

  // Recent album photos from friends (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: photos } = await supabase
    .from('album_photos')
    .select(`
      id, created_at, storage_path,
      album:albums(id, name, user_id),
      author:profiles!user_id(id, name, avatar_url)
    `)
    .in('user_id', friendIds)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(30)

  // Group by album + author + day
  const grouped = {}
  for (const p of photos || []) {
    const key = `${p.album.id}-${p.created_at.slice(0, 10)}`
    if (!grouped[key]) grouped[key] = { ...p, count: 0, isNew: true }
    grouped[key].count++
  }
  return Object.values(grouped).sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at)
  )
}
