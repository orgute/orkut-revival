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

export async function getSentRequests(userId) {
  const { data } = await supabase.from('friendships')
    .select(`id,addressee:profiles!friendships_addressee_id_fkey(id,name,avatar_url)`)
    .eq('requester_id', userId).eq('status','pending')
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

export async function getPendingDepoimentos(userId) {
  const { data } = await supabase.from('depoimentos')
    .select('id,text,created_at,from:profiles!depoimentos_from_id_fkey(id,name,avatar_url)')
    .eq('to_id', userId).or('approved.eq.false,approved.is.null').not('text','is','null')
    .order('created_at', { ascending: false })
  return data || []
}

export async function approveDepoimento(id) {
  await supabase.from('depoimentos').update({ approved: true }).eq('id', id)
}

export async function rejectDepoimento(id) {
  await supabase.from('depoimentos').delete().eq('id', id)
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
  const mimeToExt = { 'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png',
    'image/gif':'gif','image/webp':'webp','image/heic':'heic','image/heif':'heif' }
  const ext = mimeToExt[file.type] || file.name.split('.').pop().toLowerCase() || 'jpg'
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
  if (error) throw error
  // Use public URL for avatars (profile photos are meant to be seen)
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
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
    .select(`id, name, created_at,
      photo_count:album_photos(count),
      cover:album_photos(storage_path)`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  // Take only the last photo as cover
  return (data || []).map(a => ({
    ...a,
    cover_path: a.cover?.[a.cover.length - 1]?.storage_path || null,
    photo_count: a.photo_count
  }))
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

/* ── Fotos Feed ──────────────────────────────────────────────── */
export async function getFotosFeed(userId, page = 0, pageSize = 10) {
  const friends = await getFriends(userId)
  if (!friends.length) return []
  const friendIds = friends.map(f => f.id)  // exclude self

  const { data } = await supabase
    .from('album_photos')
    .select(`
      id, storage_path, caption, created_at,
      album:albums(id, name),
      author:profiles!user_id(id, name, avatar_url)
    `)
    .in('user_id', friendIds)
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  return data || []
}

export async function getPhotoComments(photoId) {
  const { data } = await supabase
    .from('photo_comments')
    .select('id, text, created_at, author:profiles!user_id(id, name, avatar_url)')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function addPhotoComment(userId, photoId, text) {
  const { data, error } = await supabase
    .from('photo_comments')
    .insert({ user_id: userId, photo_id: photoId, text })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePhotoComment(commentId) {
  await supabase.from('photo_comments').delete().eq('id', commentId)
}

/* ── Online status ───────────────────────────────────────────── */
export async function updateLastSeen(userId) {
  await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId)
}

export function getOnlineStatus(lastSeen) {
  if (!lastSeen) return 'offline'
  const diff = Date.now() - new Date(lastSeen).getTime()
  if (diff < 5 * 60 * 1000)       return 'online'   // < 5 min → disponível
  if (diff < 24 * 60 * 60 * 1000) return 'ausente'  // < 24h  → ausente
  return 'offline'                                    // > 24h  → offline
}

/* ── Fãs ─────────────────────────────────────────────────────── */
export async function getFanCount(userId) {
  try {
    const { count } = await supabase.from('fans')
      .select('id', { count: 'exact', head: true }).eq('star_id', userId)
    return count || 0
  } catch { return 0 }
}

export async function getIsFan(fanId, starId) {
  try {
    const { data } = await supabase.from('fans')
      .select('id').eq('fan_id', fanId).eq('star_id', starId).maybeSingle()
    return !!data
  } catch { return false }
}

export async function addFan(fanId, starId) {
  try { await supabase.from('fans').insert({ fan_id: fanId, star_id: starId }) } catch {}
}

export async function removeFan(fanId, starId) {
  try { await supabase.from('fans').delete().eq('fan_id', fanId).eq('star_id', starId) } catch {}
}

/* ── Messages inbox ──────────────────────────────────────────── */
export async function getMessageThreads(userId) {
  const { data } = await supabase.from('messages')
    .select('id,text,created_at,from_id,to_id')
    .or(`from_id.eq.${userId},to_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(200)
  if (!data) return []
  const threads = {}
  for (const msg of data) {
    const partnerId = msg.from_id === userId ? msg.to_id : msg.from_id
    if (!threads[partnerId]) threads[partnerId] = { partnerId, lastMsg: msg }
  }
  const partnerIds = Object.keys(threads)
  if (!partnerIds.length) return []
  const { data: profiles } = await supabase.from('profiles')
    .select('id,name,avatar_url').in('id', partnerIds)
  for (const p of profiles || []) threads[p.id].partner = p
  return Object.values(threads).sort(
    (a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at)
  )
}

export async function getFans(userId) {
  const { data } = await supabase.from('fans')
    .select('fan:profiles!fan_id(id,name,avatar_url)')
    .eq('star_id', userId)
    .order('created_at', { ascending: false })
  return (data || []).map(d => d.fan)
}

/* ── Feedback / Guestbook ────────────────────────────────────── */
export async function getFeedback() {
  const { data } = await supabase.from('feedback')
    .select('id,name,text,created_at')
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export async function addFeedback(name, text) {
  const { data, error } = await supabase.from('feedback')
    .insert({ name: name.trim(), text: text.trim() })
    .select().single()
  if (error) throw error
  return data
}

export async function createCommunity(ownerId, { name, description, category }) {
  const seed = Math.floor(Math.random() * 1000)
  const { data, error } = await supabase.from('communities')
    .insert({ name, description, category, members_count: 1, seed: String(seed) })
    .select().single()
  if (error) throw error
  // Auto-join as member
  await supabase.from('memberships').insert({ user_id: ownerId, community_id: data.id })
  return data
}

/* ── Photo tags ──────────────────────────────────────────────── */
export async function getPhotoTags(photoId) {
  const { data } = await supabase.from('photo_tags')
    .select('id,tagged_user:profiles!photo_tags_tagged_user_id_fkey(id,name,avatar_url)')
    .eq('photo_id', photoId)
  return data || []
}

export async function tagFriendInPhoto(photoId, taggedUserId, taggedById) {
  const { error } = await supabase.from('photo_tags')
    .insert({ photo_id: photoId, tagged_user_id: taggedUserId, tagged_by_id: taggedById })
  if (error && !error.message.includes('duplicate')) throw error
}

export async function removePhotoTag(photoId, taggedUserId) {
  await supabase.from('photo_tags')
    .delete().eq('photo_id', photoId).eq('tagged_user_id', taggedUserId)
}

export async function getTaggedPhotos(userId) {
  const { data } = await supabase.from('photo_tags')
    .select(`
      id,
      photo:album_photos!photo_tags_photo_id_fkey(
        id, storage_path, album_id,
        album:albums!album_photos_album_id_fkey(id, name, user_id,
          owner:profiles!albums_user_id_fkey(id, name, avatar_url))
      )
    `)
    .eq('tagged_user_id', userId)
    .order('created_at', { ascending: false })
  return (data || []).map(d => d.photo).filter(Boolean)
}

export async function getTaggedPhotoCount(userId) {
  const { count } = await supabase.from('photo_tags')
    .select('id', { count: 'exact', head: true })
    .eq('tagged_user_id', userId)
  return count || 0
}

/* ── Carousel posts ──────────────────────────────────────────── */
export async function getOrCreatePostsAlbum(userId) {
  // Hidden album for carousel posts — name starts with __ so filtered from album list
  const { data } = await supabase.from('albums')
    .select('id').eq('user_id', userId).eq('name', '__posts__').maybeSingle()
  if (data) return data.id
  const { data: created } = await supabase.from('albums')
    .insert({ user_id: userId, name: '__posts__' }).select('id').single()
  return created.id
}

export async function uploadCarousel(userId, files, expiresAt = null) {
  const albumId = await getOrCreatePostsAlbum(userId)
  const carouselId = crypto.randomUUID()
  const paths = []
  for (let i = 0; i < files.length; i++) {
    const path = await uploadPhoto(userId, files[i])
    const row = { user_id: userId, album_id: albumId, storage_path: path,
      caption: '', carousel_id: carouselId, carousel_order: i }
    if (expiresAt) row.expires_at = expiresAt
    const { data } = await supabase.from('album_photos').insert(row).select('id').single()
    paths.push({ id: data.id, storage_path: path, carousel_id: carouselId, carousel_order: i })
  }
  return { carouselId, albumId, paths }
}

export async function getFotosFeedWithCarousels(userId, page = 0, pageSize = 10, includeOwn = false) {
  const friends = await getFriends(userId)
  const friendIds = friends.map(f => f.id)
  const authorIds = includeOwn ? [userId, ...friendIds] : friendIds
  if (!authorIds.length) return []

  // Fetch flat photos — get more to handle carousel grouping
  const { data } = await supabase.from('album_photos')
    .select(`id, storage_path, caption, created_at, carousel_id, carousel_order, expires_at,
      user:profiles!album_photos_user_id_fkey(id, name, avatar_url),
      album:albums!album_photos_album_id_fkey(id, name)`)
    .in('user_id', authorIds)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  if (!data) return []

  // Filter out __posts__ album single photos (they only appear in carousels)
  // but keep them for carousel grouping
  const seen = new Set()
  const posts = []

  for (const p of data) {
    if (p.carousel_id) {
      if (seen.has(p.carousel_id)) continue
      seen.add(p.carousel_id)
      const carouselPhotos = data
        .filter(x => x.carousel_id === p.carousel_id)
        .sort((a, b) => a.carousel_order - b.carousel_order)
      posts.push({ ...p, isCarousel: true, photos: carouselPhotos })
    } else {
      // Skip photos from __posts__ album that have no carousel_id (shouldn't happen)
      if (p.album?.name === '__posts__') continue
      posts.push({ ...p, isCarousel: false, photos: [p] })
    }
  }

  // Sort by created_at descending (carousel uses first photo's timestamp)
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return posts.slice(page * pageSize, (page + 1) * pageSize)
}

export async function getMyFeed(userId, page = 0, pageSize = 10) {
  // Own posts only — single photos from own albums + own carousels
  const { data } = await supabase.from('album_photos')
    .select(`id, storage_path, caption, created_at, carousel_id, carousel_order, expires_at,
      user:profiles!album_photos_user_id_fkey(id, name, avatar_url),
      album:albums!album_photos_album_id_fkey(id, name)`)
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(300)

  if (!data) return []

  const seen = new Set()
  const posts = []
  for (const p of data) {
    if (p.carousel_id) {
      if (seen.has(p.carousel_id)) continue
      seen.add(p.carousel_id)
      const carouselPhotos = data
        .filter(x => x.carousel_id === p.carousel_id)
        .sort((a, b) => a.carousel_order - b.carousel_order)
      posts.push({ ...p, isCarousel: true, photos: carouselPhotos })
    } else {
      if (p.album?.name === '__posts__') continue
      posts.push({ ...p, isCarousel: false, photos: [p] })
    }
  }

  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return posts.slice(page * pageSize, (page + 1) * pageSize)
}

export async function deleteCarousel(carouselId) {
  await supabase.from('album_photos').delete().eq('carousel_id', carouselId)
}

/* ── Waitlist admin ──────────────────────────────────────────── */
export async function getWaitlist() {
  const { data } = await supabase
    .from('waitlist')
    .select('id,name,email,created_at,invited_at,notes')
    .order('created_at', { ascending: false })
  return data || []
}

export async function markInvited(id) {
  await supabase.from('waitlist')
    .update({ invited_at: new Date().toISOString() })
    .eq('id', id)
}

export async function updateWaitlistNotes(id, notes) {
  await supabase.from('waitlist').update({ notes }).eq('id', id)
}

export async function deleteWaitlistEntry(id) {
  await supabase.from('waitlist').delete().eq('id', id)
}
