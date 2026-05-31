import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase, signUp, signIn, signOut, getProfile, updateProfile,
  getFriends, getFriendRequests, sendFriendRequest, respondFriendRequest,
  getFriendshipStatus, getRecados, sendRecado, deleteRecado,
  getDepoimentos, sendDepoimento, getCommunities, getMyCommunities,
  joinCommunity, leaveCommunity, getCommunityPosts, createCommunityPost,
  getMessages, sendMessage, recordVisit, getVisitors, uploadAvatar,
  searchUsers } from './lib/supabase.js'

/* ── Tokens ── */
const NAV_BG   = '#2a4b8d'
const NAV_TEXT = '#ffffff'
const PINK     = '#e8197d'
const BLUE     = '#2a4b8d'
const BG       = '#dce3f0'
const WHITE    = '#ffffff'
const BORDER   = '#c8d0e0'
const TEXT     = '#1a1a2e'
const MUTED    = '#6b7a99'
const PANEL_H  = 'linear-gradient(180deg,#e8edf8 0%,#d0d8ef 100%)'

/* ── Shared styles ── */
const card  = { background:WHITE, border:`1px solid ${BORDER}`, borderRadius:3 }
const inp   = { width:'100%', border:`1px solid ${BORDER}`, borderRadius:2,
                padding:'5px 8px', fontSize:12, fontFamily:'inherit',
                color:TEXT, background:WHITE, outline:'none', boxSizing:'border-box' }
const tarea = { ...inp, resize:'vertical', minHeight:70 }
const btn   = { cursor:'pointer', border:'none', fontFamily:'inherit', borderRadius:2, fontWeight:600 }
const btnBlue = { ...btn, background:BLUE,  color:WHITE, padding:'5px 14px', fontSize:12 }
const btnPink = { ...btn, background:PINK,  color:WHITE, padding:'5px 14px', fontSize:12 }
const btnGhost= { ...btn, background:'transparent', border:`1px solid ${BORDER}`, color:MUTED, padding:'4px 10px', fontSize:11 }

const panelHead = (extra={}) => ({
  background: PANEL_H, borderBottom:`1px solid ${BORDER}`,
  padding:'3px 8px', fontSize:11, fontWeight:700, color:BLUE,
  display:'flex', justifyContent:'space-between', alignItems:'center', ...extra
})

/* ── O Logo ── */
function OrkutLogo({ size, id }){
  size = size||32; id = id||'ol'
  const h=size, w=size*4.4, gid=id+'g', mid=id+'m'
  return (
    <svg width={w} height={h} viewBox={"0 0 "+w+" "+h} style={{display:"block",overflow:"visible"}} aria-label="">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff0099" stopOpacity="1"/>
          <stop offset="21%"  stopColor="#ff0099" stopOpacity="1"/>
          <stop offset="24%"  stopColor="#ff0099" stopOpacity="0.10"/>
          <stop offset="32%"  stopColor="#ff0099" stopOpacity="0.03"/>
          <stop offset="45%"  stopColor="#ff0099" stopOpacity="0"/>
        </linearGradient>
        <mask id={mid}><rect x="0" y="0" width={w} height={h*1.2} fill={"url(#"+gid+")"}/></mask>
      </defs>
      <text x="0" y={h*0.88}
        fontFamily="'Nunito Black','Nunito','Montserrat','Arial Rounded MT Bold',Arial,sans-serif"
        fontSize={h} fontWeight="900" fill="#ff0099" mask={"url(#"+mid+")"} letterSpacing="-1">Orkut</text>
    </svg>
  )
}

/* ── Avatar ── */
function Av({ src, size, ring, name }){
  size = size||36
  const fb = "https://api.dicebear.com/9.x/personas/svg?seed="+encodeURIComponent(name||'u')
  return <img src={src||fb} alt={name||''} width={size} height={size}
    onError={e=>{ e.target.src=fb }}
    style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0, display:'block',
             border: ring ? `2px solid ${PINK}` : `1px solid ${BORDER}` }}/>
}

/* ── Toast ── */
function Toast({ msg, onDone }){
  useEffect(()=>{ if(msg){ const t=setTimeout(onDone,3000); return()=>clearTimeout(t) } },[msg])
  if(!msg) return null
  return <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',
    background:BLUE,color:WHITE,padding:'9px 20px',borderRadius:4,fontSize:13,
    fontWeight:600,zIndex:9999,boxShadow:'0 3px 12px rgba(0,0,0,.2)'}}>{msg}</div>
}

