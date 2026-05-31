import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase, signUp, signIn, signOut, getProfile, updateProfile,
  getFriends, getFriendRequests, sendFriendRequest, respondFriendRequest,
  getFriendshipStatus, getRecados, sendRecado, deleteRecado,
  getDepoimentos, sendDepoimento, getCommunities, getMyCommunities,
  joinCommunity, leaveCommunity, getCommunityPosts, createCommunityPost,
  getMessages, sendMessage, recordVisit, getVisitors, uploadAvatar,
  searchUsers } from './lib/supabase.js'

/* ── Tokens ── */
const NAV   = '#2a4b8d'
const PINK  = '#e8197d'
const BG    = '#dce3f0'
const WHITE = '#ffffff'
const BRD   = '#c8d0e0'
const TEXT  = '#1a1a2e'
const MUT   = '#6b7a99'
const BLUE  = '#2a4b8d'

const card  = {background:WHITE,border:`1px solid ${BRD}`,borderRadius:2}
const inp   = {width:'100%',border:`1px solid ${BRD}`,borderRadius:2,padding:'5px 8px',
               fontSize:12,fontFamily:'inherit',color:TEXT,background:WHITE,outline:'none',boxSizing:'border-box'}
const tarea = {...inp,resize:'vertical',minHeight:70}
const btnBl = {cursor:'pointer',border:'none',fontFamily:'inherit',borderRadius:2,fontWeight:700,
               background:BLUE,color:WHITE,padding:'5px 14px',fontSize:12}
const btnPk = {cursor:'pointer',border:'none',fontFamily:'inherit',borderRadius:2,fontWeight:700,
               background:PINK,color:WHITE,padding:'5px 14px',fontSize:12}
const btnGh = {cursor:'pointer',fontFamily:'inherit',borderRadius:2,fontWeight:400,
               background:'transparent',border:`1px solid ${BRD}`,color:MUT,padding:'4px 10px',fontSize:11}

/* ── orkut.br Logo — exact match from DOM ── */
function OrkutLogo(){
  return (
    <span style={{
      display:'inline-flex', alignItems:'baseline',
      background:WHITE, borderRadius:4,
      padding:'3px 8px 3px 8px', gap:0,
      boxShadow:'0 1px 2px rgba(0,0,0,.15)',
    }}>
      <span style={{
        fontFamily:'Georgia,"Times New Roman",serif',
        fontStyle:'italic', fontWeight:700,
        fontSize:22, color:PINK, lineHeight:1, letterSpacing:'-0.5px',
      }}>orkut</span>
      <span style={{
        fontFamily:'Georgia,"Times New Roman",serif',
        fontStyle:'italic', fontWeight:700,
        fontSize:13, color:BLUE, lineHeight:1,
        alignSelf:'flex-end', marginBottom:2,
      }}>.br</span>
    </span>
  )
}

/* ── O fade logo for auth ── */
function OFadeLogo({ size }){
  size = size||80; const w=size*4.4,h=size,gid='afg',mid='afm'
  return (
    <svg width={w} height={h} viewBox={"0 0 "+w+" "+h} style={{display:'block',overflow:'visible'}} aria-label="">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff0099" stopOpacity="1"/>
          <stop offset="21%"  stopColor="#ff0099" stopOpacity="1"/>
          <stop offset="24%"  stopColor="#ff0099" stopOpacity="0.10"/>
          <stop offset="40%"  stopColor="#ff0099" stopOpacity="0"/>
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
  size=size||36
  const fb="https://api.dicebear.com/9.x/personas/svg?seed="+encodeURIComponent(name||'u')
  return <img src={src||fb} alt={name||''} width={size} height={size}
    onError={e=>{e.target.src=fb}}
    style={{borderRadius:'50%',objectFit:'cover',flexShrink:0,display:'block',
            border:ring?`3px solid ${PINK}`:`1px solid ${BRD}`}}/>
}

/* ── Toast ── */
function Toast({ msg, onDone }){
  useEffect(()=>{if(msg){const t=setTimeout(onDone,3000);return()=>clearTimeout(t)}},[msg])
  if(!msg)return null
  return <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',
    background:BLUE,color:WHITE,padding:'9px 20px',borderRadius:3,fontSize:13,
    fontWeight:600,zIndex:9999,boxShadow:'0 3px 12px rgba(0,0,0,.2)'}}>{msg}</div>
}

