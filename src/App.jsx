import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, signUp, signIn, signOut, getProfile, updateProfile,
  getFriends, getFriendRequests, sendFriendRequest, respondFriendRequest,
  getFriendshipStatus, getRecados, sendRecado, deleteRecado,
  getDepoimentos, sendDepoimento, getCommunities, getMyCommunities,
  joinCommunity, leaveCommunity, getCommunityPosts, createCommunityPost,
  getMessages, sendMessage, recordVisit, getVisitors, uploadAvatar,
  searchUsers } from './lib/supabase.js'

/* ── Design tokens ─────────────────────────────────────────── */
const C = {
  pink:'#f0059a', pinkLight:'#fce4f1', blue:'#3b72b8',
  bg:'#eef0f5', white:'#ffffff', border:'#e2e5ec',
  text:'#1a1a2e', textMid:'#4a4a6a', textLight:'#8890a8',
  tagBg:'#f4f5f8', tagBorder:'#dde0ea', star:'#f59e0b',
}

const card    = { background:C.white, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }
const lbl     = { fontSize:11, color:C.textLight, textTransform:'lowercase', minWidth:120 }
const tag     = { display:'inline-flex', alignItems:'center', padding:'3px 11px', borderRadius:20,
                  border:`1px solid ${C.tagBorder}`, background:C.tagBg, fontSize:12, color:C.textMid,
                  marginRight:5, marginBottom:5, whiteSpace:'nowrap' }
const btn     = { cursor:'pointer', border:'none', borderRadius:6, padding:'7px 16px',
                  fontFamily:'inherit', fontSize:12, fontWeight:600 }
const btnPink = { ...btn, background:C.pink, color:'#fff' }
const btnBlue = { ...btn, background:C.blue, color:'#fff' }
const btnGhost= { ...btn, background:'transparent', border:`1px solid ${C.border}`, color:C.textMid }
const inp     = { width:'100%', border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px',
                  fontSize:13, fontFamily:'inherit', color:C.text, background:C.white,
                  outline:'none', boxSizing:'border-box' }
const tarea   = { ...inp, resize:'vertical', minHeight:72 }

/* ── Orkut Logo ─────────────────────────────────────────────── */
function OrkutLogo({ size=32, id='ol' }){
  // Giant O in full pink — rkut crashes to invisible.
  // People complete the word in their memory.
  const h=size, w=size*4.4, gid=`${id}g`, mid=`${id}m`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',overflow:'visible'}} aria-label="">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#f0059a" stopOpacity="1"/>
          <stop offset="20%"  stopColor="#f0059a" stopOpacity="1"/>
          <stop offset="25%"  stopColor="#f0059a" stopOpacity="0.14"/>
          <stop offset="36%"  stopColor="#f0059a" stopOpacity="0.04"/>
          <stop offset="50%"  stopColor="#f0059a" stopOpacity="0.01"/>
          <stop offset="100%" stopColor="#f0059a" stopOpacity="0"/>
        </linearGradient>
        <mask id={mid}>
          <rect x="0" y="0" width={w} height={h*1.2} fill={`url(#${gid})`}/>
        </mask>
      </defs>
      <text x="0" y={h*0.88}
        fontFamily="'Nunito Black','Nunito','Montserrat','Arial Rounded MT Bold',Arial,sans-serif"
        fontSize={h} fontWeight="900" fill="#f0059a" mask={`url(#${mid})`} letterSpacing="-1">
        orkut
      </text>
    </svg>
  )
}

/* ── Avatar ─────────────────────────────────────────────────── */
function Av({ src, size=36, ring=false, name='' }){
  const fallback = `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name||'user')}`
  return (
    <img src={src||fallback} alt={name} width={size} height={size}
      onError={e=>{ e.target.src=fallback }}
      style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0, display:'block',
               border: ring ? `2px solid ${C.pink}` : `1px solid ${C.border}` }}/>
  )
}

/* ── Divider ─────────────────────────────────────────────────── */
const Divider = () => <div style={{height:1,background:C.border,margin:'10px 0'}}/>

/* ── Toast ──────────────────────────────────────────────────── */
function Toast({ msg, onDone }){
  useEffect(()=>{ const t=setTimeout(onDone,3000); return()=>clearTimeout(t) },[])
  if(!msg) return null
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',
      background:C.blue,color:'#fff',padding:'10px 20px',borderRadius:8,
      fontSize:13,fontWeight:600,zIndex:9999,boxShadow:'0 4px 12px rgba(0,0,0,.2)'}}>
      {msg}
    </div>
  )
}