/* ── AUTH SCREEN ── */
function AuthScreen({ onAuth }){
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({email:'',password:'',name:''})
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  const submit=async()=>{
    setErr(''); setLoading(true)
    try{
      if(mode==='login') await signIn({email:form.email,password:form.password})
      else {
        if(!form.name.trim()) throw new Error('Digite seu nome')
        await signUp({email:form.email,password:form.password,name:form.name})
      }
      onAuth()
    }catch(e){
      setErr(e.message==='Failed to fetch'?'Erro de conexão. Tente novamente.':e.message)
    }
    setLoading(false)
  }

  const retroInp = { width:'100%', border:'1px solid #a0a8c0', borderRadius:1,
    padding:'3px 5px', fontSize:12, fontFamily:'inherit', color:TEXT,
    background:WHITE, outline:'none', boxSizing:'border-box' }

  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column'}}>
      {/* Aviso */}
      <div style={{background:'#f0eeff',borderBottom:'1px solid #d8ccf0',
        padding:'7px 0',textAlign:'center',fontSize:12}}>
        <span style={{color:PINK,fontWeight:700}}>Aviso:</span>
        <span style={{color:MUTED}}> Reviva a nostalgia com conexões verdadeiras.</span>
      </div>

      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        padding:'32px 20px',gap:40,maxWidth:960,margin:'0 auto',width:'100%',flexWrap:'wrap'}}>

        {/* Left */}
        <div style={{flex:'1 1 360px',minWidth:260,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',padding:'20px 0'}}>
          <div style={{marginBottom:40}}><OrkutLogo size={100} id="auth"/></div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {[['Conecte-se','aos seus amigos e familiares usando recados e mensagens'],
              ['Conheça','novas pessoas através de amigos de seus amigos e comunidades'],
              ['Compartilhe','seus momentos, fotos, paixões e interesses em um só lugar']
            ].map(([v,r])=>(
              <div key={v} style={{fontSize:14,color:MUTED,textAlign:'center',lineHeight:1.4}}>
                <span style={{color:PINK,fontWeight:700}}>{v}</span>{' '}{r}
              </div>
            ))}
          </div>
        </div>

        {/* Right — retro form */}
        <div style={{flex:'0 1 290px',minWidth:240}}>
          <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:3,
            padding:'14px 16px',marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
            <div style={{fontSize:12,color:TEXT,marginBottom:12,textAlign:'center',
              display:'flex',alignItems:'center',justifyContent:'center',gap:5,flexWrap:'wrap'}}>
              {mode==='login'
                ?<><span>Acesse o</span><OrkutLogo size={14} id="form"/><span>com a sua conta</span></>
                :<span style={{fontWeight:600}}>Cadastre-se gratuitamente</span>}
            </div>

            {mode==='signup'&&<div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:TEXT,marginBottom:2}}>Seu nome:</div>
              <input style={retroInp} value={form.name} onChange={e=>f('name',e.target.value)}/>
            </div>}

            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:TEXT,marginBottom:2}}>E-mail:</div>
              <input style={retroInp} type="email" value={form.email}
                onChange={e=>f('email',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:TEXT,marginBottom:2}}>Senha:</div>
              <input style={retroInp} type="password" value={form.password}
                onChange={e=>f('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>

            {err&&<div style={{fontSize:11,color:'#cc0000',marginBottom:8,padding:'4px 6px',
              background:'#fff0f0',border:'1px solid #ffcccc',borderRadius:2}}>{err}</div>}

            <button style={{background:'linear-gradient(180deg,#5577bb,#2244aa)',
              border:'1px solid #1a3a8a',borderRadius:2,color:WHITE,padding:'4px 16px',
              fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}
              onClick={submit} disabled={loading}>
              {loading?'Aguarde…':mode==='login'?'Login':'Criar conta'}
            </button>
            {mode==='login'&&<div style={{fontSize:11,color:PINK,cursor:'pointer',marginTop:8}}>
              Esqueceu sua senha?</div>}
          </div>

          <div style={{background:WHITE,border:`1px solid ${BORDER}`,borderRadius:3,
            padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',textAlign:'center'}}>
            {mode==='login'
              ?<><div style={{fontSize:12,color:TEXT,marginBottom:10}}>Ainda não é membro?</div>
                <button style={{...btnPink,padding:'6px 20px',fontSize:13,letterSpacing:.5}}
                  onClick={()=>setMode('signup')}>ENTRAR JÁ</button></>
              :<><div style={{fontSize:12,color:TEXT,marginBottom:10}}>Já tem uma conta?</div>
                <button style={{background:'linear-gradient(180deg,#5577bb,#2244aa)',
                  border:'1px solid #1a3a8a',borderRadius:2,color:WHITE,padding:'6px 20px',
                  fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}
                  onClick={()=>setMode('login')}>ENTRAR</button></>}
          </div>
        </div>
      </div>

      <div style={{textAlign:'center',padding:'12px 0',fontSize:11,color:MUTED,
        borderTop:`1px solid ${BORDER}`}}>
        © Recriado com ❤️ · Zero Monetização
      </div>
    </div>
  )
}

/* ── TOP NAV — dark blue, Portuguese ── */
function TopNav({ page, setPage, profile, pendingReqs }){
  const [search,setSearch]=useState('')
  const [results,setResults]=useState([])
  const [show,setShow]=useState(false)

  const doSearch=useCallback(async(q)=>{
    if(q.length<2){setResults([]);return}
    setResults(await searchUsers(q)); setShow(true)
  },[])
  useEffect(()=>{ const t=setTimeout(()=>doSearch(search),300); return()=>clearTimeout(t) },[search])

  const links=[['Início','home'],['Perfil','perfil'],['Recados','recados'],
               ['Amigos','amigos'],['Comunidades','comunidades'],['Aplicativos','apps']]
  const cur = typeof page==='string'?page:page?.name

  return (
    <nav style={{background:NAV_BG,position:'sticky',top:0,zIndex:200,height:44,
      display:'flex',alignItems:'center',padding:'0 10px',
      boxShadow:'0 2px 4px rgba(0,0,0,.3)'}}>

      {/* Logo */}
      <div onClick={()=>setPage('home')} style={{cursor:'pointer',marginRight:4,flexShrink:0,
        background:WHITE,borderRadius:3,padding:'2px 8px',display:'flex',alignItems:'center'}}>
        <OrkutLogo size={20} id="nav"/>
      </div>

      {/* Nav links */}
      <div style={{display:'flex',flex:1,alignItems:'center',height:'100%',marginLeft:4}}>
        {links.map(([label,pg])=>(
          <div key={pg} onClick={()=>setPage(pg)} style={{
            padding:'0 10px',height:'100%',display:'flex',alignItems:'center',
            fontSize:13,fontWeight:cur===pg?700:400,cursor:'pointer',whiteSpace:'nowrap',
            color:cur===pg?WHITE:'rgba(255,255,255,.82)',
            borderBottom:cur===pg?'2px solid '+WHITE:'2px solid transparent',
            boxSizing:'border-box',position:'relative',
          }}>
            {label}
            {pg==='amigos'&&pendingReqs>0&&(
              <span style={{position:'absolute',top:5,right:1,background:PINK,color:WHITE,
                borderRadius:10,padding:'0 4px',fontSize:9,fontWeight:700,lineHeight:'15px'}}>
                {pendingReqs}</span>
            )}
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{position:'relative',marginRight:10}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          onFocus={()=>search.length>1&&setShow(true)}
          onBlur={()=>setTimeout(()=>setShow(false),200)}
          placeholder="Pesquisar no Orkut"
          style={{border:'1px solid rgba(255,255,255,.4)',borderRadius:2,padding:'3px 8px',
            fontSize:12,background:'rgba(255,255,255,.15)',color:WHITE,
            outline:'none',width:160,fontFamily:'inherit'}}/>
        {show&&results.length>0&&(
          <div style={{position:'absolute',top:'100%',left:0,right:0,background:WHITE,
            border:`1px solid ${BORDER}`,borderRadius:2,zIndex:999,maxHeight:200,
            overflowY:'auto',marginTop:2,boxShadow:'0 3px 10px rgba(0,0,0,.2)'}}>
            {results.map(u=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,
                padding:'6px 10px',cursor:'pointer',borderBottom:`1px solid ${BORDER}`}}
                onMouseDown={()=>{setPage({name:'profile',userId:u.id});setSearch('');setShow(false)}}>
                <Av src={u.avatar_url} size={24} name={u.name}/>
                <div style={{fontSize:12,color:TEXT}}>{u.name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User */}
      <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'rgba(255,255,255,.9)'}}>
        <span style={{width:7,height:7,borderRadius:'50%',background:'#4caf50',display:'inline-block'}}/>
        <span style={{cursor:'pointer',fontWeight:600}} onClick={()=>setPage('perfil')}>
          {profile?.name?.split(' ')[0]||'…'}
        </span>
        <span style={{color:'rgba(255,255,255,.4)'}}>|</span>
        <span style={{cursor:'pointer',color:'rgba(255,255,255,.75)'}} onClick={()=>signOut()}>Sair</span>
      </div>
    </nav>
  )
}

/* ── LEFT SIDEBAR ── */
function LeftSidebar({ page, setPage, profile }){
  const cur = typeof page==='string'?page:page?.name
  const links=[['perfil','perfil'],['recados','Recados'],['galeria','Galeria'],
               ['depoimentos','Depoimentos'],['comunidades','Comunidades'],['apps','Aplicativos']]
  return (
    <aside style={{width:200,flexShrink:0}}>
      <div style={{...card,overflow:'hidden',marginBottom:8}}>
        {/* Photo */}
        <div style={{background:'#e8edf8',borderBottom:`1px solid ${BORDER}`,
          textAlign:'center',padding:'10px 0 8px',cursor:'pointer'}}
          onClick={()=>setPage('perfil')}>
          <Av src={profile?.avatar_url} size={80} ring name={profile?.name}/>
          <div style={{fontWeight:700,fontSize:13,color:PINK,marginTop:6}}>
            {profile?.name||'…'}
          </div>
          <div style={{fontSize:11,color:'#4caf50',marginTop:1}}>● disponível</div>
        </div>
        {/* Nav */}
        <div style={{padding:'6px 0'}}>
          <div style={{display:'flex',justifyContent:'space-between',padding:'2px 10px 4px',
            fontSize:10,color:MUTED,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>
            <span>perfil</span>
            <span style={{color:PINK,cursor:'pointer',textTransform:'none',fontWeight:400,fontSize:11}}
              onClick={()=>setPage('perfil')}>editar</span>
          </div>
          {links.map(([pg,label])=>(
            <div key={pg} onClick={()=>setPage(pg)} style={{
              padding:'4px 12px',cursor:'pointer',fontSize:13,
              color: cur===pg ? '#cc0000' : BLUE,
              fontWeight: cur===pg ? 700 : 400,
              background: cur===pg ? '#dde3f0' : 'transparent',
            }}>{label}</div>
          ))}
        </div>
      </div>
    </aside>
  )
}

/* ── HOME PAGE — OG center layout ── */
function HomePage({ setPage, profile, friendCount, communityCount, recadoCount }){
  const ph = panelHead()
  const panel = {...card, marginBottom:8, overflow:'hidden'}

  return (
    <div>
      {/* Welcome + status */}
      <div style={panel}>
        <div style={{padding:'12px 14px'}}>
          <div style={{fontWeight:700,fontSize:16,color:TEXT,marginBottom:8}}>
            Bem-vindo(a), {profile?.name?.split(' ')[0]}!
          </div>
          <div style={{display:'flex',alignItems:'center',border:`1px solid ${PINK}`,
            borderRadius:2,padding:'5px 10px',background:WHITE}}>
            <span style={{flex:1,fontSize:13,color:MUTED,fontStyle:'italic'}}>Tenha um ótimo dia!</span>
            <span style={{fontSize:18}}>🙂</span>
          </div>
        </div>
      </div>

      {/* Icon row */}
      <div style={panel}>
        <div style={{display:'flex',justifyContent:'space-around',padding:'14px 8px',
          borderBottom:`1px solid ${BORDER}`}}>
          {[['✏️','recados',recadoCount,'recados'],
            ['🖼️','fotos',0,'galeria'],
            ['🌍','comunidades',communityCount,'comunidades'],
            ['⭐','fãs',0,null],
            ['✉️','mensagens',0,'recados'],
          ].map(([icon,label,count,pg])=>(
            <div key={label} style={{textAlign:'center',cursor:pg?'pointer':'default'}}
              onClick={()=>pg&&setPage(pg)}>
              <div style={{fontSize:24,marginBottom:2}}>{icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:BLUE}}>{count}</div>
              <div style={{fontSize:10,color:MUTED}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'7px 12px',fontSize:11,color:MUTED,lineHeight:1.7}}>
          <span style={{fontWeight:700,color:TEXT}}>Visitas ao perfil:</span> desde hoje: 0 &nbsp;·&nbsp;
          <span style={{fontWeight:700,color:TEXT}}>Visitantes recentes:</span> — &nbsp;·&nbsp;
          <span style={{fontWeight:700,color:TEXT}}>Fortuna do dia:</span> Tenha um ótimo dia!
        </div>
      </div>

      {/* Friend suggestions */}
      <div style={panel}>
        <div style={ph}><span>sugestões de amigos</span></div>
        <div style={{display:'flex',gap:16,padding:'12px 14px',flexWrap:'wrap'}}>
          {['A','B','C','D'].map((letter,i)=>{
            const colors=['#2a4b8d','#e8197d','#2e7d32','#c62828']
            return (
              <div key={letter} style={{textAlign:'center',cursor:'pointer',opacity:.8}} title="Em breve">
                <div style={{width:60,height:60,borderRadius:3,border:`1px solid ${BORDER}`,
                  background:colors[i],display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:24,fontWeight:900,color:WHITE,margin:'0 auto 4px'}}>{letter}</div>
                <div style={{fontSize:11,color:BLUE}}>{letter}.</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── RIGHT COLUMN ── */
const COMMUNITY_SUGGESTIONS = [
  { name:'Eu odeio acordar cedo', seed:'acordar', members:'10,2M' },
  { name:'Orkut para sempre',     seed:'forever', members:'4,8M'  },
  { name:'Comunidade X',          seed:'comx',    members:'—'     },
  { name:'Comunidade Y',          seed:'comy',    members:'—'     },
]
function RightColumn({ myId, setPage }){
  const [friends,setFriends]=useState([])
  const [mine,setMine]=useState([])
  useEffect(()=>{ getFriends(myId).then(setFriends); getMyCommunities(myId).then(setMine) },[myId])
  const ph = panelHead()
  const panel = {...card, marginBottom:8, overflow:'hidden'}

  return (
    <aside style={{width:185,flexShrink:0}}>
      {/* meus amigos */}
      <div style={panel}>
        <div style={ph}>
          <span>meus amigos ({friends.length})</span>
          <span style={{color:PINK,cursor:'pointer',fontWeight:400}} onClick={()=>setPage('amigos')}>ver todos</span>
        </div>
        <div style={{padding:8}}>
          {friends.length===0
            ?<div style={{fontSize:11,color:MUTED,marginBottom:6}}>Sem amigos ainda.</div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginBottom:6}}>
              {friends.slice(0,9).map(f=>(
                <div key={f.id} style={{textAlign:'center',cursor:'pointer'}}
                  onClick={()=>setPage({name:'profile',userId:f.id})}>
                  <Av src={f.avatar_url} size={38} name={f.name}/>
                  <div style={{fontSize:9,color:MUTED,marginTop:2,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          }
          <input placeholder="buscar amigos" style={{...inp,fontSize:11}}/>
        </div>
      </div>

      {/* minhas comunidades */}
      <div style={panel}>
        <div style={ph}>
          <span>minhas comunidades ({mine.length})</span>
          <span style={{color:PINK,cursor:'pointer',fontWeight:400}} onClick={()=>setPage('comunidades')}>ver todas</span>
        </div>
        <div style={{padding:8}}>
          {mine.length===0
            ?<div style={{fontSize:11,color:MUTED,marginBottom:6}}>Sem comunidades.</div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginBottom:8}}>
              {mine.slice(0,6).map(c=>(
                <div key={c.id} style={{textAlign:'center'}}>
                  <img src={"https://picsum.photos/seed/"+c.seed+"/40/40"} alt=""
                    style={{width:38,height:38,borderRadius:2,objectFit:'cover',
                      border:`1px solid ${BORDER}`,display:'block'}}/>
                  <div style={{fontSize:9,color:MUTED,marginTop:2,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(c.name||'').replace(/[♥❤★]/g,'').trim()}</div>
                </div>
              ))}
            </div>
          }
          <div style={{borderTop:mine.length?`1px solid ${BORDER}`:'none',
            paddingTop:mine.length?7:0}}>
            <div style={{fontSize:10,color:MUTED,fontWeight:700,marginBottom:5,
              textTransform:'uppercase',letterSpacing:.3}}>sugeridas</div>
            {COMMUNITY_SUGGESTIONS.map((c,i)=>(
              <div key={i} style={{display:'flex',gap:6,alignItems:'center',marginBottom:5,
                cursor:'pointer'}} onClick={()=>setPage('comunidades')}>
                <img src={"https://picsum.photos/seed/"+c.seed+"/40/40"} alt=""
                  style={{width:26,height:26,borderRadius:2,objectFit:'cover',
                    border:`1px solid ${BORDER}`,display:'block',flexShrink:0}}/>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:10,color:BLUE,lineHeight:1.2,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name.replace(/[♥❤★]/g,'').trim()}</div>
                  <div style={{fontSize:9,color:MUTED}}>{c.members} membros</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ── PERFIL ── */
function PerfilPage({ myId, userId, setPage, toast }){
  const isOwn=!userId||userId===myId
  const targetId=userId||myId
  const [profile,setProfile]=useState(null)
  const [editing,setEditing]=useState(false)
  const [draft,setDraft]=useState({})
  const [tab,setTab]=useState('sobre')
  const [deps,setDeps]=useState([])
  const [tWrite,setTWrite]=useState(false)
  const [tDraft,setTDraft]=useState('')
  const [fStatus,setFStatus]=useState(null)
  const [uploading,setUploading]=useState(false)

  useEffect(()=>{
    if(!targetId) return
    getProfile(targetId).then(p=>{setProfile(p);setDraft(p||{})})
    getDepoimentos(targetId).then(setDeps)
    if(!isOwn){ recordVisit(myId,targetId); getFriendshipStatus(myId,targetId).then(setFStatus) }
  },[targetId])

  const save=async()=>{
    await updateProfile(myId,{name:draft.name,bio:draft.bio,city:draft.city,
      country:draft.country,gender:draft.gender,rel_status:draft.rel_status,
      musica:draft.musica||[],filmes:draft.filmes||[],livros:draft.livros||[]})
    setProfile(draft);setEditing(false);toast('Perfil atualizado!')
  }
  const handleAvatar=async(e)=>{
    const file=e.target.files[0];if(!file)return
    setUploading(true)
    try{ const url=await uploadAvatar(myId,file); await updateProfile(myId,{avatar_url:url})
      setProfile(p=>({...p,avatar_url:url}));toast('Foto atualizada!') }
    catch(err){ toast('Erro ao enviar foto') }
    setUploading(false)
  }
  const handleFriend=async()=>{
    if(!fStatus){await sendFriendRequest(myId,targetId);setFStatus({status:'pending',requester_id:myId});toast('Pedido enviado!')}
  }
  const submitDep=async()=>{
    if(!tDraft.trim())return
    await sendDepoimento(myId,targetId,tDraft)
    getDepoimentos(targetId).then(setDeps)
    setTDraft('');setTWrite(false);toast('Depoimento enviado!')
  }
  const arrayField=(k,v)=>setDraft(p=>({...p,[k]:v.split(',').map(s=>s.trim()).filter(Boolean)}))

  if(!profile) return <div style={{padding:20,color:MUTED,textAlign:'center'}}>Carregando…</div>

  const tag={display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:12,
    border:`1px solid ${BORDER}`,background:'#f0f4ff',fontSize:12,color:MUTED,
    marginRight:5,marginBottom:4}

  return (
    <div>
      <div style={{...card,padding:16,marginBottom:8,overflow:'hidden'}}>
        <div style={{display:'flex',gap:14,alignItems:'flex-start',marginBottom:12}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            <Av src={profile.avatar_url} size={80} ring name={profile.name}/>
            {isOwn&&<label style={{fontSize:10,color:BLUE,cursor:'pointer',marginTop:3,display:'block'}}>
              {uploading?'…':'trocar foto'}
              <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
            </label>}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <h1 style={{fontSize:20,fontWeight:700,color:TEXT,margin:0}}>{profile.name}</h1>
              <div style={{display:'flex',gap:7}}>
                {isOwn&&<button style={btnBlue} onClick={()=>setEditing(!editing)}>{editing?'Cancelar':'Editar perfil'}</button>}
                {!isOwn&&<button style={fStatus?.status==='accepted'?btnGhost:btnBlue} onClick={handleFriend}>
                  {!fStatus?'+ Adicionar':fStatus.status==='pending'&&fStatus.requester_id===myId?'Pedido enviado':'Aceitar'}
                </button>}
                {!isOwn&&<button style={btnPink} onClick={()=>setPage({name:'recados',userId:targetId})}>✉ Recado</button>}
              </div>
            </div>
            {!editing
              ?<div style={{background:'#f5f7fc',borderRadius:2,padding:'6px 10px',
                  fontSize:13,color:MUTED,fontStyle:'italic'}}>{profile.bio||'…'}</div>
              :<textarea style={{...tarea,marginBottom:8}} value={draft.bio||''}
                  onChange={e=>setDraft({...draft,bio:e.target.value})}/>}
          </div>
        </div>

        {editing?(
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {[['nome','name'],['cidade','city'],['país','country'],['gênero','gender'],['relacionamento','rel_status']].map(([l,k])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:11,color:MUTED,minWidth:100}}>{l}</div>
                <input style={{...inp,flex:1}} value={draft[k]||''} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
              </div>
            ))}
            {[['música','musica'],['filmes','filmes'],['livros','livros']].map(([l,k])=>(
              <div key={k} style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:11,color:MUTED,minWidth:100}}>{l} (vírgula)</div>
                <input style={{...inp,flex:1}} value={(draft[k]||[]).join(', ')} onChange={e=>arrayField(k,e.target.value)}/>
              </div>
            ))}
            <button style={{...btnBlue,alignSelf:'flex-start',marginTop:4}} onClick={save}>Salvar</button>
          </div>
        ):(
          <div>
            {[['relacionamento',profile.rel_status],['país',profile.country],['cidade',profile.city]].map(([l,v])=>v&&(
              <div key={l} style={{display:'flex',padding:'6px 0',borderTop:`1px solid ${BORDER}`}}>
                <div style={{fontSize:11,color:MUTED,minWidth:120}}>{l}</div>
                <div style={{fontSize:13,color:TEXT}}>{v}</div>
              </div>
            ))}
            {profile.musica?.length>0&&<div style={{display:'flex',flexWrap:'wrap',padding:'6px 0',borderTop:`1px solid ${BORDER}`}}>
              <div style={{fontSize:11,color:MUTED,minWidth:120,paddingTop:2}}>música</div>
              <div>{profile.musica.map(t=><span key={t} style={tag}>{t}</span>)}</div>
            </div>}
            {profile.filmes?.length>0&&<div style={{display:'flex',flexWrap:'wrap',padding:'6px 0',borderTop:`1px solid ${BORDER}`}}>
              <div style={{fontSize:11,color:MUTED,minWidth:120,paddingTop:2}}>filmes</div>
              <div>{profile.filmes.map(t=><span key={t} style={tag}>{t}</span>)}</div>
            </div>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{...card,overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:`1px solid ${BORDER}`,background:'#f0f4ff'}}>
          {['depoimentos','sobre'].map(t=>(
            <div key={t} onClick={()=>setTab(t)} style={{padding:'7px 14px',cursor:'pointer',
              fontSize:12,fontWeight:tab===t?700:400,color:tab===t?BLUE:MUTED,
              borderBottom:tab===t?`2px solid ${BLUE}`:'2px solid transparent',boxSizing:'border-box'}}>
              {t.charAt(0).toUpperCase()+t.slice(1)}{t==='depoimentos'&&` (${deps.length})`}
            </div>
          ))}
        </div>
        <div style={{padding:14}}>
          {tab==='sobre'&&<div style={{fontSize:12,color:MUTED,lineHeight:2}}>
            <p>Membro desde {new Date(profile.created_at||Date.now()).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</p>
          </div>}
          {tab==='depoimentos'&&<div>
            {deps.map(d=>(
              <div key={d.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BORDER}`}}>
                <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:d.from.id})}>
                  <Av src={d.from.avatar_url} size={34} name={d.from.name}/>
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:BLUE,marginBottom:2,cursor:'pointer'}}
                    onClick={()=>setPage({name:'profile',userId:d.from.id})}>{d.from.name}:</div>
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.5}}>{d.text}</div>
                  <div style={{fontSize:10,color:MUTED,marginTop:3}}>{new Date(d.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            ))}
            {deps.length===0&&<div style={{color:MUTED,fontSize:12,padding:'12px 0'}}>Nenhum depoimento ainda.</div>}
            {!tWrite&&!isOwn&&<button style={{...btnBlue,marginTop:8}} onClick={()=>setTWrite(true)}>Escrever depoimento</button>}
            {tWrite&&<div style={{marginTop:8,background:'#f5f7fc',borderRadius:3,padding:10}}>
              <textarea style={tarea} value={tDraft} onChange={e=>setTDraft(e.target.value)} placeholder="Escreva algo bonito…"/>
              <div style={{display:'flex',gap:8,marginTop:8}}>
                <button style={btnBlue} onClick={submitDep}>Postar</button>
                <button style={btnGhost} onClick={()=>setTWrite(false)}>Cancelar</button>
              </div>
            </div>}
          </div>}
        </div>
      </div>
    </div>
  )
}

/* ── RECADOS ── */
function RecadosPage({ myId, targetUserId, setPage, toast }){
  const targetId=targetUserId||myId
  const isOwn=targetId===myId
  const [recados,setRecados]=useState([])
  const [text,setText]=useState('')
  const [targetProfile,setTargetProfile]=useState(null)
  const [replyId,setReplyId]=useState(null)
  const [replyTxt,setReplyTxt]=useState('')
  const [replies,setReplies]=useState({})

  useEffect(()=>{
    getRecados(targetId).then(setRecados)
    if(!isOwn) getProfile(targetId).then(setTargetProfile)
  },[targetId])
  useEffect(()=>{
    const ch=supabase.channel('rec-'+targetId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'recados',filter:'to_id=eq.'+targetId},
        ()=>getRecados(targetId).then(setRecados))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[targetId])

  const post=async()=>{
    if(!text.trim())return
    await sendRecado(myId,targetId,text)
    getRecados(targetId).then(setRecados);setText('');toast('Recado enviado!')
  }
  const del=async(id)=>{ await deleteRecado(id,myId);setRecados(p=>p.filter(r=>r.id!==id)) }
  const sendReply=(id)=>{
    if(!replyTxt.trim())return
    setReplies(p=>({...p,[id]:[...(p[id]||[]),{from:'Você',text:replyTxt,date:'agora'}]}))
    setReplyTxt('');setReplyId(null)
  }

  return (
    <div>
      <div style={{...card,padding:14,marginBottom:8,overflow:'hidden'}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:8}}>
          {isOwn?'Deixar recado no meu mural':`Recado para ${targetProfile?.name||'…'}`}
        </div>
        <textarea style={tarea} value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva um recado…"/>
        <button style={{...btnBlue,marginTop:8}} onClick={post}>Enviar recado</button>
      </div>
      <div style={{...card,padding:14,overflow:'hidden'}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:10}}>Recados ({recados.length})</div>
        {recados.map(r=>(
          <div key={r.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BORDER}`}}>
            <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:r.from.id})}>
              <Av src={r.from.avatar_url} size={36} name={r.from.name}/>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer'}}
                  onClick={()=>setPage({name:'profile',userId:r.from.id})}>{r.from.name}</span>
                <span style={{fontSize:10,color:MUTED}}>{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div style={{fontSize:13,color:TEXT,marginTop:3,lineHeight:1.5}}>{r.text}</div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <span style={{fontSize:11,color:BLUE,cursor:'pointer'}} onClick={()=>setReplyId(replyId===r.id?null:r.id)}>↩ Responder</span>
                {(isOwn||r.from.id===myId)&&<span style={{fontSize:11,color:'#cc0000',cursor:'pointer'}} onClick={()=>del(r.id)}>Apagar</span>}
              </div>
              {(replies[r.id]||[]).map((rep,i)=>(
                <div key={i} style={{marginTop:6,paddingLeft:10,borderLeft:`2px solid #dde4f0`,fontSize:12,color:MUTED}}>
                  <b style={{color:TEXT}}>Você:</b> {rep.text}
                </div>
              ))}
              {replyId===r.id&&<div style={{marginTop:6,display:'flex',gap:7}}>
                <input style={{...inp,flex:1}} placeholder="Responder…" value={replyTxt}
                  onChange={e=>setReplyTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendReply(r.id)}/>
                <button style={btnBlue} onClick={()=>sendReply(r.id)}>Enviar</button>
              </div>}
            </div>
          </div>
        ))}
        {recados.length===0&&<div style={{color:MUTED,fontSize:12,padding:'14px 0'}}>Nenhum recado ainda.</div>}
      </div>
    </div>
  )
}

/* ── AMIGOS ── */
function AmigosPage({ myId, setPage, toast }){
  const [friends,setFriends]=useState([])
  const [requests,setRequests]=useState([])
  const [chatF,setChatF]=useState(null)
  const [messages,setMessages]=useState([])
  const [chatInput,setChatInput]=useState('')
  const chatRef=useRef()

  const load=()=>{ getFriends(myId).then(setFriends); getFriendRequests(myId).then(setRequests) }
  useEffect(()=>{ load() },[myId])
  useEffect(()=>{
    const ch=supabase.channel('fr-'+myId)
      .on('postgres_changes',{event:'*',schema:'public',table:'friendships'},()=>load())
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[myId])

  const respond=async(id,accept)=>{ await respondFriendRequest(id,accept); load(); toast(accept?'Amizade aceita!':'Recusado') }
  const openChat=async(f)=>{ setChatF(f); getMessages(myId,f.id).then(setMessages) }

  useEffect(()=>{
    if(!chatF)return
    const ch=supabase.channel('chat-'+[myId,chatF.id].sort().join('-'))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},
        ()=>getMessages(myId,chatF.id).then(msgs=>{ setMessages(msgs); setTimeout(()=>chatRef.current?.scrollTo(0,9999),50) }))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[chatF])

  const sendMsg=async()=>{ if(!chatInput.trim())return; await sendMessage(myId,chatF.id,chatInput); setChatInput('') }

  return (
    <div>
      {requests.length>0&&<div style={{...card,padding:14,marginBottom:8,overflow:'hidden'}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:8}}>📬 Pedidos de amizade ({requests.length})</div>
        {requests.map(r=>(
          <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:`1px solid ${BORDER}`}}>
            <Av src={r.requester.avatar_url} size={36} name={r.requester.name}/>
            <div style={{flex:1,fontWeight:600,fontSize:13,color:TEXT,cursor:'pointer'}}
              onClick={()=>setPage({name:'profile',userId:r.requester.id})}>{r.requester.name}</div>
            <button style={{...btnBlue,padding:'3px 10px',fontSize:11}} onClick={()=>respond(r.id,true)}>Aceitar</button>
            <button style={{...btnGhost,padding:'3px 10px',fontSize:11}} onClick={()=>respond(r.id,false)}>Recusar</button>
          </div>
        ))}
      </div>}

      <div style={{...card,padding:14,overflow:'hidden'}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:12}}>Amigos ({friends.length})</div>
        {friends.length===0
          ?<div style={{textAlign:'center',padding:'24px 0',color:MUTED,fontSize:13}}>
            Use a busca para encontrar pessoas!</div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {friends.map(f=>(
              <div key={f.id} style={{textAlign:'center',padding:10,borderRadius:3,
                border:`1px solid ${BORDER}`,background:'#f5f7fc'}}>
                <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:f.id})}>
                  <Av src={f.avatar_url} size={50} name={f.name}/>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:TEXT,margin:'5px 0',cursor:'pointer',
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                  onClick={()=>setPage({name:'profile',userId:f.id})}>{f.name}</div>
                <div style={{display:'flex',gap:4,justifyContent:'center'}}>
                  <button style={{...btnBlue,padding:'2px 8px',fontSize:10}} onClick={()=>openChat(f)}>💬</button>
                  <button style={{...btnGhost,padding:'2px 8px',fontSize:10}} onClick={()=>setPage({name:'recados',userId:f.id})}>✉</button>
                </div>
              </div>
            ))}
          </div>}
      </div>

      {chatF&&<div style={{position:'fixed',bottom:20,right:20,width:290,background:WHITE,
        border:`1.5px solid ${BORDER}`,borderRadius:4,boxShadow:'0 6px 24px rgba(0,0,0,.15)',zIndex:999,overflow:'hidden'}}>
        <div style={{background:BLUE,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <Av src={chatF.avatar_url} size={22} name={chatF.name}/>
            <span style={{color:WHITE,fontWeight:700,fontSize:12}}>{chatF.name}</span>
          </div>
          <span style={{color:WHITE,cursor:'pointer'}} onClick={()=>setChatF(null)}>✕</span>
        </div>
        <div ref={chatRef} style={{height:200,overflowY:'auto',padding:8,background:'#f5f7fc',
          display:'flex',flexDirection:'column',gap:5}}>
          {messages.length===0&&<div style={{color:MUTED,fontSize:11,textAlign:'center',marginTop:60}}>Diga olá!</div>}
          {messages.map(m=>(
            <div key={m.id} style={{alignSelf:m.from_id===myId?'flex-end':'flex-start',
              maxWidth:'80%',background:m.from_id===myId?BLUE:WHITE,
              color:m.from_id===myId?WHITE:TEXT,padding:'5px 9px',borderRadius:8,fontSize:12}}>
              {m.text}
            </div>
          ))}
        </div>
        <div style={{padding:6,borderTop:`1px solid ${BORDER}`,display:'flex',gap:6}}>
          <input style={{...inp,flex:1,fontSize:12}} value={chatInput}
            onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()}
            placeholder="Mensagem…"/>
          <button style={{...btnBlue,padding:'5px 10px'}} onClick={sendMsg}>→</button>
        </div>
      </div>}
    </div>
  )
}

/* ── COMUNIDADES ── */
function ComunidadesPage({ myId, toast }){
  const [all,setAll]=useState([])
  const [mine,setMine]=useState([])
  const [cat,setCat]=useState('Todos')
  const [search,setSearch]=useState('')
  const [tab,setTab]=useState('todas')
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
    if(myIds.has(c.id)){await leaveCommunity(myId,c.id);setMine(p=>p.filter(x=>x.id!==c.id));toast('Você saiu')}
    else{await joinCommunity(myId,c.id);setMine(p=>[...p,c]);toast('Bem-vindo(a)!')}
  }
  const openCom=async(c)=>{ setActive(c); getCommunityPosts(c.id).then(setPosts) }
  useEffect(()=>{
    if(!active)return
    const ch=supabase.channel('com-'+active.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'community_posts',
        filter:'community_id=eq.'+active.id},()=>getCommunityPosts(active.id).then(setPosts))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[active])
  const postMsg=async()=>{
    if(!newPost.trim())return
    await createCommunityPost(myId,active.id,newPost);setNewPost('');toast('Postado!')
  }

  const tag={display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:12,
    border:`1px solid ${BORDER}`,background:'#f0f4ff',fontSize:11,color:MUTED,
    marginRight:5,marginBottom:5,cursor:'pointer'}

  if(active){
    const isJ=myIds.has(active.id)
    return (
      <div>
        <div style={{fontSize:12,color:MUTED,marginBottom:8}}>
          <span style={{color:BLUE,cursor:'pointer'}} onClick={()=>setActive(null)}>Comunidades</span> › {active.name}
        </div>
        <div style={{...card,padding:14,overflow:'hidden'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <img src={"https://picsum.photos/seed/"+active.seed+"/50/50"} alt=""
                style={{width:48,height:48,borderRadius:3,objectFit:'cover',border:`1px solid ${BORDER}`}}/>
              <div>
                <div style={{fontWeight:700,fontSize:15,color:TEXT}}>{active.name}</div>
                <div style={{fontSize:11,color:MUTED}}>{active.category} · {(active.members_count||0).toLocaleString('pt-BR')} membros</div>
                <div style={{fontSize:12,color:MUTED,fontStyle:'italic',marginTop:2}}>{active.description}</div>
              </div>
            </div>
            <button style={isJ?btnGhost:btnBlue} onClick={()=>toggle(active)}>{isJ?'✓ Membro':'+ Participar'}</button>
          </div>
          {isJ&&<div style={{background:'#f5f7fc',borderRadius:3,padding:10,marginBottom:12}}>
            <textarea style={tarea} value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Postar na comunidade…"/>
            <button style={{...btnBlue,marginTop:8}} onClick={postMsg}>Postar</button>
          </div>}
          {posts.length===0
            ?<div style={{textAlign:'center',color:MUTED,padding:24,fontSize:13}}>
              {isJ?'Seja o primeiro a postar!':'Entre para ver e postar.'}
            </div>
            :posts.map(p=>(
              <div key={p.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BORDER}`}}>
                <Av src={p.author.avatar_url} size={34} name={p.author.name}/>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:BLUE}}>{p.author.name}</div>
                  <div style={{fontSize:13,color:TEXT,marginTop:2,lineHeight:1.5}}>{p.text}</div>
                  <div style={{fontSize:10,color:MUTED,marginTop:2}}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{...card,padding:14,overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:TEXT}}>Comunidades Clássicas</div>
            <div style={{fontSize:11,color:MUTED}}>{all.length} comunidades · {mine.length} suas</div>
          </div>
          <input style={{...inp,width:170,fontSize:12}} placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{display:'flex',borderBottom:`1px solid ${BORDER}`,marginBottom:10}}>
          {[['todas','Todas'],['minhas','Minhas']].map(([t,l])=>(
            <div key={t} onClick={()=>setTab(t)} style={{padding:'6px 12px',cursor:'pointer',fontSize:12,
              fontWeight:tab===t?700:400,color:tab===t?BLUE:MUTED,
              borderBottom:tab===t?`2px solid ${BLUE}`:'2px solid transparent',boxSizing:'border-box'}}>
              {l}{t==='minhas'&&mine.length>0&&<span style={{background:BLUE,color:WHITE,
                borderRadius:10,padding:'0 5px',fontSize:10,marginLeft:4}}>{mine.length}</span>}
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:10}}>
          {cats.map(c=>(
            <span key={c} onClick={()=>setCat(c)} style={{...tag,
              background:cat===c?BLUE:'#f0f4ff',color:cat===c?WHITE:MUTED,
              border:cat===c?`1px solid ${BLUE}`:`1px solid ${BORDER}`,fontWeight:cat===c?600:400}}>
              {c}
            </span>
          ))}
        </div>
        {filtered.length===0
          ?<div style={{textAlign:'center',color:MUTED,padding:28,fontSize:13}}>
            {tab==='minhas'?'Você ainda não entrou em nenhuma comunidade.':'Nenhuma encontrada.'}
          </div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:9}}>
            {filtered.map(c=>{
              const isJ=myIds.has(c.id)
              return (
                <div key={c.id} style={{border:`1px solid ${isJ?BLUE:BORDER}`,borderRadius:3,
                  overflow:'hidden',background:isJ?'#eff4fb':'#f5f7fc'}}>
                  <div style={{position:'relative',cursor:'pointer'}} onClick={()=>openCom(c)}>
                    <img src={"https://picsum.photos/seed/"+c.seed+"/300/80"} alt=""
                      style={{width:'100%',height:60,objectFit:'cover',display:'block'}}/>
                    {isJ&&<div style={{position:'absolute',top:4,right:4,background:BLUE,
                      color:WHITE,borderRadius:8,padding:'0 6px',fontSize:9,fontWeight:700}}>✓</div>}
                  </div>
                  <div style={{padding:'7px 9px'}}>
                    <div style={{fontSize:11,fontWeight:600,color:TEXT,marginBottom:1,cursor:'pointer',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                      onClick={()=>openCom(c)}>{c.name}</div>
                    <div style={{fontSize:9,color:MUTED,marginBottom:6}}>{(c.members_count||0).toLocaleString('pt-BR')} membros</div>
                    <div style={{display:'flex',gap:4}}>
                      {isJ&&<button style={{...btnBlue,padding:'1px 7px',fontSize:9,flex:1}} onClick={()=>openCom(c)}>Entrar →</button>}
                      <button style={{...(isJ?btnGhost:btnBlue),padding:'1px 7px',fontSize:9,flex:1}} onClick={()=>toggle(c)}>
                        {isJ?'Sair':'+ Entrar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>}
      </div>
    </div>
  )
}

/* ── APPS ── */
function AppsPage(){
  const [fortune,setFortune]=useState(null)
  const fortunes=['Grandes coisas estão a caminho 🌟','Uma velha amizade será renovada 💫','Confie no processo ✨','O Orkut nunca mente 😄']
  return (
    <div style={{...card,padding:16,overflow:'hidden'}}>
      <h2 style={{fontSize:14,fontWeight:700,margin:'0 0 14px',color:TEXT}}>Aplicativos</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
        {[{id:1,icon:'♈',name:'Horóscopo',desc:'Veja seu signo e previsões do dia'},
          {id:2,icon:'🥠',name:'Fortune Cookie',desc:'Receba uma mensagem do destino'},
          {id:3,icon:'👥',name:'Comparar Perfis',desc:'Compare karma com amigos'},
          {id:4,icon:'🎵',name:'Quiz Musical',desc:'Teste seu conhecimento musical'}
        ].map(a=>(
          <div key={a.id} style={{border:`1px solid ${BORDER}`,borderRadius:3,padding:12,background:'#f5f7fc'}}>
            <div style={{fontSize:24,marginBottom:4}}>{a.icon}</div>
            <div style={{fontWeight:700,fontSize:12,color:TEXT,marginBottom:2}}>{a.name}</div>
            <div style={{fontSize:11,color:MUTED,marginBottom:8}}>{a.desc}</div>
            <button style={btnBlue} onClick={()=>a.id===2&&setFortune(fortunes[Math.floor(Math.random()*fortunes.length)])}>Abrir</button>
            {a.id===2&&fortune&&<div style={{marginTop:7,fontSize:12,fontStyle:'italic',
              background:WHITE,borderRadius:2,padding:'5px 8px',color:TEXT}}>{fortune}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── ROOT ── */
export default function App(){
  const [session,setSession]=useState(undefined)
  const [profile,setProfile]=useState(null)
  const [page,setPage]=useState('home')
  const [pendingReqs,setPendingReqs]=useState(0)
  const [visitors,setVisitors]=useState([])
  const [toast,setToast]=useState('')
  const [friendCount,setFriendCount]=useState(0)
  const [communityCount,setCommunityCount]=useState(0)
  const [recadoCount,setRecadoCount]=useState(0)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s))
    return()=>subscription.unsubscribe()
  },[])
  useEffect(()=>{
    if(!session?.user)return
    const uid=session.user.id
    getProfile(uid).then(setProfile)
    getFriendRequests(uid).then(r=>setPendingReqs(r.length))
    getVisitors(uid).then(setVisitors)
    getFriends(uid).then(f=>setFriendCount(f.length))
    getMyCommunities(uid).then(c=>setCommunityCount(c.length))
    getRecados(uid).then(r=>setRecadoCount(r.length))
  },[session])

  if(session===undefined) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:BG}}>
      <OrkutLogo size={40} id="load"/>
    </div>
  )
  if(!session) return <AuthScreen onAuth={()=>supabase.auth.getSession().then(({data:{session}})=>setSession(session))}/>

  const myId=session.user.id
  const cur=typeof page==='string'?page:page?.name

  const renderMain=()=>{
    switch(cur){
      case 'home':        return <HomePage setPage={setPage} profile={profile} friendCount={friendCount} communityCount={communityCount} recadoCount={recadoCount}/>
      case 'perfil':      return <PerfilPage myId={myId} userId={null} setPage={setPage} toast={setToast}/>
      case 'profile':     return <PerfilPage myId={myId} userId={page.userId} setPage={setPage} toast={setToast}/>
      case 'recados':     return <RecadosPage myId={myId} targetUserId={page?.userId||null} setPage={setPage} toast={setToast}/>
      case 'amigos':      return <AmigosPage myId={myId} setPage={setPage} toast={setToast}/>
      case 'comunidades': return <ComunidadesPage myId={myId} toast={setToast}/>
      case 'galeria':     return <div style={{...card,padding:28,textAlign:'center',color:MUTED}}>Galeria em breve 🖼</div>
      case 'depoimentos': return <PerfilPage myId={myId} userId={null} setPage={setPage} toast={setToast}/>
      case 'apps':        return <AppsPage/>
      default:            return <HomePage setPage={setPage} profile={profile} friendCount={friendCount} communityCount={communityCount} recadoCount={recadoCount}/>
    }
  }

  return (
    <div style={{fontFamily:"'Trebuchet MS','Lucida Grande',sans-serif",background:BG,minHeight:'100vh',color:TEXT}}>
      <TopNav page={page} setPage={setPage} profile={profile} pendingReqs={pendingReqs}/>
      <div style={{maxWidth:1040,margin:'0 auto',padding:'9px 9px',display:'flex',gap:8,alignItems:'flex-start'}}>
        <LeftSidebar page={page} setPage={setPage} profile={profile}/>
        <main style={{flex:1,minWidth:0}}>{renderMain()}</main>
        <RightColumn myId={myId} setPage={setPage}/>
      </div>
      <div style={{textAlign:'center',padding:'14px 0 20px',fontSize:11,color:MUTED,
        borderTop:`1px solid ${BORDER}`,marginTop:8}}>
        © Recriado com ❤️ · Zero Monetização
      </div>
      <Toast msg={toast} onDone={()=>setToast('')}/>
    </div>
  )
}