/* ── AUTH ── */
function AuthScreen({ onAuth }){
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({email:'',password:'',name:''})
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))
  const submit=async()=>{
    setErr('');setLoading(true)
    try{
      if(mode==='login') await signIn({email:form.email,password:form.password})
      else{ if(!form.name.trim())throw new Error('Digite seu nome'); await signUp({email:form.email,password:form.password,name:form.name}) }
      onAuth()
    }catch(e){ setErr(e.message==='Failed to fetch'?'Erro de conexão. Tente novamente.':e.message) }
    setLoading(false)
  }
  const ri={width:'100%',border:'1px solid #a0a8c0',borderRadius:1,padding:'3px 5px',
    fontSize:12,fontFamily:'inherit',color:TEXT,background:WHITE,outline:'none',boxSizing:'border-box'}
  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column'}}>
      <div style={{background:'#f0eeff',borderBottom:'1px solid #d8ccf0',padding:'7px 0',textAlign:'center',fontSize:12}}>
        <span style={{color:PINK,fontWeight:700}}>Aviso:</span>
        <span style={{color:MUT}}> Reviva a nostalgia com conexões verdadeiras.</span>
      </div>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        padding:'32px 20px',gap:40,maxWidth:960,margin:'0 auto',width:'100%',flexWrap:'wrap'}}>
        <div style={{flex:'1 1 360px',minWidth:260,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',padding:'20px 0'}}>
          <div style={{marginBottom:40}}><OFadeLogo size={100}/></div>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {[['Conecte-se','aos seus amigos e familiares usando recados e mensagens'],
              ['Conheça','novas pessoas através de amigos de seus amigos e comunidades'],
              ['Compartilhe','seus momentos, fotos, paixões e interesses em um só lugar']
            ].map(([v,r])=>(
              <div key={v} style={{fontSize:14,color:MUT,textAlign:'center',lineHeight:1.4}}>
                <span style={{color:PINK,fontWeight:700}}>{v}</span>{' '}{r}
              </div>
            ))}
          </div>
        </div>
        <div style={{flex:'0 1 290px',minWidth:240}}>
          <div style={{...card,padding:'14px 16px',marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
            <div style={{fontSize:12,color:TEXT,marginBottom:12,textAlign:'center',
              display:'flex',alignItems:'center',justifyContent:'center',gap:5,flexWrap:'wrap'}}>
              {mode==='login'?<><span>Acesse o</span><OrkutLogo size={11}/><span>com a sua conta</span></>
                :<span style={{fontWeight:600}}>Cadastre-se gratuitamente</span>}
            </div>
            {mode==='signup'&&<div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:TEXT,marginBottom:2}}>Seu nome:</div>
              <input style={ri} value={form.name} onChange={e=>f('name',e.target.value)}/>
            </div>}
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,color:TEXT,marginBottom:2}}>E-mail:</div>
              <input style={ri} type="email" value={form.email} onChange={e=>f('email',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{fontSize:11,color:TEXT,marginBottom:2}}>Senha:</div>
              <input style={ri} type="password" value={form.password} onChange={e=>f('password',e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            {err&&<div style={{fontSize:11,color:'#cc0000',marginBottom:8,padding:'4px 6px',
              background:'#fff0f0',border:'1px solid #ffcccc',borderRadius:2}}>{err}</div>}
            <button style={{background:'linear-gradient(180deg,#5577bb,#2244aa)',border:'1px solid #1a3a8a',
              borderRadius:2,color:WHITE,padding:'4px 16px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}
              onClick={submit} disabled={loading}>{loading?'Aguarde…':mode==='login'?'Login':'Criar conta'}</button>
            {mode==='login'&&<div style={{fontSize:11,color:PINK,cursor:'pointer',marginTop:8}}>Esqueceu sua senha?</div>}
          </div>
          <div style={{...card,padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',textAlign:'center'}}>
            {mode==='login'
              ?<><div style={{fontSize:12,color:TEXT,marginBottom:10}}>Ainda não é membro?</div>
                <button style={{...btnPk,padding:'6px 20px',fontSize:13}} onClick={()=>setMode('signup')}>ENTRAR JÁ</button></>
              :<><div style={{fontSize:12,color:TEXT,marginBottom:10}}>Já tem uma conta?</div>
                <button style={{background:'linear-gradient(180deg,#5577bb,#2244aa)',border:'1px solid #1a3a8a',
                  borderRadius:2,color:WHITE,padding:'6px 20px',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}
                  onClick={()=>setMode('login')}>ENTRAR</button></>}
          </div>
        </div>
      </div>
      <div style={{textAlign:'center',padding:'12px 0',fontSize:11,color:MUT,borderTop:`1px solid ${BRD}`}}>
        © Recriado com ❤️ · Zero Monetização
      </div>
    </div>
  )
}

/* ── TOP NAV — exact DOM match from orkut-revival.vercel.app ── */
function TopNav({ page, setPage, profile, pendingReqs }){
  const [search,setSearch]=useState('')
  const [results,setResults]=useState([])
  const [show,setShow]=useState(false)
  const doSearch=useCallback(async(q)=>{
    if(q.length<2){setResults([]);return}
    setResults(await searchUsers(q));setShow(true)
  },[])
  useEffect(()=>{const t=setTimeout(()=>doSearch(search),300);return()=>clearTimeout(t)},[search])

  const cur=typeof page==='string'?page:page?.name
  // Nav links — EN labels (matching source), PT routing
  const links=[
    ['Home','home'],['Profile','profile'],['Scrapbook','scrapbook'],
    ['Friends','friends'],['Communities','communities']
  ]

  return (
    <header style={{
      background:'hsl(222,60%,35%)',   /* matches --orkut-header */
      position:'sticky', top:0, zIndex:200, height:40,
      display:'flex', alignItems:'center',
      boxShadow:'0 1px 3px rgba(0,0,0,.3)',
    }}>
      <div style={{
        maxWidth:980, margin:'0 auto', width:'100%',
        height:'100%', display:'flex', alignItems:'center',
        padding:'0 10px', gap:0,
      }}>
        {/* Logo card */}
        <a onClick={()=>setPage('home')} style={{
          marginRight:12, cursor:'pointer', textDecoration:'none',
          flexShrink:0,
        }}>
          <OrkutLogo/>
        </a>

        {/* Nav links */}
        <nav style={{display:'flex',alignItems:'center',height:'100%'}}>
          {links.map(([label,pg])=>(
            <a key={pg} onClick={()=>setPage(pg)} style={{
              display:'inline-flex', alignItems:'center', height:'100%',
              padding:'0 12px', cursor:'pointer', textDecoration:'none',
              fontSize:13, fontWeight:cur===pg?600:400,
              color: cur===pg ? WHITE : 'rgba(255,255,255,.8)',
              borderBottom: cur===pg ? '2px solid '+WHITE : '2px solid transparent',
              boxSizing:'border-box', position:'relative',
              transition:'color .1s',
            }}>
              {label}
              {pg==='friends'&&pendingReqs>0&&(
                <span style={{position:'absolute',top:4,right:2,background:PINK,color:WHITE,
                  borderRadius:10,padding:'0 4px',fontSize:9,fontWeight:700,lineHeight:'15px'}}>
                  {pendingReqs}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Right side — user + logout */}
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:12,fontSize:11,color:WHITE}}>
          {/* Inline search */}
          <div style={{position:'relative'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              onFocus={()=>search.length>1&&setShow(true)}
              onBlur={()=>setTimeout(()=>setShow(false),200)}
              placeholder="buscar pessoas"
              style={{border:'1px solid rgba(255,255,255,.35)',borderRadius:2,
                padding:'2px 8px',fontSize:11,
                background:'rgba(255,255,255,.15)',color:WHITE,
                outline:'none',width:130,fontFamily:'inherit'}}/>
            {show&&results.length>0&&(
              <div style={{position:'absolute',top:'100%',left:0,right:0,background:WHITE,
                border:`1px solid ${BRD}`,borderRadius:2,zIndex:999,maxHeight:200,
                overflowY:'auto',marginTop:2,boxShadow:'0 3px 10px rgba(0,0,0,.2)'}}>
                {results.map(u=>(
                  <div key={u.id} style={{display:'flex',alignItems:'center',gap:8,
                    padding:'6px 10px',cursor:'pointer',borderBottom:`1px solid ${BRD}`,background:WHITE}}
                    onMouseDown={()=>{setPage({name:'userprofile',userId:u.id});setSearch('');setShow(false)}}>
                    <Av src={u.avatar_url} size={24} name={u.name}/>
                    <div style={{fontSize:12,color:TEXT}}>{u.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Green dot + name */}
          <span style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',
              background:'hsl(142,71%,45%)'}}/>
            <span style={{cursor:'pointer',fontWeight:400}}
              onClick={()=>setPage('profile')}>{profile?.name?.split(' ')[0]||'…'}</span>
          </span>
          {/* Logout */}
          <button onClick={()=>signOut()} style={{
            background:'transparent',border:'none',color:WHITE,
            fontSize:11,cursor:'pointer',fontFamily:'inherit',
            textDecoration:'none',padding:0,
          }}>Logout</button>
        </div>
      </div>
    </header>
  )
}

/* ── LAYOUT WRAPPER ── */
function Layout({ left, center, right }){
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px 8px',
      display:'grid',gridTemplateColumns:left&&right?'210px 1fr 230px':left?'210px 1fr':'1fr',
      gap:8,alignItems:'flex-start'}}>
      {left&&<div>{left}</div>}
      <div>{center}</div>
      {right&&<div>{right}</div>}
    </div>
  )
}

/* ── RIGHT SIDEBAR ── */
function RightSidebar({ myId, setPage }){
  const [friends,setFriends]=useState([])
  const [mine,setMine]=useState([])
  useEffect(()=>{getFriends(myId).then(setFriends);getMyCommunities(myId).then(setMine)},[myId])
  const Sec=({title,count,action,actionLabel,children})=>(
    <div style={{...card,marginBottom:8,overflow:'hidden'}}>
      <div style={{padding:'6px 10px',borderBottom:`1px solid ${BRD}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontWeight:700,fontSize:12,color:TEXT}}>{title} ({count})</span>
        {action&&<span style={{fontSize:11,color:PINK,cursor:'pointer'}} onClick={action}>{actionLabel} »</span>}
      </div>
      <div style={{padding:'8px 10px'}}>{children}</div>
    </div>
  )
  return (
    <aside>
      <Sec title="meus amigos" count={friends.length} action={()=>setPage('friends')} actionLabel="ver todos">
        {friends.length===0
          ?<div style={{fontSize:11,color:MUT,marginBottom:6}}>Sem amigos ainda.</div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginBottom:6}}>
            {friends.slice(0,9).map(f=>(
              <div key={f.id} style={{textAlign:'center',cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:f.id})}>
                <Av src={f.avatar_url} size={38} name={f.name}/>
                <div style={{fontSize:9,color:MUT,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>}
        <input placeholder="buscar amigos" style={{...inp,fontSize:11}}/>
      </Sec>
      <Sec title="minhas comunidades" count={mine.length} action={()=>setPage('communities')} actionLabel="ver todas">
        {mine.length===0
          ?<div style={{fontSize:11,color:MUT}}>Sem comunidades.</div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
            {mine.slice(0,6).map(c=>(
              <div key={c.id} style={{textAlign:'center'}}>
                <img src={"https://picsum.photos/seed/"+(c.seed||c.id)+"/40/40"} alt=""
                  style={{width:36,height:36,borderRadius:2,objectFit:'cover',border:`1px solid ${BRD}`,display:'block'}}/>
                <div style={{fontSize:9,color:MUT,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(c.name||'').replace(/[♥❤★]/g,'').trim()}</div>
              </div>
            ))}
          </div>}
      </Sec>
    </aside>
  )
}

/* ── HOME ── */
function HomePage({ profile, myId, setPage }){
  const [recadoCount,setRecadoCount]=useState(0)
  const [comCount,setComCount]=useState(0)
  useEffect(()=>{
    if(!myId)return
    getRecados(myId).then(r=>setRecadoCount(r.length))
    getMyCommunities(myId).then(c=>setComCount(c.length))
  },[myId])
  return (
    <Layout
      left={
        <div style={{...card,overflow:'hidden'}}>
          <div style={{cursor:'pointer',borderBottom:`1px solid ${BRD}`,lineHeight:0}} onClick={()=>setPage('profile')}>
            <Av src={profile?.avatar_url} size={210} ring={false} name={profile?.name}/>
          </div>
          <div style={{padding:'8px 10px 4px',borderBottom:`1px solid ${BRD}`}}>
            <div style={{fontWeight:700,fontSize:14,color:PINK,cursor:'pointer',marginBottom:2}} onClick={()=>setPage('profile')}>{profile?.name||'…'}</div>
            <div style={{fontSize:11,color:'#4caf50'}}>● disponível</div>
          </div>
          <div style={{padding:'6px 0'}}>
            <div style={{display:'flex',justifyContent:'space-between',padding:'2px 10px 4px'}}>
              <span style={{fontSize:10,color:MUT,fontWeight:700,textTransform:'uppercase',letterSpacing:.4}}>perfil</span>
              <span style={{fontSize:11,color:PINK,cursor:'pointer'}} onClick={()=>setPage('profile')}>editar</span>
            </div>
            {[['scrapbook','scrapbook'],['fotos',null],['amigos','friends'],['comunidades','communities'],['depoimentos','profile']].map(([label,pg])=>(
              <div key={label} onClick={()=>pg&&setPage(pg)} style={{padding:'3px 10px',fontSize:13,cursor:pg?'pointer':'default',color:BLUE}}>{label}</div>
            ))}
          </div>
        </div>
      }
      center={
        <div>
          <div style={{...card,padding:'14px 16px',marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:18,color:TEXT,marginBottom:10}}>Bem-vindo(a), {profile?.name?.split(' ')[0]}!</div>
            <div style={{display:'flex',alignItems:'center',border:`1px solid ${PINK}`,
              borderRadius:2,padding:'6px 10px',background:WHITE,marginBottom:14}}>
              <span style={{flex:1,fontSize:13,color:MUT,fontStyle:'italic'}}>Tenha um ótimo dia!</span>
              <span style={{fontSize:18}}>🙂</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-around',borderTop:`1px solid ${BRD}`,paddingTop:12}}>
              {[['✏️','scraps',recadoCount,'scrapbook'],['🖼️','fotos',0,null],
                ['🖼','fotos de mim',0,null],['⭐','fãs',0,null],['✉️','mensagens',0,null]
              ].map(([icon,label,count,pg])=>(
                <div key={label} style={{textAlign:'center',cursor:pg?'pointer':'default'}} onClick={()=>pg&&setPage(pg)}>
                  <div style={{fontSize:22,marginBottom:2}}>{icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:BLUE}}>{count}</div>
                  <div style={{fontSize:10,color:MUT}}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{...card,padding:'12px 14px',marginBottom:8}}>
            <div style={{fontSize:11,color:MUT,lineHeight:1.9}}>
              <span style={{fontWeight:700,color:TEXT}}>Visitas ao perfil:</span> desde hoje: 0 &nbsp;·&nbsp;
              <span style={{fontWeight:700,color:TEXT}}>Visitantes recentes:</span> — &nbsp;·&nbsp;
              <span style={{fontWeight:700,color:TEXT}}>Fortuna do dia:</span> Tenha um ótimo dia!
            </div>
          </div>
          <div style={{...card,overflow:'hidden',marginBottom:8}}>
            <div style={{padding:'6px 10px',borderBottom:`1px solid ${BRD}`,fontWeight:700,fontSize:12,color:TEXT}}>sugestões de amigos</div>
            <div style={{display:'flex',gap:16,padding:'12px 14px',flexWrap:'wrap'}}>
              {['A','B','C','D'].map((letter,i)=>{
                const colors=['#2a4b8d','#e8197d','#2e7d32','#c62828']
                return (
                  <div key={letter} style={{textAlign:'center',cursor:'pointer',opacity:.8}} title="Em breve">
                    <div style={{width:60,height:60,borderRadius:3,border:`1px solid ${BRD}`,
                      background:colors[i],display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:24,fontWeight:900,color:WHITE,margin:'0 auto 4px'}}>{letter}</div>
                    <div style={{fontSize:11,color:BLUE}}>{letter}.</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      }
      right={<RightSidebar myId={myId} setPage={setPage}/>}
    />
  )
}

/* ── PROFILE ── */
function ProfilePage({ myId, userId, setPage, toast }){
  const isOwn=!userId||userId===myId
  const targetId=userId||myId
  const [profile,setProfile]=useState(null)
  const [editing,setEditing]=useState(false)
  const [draft,setDraft]=useState({})
  const [deps,setDeps]=useState([])
  const [tWrite,setTWrite]=useState(false)
  const [tDraft,setTDraft]=useState('')
  const [fStatus,setFStatus]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [scraps,setScraps]=useState([])

  useEffect(()=>{
    if(!targetId)return
    getProfile(targetId).then(p=>{setProfile(p);setDraft(p||{})})
    getDepoimentos(targetId).then(setDeps)
    getRecados(targetId).then(setScraps)
    if(!isOwn){recordVisit(myId,targetId);getFriendshipStatus(myId,targetId).then(setFStatus)}
  },[targetId])

  const save=async()=>{
    await updateProfile(myId,{name:draft.name,bio:draft.bio,city:draft.city,country:draft.country,
      gender:draft.gender,rel_status:draft.rel_status,musica:draft.musica||[],filmes:draft.filmes||[]})
    setProfile(draft);setEditing(false);toast('Perfil atualizado!')
  }
  const handleAvatar=async(e)=>{
    const file=e.target.files[0];if(!file)return
    setUploading(true)
    try{const url=await uploadAvatar(myId,file);await updateProfile(myId,{avatar_url:url});setProfile(p=>({...p,avatar_url:url}));toast('Foto atualizada!')}
    catch(err){toast('Erro ao enviar')}
    setUploading(false)
  }
  const handleFriend=async()=>{
    if(!fStatus){await sendFriendRequest(myId,targetId);setFStatus({status:'pending',requester_id:myId});toast('Pedido enviado!')}
  }
  const submitDep=async()=>{
    if(!tDraft.trim())return
    await sendDepoimento(myId,targetId,tDraft)
    getDepoimentos(targetId).then(setDeps);setTDraft('');setTWrite(false);toast('Depoimento enviado!')
  }
  if(!profile)return <div style={{padding:20,color:MUT,textAlign:'center'}}>Carregando…</div>

  return (
    <Layout
      left={
        <div style={{...card,overflow:'hidden',textAlign:'center'}}>
          <div>
            <Av src={profile.avatar_url} size={200} ring={false} name={profile.name}/>
          </div>
          <div style={{padding:'8px 0 6px'}}>
            <div style={{fontWeight:700,fontSize:14,color:PINK}}>{profile.name}</div>
            <div style={{fontSize:11,color:'#4caf50',marginTop:2}}>● disponível</div>
          </div>
          {isOwn&&<div style={{borderTop:`1px solid ${BRD}`,padding:'8px 0'}}>
            <div style={{fontSize:12,color:BLUE,cursor:'pointer',marginBottom:4}} onClick={()=>setPage('scrapbook')}>scrapbook</div>
            <div style={{fontSize:12,color:BLUE,cursor:'pointer',marginBottom:4}}>fotos</div>
            <div style={{fontSize:12,color:BLUE,cursor:'pointer',marginBottom:4}} onClick={()=>setPage('friends')}>amigos</div>
            <div style={{fontSize:12,color:BLUE,cursor:'pointer',marginBottom:4}} onClick={()=>setPage('communities')}>comunidades</div>
            <div style={{fontSize:12,color:BLUE,cursor:'pointer'}}>depoimentos</div>
          </div>}
        </div>
      }
      center={
        <div>
          <div style={{...card,padding:'14px 16px',marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <h1 style={{fontSize:22,fontWeight:700,color:PINK,margin:0}}>{profile.name}</h1>
              <div style={{display:'flex',gap:8}}>
                {isOwn&&<><button style={btnBl} onClick={()=>setEditing(!editing)}>{editing?'cancelar':'editar perfil'}</button>
                  <label style={{...btnBl,cursor:'pointer'}}>
                    {uploading?'…':'trocar foto'}
                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
                  </label></>}
                {!isOwn&&<button style={fStatus?.status==='accepted'?{...btnGh}:btnBl} onClick={handleFriend}>
                  {!fStatus?'+ adicionar':fStatus.status==='pending'&&fStatus.requester_id===myId?'pedido enviado':'aceitar'}</button>}
              </div>
            </div>
            {/* Stats row */}
            <div style={{display:'flex',gap:16,fontSize:12,color:TEXT,marginBottom:10,flexWrap:'wrap'}}>
              <span>✏️ recados <strong>{scraps.length}</strong></span>
              <span>🖼️ fotos <strong>0</strong></span>
              <span>🎞️ vídeos <strong>0</strong></span>
              <span>⭐ fãs <strong>0</strong></span>
            </div>
            {/* Ratings */}
            <div style={{display:'flex',gap:16,fontSize:12,color:MUT,marginBottom:12,alignItems:'center'}}>
              <span>confiável <span style={{fontSize:16}}>😊😊😊</span></span>
              <span>legal <span style={{color:'#3b5bdb',fontSize:16}}>■■■</span></span>
              <span>sexy <span style={{color:'#e03131',fontSize:16}}>♥♥♥</span></span>
            </div>
            {editing?(
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {[['nome','name'],['cidade','city'],['país','country'],['gênero','gender'],['relacionamento','rel_status']].map(([l,k])=>(
                  <div key={k} style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{fontSize:11,color:MUT,minWidth:100}}>{l}</div>
                    <input style={{...inp,flex:1}} value={draft[k]||''} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
                  </div>
                ))}
                <button style={{...btnBl,alignSelf:'flex-start',marginTop:4}} onClick={save}>Salvar</button>
              </div>
            ):(
              <div style={{fontSize:13,color:TEXT,lineHeight:1.8}}>
                {profile.bio&&<div style={{fontStyle:'italic',color:MUT,marginBottom:6}}>{profile.bio}</div>}
                {profile.rel_status&&<div><span style={{color:MUT}}>relacionamento: </span>{profile.rel_status}</div>}
                {profile.country&&<div><span style={{color:MUT}}>país: </span>{profile.country}</div>}
              </div>
            )}
          </div>
          {/* Depoimentos */}
          <div style={{...card,overflow:'hidden'}}>
            <div style={{padding:'6px 10px',borderBottom:`1px solid ${BRD}`,fontWeight:700,fontSize:12,color:TEXT}}>
              depoimentos ({deps.length})
            </div>
            <div style={{padding:'10px 14px'}}>
              {deps.map(d=>(
                <div key={d.id} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${BRD}`}}>
                  <Av src={d.from.avatar_url} size={32} name={d.from.name}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer',marginBottom:2}}
                      onClick={()=>setPage({name:'profile',userId:d.from.id})}>{d.from.name}:</div>
                    <div style={{fontSize:13,color:TEXT,lineHeight:1.5}}>{d.text}</div>
                  </div>
                </div>
              ))}
              {deps.length===0&&<div style={{fontSize:12,color:MUT}}>Nenhum depoimento ainda.</div>}
              {!tWrite&&!isOwn&&<button style={{...btnBl,marginTop:8}} onClick={()=>setTWrite(true)}>escrever depoimento</button>}
              {tWrite&&<div style={{marginTop:8}}>
                <textarea style={tarea} value={tDraft} onChange={e=>setTDraft(e.target.value)} placeholder="Escreva algo bonito…"/>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button style={btnBl} onClick={submitDep}>Postar</button>
                  <button style={btnGh} onClick={()=>setTWrite(false)}>Cancelar</button>
                </div>
              </div>}
            </div>
          </div>
        </div>
      }
      right={<RightSidebar myId={myId} setPage={setPage}/>}
    />
  )
}

/* ── SCRAPBOOK ── */
function ScrapbookPage({ myId, targetUserId, setPage, toast }){
  const targetId=targetUserId||myId
  const isOwn=targetId===myId
  const [scraps,setScraps]=useState([])
  const [text,setText]=useState('')
  const [targetProfile,setTargetProfile]=useState(null)
  useEffect(()=>{
    getRecados(targetId).then(setScraps)
    if(!isOwn)getProfile(targetId).then(setTargetProfile)
  },[targetId])
  useEffect(()=>{
    const ch=supabase.channel('scrap-'+targetId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'recados',filter:'to_id=eq.'+targetId},
        ()=>getRecados(targetId).then(setScraps)).subscribe()
    return()=>supabase.removeChannel(ch)
  },[targetId])
  const post=async()=>{
    if(!text.trim())return
    await sendRecado(myId,targetId,text)
    getRecados(targetId).then(setScraps);setText('');toast('Recado enviado!')
  }
  const name=isOwn?'meu':targetProfile?.name||'…'
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{...card,overflow:'hidden'}}>
        <div style={{padding:'8px 12px',borderBottom:`1px solid ${BRD}`,fontWeight:700,fontSize:14,color:TEXT}}>
          scrapbook de {isOwn?(myId?'mim':name):name}
        </div>
        {isOwn&&<div style={{padding:'10px 12px',borderBottom:`1px solid ${BRD}`}}>
          <textarea style={tarea} value={text} onChange={e=>setText(e.target.value)} placeholder="Deixar um scrap…"/>
          <button style={{...btnBl,marginTop:8}} onClick={post}>Enviar</button>
        </div>}
        <div style={{padding:'0 12px'}}>
          {scraps.length===0
            ?<div style={{padding:'20px 0',color:MUT,fontSize:13}}>Nenhum scrap ainda.</div>
            :scraps.map(s=>(
              <div key={s.id} style={{display:'flex',gap:10,padding:'12px 0',borderBottom:`1px solid ${BRD}`}}>
                <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:s.from.id})}>
                  <Av src={s.from.avatar_url} size={36} name={s.from.name}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer',marginBottom:3}}
                    onClick={()=>setPage({name:'profile',userId:s.from.id})}>{s.from.name}</div>
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.5}}>{s.text}</div>
                  <div style={{fontSize:10,color:MUT,marginTop:4}}>{new Date(s.created_at).toLocaleDateString('pt-BR')}</div>
                  {isOwn&&<span style={{fontSize:11,color:'#cc0000',cursor:'pointer',marginTop:4,display:'block'}}
                    onClick={()=>deleteRecado(s.id,myId).then(()=>setScraps(p=>p.filter(r=>r.id!==s.id)))}>apagar</span>}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

/* ── FRIENDS ── */
function FriendsPage({ myId, setPage, toast }){
  const [tab,setTab]=useState('amigos')
  const [friends,setFriends]=useState([])
  const [requests,setRequests]=useState([])
  const [chatF,setChatF]=useState(null)
  const [messages,setMessages]=useState([])
  const [chatInput,setChatInput]=useState('')
  const chatRef=useRef()

  const load=()=>{getFriends(myId).then(setFriends);getFriendRequests(myId).then(setRequests)}
  useEffect(()=>{load()},[myId])
  useEffect(()=>{
    const ch=supabase.channel('fr-'+myId)
      .on('postgres_changes',{event:'*',schema:'public',table:'friendships'},()=>load()).subscribe()
    return()=>supabase.removeChannel(ch)
  },[myId])
  const respond=async(id,accept)=>{await respondFriendRequest(id,accept);load();toast(accept?'Aceito!':'Recusado')}
  const openChat=async(f)=>{setChatF(f);getMessages(myId,f.id).then(setMessages)}
  useEffect(()=>{
    if(!chatF)return
    const ch=supabase.channel('ch-'+[myId,chatF.id].sort().join('-'))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},
        ()=>getMessages(myId,chatF.id).then(msgs=>{setMessages(msgs);setTimeout(()=>chatRef.current?.scrollTo(0,9999),50)}))
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[chatF])
  const sendMsg=async()=>{if(!chatInput.trim())return;await sendMessage(myId,chatF.id,chatInput);setChatInput('')}

  const tabs=[['amigos','meus amigos'],['pedidos','pedidos recebidos'],['enviados','pedidos enviados']]
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{...card,overflow:'hidden'}}>
        <div style={{padding:'8px 12px',borderBottom:`1px solid ${BRD}`,fontWeight:700,fontSize:14,color:TEXT}}>amigos</div>
        <div style={{display:'flex',borderBottom:`1px solid ${BRD}`}}>
          {tabs.map(([t,l])=>(
            <div key={t} onClick={()=>setTab(t)} style={{padding:'7px 14px',cursor:'pointer',fontSize:12,
              fontWeight:tab===t?700:400,color:tab===t?BLUE:MUT,
              borderBottom:tab===t?`2px solid ${BLUE}`:'2px solid transparent',boxSizing:'border-box'}}>{l}</div>
          ))}
        </div>
        <div style={{padding:'12px 14px'}}>
          {tab==='amigos'&&(friends.length===0
            ?<div style={{color:MUT,fontSize:13}}>Nada por aqui.</div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:10}}>
              {friends.map(f=>(
                <div key={f.id} style={{textAlign:'center',padding:8,border:`1px solid ${BRD}`,borderRadius:2,background:'#f5f7fc'}}>
                  <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'profile',userId:f.id})}>
                    <Av src={f.avatar_url} size={60} name={f.name}/>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:TEXT,margin:'5px 0',cursor:'pointer'}}
                    onClick={()=>setPage({name:'profile',userId:f.id})}>{f.name}</div>
                  <button style={{...btnBl,padding:'2px 8px',fontSize:10}} onClick={()=>openChat(f)}>💬 chat</button>
                </div>
              ))}
            </div>)}
          {tab==='pedidos'&&(requests.length===0
            ?<div style={{color:MUT,fontSize:13}}>Nada por aqui.</div>
            :requests.map(r=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${BRD}`}}>
                <Av src={r.requester.avatar_url} size={36} name={r.requester.name}/>
                <div style={{flex:1,fontWeight:600,fontSize:13,color:TEXT}}>{r.requester.name}</div>
                <button style={{...btnBl,padding:'3px 10px',fontSize:11}} onClick={()=>respond(r.id,true)}>aceitar</button>
                <button style={{...btnGh,padding:'3px 10px',fontSize:11}} onClick={()=>respond(r.id,false)}>recusar</button>
              </div>
            )))}
          {tab==='enviados'&&<div style={{color:MUT,fontSize:13}}>Nada por aqui.</div>}
        </div>
        <div style={{padding:'10px 14px',borderTop:`1px solid ${BRD}`}}>
          <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:8}}>buscar pessoas</div>
          <input style={inp} placeholder="buscar por nome…"/>
        </div>
      </div>

      {chatF&&<div style={{position:'fixed',bottom:20,right:20,width:290,background:WHITE,
        border:`1.5px solid ${BRD}`,borderRadius:3,boxShadow:'0 6px 24px rgba(0,0,0,.15)',zIndex:999,overflow:'hidden'}}>
        <div style={{background:BLUE,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <Av src={chatF.avatar_url} size={22} name={chatF.name}/>
            <span style={{color:WHITE,fontWeight:700,fontSize:12}}>{chatF.name}</span>
          </div>
          <span style={{color:WHITE,cursor:'pointer'}} onClick={()=>setChatF(null)}>✕</span>
        </div>
        <div ref={chatRef} style={{height:200,overflowY:'auto',padding:8,background:'#f5f7fc',display:'flex',flexDirection:'column',gap:5}}>
          {messages.length===0&&<div style={{color:MUT,fontSize:11,textAlign:'center',marginTop:60}}>Diga olá!</div>}
          {messages.map(m=>(
            <div key={m.id} style={{alignSelf:m.from_id===myId?'flex-end':'flex-start',maxWidth:'80%',
              background:m.from_id===myId?BLUE:WHITE,color:m.from_id===myId?WHITE:TEXT,
              padding:'5px 9px',borderRadius:8,fontSize:12}}>{m.text}</div>
          ))}
        </div>
        <div style={{padding:6,borderTop:`1px solid ${BRD}`,display:'flex',gap:6}}>
          <input style={{...inp,flex:1,fontSize:12}} value={chatInput}
            onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()} placeholder="Mensagem…"/>
          <button style={{...btnBl,padding:'5px 10px'}} onClick={sendMsg}>→</button>
        </div>
      </div>}
    </div>
  )
}

/* ── COMMUNITIES ── */
function CommunitiesPage({ myId, toast }){
  const [all,setAll]=useState([])
  const [mine,setMine]=useState([])
  const [search,setSearch]=useState('')
  const [active,setActive]=useState(null)
  const [posts,setPosts]=useState([])
  const [newPost,setNewPost]=useState('')

  useEffect(()=>{getCommunities().then(setAll);getMyCommunities(myId).then(setMine)},[myId])
  const myIds=new Set(mine.map(c=>c.id))
  const filtered=all.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()))

  const toggle=async(c)=>{
    if(myIds.has(c.id)){await leaveCommunity(myId,c.id);setMine(p=>p.filter(x=>x.id!==c.id));toast('Você saiu')}
    else{await joinCommunity(myId,c.id);setMine(p=>[...p,c]);toast('Bem-vindo(a)!')}
  }
  const openCom=async(c)=>{setActive(c);getCommunityPosts(c.id).then(setPosts)}
  useEffect(()=>{
    if(!active)return
    const ch=supabase.channel('cp-'+active.id)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'community_posts',filter:'community_id=eq.'+active.id},
        ()=>getCommunityPosts(active.id).then(setPosts)).subscribe()
    return()=>supabase.removeChannel(ch)
  },[active])
  const postMsg=async()=>{if(!newPost.trim())return;await createCommunityPost(myId,active.id,newPost);setNewPost('');toast('Postado!')}

  if(active){
    const isJ=myIds.has(active.id)
    return (
      <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
        <div style={{...card,overflow:'hidden'}}>
          <div style={{padding:'8px 12px',borderBottom:`1px solid ${BRD}`,display:'flex',
            justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <img src={"https://picsum.photos/seed/"+(active.seed||active.id)+"/50/50"} alt=""
                style={{width:44,height:44,borderRadius:2,objectFit:'cover',border:`1px solid ${BRD}`}}/>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:TEXT}}>{active.name}</div>
                <div style={{fontSize:11,color:MUT}}>{active.category} · {(active.members_count||0).toLocaleString('pt-BR')} membros</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span style={{fontSize:12,color:BLUE,cursor:'pointer'}} onClick={()=>setActive(null)}>← voltar</span>
              <button style={isJ?btnGh:btnBl} onClick={()=>toggle(active)}>{isJ?'✓ membro':'+ participar'}</button>
            </div>
          </div>
          {isJ&&<div style={{padding:'10px 12px',borderBottom:`1px solid ${BRD}`}}>
            <textarea style={tarea} value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="Postar na comunidade…"/>
            <button style={{...btnBl,marginTop:8}} onClick={postMsg}>Postar</button>
          </div>}
          <div style={{padding:'0 12px'}}>
            {posts.length===0
              ?<div style={{padding:'20px 0',color:MUT,fontSize:13}}>{isJ?'Seja o primeiro a postar!':'Entre para ver e postar.'}</div>
              :posts.map(p=>(
                <div key={p.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BRD}`}}>
                  <Av src={p.author.avatar_url} size={32} name={p.author.name}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:BLUE}}>{p.author.name}</div>
                    <div style={{fontSize:13,color:TEXT,marginTop:2}}>{p.text}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{...card,overflow:'hidden'}}>
        <div style={{padding:'8px 12px',borderBottom:`1px solid ${BRD}`,display:'flex',
          justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:700,fontSize:14,color:TEXT}}>comunidades</span>
          <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontWeight:600}}>+ criar comunidade</span>
        </div>
        <div style={{padding:'10px 12px',borderBottom:`1px solid ${BRD}`}}>
          <input style={inp} placeholder="buscar nome ou categoria" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{padding:'10px 12px',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          {filtered.map(c=>{
            const isJ=myIds.has(c.id)
            return (
              <div key={c.id} style={{display:'flex',gap:10,padding:'10px 12px',
                border:`1px solid ${BRD}`,borderRadius:2,background:'#f8f9fc',alignItems:'center'}}>
                <img src={"https://picsum.photos/seed/"+(c.seed||c.id)+"/60/60"} alt=""
                  style={{width:56,height:56,borderRadius:2,objectFit:'cover',border:`1px solid ${BRD}`,flexShrink:0,cursor:'pointer'}}
                  onClick={()=>openCom(c)}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:BLUE,cursor:'pointer',marginBottom:2,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                    onClick={()=>openCom(c)}>{c.name}</div>
                  <div style={{fontSize:10,color:MUT,marginBottom:6}}>{(c.members_count||0).toLocaleString('pt-BR')} membros</div>
                  {!isJ
                    ?<button style={{...btnBl,padding:'2px 12px',fontSize:11}} onClick={()=>toggle(c)}>participar</button>
                    :<button style={{...btnGh,padding:'2px 12px',fontSize:11}} onClick={()=>openCom(c)}>entrar →</button>}
                </div>
              </div>
            )
          })}
        </div>
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
  const [toast,setToast]=useState('')

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
  },[session])

  if(session===undefined)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:BG}}>
      <OFadeLogo size={40}/>
    </div>
  )
  if(!session)return <AuthScreen onAuth={()=>supabase.auth.getSession().then(({data:{session}})=>setSession(session))}/>

  const myId=session.user.id
  const cur=typeof page==='string'?page:page?.name

  const renderPage=()=>{
    switch(cur){
      case 'home':        return <HomePage profile={profile} myId={myId} setPage={setPage}/>
      case 'profile':     return <ProfilePage myId={myId} userId={null} setPage={setPage} toast={setToast}/>
      case 'userprofile': return <ProfilePage myId={myId} userId={page.userId} setPage={setPage} toast={setToast}/>
      case 'scrapbook':   return <ScrapbookPage myId={myId} targetUserId={page?.userId||null} setPage={setPage} toast={setToast}/>
      case 'friends':     return <FriendsPage myId={myId} setPage={setPage} toast={setToast}/>
      case 'communities': return <CommunitiesPage myId={myId} toast={setToast}/>
      default:            return <HomePage profile={profile} myId={myId} setPage={setPage}/>
    }
  }

  // Fix profile navigation from search results
  const navSetPage=(pg)=>{
    if(pg?.name==='profile'&&pg?.userId&&pg.userId!==myId) setPage({name:'userprofile',userId:pg.userId})
    else setPage(pg)
  }

  return (
    <div style={{fontFamily:"'Trebuchet MS','Lucida Grande',sans-serif",background:BG,minHeight:'100vh',color:TEXT}}>
      <TopNav page={page} setPage={navSetPage} profile={profile} pendingReqs={pendingReqs}/>
      {renderPage()}
      <footer style={{textAlign:'center',padding:'14px 0 20px',fontSize:11,color:MUT,
        borderTop:`1px solid ${BRD}`,marginTop:8}}>
        © Recriado com ❤️ · Zero Monetização
      </footer>
      <Toast msg={toast} onDone={()=>setToast('')}/>
    </div>
  )
}