/* ── AUTH SCREENS ────────────────────────────────────────────── */
function AuthScreen({ onAuth }){
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({email:'',password:'',name:''})
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)

  const submit=async()=>{
    setErr(''); setLoading(true)
    try{
      if(mode==='login'){
        await signIn({ email:form.email, password:form.password })
      } else {
        if(!form.name.trim()) throw new Error('Digite seu nome')
        await signUp({ email:form.email, password:form.password, name:form.name })
      }
      onAuth()
    } catch(e){ setErr(e.message) }
    setLoading(false)
  }

  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  const bullets = [
    ['Conecte-se', 'aos seus amigos e familiares usando recados e mensagens'],
    ['Conheça', 'novas pessoas através de amigos de seus amigos e comunidades'],
    ['Compartilhe', 'seus momentos, fotos, paixões e interesses em um só lugar'],
  ]

  return (
    <div style={{minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column'}}>
      {/* Aviso top bar */}
      <div style={{background:'#f8f0ff', borderBottom:`1px solid #e0d0f0`, padding:'8px 0',
        textAlign:'center', fontSize:12}}>
        <span style={{color:C.pink, fontWeight:700}}>Aviso:</span>
        <span style={{color:C.textMid}}> Versão nostálgica do nosso amado site.</span>
      </div>

      {/* Main two-column layout */}
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'32px 20px', gap:32, maxWidth:960, margin:'0 auto', width:'100%', flexWrap:'wrap'}}>

        {/* LEFT — logo + bullets */}
        <div style={{flex:'1 1 380px', minWidth:280, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', padding:'20px 0'}}>
          <div style={{marginBottom:36}}>
            <OrkutLogo size={90} id="auth"/>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            {bullets.map(([verb, rest]) => (
              <div key={verb} style={{fontSize:14, color:C.textMid, textAlign:'center'}}>
                <span style={{color:C.pink, fontWeight:700}}>{verb}</span>
                {' '}{rest}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — form */}
        <div style={{flex:'0 1 320px', minWidth:260}}>
          <div style={{...card, padding:24, marginBottom:12}}>
            <div style={{fontSize:13, color:C.textMid, marginBottom:16, textAlign:'center'}}>
              {mode==='login'
                ? 'Acesse com a sua conta'
                : 'Crie sua conta gratuitamente'}
            </div>

            {mode==='signup'&&(
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11, color:C.textLight, marginBottom:4}}>Seu nome:</div>
                <input style={inp} placeholder="Como quer ser chamado(a)?"
                  value={form.name} onChange={e=>f('name',e.target.value)}/>
              </div>
            )}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11, color:C.textLight, marginBottom:4}}>E-mail:</div>
              <input style={inp} type="email" placeholder="seu@email.com"
                value={form.email} onChange={e=>f('email',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11, color:C.textLight, marginBottom:4}}>Senha:</div>
              <input style={inp} type="password" placeholder="mínimo 6 caracteres"
                value={form.password} onChange={e=>f('password',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>

            {err&&<div style={{fontSize:12,color:'#ef4444',marginBottom:12,padding:'7px 10px',
              background:'#fef2f2',borderRadius:6}}>{err}</div>}

            <button style={{...btnBlue,width:'100%',padding:'9px',fontSize:13,borderRadius:4}}
              onClick={submit} disabled={loading}>
              {loading?'Aguarde…':mode==='login'?'Entrar':'Criar conta'}
            </button>

            {mode==='login'&&(
              <div style={{textAlign:'center',marginTop:12,fontSize:12,color:C.pink,cursor:'pointer'}}>
                Esqueceu sua senha?
              </div>
            )}
          </div>

          {/* Sign-up / Login toggle card */}
          <div style={{...card, padding:18, textAlign:'center'}}>
            {mode==='login' ? (
              <>
                <div style={{fontSize:13, color:C.textMid, marginBottom:10}}>Ainda não é membro?</div>
                <button style={{...btnPink, padding:'8px 24px', fontSize:13, fontWeight:700,
                  letterSpacing:0.5, borderRadius:4}}
                  onClick={()=>setMode('signup')}>
                  ENTRAR JÁ
                </button>
              </>
            ) : (
              <>
                <div style={{fontSize:13, color:C.textMid, marginBottom:10}}>Já tem uma conta?</div>
                <button style={{...btnBlue, padding:'8px 24px', fontSize:13, fontWeight:700,
                  letterSpacing:0.5, borderRadius:4}}
                  onClick={()=>setMode('login')}>
                  ENTRAR
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{textAlign:'center', padding:'14px 0', fontSize:11, color:C.textLight,
        borderTop:`1px solid ${C.border}`}}>
        © Recriado com ❤️ · Reviva a nostalgia
      </div>
    </div>
  )
}

/* ── TOP NAV ─────────────────────────────────────────────────── */
function TopNav({ page, setPage, profile, pendingReqs }){
  const [search,setSearch]=useState('')
  const [results,setResults]=useState([])
  const [showResults,setShowResults]=useState(false)
  const searchRef=useRef()

  const doSearch=useCallback(async(q)=>{
    if(q.length<2){setResults([]);return}
    const data=await searchUsers(q)
    setResults(data)
    setShowResults(true)
  },[])

  useEffect(()=>{
    const t=setTimeout(()=>doSearch(search),300)
    return()=>clearTimeout(t)
  },[search])

  const links=[['Início','home'],['Perfil','perfil'],['Recados','recados'],['Amigos','amigos'],['Comunidades','comunidades'],['Aplicativos','apps']]

  return (
    <nav style={{background:C.white,borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:200,
      display:'flex',alignItems:'center',padding:'0 18px',height:50,boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
      <div onClick={()=>setPage('home')} style={{cursor:'pointer',marginRight:20,flexShrink:0,paddingTop:4}}>
        <OrkutLogo size={24}/>
      </div>
      <div style={{display:'flex',flex:1,alignItems:'center',height:'100%',gap:0}}>
        {links.map(([label,pg])=>(
          <div key={pg} onClick={()=>setPage(pg)} style={{
            padding:'0 11px',height:'100%',display:'flex',alignItems:'center',
            fontSize:13,fontWeight:page===pg?700:400,cursor:'pointer',
            color:page===pg?C.blue:C.textMid,
            borderBottom:page===pg?`2px solid ${C.blue}`:'2px solid transparent',
            boxSizing:'border-box',position:'relative',
          }}>
            {label}
            {pg==='amigos'&&pendingReqs>0&&(
              <span style={{position:'absolute',top:6,right:2,background:C.pink,color:'#fff',
                borderRadius:10,padding:'0 5px',fontSize:9,fontWeight:700,lineHeight:'16px'}}>
                {pendingReqs}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{position:'relative',marginRight:14}} ref={searchRef}>
        <span style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:C.textLight,fontSize:12}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          onFocus={()=>search.length>1&&setShowResults(true)}
          onBlur={()=>setTimeout(()=>setShowResults(false),200)}
          placeholder="Pesquisar pessoas…"
          style={{...inp,width:180,paddingLeft:28,borderRadius:18,fontSize:12,background:C.bg}}/>
        {showResults&&results.length>0&&(
          <div style={{position:'absolute',top:'100%',left:0,right:0,background:C.white,
            border:`1px solid ${C.border}`,borderRadius:8,boxShadow:'0 4px 16px rgba(0,0,0,.1)',
            zIndex:999,maxHeight:240,overflowY:'auto',marginTop:4}}>
            {results.map(u=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',cursor:'pointer',
                borderBottom:`1px solid ${C.border}`}}
                onMouseDown={()=>{ setPage({name:'profile',userId:u.id}); setSearch(''); setShowResults(false) }}>
                <Av src={u.avatar_url} size={28} name={u.name}/>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:C.text}}>{u.name}</div>
                  <div style={{fontSize:10,color:C.textLight}}>{u.city||u.country||''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User menu */}
      <div style={{display:'flex',alignItems:'center',gap:7,cursor:'pointer',
        padding:'4px 8px',borderRadius:7,border:`1px solid ${C.border}`}}
        onClick={()=>setPage('perfil')}>
        <Av src={profile?.avatar_url} size={24} name={profile?.name}/>
        <span style={{fontSize:12,fontWeight:600,color:C.text,maxWidth:90,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {profile?.name||'…'}
        </span>
        <span style={{fontSize:10,color:C.textLight}}>▾</span>
      </div>
    </nav>
  )
}

/* ── LEFT SIDEBAR ────────────────────────────────────────────── */
function LeftSidebar({ page, setPage, profile, visitors }){
  return (
    <aside style={{width:200,flexShrink:0}}>
      <div style={{...card,padding:14,marginBottom:10,textAlign:'center'}}>
        <div style={{display:'inline-block',marginBottom:8,position:'relative'}}>
          <Av src={profile?.avatar_url} size={76} ring name={profile?.name}/>
        </div>
        <div style={{fontWeight:700,fontSize:14,color:C.text}}>{profile?.name||'…'}</div>
        <div style={{fontSize:11,color:C.textLight,marginTop:2}}>{profile?.gender}, {profile?.rel_status}</div>
        <div style={{fontSize:11,color:C.textLight}}>{profile?.country}</div>
        <Divider/>
        <div style={{display:'flex',flexDirection:'column',gap:1,textAlign:'left'}}>
          {[['👤','Perfil','perfil'],['✉','Recados','recados'],['🖼','Galeria','galeria'],
            ['📝','Depoimentos','depoimentos'],['🎮','Aplicativos','apps']].map(([icon,label,pg])=>(
            <div key={pg} onClick={()=>setPage(pg)} style={{
              display:'flex',alignItems:'center',gap:8,
              padding:'6px 8px',borderRadius:6,cursor:'pointer',
              background:page===pg||page?.name===pg?'#eff4fb':'transparent',
              color:page===pg||page?.name===pg?C.blue:C.textMid,
              fontWeight:page===pg||page?.name===pg?700:400,fontSize:13,
            }}>
              <span style={{fontSize:13}}>{icon}</span>{label}
            </div>
          ))}
          <Divider/>
          <div onClick={()=>signOut()} style={{display:'flex',alignItems:'center',gap:8,
            padding:'6px 8px',borderRadius:6,cursor:'pointer',color:'#ef4444',fontSize:13}}>
            <span>🚪</span>Sair
          </div>
        </div>
      </div>

      {/* Visitors */}
      {visitors.length>0&&(
        <div style={{...card,padding:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.text,marginBottom:8}}>👁 Quem visitou</div>
          {visitors.slice(0,5).map((v,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:7,marginBottom:6,cursor:'pointer'}}
              onClick={()=>setPage({name:'profile',userId:v.visitor.id})}>
              <Av src={v.visitor.avatar_url} size={28} name={v.visitor.name}/>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:C.text}}>{v.visitor.name}</div>
                <div style={{fontSize:9,color:C.textLight}}>{new Date(v.visited_at).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

/* ── HOME PAGE ───────────────────────────────────────────────── */
function HomePage({ setPage, profile, friendCount, communityCount, recadoCount }){
  return (
    <div>
      <div style={{...card,padding:16,marginBottom:10,background:'linear-gradient(135deg,#eef4ff,#f0f7ff)'}}>
        <div style={{fontWeight:700,fontSize:16,color:C.blue,marginBottom:3}}>
          Bem-vindo(a) de volta, {profile?.name?.split(' ')[0]}! 👋
        </div>
        <div style={{fontSize:12,color:C.textMid}}>Reconecte-se. Tudo começa aqui.</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:9,marginBottom:10}}>
        {[['👥','Amigos',friendCount,'amigos'],['✉️','Recados',recadoCount,'recados'],['🌍','Comunidades',communityCount,'comunidades']].map(([icon,l,v,pg])=>(
          <div key={l} style={{...card,padding:14,textAlign:'center',cursor:'pointer'}} onClick={()=>setPage(pg)}>
            <div style={{fontSize:20,marginBottom:3}}>{icon}</div>
            <div style={{fontSize:19,fontWeight:700,color:C.blue}}>{v}</div>
            <div style={{fontSize:11,color:C.textLight}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:8}}>💡 Por onde começar</div>
        {[
          ['🔍','Pesquise seus amigos antigos pelo nome','search'],
          ['🌍','Entre nas comunidades clássicas que você amava','comunidades'],
          ['✏️','Complete seu perfil com músicas e filmes favoritos','perfil'],
          ['✉️','Deixe um recado na página de alguém','amigos'],
        ].map(([icon,text,pg],i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',
            borderBottom:i<3?`1px solid ${C.border}`:'none',cursor:'pointer'}}
            onClick={()=>setPage(pg)}>
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{fontSize:13,color:C.textMid}}>{text}</span>
            <span style={{marginLeft:'auto',fontSize:12,color:C.blue}}>→</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── PROFILE PAGE ────────────────────────────────────────────── */
function PerfilPage({ myId, userId, setPage, toast }){
  const isOwn = !userId || userId===myId
  const targetId = userId||myId
  const [profile,setProfile]=useState(null)
  const [editing,setEditing]=useState(false)
  const [draft,setDraft]=useState({})
  const [tab,setTab]=useState('sobre')
  const [deps,setDeps]=useState([])
  const [tWrite,setTWrite]=useState(false)
  const [tDraft,setTDraft]=useState('')
  const [fStatus,setFStatus]=useState(null)
  const [loading,setLoading]=useState(false)
  const [avatarUploading,setAvatarUploading]=useState(false)

  useEffect(()=>{
    if(!targetId) return
    getProfile(targetId).then(p=>{ setProfile(p); setDraft(p||{}) })
    getDepoimentos(targetId).then(setDeps)
    if(!isOwn) { recordVisit(myId, targetId) }
    if(!isOwn) getFriendshipStatus(myId, targetId).then(setFStatus)
  },[targetId])

  const save=async()=>{
    setLoading(true)
    await updateProfile(myId,{
      name:draft.name, bio:draft.bio, city:draft.city,
      country:draft.country, gender:draft.gender, rel_status:draft.rel_status,
      musica:draft.musica||[], filmes:draft.filmes||[], livros:draft.livros||[],
    })
    setProfile(draft); setEditing(false); setLoading(false); toast('Perfil atualizado!')
  }

  const handleAvatar=async(e)=>{
    const file=e.target.files[0]; if(!file) return
    setAvatarUploading(true)
    try{
      const url=await uploadAvatar(myId,file)
      await updateProfile(myId,{avatar_url:url})
      setProfile(p=>({...p,avatar_url:url}))
      toast('Foto atualizada!')
    }catch(err){ toast('Erro ao enviar foto') }
    setAvatarUploading(false)
  }

  const handleFriend=async()=>{
    if(!fStatus){ await sendFriendRequest(myId,targetId); setFStatus({status:'pending',requester_id:myId}); toast('Pedido enviado!') }
    else if(fStatus.status==='pending'&&fStatus.requester_id!==myId){ await respondFriendRequest(fStatus.id,true); setFStatus({...fStatus,status:'accepted'}); toast('Amizade aceita!') }
  }

  const submitDep=async()=>{
    if(!tDraft.trim()) return
    await sendDepoimento(myId,targetId,tDraft)
    const d=await getDepoimentos(targetId); setDeps(d)
    setTDraft(''); setTWrite(false); toast('Depoimento enviado!')
  }

  const arrayField=(key,value)=>{
    const arr=value.split(',').map(s=>s.trim()).filter(Boolean)
    setDraft(p=>({...p,[key]:arr}))
  }

  if(!profile) return <div style={{padding:20,color:C.textLight,textAlign:'center'}}>Carregando perfil…</div>

  const Field=({l,children})=>(
    <div style={{display:'flex',alignItems:'flex-start',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
      <div style={{...lbl,paddingTop:1}}>{l}</div>
      <div style={{flex:1}}>{children}</div>
    </div>
  )

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue,cursor:'pointer'}} onClick={()=>setPage('home')}>Início</span> ›{' '}
        <span style={{color:C.blue,fontWeight:600}}>{isOwn?'Meu Perfil':profile.name}</span>
      </div>

      <div style={{...card,padding:18,marginBottom:10}}>
        <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:12}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            <Av src={profile.avatar_url} size={80} ring name={profile.name}/>
            {isOwn&&(
              <label style={{fontSize:10,color:C.blue,cursor:'pointer',marginTop:4,display:'block'}}>
                {avatarUploading?'Enviando…':'trocar foto'}
                <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
              </label>
            )}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <h1 style={{fontSize:21,fontWeight:700,color:C.text,margin:0}}>{profile.name}</h1>
              <div style={{display:'flex',gap:8}}>
                {isOwn&&<button style={btnBlue} onClick={()=>setEditing(!editing)}>{editing?'Cancelar':'Editar perfil'}</button>}
                {!isOwn&&(
                  <button style={fStatus?.status==='accepted'?btnGhost:btnBlue} onClick={handleFriend}>
                    {!fStatus?'+ Adicionar amigo':
                     fStatus.status==='pending'&&fStatus.requester_id===myId?'Pedido enviado':
                     fStatus.status==='pending'?'Aceitar pedido':'✓ Amigos'}
                  </button>
                )}
                {!isOwn&&<button style={btnPink} onClick={()=>setPage({name:'recados',userId:targetId})}>✉ Recado</button>}
              </div>
            </div>
            {!editing
              ?<div style={{background:C.bg,borderRadius:7,padding:'7px 13px',fontSize:13,color:C.textMid,fontStyle:'italic'}}>{profile.bio}</div>
              :<textarea style={{...tarea,marginBottom:8}} value={draft.bio||''} onChange={e=>setDraft({...draft,bio:e.target.value})}/>
            }
          </div>
        </div>

        {/* Ratings */}
        <div style={{display:'flex',gap:20,padding:'10px 0',borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,marginBottom:10}}>
          {[['fãs',`⭐ ${profile.karma||10}`],['confiável','😊 😊 😊'],['legal','👍 👍 👍'],['sexy','❤ ❤ ❤']].map(([l,v])=>(
            <div key={l} style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:C.textLight,marginBottom:2}}>{l}</div>
              <div style={{fontSize:13,fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>

        {editing?(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[['nome','name'],['cidade','city'],['país','country'],['gênero','gender'],['relacionamento','rel_status']].map(([l,k])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{...lbl}}>{l}</div>
                <input style={{...inp,flex:1}} value={draft[k]||''} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
              </div>
            ))}
            {[['música (separada por vírgulas)','musica'],['filmes','filmes'],['livros','livros']].map(([l,k])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{...lbl}}>{l}</div>
                <input style={{...inp,flex:1}}
                  value={(draft[k]||[]).join(', ')}
                  onChange={e=>arrayField(k,e.target.value)}/>
              </div>
            ))}
            <button style={{...btnBlue,alignSelf:'flex-start',marginTop:4}} onClick={save} disabled={loading}>
              {loading?'Salvando…':'Salvar'}
            </button>
          </div>
        ):(
          <>
            <Field l="relacionamento"><span style={{fontSize:13}}>{profile.rel_status}</span></Field>
            <Field l="quem sou eu"><span style={{fontSize:13,lineHeight:1.6}}>{profile.bio}</span></Field>
            <Field l="cidade/país"><span style={{fontSize:13}}>{[profile.city,profile.country].filter(Boolean).join(', ')}</span></Field>
            {profile.musica?.length>0&&<Field l="música"><div style={{display:'flex',flexWrap:'wrap',marginTop:3}}>{profile.musica.map(t=><span key={t} style={tag}>{t}</span>)}</div></Field>}
            {profile.filmes?.length>0&&<Field l="filmes"><div style={{display:'flex',flexWrap:'wrap',marginTop:3}}>{profile.filmes.map(t=><span key={t} style={tag}>{t}</span>)}</div></Field>}
            {profile.livros?.length>0&&<Field l="livros"><div style={{display:'flex',flexWrap:'wrap',marginTop:3}}>{profile.livros.map(t=><span key={t} style={tag}>{t}</span>)}</div></Field>}
          </>
        )}
      </div>

      {/* Tabs */}
      <div style={{...card}}>
        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,background:'#f8f9fc'}}>
          {['depoimentos','sobre'].map(t=>(
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:'9px 16px',cursor:'pointer',fontSize:12,fontWeight:tab===t?700:400,
              borderBottom:tab===t?`2px solid ${C.blue}`:'2px solid transparent',
              color:tab===t?C.blue:C.textMid,boxSizing:'border-box'}}>
              {t.charAt(0).toUpperCase()+t.slice(1)}{t==='depoimentos'&&` (${deps.length})`}
            </div>
          ))}
        </div>
        <div style={{padding:16}}>
          {tab==='sobre'&&(
            <div style={{fontSize:12,color:C.textMid,lineHeight:2}}>
              <p>👤 Membro desde {new Date(profile.created_at||Date.now()).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>
              <p>⭐ Karma: {profile.karma||10}</p>
            </div>
          )}
          {tab==='depoimentos'&&(
            <div>
              {deps.map(d=>(
                <div key={d.id} style={{display:'flex',gap:11,padding:'11px 0',borderBottom:`1px solid ${C.border}`}}>
                  <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:d.from.id})}>
                    <Av src={d.from.avatar_url} size={36} name={d.from.name}/>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:C.blue,marginBottom:2,cursor:'pointer'}}
                      onClick={()=>setPage({name:'profile',userId:d.from.id})}>{d.from.name}:</div>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{d.text}</div>
                    <div style={{fontSize:11,color:C.textLight,marginTop:3}}>
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
              {deps.length===0&&<div style={{color:C.textLight,fontSize:12,padding:'16px 0'}}>Nenhum depoimento ainda.</div>}
              {!tWrite&&!isOwn&&myId&&(
                <button style={{...btnBlue,marginTop:8}} onClick={()=>setTWrite(true)}>Escrever depoimento</button>
              )}
              {tWrite&&(
                <div style={{marginTop:8,background:C.bg,borderRadius:7,padding:12}}>
                  <textarea style={tarea} value={tDraft} onChange={e=>setTDraft(e.target.value)} placeholder="Escreva algo bonito…"/>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button style={btnBlue} onClick={submitDep}>Postar</button>
                    <button style={btnGhost} onClick={()=>setTWrite(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── RECADOS ─────────────────────────────────────────────────── */
function RecadosPage({ myId, targetUserId, setPage, toast }){
  const targetId = targetUserId||myId
  const isOwn    = targetId===myId
  const [recados,setRecados]=useState([])
  const [text,setText]=useState('')
  const [targetProfile,setTargetProfile]=useState(null)
  const [loading,setLoading]=useState(false)
  const [replyId,setReplyId]=useState(null)

  useEffect(()=>{
    getRecados(targetId).then(setRecados)
    if(!isOwn) getProfile(targetId).then(setTargetProfile)
  },[targetId])

  // Realtime
  useEffect(()=>{
    const ch=supabase.channel('recados-'+targetId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'recados',filter:`to_id=eq.${targetId}`},
        ()=>getRecados(targetId).then(setRecados))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[targetId])

  const post=async()=>{
    if(!text.trim()) return
    setLoading(true)
    await sendRecado(myId,targetId,text)
    const data=await getRecados(targetId); setRecados(data)
    setText(''); setLoading(false); toast('Recado enviado!')
  }

  const del=async(id)=>{ await deleteRecado(id,myId); setRecados(p=>p.filter(r=>r.id!==id)) }

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue,cursor:'pointer'}} onClick={()=>setPage('home')}>Início</span> ›{' '}
        {!isOwn&&<><span style={{color:C.blue,cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:targetId})}>{targetProfile?.name}</span> › </>}
        <span style={{color:C.blue,fontWeight:600}}>Recados</span>
      </div>

      <div style={{...card,padding:16,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:8}}>
          {isOwn?'Deixar recado no meu mural':`Deixar recado para ${targetProfile?.name||'…'}`}
        </div>
        <textarea style={tarea} value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva um recado…"/>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button style={{...btnBlue,opacity:loading?.6:1}} onClick={post} disabled={loading}>
            {loading?'Enviando…':'Enviar recado'}
          </button>
        </div>
      </div>

      <div style={{...card,padding:16}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>Recados ({recados.length})</div>
        {recados.map(r=>(
          <div key={r.id} style={{display:'flex',gap:11,padding:'11px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:r.from.id})}>
              <Av src={r.from.avatar_url} size={38} name={r.from.name}/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,fontSize:13,color:C.blue,cursor:'pointer'}}
                  onClick={()=>setPage({name:'profile',userId:r.from.id})}>{r.from.name}</span>
                <span style={{fontSize:11,color:C.textLight}}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div style={{fontSize:13,color:C.text,marginTop:3,lineHeight:1.5}}>{r.text}</div>
              <div style={{display:'flex',gap:12,marginTop:5}}>
                <span style={{fontSize:11,color:C.blue,cursor:'pointer'}}
                  onClick={()=>setPage({name:'recados',userId:r.from.id})}>↩ Responder</span>
                {(isOwn||r.from.id===myId)&&(
                  <span style={{fontSize:11,color:'#ef4444',cursor:'pointer'}} onClick={()=>del(r.id)}>Apagar</span>
                )}
              </div>
            </div>
          </div>
        ))}
        {recados.length===0&&<div style={{color:C.textLight,fontSize:12,padding:'16px 0'}}>Nenhum recado ainda.</div>}
      </div>
    </div>
  )
}

/* ── AMIGOS ──────────────────────────────────────────────────── */
function AmigosPage({ myId, setPage, toast }){
  const [friends,setFriends]=useState([])
  const [requests,setRequests]=useState([])
  const [chatFriend,setChatFriend]=useState(null)
  const [messages,setMessages]=useState([])
  const [chatInput,setChatInput]=useState('')
  const chatRef=useRef()

  const load=()=>{ getFriends(myId).then(setFriends); getFriendRequests(myId).then(setRequests) }
  useEffect(()=>{ load() },[myId])

  // Realtime friend requests
  useEffect(()=>{
    const ch=supabase.channel('friends-'+myId)
      .on('postgres_changes',{event:'*',schema:'public',table:'friendships'},()=>load())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[myId])

  const respond=async(id,accept)=>{
    await respondFriendRequest(id,accept); load()
    toast(accept?'Amizade aceita!':'Pedido recusado')
  }

  const openChat=async(f)=>{
    setChatFriend(f)
    const msgs=await getMessages(myId,f.id); setMessages(msgs)
    setTimeout(()=>chatRef.current?.scrollTo(0,9999),50)
  }

  // Realtime chat
  useEffect(()=>{
    if(!chatFriend) return
    const ch=supabase.channel('chat-'+[myId,chatFriend.id].sort().join('-'))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},
        ()=>getMessages(myId,chatFriend.id).then(msgs=>{ setMessages(msgs); setTimeout(()=>chatRef.current?.scrollTo(0,9999),50) }))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[chatFriend])

  const sendMsg=async()=>{
    if(!chatInput.trim()) return
    await sendMessage(myId,chatFriend.id,chatInput); setChatInput('')
  }

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Amigos</span>
      </div>

      {requests.length>0&&(
        <div style={{...card,padding:16,marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:10}}>
            📬 Pedidos de amizade ({requests.length})
          </div>
          {requests.map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${C.border}`}}>
              <Av src={r.requester.avatar_url} size={38} name={r.requester.name}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:C.text,cursor:'pointer'}}
                  onClick={()=>setPage({name:'profile',userId:r.requester.id})}>{r.requester.name}</div>
              </div>
              <button style={{...btnBlue,padding:'4px 12px',fontSize:11}} onClick={()=>respond(r.id,true)}>Aceitar</button>
              <button style={{...btnGhost,padding:'4px 12px',fontSize:11}} onClick={()=>respond(r.id,false)}>Recusar</button>
            </div>
          ))}
        </div>
      )}

      <div style={{...card,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Meus Amigos ({friends.length})</h2>
          {friends.length===0&&<span style={{fontSize:12,color:C.textLight}}>Pesquise pessoas na barra de busca ↑</span>}
        </div>
        {friends.length===0?(
          <div style={{textAlign:'center',padding:'30px 0',color:C.textLight,fontSize:13}}>
            Você ainda não tem amigos aqui. Use a busca para encontrar pessoas!
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {friends.map(f=>(
              <div key={f.id} style={{textAlign:'center',padding:11,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg}}>
                <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:f.id})}>
                  <Av src={f.avatar_url} size={52} name={f.name}/>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:C.text,margin:'6px 0',cursor:'pointer',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                  onClick={()=>setPage({name:'profile',userId:f.id})}>{f.name}</div>
                <div style={{fontSize:10,color:C.textLight,marginBottom:8}}>{f.city||f.country||''}</div>
                <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                  <button style={{...btnBlue,padding:'3px 9px',fontSize:11}} onClick={()=>openChat(f)}>💬 Chat</button>
                  <button style={{...btnGhost,padding:'3px 9px',fontSize:11}}
                    onClick={()=>setPage({name:'recados',userId:f.id})}>✉</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat modal */}
      {chatFriend&&(
        <div style={{position:'fixed',bottom:20,right:20,width:295,background:C.white,
          border:`1.5px solid ${C.border}`,borderRadius:12,
          boxShadow:'0 8px 30px rgba(0,0,0,.13)',zIndex:999,overflow:'hidden'}}>
          <div style={{background:C.blue,padding:'9px 13px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Av src={chatFriend.avatar_url} size={24} name={chatFriend.name}/>
              <span style={{color:'#fff',fontWeight:700,fontSize:13}}>{chatFriend.name}</span>
            </div>
            <span style={{color:'#fff',cursor:'pointer'}} onClick={()=>setChatFriend(null)}>✕</span>
          </div>
          <div ref={chatRef} style={{height:220,overflowY:'auto',padding:10,background:C.bg,
            display:'flex',flexDirection:'column',gap:6}}>
            {messages.length===0&&<div style={{color:C.textLight,fontSize:11,textAlign:'center',marginTop:70}}>
              Comece a conversa!</div>}
            {messages.map(m=>(
              <div key={m.id} style={{alignSelf:m.from_id===myId?'flex-end':'flex-start',maxWidth:'82%',
                background:m.from_id===myId?C.blue:'#fff',color:m.from_id===myId?'#fff':C.text,
                padding:'6px 10px',borderRadius:10,fontSize:12,
                boxShadow:'0 1px 3px rgba(0,0,0,.06)'}}>
                {m.text}
              </div>
            ))}
          </div>
          <div style={{padding:7,borderTop:`1px solid ${C.border}`,display:'flex',gap:6}}>
            <input style={{...inp,flex:1,fontSize:12}} value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&sendMsg()}
              placeholder="Mensagem…"/>
            <button style={{...btnBlue,padding:'6px 11px'}} onClick={sendMsg}>→</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── COMUNIDADES ─────────────────────────────────────────────── */
function ComunidadesPage({ myId, toast }){
  const [all,setAll]=useState([])
  const [mine,setMine]=useState([])
  const [tab,setTab]=useState('todas')
  const [cat,setCat]=useState('Todos')
  const [search,setSearch]=useState('')
  const [active,setActive]=useState(null)
  const [posts,setPosts]=useState([])
  const [newPost,setNewPost]=useState('')

  useEffect(()=>{ getCommunities().then(setAll); getMyCommunities(myId).then(setMine) },[myId])

  const cats=['Todos',...[...new Set(all.map(c=>c.category))].sort()]
  const myIds=new Set(mine.map(c=>c.id))

  const filtered=all.filter(c=>{
    const mc=cat==='Todos'||c.category===cat
    const ms=c.name.toLowerCase().includes(search.toLowerCase())
    const mt=tab==='todas'||myIds.has(c.id)
    return mc&&ms&&mt
  })

  const toggle=async(c)=>{
    if(myIds.has(c.id)){ await leaveCommunity(myId,c.id); setMine(p=>p.filter(x=>x.id!==c.id)); toast('Você saiu da comunidade') }
    else { await joinCommunity(myId,c.id); setMine(p=>[...p,c]); toast('Bem-vindo(a) à comunidade!') }
  }

  const openCom=async(c)=>{
    setActive(c); const p=await getCommunityPosts(c.id); setPosts(p)
  }

  // Realtime posts
  useEffect(()=>{
    if(!active) return
    const ch=supabase.channel('com-'+active.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'community_posts',filter:`community_id=eq.${active.id}`},
        ()=>getCommunityPosts(active.id).then(setPosts))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[active])

  const postMsg=async()=>{
    if(!newPost.trim()) return
    await createCommunityPost(myId,active.id,newPost)
    setNewPost(''); toast('Postagem enviada!')
  }

  if(active){
    const isJoined=myIds.has(active.id)
    return (
      <div>
        <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
          <span style={{color:C.blue,cursor:'pointer'}} onClick={()=>setActive(null)}>Comunidades</span> ›{' '}
          <span style={{color:C.blue,fontWeight:600}}>{active.name}</span>
        </div>
        <div style={{...card,padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <img src={`https://picsum.photos/seed/${active.seed}/60/60`} alt=""
                style={{width:52,height:52,borderRadius:8,objectFit:'cover',border:`1px solid ${C.border}`}}/>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:2}}>{active.name}</div>
                <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>{active.category} · {(active.members_count||0).toLocaleString('pt-BR')} membros</div>
                <div style={{fontSize:12,color:C.textMid,fontStyle:'italic'}}>{active.description}</div>
              </div>
            </div>
            <button style={isJoined?btnGhost:btnBlue} onClick={()=>toggle(active)}>
              {isJoined?'✓ Membro':'+ Participar'}
            </button>
          </div>

          {isJoined&&(
            <div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:14}}>
              <textarea style={tarea} value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Compartilhe algo com a comunidade…"/>
              <button style={{...btnBlue,marginTop:8}} onClick={postMsg}>Postar</button>
            </div>
          )}

          {posts.length===0?(
            <div style={{textAlign:'center',color:C.textLight,padding:30,fontSize:13}}>
              {isJoined?'Seja o primeiro a postar!':'Entre na comunidade para ver e postar conteúdo.'}
            </div>
          ):posts.map(p=>(
            <div key={p.id} style={{display:'flex',gap:11,padding:'11px 0',borderBottom:`1px solid ${C.border}`}}>
              <Av src={p.author.avatar_url} size={36} name={p.author.name}/>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:C.blue}}>{p.author.name}</div>
                <div style={{fontSize:13,color:C.text,marginTop:3,lineHeight:1.5}}>{p.text}</div>
                <div style={{fontSize:11,color:C.textLight,marginTop:3}}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Comunidades</span>
      </div>
      <div style={{...card,padding:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:C.text}}>Comunidades Clássicas</div>
            <div style={{fontSize:11,color:C.textLight,marginTop:2}}>{all.length} comunidades · {mine.length} suas</div>
          </div>
          <input style={{...inp,width:180,fontSize:12}} placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:12}}>
          {[['todas','Todas'],['minhas','Minhas']].map(([t,l])=>(
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:'7px 14px',cursor:'pointer',fontSize:12,fontWeight:tab===t?700:400,
              borderBottom:tab===t?`2px solid ${C.blue}`:'2px solid transparent',
              color:tab===t?C.blue:C.textMid,boxSizing:'border-box',
            }}>
              {l}{t==='minhas'&&mine.length>0&&<span style={{background:C.blue,color:'#fff',borderRadius:10,padding:'1px 6px',fontSize:10,marginLeft:4}}>{mine.length}</span>}
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:14}}>
          {cats.map(c=>(
            <span key={c} onClick={()=>setCat(c)} style={{...tag,cursor:'pointer',
              background:cat===c?C.blue:C.tagBg,color:cat===c?'#fff':C.textMid,
              border:cat===c?`1px solid ${C.blue}`:`1px solid ${C.tagBorder}`,fontWeight:cat===c?600:400}}>
              {c}
            </span>
          ))}
        </div>

        {filtered.length===0?(
          <div style={{textAlign:'center',color:C.textLight,padding:30,fontSize:13}}>
            {tab==='minhas'?'Você ainda não entrou em nenhuma comunidade.':'Nenhuma encontrada.'}
          </div>
        ):(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))',gap:10}}>
            {filtered.map(c=>{
              const isJ=myIds.has(c.id)
              return (
                <div key={c.id} style={{border:`1px solid ${isJ?C.blue:C.border}`,borderRadius:9,overflow:'hidden',background:isJ?'#eff4fb':C.bg}}>
                  <div style={{position:'relative',cursor:'pointer'}} onClick={()=>openCom(c)}>
                    <img src={`https://picsum.photos/seed/${c.seed}/300/90`} alt=""
                      style={{width:'100%',height:70,objectFit:'cover',display:'block'}}/>
                    {isJ&&<div style={{position:'absolute',top:6,right:6,background:C.blue,color:'#fff',
                      borderRadius:10,padding:'1px 7px',fontSize:10,fontWeight:700}}>✓</div>}
                  </div>
                  <div style={{padding:'8px 10px'}}>
                    <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:1,cursor:'pointer',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                      onClick={()=>openCom(c)}>{c.name}</div>
                    <div style={{fontSize:10,color:C.textLight,marginBottom:1}}>{c.category}</div>
                    <div style={{fontSize:10,color:C.textLight,marginBottom:7}}>{(c.members_count||0).toLocaleString('pt-BR')} membros</div>
                    <div style={{display:'flex',gap:4}}>
                      {isJ&&<button style={{...btnBlue,padding:'2px 8px',fontSize:10,flex:1}} onClick={()=>openCom(c)}>Entrar →</button>}
                      <button style={{...(isJ?btnGhost:btnBlue),padding:'2px 8px',fontSize:10,flex:1}} onClick={()=>toggle(c)}>
                        {isJ?'Sair':'+ Entrar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── RIGHT COLUMN ─────────────────────────────────────────────── */
// Placeholder avatars for friend suggestions — single bold letter
function LetterAvatar({ letter, size=42 }){
  const colors=['#e91e8c','#3b72b8','#e8650a','#22a06b']
  const i = letter.charCodeAt(0) % colors.length
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:colors[i],
      display:'flex',alignItems:'center',justifyContent:'center',
      fontWeight:900,fontSize:size*0.48,color:'#fff',flexShrink:0,
      border:`1px solid ${C.border}`}}>
      {letter}
    </div>
  )
}

const FRIEND_SUGGESTIONS = [
  { letter:'A', label:'A.' },
  { letter:'B', label:'B.' },
  { letter:'C', label:'C.' },
  { letter:'D', label:'D.' },
]

const COMMUNITY_SUGGESTIONS = [
  { name:'♥ Eu odeio acordar cedo', seed:'acordar', members:'10,2M' },
  { name:'Orkut para sempre ♥',     seed:'forever', members:'4,8M'  },
  { name:'Comunidade X',            seed:'comx',    members:'—'     },
  { name:'Comunidade Y',            seed:'comy',    members:'—'     },
]

function RightColumn({ myId, setPage }){
  const [friends,setFriends]=useState([])
  const [mine,setMine]=useState([])
  useEffect(()=>{ getFriends(myId).then(setFriends); getMyCommunities(myId).then(setMine) },[myId])

  return (
    <aside style={{width:192,flexShrink:0}}>

      {/* ── Meus amigos ── */}
      <div style={{...card,padding:13,marginBottom:10}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:12,color:C.text}}>
            meus amigos ({friends.length})
          </div>
          <span style={{fontSize:11,color:C.blue,cursor:'pointer'}} onClick={()=>setPage('amigos')}>ver todos</span>
        </div>
        {friends.length===0
          ? <div style={{fontSize:11,color:C.textLight,textAlign:'center',padding:'4px 0'}}>Sem amigos ainda.</div>
          : <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
              {friends.slice(0,9).map(f=>(
                <div key={f.id} style={{textAlign:'center',cursor:'pointer'}}
                  onClick={()=>setPage({name:'profile',userId:f.id})}>
                  <Av src={f.avatar_url} size={42} name={f.name}/>
                  <div style={{fontSize:9,color:C.textLight,marginTop:2,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* ── Sugestões de amigos ── */}
      <div style={{...card,padding:13,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:10}}>
          sugestões de amigos
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
          {FRIEND_SUGGESTIONS.map(({letter,label})=>(
            <div key={letter} style={{textAlign:'center',cursor:'pointer',opacity:0.7}}
              title="Em breve">
              <div style={{display:'flex',justifyContent:'center'}}>
                <LetterAvatar letter={letter} size={38}/>
              </div>
              <div style={{fontSize:9,color:C.textLight,marginTop:3}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Minhas comunidades + sugestões ── */}
      <div style={{...card,padding:13}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:12,color:C.text}}>
            minhas comunidades ({mine.length})
          </div>
          <span style={{fontSize:11,color:C.blue,cursor:'pointer'}}
            onClick={()=>setPage('comunidades')}>ver todas</span>
        </div>

        {/* Real joined communities */}
        {mine.length>0&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12}}>
            {mine.slice(0,6).map(c=>(
              <div key={c.id} style={{textAlign:'center'}}>
                <img src={`https://picsum.photos/seed/${c.seed}/60/60`} alt=""
                  style={{width:42,height:42,borderRadius:6,objectFit:'cover',
                    border:`1px solid ${C.border}`,display:'block'}}/>
                <div style={{fontSize:9,color:C.textLight,marginTop:2,overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {c.name.replace(/[♥❤★]/g,'').trim()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested communities */}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10}}>
          <div style={{fontSize:10,color:C.textLight,marginBottom:8,fontWeight:600}}>
            comunidades sugeridas
          </div>
          {COMMUNITY_SUGGESTIONS.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,
              cursor:'pointer'}} onClick={()=>setPage('comunidades')}>
              <img src={`https://picsum.photos/seed/${c.seed}/40/40`} alt=""
                style={{width:32,height:32,borderRadius:5,objectFit:'cover',
                  border:`1px solid ${C.border}`,flexShrink:0,display:'block'}}/>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,fontWeight:600,color:C.text,overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.3}}>
                  {c.name.replace(/[♥❤★]/g,'').trim()}
                </div>
                <div style={{fontSize:9,color:C.textLight}}>{c.members} membros</div>
              </div>
            </div>
          ))}
          <div style={{textAlign:'center',marginTop:4}}>
            <span style={{fontSize:11,color:C.blue,cursor:'pointer'}}
              onClick={()=>setPage('comunidades')}>
              ver todas as comunidades →
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ── APPS ─────────────────────────────────────────────────────── */
function AppsPage(){
  const [fortune,setFortune]=useState(null)
  const fortunes=['Grandes coisas estão a caminho 🌟','Uma velha amizade será renovada em breve 💫','Seu próximo passo é mais fácil do que parece ✨','Confie no processo — o Orkut nunca mente 😄']
  const pick=a=>a[Math.floor(Math.random()*a.length)]
  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Aplicativos</span>
      </div>
      <div style={{...card,padding:16}}>
        <h2 style={{fontSize:14,fontWeight:700,margin:'0 0 14px'}}>Aplicativos</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
          {[
            {id:1,icon:'♈',name:'Horóscopo',desc:'Veja seu signo e previsões do dia'},
            {id:2,icon:'🥠',name:'Fortune Cookie',desc:'Receba uma mensagem do destino'},
            {id:3,icon:'👥',name:'Comparar Perfis',desc:'Compare karma com seus amigos'},
            {id:4,icon:'🎵',name:'Quiz Musical',desc:'Teste seu conhecimento musical'},
          ].map(a=>(
            <div key={a.id} style={{border:`1px solid ${C.border}`,borderRadius:9,padding:14,background:C.bg}}>
              <div style={{fontSize:26,marginBottom:5}}>{a.icon}</div>
              <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>{a.desc}</div>
              <button style={btnBlue} onClick={()=>a.id===2&&setFortune(pick(fortunes))}>Abrir</button>
              {a.id===2&&fortune&&<div style={{marginTop:8,fontSize:12,fontStyle:'italic',background:'#fff',borderRadius:6,padding:'6px 10px',color:C.text}}>{fortune}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── ROOT APP ─────────────────────────────────────────────────── */
export default function App(){
  const [session,setSession]=useState(undefined) // undefined=loading
  const [profile,setProfile]=useState(null)
  const [page,setPage]=useState('home')
  const [pendingReqs,setPendingReqs]=useState(0)
  const [visitors,setVisitors]=useState([])
  const [toast,setToast]=useState('')
  const [friendCount,setFriendCount]=useState(0)
  const [communityCount,setCommunityCount]=useState(0)
  const [recadoCount,setRecadoCount]=useState(0)

  const showToast=msg=>setToast(msg)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s))
    return()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    if(!session?.user) return
    const uid=session.user.id
    getProfile(uid).then(setProfile)
    getFriendRequests(uid).then(r=>setPendingReqs(r.length))
    getVisitors(uid).then(setVisitors)
    getFriends(uid).then(f=>setFriendCount(f.length))
    getMyCommunities(uid).then(c=>setCommunityCount(c.length))
    getRecados(uid).then(r=>setRecadoCount(r.length))
  },[session])

  if(session===undefined) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:C.bg}}>
      <OrkutLogo size={36}/>
    </div>
  )

  if(!session) return <AuthScreen onAuth={()=>supabase.auth.getSession().then(({data:{session}})=>setSession(session))}/>

  const myId=session.user.id
  const showRight=['home','perfil'].includes(typeof page==='string'?page:page?.name)

  const renderMain=()=>{
    const pg=typeof page==='string'?page:page?.name
    switch(pg){
      case 'home':        return <HomePage setPage={setPage} profile={profile} friendCount={friendCount} communityCount={communityCount} recadoCount={recadoCount}/>
      case 'perfil':      return <PerfilPage myId={myId} userId={null} setPage={setPage} toast={showToast}/>
      case 'profile':     return <PerfilPage myId={myId} userId={page.userId} setPage={setPage} toast={showToast}/>
      case 'recados':     return <RecadosPage myId={myId} targetUserId={page?.userId||null} setPage={setPage} toast={showToast}/>
      case 'amigos':      return <AmigosPage myId={myId} setPage={setPage} toast={showToast}/>
      case 'comunidades': return <ComunidadesPage myId={myId} toast={showToast}/>
      case 'galeria':     return <div style={{...card,padding:30,textAlign:'center',color:C.textLight}}>Galeria de fotos em breve 🖼</div>
      case 'depoimentos': return <PerfilPage myId={myId} userId={null} setPage={setPage} toast={showToast}/>
      case 'apps':        return <AppsPage/>
      default:            return <HomePage setPage={setPage} profile={profile} friendCount={friendCount} communityCount={communityCount} recadoCount={recadoCount}/>
    }
  }

  return (
    <div style={{fontFamily:"'Trebuchet MS','Lucida Grande',sans-serif",background:C.bg,minHeight:'100vh',color:C.text}}>
      <TopNav page={typeof page==='string'?page:page?.name} setPage={setPage} profile={profile} pendingReqs={pendingReqs}/>
      <div style={{maxWidth:1040,margin:'0 auto',padding:'14px 14px',display:'flex',gap:11,alignItems:'flex-start'}}>
        <LeftSidebar page={typeof page==='string'?page:page?.name} setPage={setPage} profile={profile} visitors={visitors}/>
        <main style={{flex:1,minWidth:0}}>{renderMain()}</main>
        {showRight&&<RightColumn myId={myId} setPage={setPage}/>}
      </div>
      <div style={{textAlign:'center',padding:'18px 0 28px',fontSize:11,color:C.textLight}}>
        © Recriado com ❤️ · Reviva a nostalgia
      </div>
      <Toast msg={toast} onDone={()=>setToast('')}/>
    </div>
  )
}
