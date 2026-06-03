import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase, signUp, signIn, signOut, getProfile, updateProfile,
  getFriends, getFriendRequests, sendFriendRequest, respondFriendRequest,
  getFriendshipStatus, getRecados, sendRecado, deleteRecado,
  getDepoimentos, sendDepoimento, getCommunities, getMyCommunities,
  joinCommunity, leaveCommunity, getCommunityPosts, createCommunityPost,
  getMessages, sendMessage, recordVisit, getVisitors, uploadAvatar,
  searchUsers, validateInviteCode, useInviteCode, getMyInvites, getMemberNumber } from './lib/supabase.js'

/* ── Design tokens matching screenshot exactly ── */
const NAV_BG  = '#1a2e5a'   // dark navy nav
const PINK    = '#e8197d'   // orkut pink
const BG      = '#dce3f0'   // page background blue-grey
const WHITE   = '#ffffff'
const BRD     = '#c8d0e0'
const TEXT    = '#222222'
const MUTED   = '#666666'
const BLUE    = '#2a4b8d'
// Right panel header — light blue-grey gradient like screenshot
const RH_BG   = 'linear-gradient(180deg,#e8edf8 0%,#d8e0f0 100%)'
const RH_BRD  = '#b0b8d0'

/* ── Shared styles ── */
const inp  = { width:'100%', border:`1px solid ${BRD}`, borderRadius:2, padding:'4px 7px',
               fontSize:12, fontFamily:'inherit', color:TEXT, background:WHITE,
               outline:'none', boxSizing:'border-box' }
const tarea= { ...inp, resize:'vertical', minHeight:70 }
const btnBl= { cursor:'pointer', border:'none', fontFamily:'inherit', borderRadius:2,
               fontWeight:700, background:BLUE, color:WHITE, padding:'5px 14px', fontSize:12 }
const btnPk= { ...btnBl, background:PINK }
const btnGh= { cursor:'pointer', fontFamily:'inherit', borderRadius:2, fontWeight:400,
               background:'transparent', border:`1px solid ${BRD}`, color:MUTED,
               padding:'4px 10px', fontSize:11 }

/* ── Big O fade logo (auth screen only) ── */
function OFadeLogo({ size, id }){
  size=size||80; id=id||'ofl'; const w=size*4.4,h=size,gid=id+'g',mid=id+'m'
  return (
    <svg width={w} height={h} viewBox={"0 0 "+w+" "+h} style={{display:'block',overflow:'visible'}}>
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

/* ── Nav logo — big O, bright pink, visible on dark navy ── */
function NavLogo(){
  const h=30, w=h*4.4, gid='nlg', mid='nlm'
  return (
    <svg width={w} height={h} viewBox={"0 0 "+w+" "+h}
      style={{display:'block',overflow:'visible',cursor:'pointer'}} aria-label="">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ff00aa" stopOpacity="1"/>
          <stop offset="20%"  stopColor="#ff00aa" stopOpacity="1"/>
          <stop offset="24%"  stopColor="#ff00aa" stopOpacity="0.12"/>
          <stop offset="38%"  stopColor="#ff00aa" stopOpacity="0"/>
        </linearGradient>
        <mask id={mid}><rect x="0" y="0" width={w} height={h*1.2} fill={"url(#"+gid+")"}/></mask>
      </defs>
      <text x="0" y={h*0.88}
        fontFamily="'Nunito Black','Nunito','Montserrat','Arial Rounded MT Bold',Arial,sans-serif"
        fontSize={h} fontWeight="900" fill="#ff00aa" mask={"url(#"+mid+")"} letterSpacing="-1">Orkut</text>
    </svg>
  )
}

/* ── Avatar ── */
function Av({ src, size, name, radius }){
  size=size||36; radius=radius!==undefined?radius:'50%'
  const fb="https://api.dicebear.com/9.x/personas/svg?seed="+encodeURIComponent(name||'u')
  return <img src={src||fb} alt={name||''} width={size} height={size}
    onError={e=>{e.target.src=fb}}
    style={{borderRadius:radius,objectFit:'cover',flexShrink:0,display:'block',
            border:`1px solid ${BRD}`}}/>
}

/* ── Toast ── */
function Toast({ msg, onDone }){
  useEffect(()=>{if(msg){const t=setTimeout(onDone,3000);return()=>clearTimeout(t)}},[msg])
  if(!msg)return null
  return <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',
    background:BLUE,color:WHITE,padding:'9px 20px',borderRadius:3,fontSize:13,
    fontWeight:600,zIndex:9999,boxShadow:'0 3px 12px rgba(0,0,0,.2)'}}>{msg}</div>
}

/* ── AUTH SCREEN ── */
function AuthScreen({ onAuth }){
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({email:'',password:'',name:'',invite:''})
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))
  const submit=async()=>{
    setErr('');setLoading(true)
    try{
      if(mode==='login'){
        await signIn({email:form.email,password:form.password})
      } else {
        if(!form.name.trim()) throw new Error('Digite seu nome')
        if(!form.invite.trim()) throw new Error('Código de convite obrigatório')
        // Validate invite code first
        const invite = await validateInviteCode(form.invite)
        if(!invite) throw new Error('Código de convite inválido ou já utilizado')
        // Create account
        const data = await signUp({email:form.email,password:form.password,name:form.name})
        // Mark invite as used
        if(data?.user) await useInviteCode(form.invite, data.user.id)
      }
      onAuth()
    }catch(e){ setErr(e.message==='Failed to fetch'?'Erro de conexão. Tente novamente.':e.message) }
    setLoading(false)
  }
  const ri={...inp,border:'1px solid #a0a8c0',borderRadius:1,padding:'3px 5px'}
  return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',flexDirection:'column'}}>
      <div style={{background:'#f0eeff',borderBottom:'1px solid #d8ccf0',padding:'7px 0',textAlign:'center',fontSize:12}}>
        <span style={{color:PINK,fontWeight:700}}>Aviso:</span>
        <span style={{color:MUTED}}> Reviva a nostalgia com conexões verdadeiras.</span>
      </div>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',
        padding:'32px 20px',gap:40,maxWidth:960,margin:'0 auto',width:'100%',flexWrap:'wrap'}}>
        <div style={{flex:'1 1 360px',minWidth:260,display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center'}}>
          <div style={{marginBottom:40}}><OFadeLogo size={100}/></div>
          {/* OG Orkut-inspired invite-only manifesto */}
          <div style={{maxWidth:340,textAlign:'center'}}>
            <p style={{fontSize:15,color:TEXT,lineHeight:1.7,marginBottom:14}}>
              <span style={{color:PINK,fontWeight:700}}>Uma comunidade exclusiva</span>{' '}
              para conexões reais com as pessoas que você ama.
            </p>
            <p style={{fontSize:13,color:MUTED,lineHeight:1.8,marginBottom:14}}>
              Estamos comprometidos em oferecer um espaço seguro para socializar,
              reencontrar amigos e criar memórias com quem realmente importa.
              Sem anúncios. Sem rastreamento. Sem influencers. Sem monetização.
            </p>
            <p style={{fontSize:13,color:MUTED,lineHeight:1.8,marginBottom:14}}>
              Aqui é só sobre <strong style={{color:TEXT}}>pessoas reais</strong>,{' '}
              <strong style={{color:TEXT}}>família</strong> e{' '}
              <strong style={{color:TEXT}}>amigos verdadeiros</strong> que você quer
              manter perto — como nos velhos tempos.
            </p>
            <div style={{borderTop:`1px solid ${BRD}`,paddingTop:14,fontSize:12,color:MUTED,fontStyle:'italic'}}>
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:5}}>
                <rect x="1" y="6.5" width="10" height="8" rx="1.5" fill="#9aa0b0"/>
                <path d="M3 6.5V4.5a3 3 0 0 1 6 0v2" stroke="#9aa0b0" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                <circle cx="6" cy="11" r="1.2" fill="white"/>
              </svg> Comunidade por convite.<br/>
              Cada membro pode convidar até 10 pessoas de confiança.
            </div>
          </div>
        </div>
        <div style={{flex:'0 1 290px',minWidth:240}}>
          <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
            padding:'14px 16px',marginBottom:10,boxShadow:'0 1px 3px rgba(0,0,0,.08)'}}>
            <div style={{fontSize:12,color:TEXT,marginBottom:12,textAlign:'center',
              display:'flex',alignItems:'center',justifyContent:'center',gap:5,flexWrap:'wrap'}}>
              {mode==='login'
                ?<div style={{textAlign:'center',fontSize:12,color:TEXT}}>
                    Acesse o{' '}
                    <span style={{display:'inline-block',verticalAlign:'middle',marginBottom:2}}>
                      <OFadeLogo size={22} id="frm"/>
                    </span>
                    {' '}com a sua conta
                  </div>
                :<span style={{fontWeight:600}}>Cadastre-se gratuitamente</span>}
            </div>
            {mode==='signup'&&<>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:11,color:TEXT,marginBottom:2}}>Código de convite:</div>
                <input style={ri} value={form.invite} onChange={e=>f('invite',e.target.value.toUpperCase())}
                  placeholder="Ex: AB12CD34" maxLength={8}/>
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:11,color:TEXT,marginBottom:2}}>Seu nome:</div>
                <input style={ri} value={form.name} onChange={e=>f('name',e.target.value)}/>
              </div>
            </>}
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
              borderRadius:2,color:WHITE,padding:'4px 16px',fontSize:12,fontWeight:700,
              cursor:'pointer',fontFamily:'inherit'}} onClick={submit} disabled={loading}>
              {loading?'Aguarde…':mode==='login'?'Login':'Criar conta'}
            </button>
            {mode==='login'&&<div style={{fontSize:11,color:PINK,cursor:'pointer',marginTop:8}}>Esqueceu sua senha?</div>}
          </div>
          <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
            padding:'14px 16px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',textAlign:'center'}}>
            {mode==='login'
              ?<><div style={{fontSize:12,color:TEXT,marginBottom:10}}>Ainda não é membro?</div>
                <button style={{...btnPk,padding:'6px 20px',fontSize:13}} onClick={()=>setMode('signup')}>ENTRAR JÁ</button></>
              :<><div style={{fontSize:12,color:TEXT,marginBottom:10}}>Já tem uma conta?</div>
                <button style={{background:'linear-gradient(180deg,#5577bb,#2244aa)',border:'1px solid #1a3a8a',
                  borderRadius:2,color:WHITE,padding:'6px 20px',fontSize:12,fontWeight:700,
                  cursor:'pointer',fontFamily:'inherit'}} onClick={()=>setMode('login')}>ENTRAR</button></>}
          </div>
        </div>
      </div>
      <div style={{textAlign:'center',padding:'12px 0',fontSize:11,color:MUTED,borderTop:`1px solid ${BRD}`}}>
        © Recriado com ❤️ · Zero Monetização
      </div>
    </div>
  )
}

/* ── TOP NAV — exact match screenshot ── */
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
  const links=[['Início','home'],['Perfil','profile'],['Recados','scrapbook'],
               ['Amigos','friends'],['Comunidades','communities']]
  return (
    <header style={{background:NAV_BG,position:'sticky',top:0,zIndex:200,height:40,
      display:'flex',alignItems:'center',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>
      <div style={{maxWidth:980,margin:'0 auto',width:'100%',height:'100%',
        display:'flex',alignItems:'center',padding:'0 10px',gap:0}}>
        <div onClick={()=>setPage('home')} style={{marginRight:14,flexShrink:0}}>
          <NavLogo/>
        </div>
        <nav style={{display:'flex',alignItems:'center',height:'100%'}}>
          {links.map(([label,pg])=>(
            <div key={pg} onClick={()=>setPage(pg)} style={{
              display:'inline-flex',alignItems:'center',height:'100%',
              padding:'0 13px',cursor:'pointer',
              fontFamily:'Arial,sans-serif',fontWeight:700,fontSize:13,
              color:WHITE,userSelect:'none',
              background:cur===pg?'rgba(0,0,0,.28)':'transparent',
              boxShadow:cur===pg?'inset 0 2px 4px rgba(0,0,0,.25)':'none',
              position:'relative',
            }}>
              {label}
              {pg==='friends'&&pendingReqs>0&&(
                <span style={{position:'absolute',top:4,right:2,background:PINK,color:WHITE,
                  borderRadius:10,padding:'0 4px',fontSize:9,fontWeight:700,lineHeight:'15px'}}>
                  {pendingReqs}</span>
              )}
            </div>
          ))}
        </nav>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10,fontSize:11,color:WHITE}}>

          <span style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#4caf50'}}/>
            <span style={{cursor:'pointer'}} onClick={()=>setPage('profile')}>{profile?.name?.split(' ')[0]||'…'}</span>
          </span>
          <span style={{cursor:'pointer',opacity:.85}} onClick={()=>signOut()}>Logout</span>
        </div>
      </div>
    </header>
  )
}

/* ── RIGHT PANEL — matches screenshot style exactly ── */
function RightPanel({ title, children }){
  return (
    <div style={{background:WHITE,border:`1px solid ${RH_BRD}`,borderRadius:3,
      marginBottom:10,overflow:'hidden'}}>
      <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
        padding:'5px 10px',fontWeight:700,fontSize:13,color:TEXT}}>
        {title}
      </div>
      <div style={{padding:'8px 10px'}}>{children}</div>
    </div>
  )
}

/* ── RIGHT SIDEBAR ── */
function RightSidebar({ myId, setPage }){
  const [friends,setFriends]=useState([])
  const [mine,setMine]=useState([])
  useEffect(()=>{
    getFriends(myId).then(setFriends)
    getMyCommunities(myId).then(setMine)
  },[myId])
  return (
    <aside style={{width:230,flexShrink:0}}>
      <RightPanel title={`meus amigos (${friends.length})`}>
        {friends.length===0?(
          <>
            <input placeholder="buscar amigos" style={{...inp,marginBottom:7,fontSize:11}}/>
            <div style={{fontSize:12,color:MUTED}}>Sem amigos ainda.</div>
          </>
        ):(
          <>
            <input placeholder="buscar amigos" style={{...inp,marginBottom:7,fontSize:11}}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
              {friends.slice(0,8).map(f=>(
                <div key={f.id} style={{textAlign:'center',cursor:'pointer'}}
                  onClick={()=>setPage({name:'userprofile',userId:f.id})}>
                  <Av src={f.avatar_url} size={40} name={f.name} radius="3px"/>
                  <div style={{fontSize:9,color:MUTED,marginTop:2,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </RightPanel>
      <RightPanel title={`minhas comunidades (${mine.length})`}>
        {mine.length===0
          ?<div style={{fontSize:12,color:MUTED}}>Sem comunidades.</div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4}}>
            {mine.slice(0,8).map(c=>(
              <div key={c.id} style={{textAlign:'center',cursor:'pointer'}}
                onClick={()=>setPage({name:'communities',openCommunity:c})}>
                <img src={"https://picsum.photos/seed/"+(c.seed||c.id)+"/40/40"} alt=""
                  style={{width:40,height:40,borderRadius:3,objectFit:'cover',
                    border:`1px solid ${BRD}`,display:'block'}}/>
                <div style={{fontSize:9,color:MUTED,marginTop:2,overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {(c.name||'').replace(/[♥❤★]/g,'').trim()}
                </div>
              </div>
            ))}
          </div>}
      </RightPanel>
    </aside>
  )
}

/* ── HOME PAGE — pixel match of screenshot ── */
function HomePage({ profile, myId, setPage }){
  const [scrapCount,setScrapCount]=useState(0)
  const [comCount,setComCount]=useState(0)
  const [fortune,setFortune]=useState('Tenha um ótimo dia!')
  const [editingFortune,setEditingFortune]=useState(false)
  const [fortuneDraft,setFortuneDraft]=useState('')
  useEffect(()=>{
    if(!myId)return
    getRecados(myId).then(r=>setScrapCount(r.length))
    getMyCommunities(myId).then(c=>setComCount(c.length))
  },[myId])

  // Icon row — colored icons matching screenshot
  const icons=[
    { emoji:'✏️',  color:'#e8700a', label:'scraps',       count:scrapCount, pg:'scrapbook' },
    { emoji:'📷',  color:'#555577', label:'fotos',         count:0,          pg:'galeria' },
    { emoji:'🏷️',  color:'#e8700a', label:'fotos de mim',  count:0,          pg:null },
    { emoji:'⭐',  color:'#f5a623', label:'fãs',            count:0,          pg:null },
    { emoji:'✉️',  color:'#757575', label:'mensagens',      count:0,          pg:null },
  ]

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px',
      display:'grid',gridTemplateColumns:'210px 1fr 230px',gap:8,alignItems:'flex-start'}}>

      {/* LEFT COL — photo + name + status + nav */}
      <div>
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden',marginBottom:6}}>
          <div style={{lineHeight:0,borderBottom:`1px solid ${BRD}`,cursor:'pointer'}}
            onClick={()=>setPage('profile')}>
            <img src={profile?.avatar_url||("https://api.dicebear.com/9.x/personas/svg?seed="+(profile?.name||'u'))}
              alt={profile?.name||''}
              style={{width:'100%',aspectRatio:'1',objectFit:'cover',display:'block'}}
              onError={e=>{e.target.src="https://api.dicebear.com/9.x/personas/svg?seed=u"}}/>
          </div>
          <div style={{padding:'8px 10px'}}>
            <div style={{fontWeight:700,fontSize:14,color:PINK,cursor:'pointer',marginBottom:3}}
              onClick={()=>setPage('profile')}>{profile?.name||'…'}</div>
            <div style={{fontSize:12,color:'#4caf50'}}>● disponível</div>
          </div>
        </div>
        {/* Nav panel — light blue header, links list */}
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
          <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
            padding:'4px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700,fontSize:12,color:TEXT}}>perfil</span>
            <span style={{fontSize:11,color:BLUE,cursor:'pointer',textDecoration:'underline'}}
              onClick={()=>setPage('profile')}>editar</span>
          </div>
          {[['scrapbook','scrapbook'],['fotos','galeria'],['amigos','friends'],
            ['comunidades','communities'],['depoimentos','depoimentos']].map(([label,pg])=>(
            <div key={label} onClick={()=>pg&&setPage(pg)} style={{
              padding:'5px 10px',fontSize:13,
              cursor:pg?'pointer':'default',
              color:BLUE,
              borderBottom:`1px solid ${BRD}`,
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* CENTER — welcome panel */}
      <div>
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
          padding:'14px 16px',marginBottom:0}}>
          {/* Welcome */}
          <div style={{fontWeight:700,fontSize:18,color:TEXT,marginBottom:10}}>
            Bem-vindo(a), {profile?.name?.split(' ')[0]}!
          </div>
          {/* Status box — pink border, editable */}
          <div style={{display:'flex',alignItems:'center',
            border:`1px solid ${PINK}`,borderRadius:3,
            padding:'6px 10px',marginBottom:14,background:WHITE,cursor:'text'}}
            onClick={()=>{setFortuneDraft(fortune);setEditingFortune(true)}}>
            {editingFortune
              ? <input autoFocus style={{flex:1,border:'none',outline:'none',fontSize:13,
                  color:TEXT,fontFamily:'inherit',background:'transparent'}}
                  value={fortuneDraft}
                  onChange={e=>setFortuneDraft(e.target.value)}
                  onBlur={()=>{setFortune(fortuneDraft);setEditingFortune(false)}}
                  onKeyDown={e=>{if(e.key==='Enter'){setFortune(fortuneDraft);setEditingFortune(false)}}}/>
              : <span style={{flex:1,fontSize:13,color:TEXT}}>{fortune}</span>
            }
            <span style={{fontSize:18}}>🙂</span>
          </div>
          {/* Icon row — colored icons, fixed 32px icon height so labels align */}
          <div style={{display:'flex',justifyContent:'space-around',
            paddingTop:12,borderTop:`1px solid ${BRD}`,marginBottom:12}}>
            {icons.map(({emoji,color,label,count,pg})=>(
              <div key={label} style={{textAlign:'center',cursor:pg?'pointer':'default',minWidth:60}}
                onClick={()=>pg&&setPage(pg)}>
                <div style={{fontSize:11,fontWeight:700,color:BLUE,marginBottom:2}}>{count}</div>
                <div style={{height:32,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:3}}>
                  {label==='fotos'
                    ? <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
                        <rect x="1" y="2" width="24" height="18" rx="2" fill="none" stroke="#2e7d32" strokeWidth="1.8"/>
                        <path d="M1 14l6-5 5 5 4-4 9 7" stroke="#2e7d32" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                        <circle cx="8" cy="7" r="2.2" fill="none" stroke="#2e7d32" strokeWidth="1.6"/>
                      </svg>
                    : <span style={{fontSize:24,color}}
                        dangerouslySetInnerHTML={{__html:`<span style="color:${color}">${emoji}</span>`}}/>
                  }
                </div>
                <div style={{fontSize:11,color:TEXT}}>{label}</div>
              </div>
            ))}
          </div>
          {/* Stats line */}
          <div style={{fontSize:12,color:TEXT,lineHeight:1.9,borderTop:`1px solid ${BRD}`,paddingTop:10}}>
            <div><strong>Visitas ao perfil:</strong> desde hoje: 0</div>
            <div><strong>Visitantes recentes:</strong> —</div>
            <div><strong>Fortuna do dia:</strong> {fortune}</div>
          </div>
        </div>
        {/* Friend suggestions — screenshot style: grey square avatars */}
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden',marginTop:8}}>
          <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
            padding:'5px 10px',fontWeight:700,fontSize:12,color:TEXT}}>
            sugestões de amigos
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,padding:'12px 14px'}}>
            {['A','B','C','D'].map((letter)=>(
              <div key={letter} style={{textAlign:'center',cursor:'pointer'}} title="Em breve">
                <div style={{
                  width:'100%',aspectRatio:'1',borderRadius:2,
                  border:`1px solid ${BRD}`,background:'#e0e6f2',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:30,fontWeight:900,color:'#4a5a7a',marginBottom:5,
                }}>{letter}</div>
                <div style={{fontSize:11,color:TEXT,overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{letter}.</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COL */}
      <RightSidebar myId={myId} setPage={setPage}/>
    </div>
  )
}

/* ── PERFIL ── */
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
  const [invites,setInvites]=useState([])
  const [showInvites,setShowInvites]=useState(false)
  const [tab,setTab]=useState('social')
  const [memberNum,setMemberNum]=useState(null)

  useEffect(()=>{
    if(!targetId)return
    getProfile(targetId).then(p=>{setProfile(p);setDraft(p||{})})
    getDepoimentos(targetId).then(setDeps)
    getRecados(targetId).then(setScraps)
    if(isOwn){ getMyInvites(myId).then(setInvites); getMemberNumber(targetId).then(setMemberNum) }
    if(!isOwn){recordVisit(myId,targetId);getFriendshipStatus(myId,targetId).then(setFStatus)}
  },[targetId])

  const save=async()=>{
    await updateProfile(myId,{name:draft.name,bio:draft.bio,city:draft.city,
      country:draft.country,gender:draft.gender,rel_status:draft.rel_status,
      musica:draft.musica||[],filmes:draft.filmes||[]})
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
    getDepoimentos(targetId).then(setDeps);setTDraft('');setTWrite(false);toast('Enviado!')
  }
  const af=(k,v)=>setDraft(p=>({...p,[k]:v.split(',').map(s=>s.trim()).filter(Boolean)}))
  if(!profile)return <div style={{padding:20,color:MUTED,textAlign:'center'}}>Carregando…</div>

  const tag={display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:10,
    border:`1px solid ${BRD}`,background:'#f0f4ff',fontSize:12,color:MUTED,marginRight:4,marginBottom:4}

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px',
      display:'grid',gridTemplateColumns:'210px 1fr 230px',gap:8,alignItems:'flex-start'}}>
      {/* Left */}
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{lineHeight:0,borderBottom:`1px solid ${BRD}`}}>
          <img src={profile.avatar_url||("https://api.dicebear.com/9.x/personas/svg?seed="+(profile.name||'u'))}
            alt={profile.name} style={{width:'100%',aspectRatio:'1',objectFit:'cover',display:'block'}}/>
        </div>
        <div style={{padding:'8px 10px 4px'}}>
          <div style={{fontWeight:700,fontSize:14,color:PINK,marginBottom:2}}>{profile.name}</div>
          <div style={{fontSize:12,color:'#4caf50',marginBottom:8}}>● disponível</div>
          {isOwn&&<label style={{...btnBl,display:'inline-block',cursor:'pointer',fontSize:11,padding:'3px 10px',marginBottom:4}}>
            {uploading?'…':'trocar foto'}
            <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/>
          </label>}
        </div>
        <div style={{borderTop:`1px solid ${BRD}`,padding:'6px 0'}}>
          {[['scrapbook','scrapbook'],['fotos','galeria'],['amigos','friends'],
            ['comunidades','communities'],['depoimentos','depoimentos']].map(([label,pg])=>(
            <div key={label} onClick={()=>pg&&setPage(pg)} style={{
              padding:'3px 10px',fontSize:13,cursor:pg?'pointer':'default',color:BLUE}}>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Center */}
      <div>
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,marginBottom:8,overflow:'hidden'}}>
          {/* Header: name + buttons */}
          <div style={{padding:'12px 16px 8px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <h1 style={{fontSize:20,fontWeight:700,color:PINK,margin:0,textDecoration:'underline',cursor:'default'}}>{profile.name}</h1>
              <div style={{display:'flex',gap:7}}>
                {isOwn&&<><button style={btnBl} onClick={()=>setEditing(!editing)}>{editing?'cancelar':'editar perfil'}</button>
                  <label style={{...btnGh,cursor:'pointer'}}>trocar foto<input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatar}/></label></>}
                {!isOwn&&<button style={fStatus?.status==='accepted'?btnGh:btnBl} onClick={handleFriend}>
                  {!fStatus?'+ adicionar':fStatus.status==='pending'&&fStatus.requester_id===myId?'pedido enviado':'aceitar'}</button>}
                {!isOwn&&<button style={btnPk} onClick={()=>setPage({name:'scrapbook',userId:targetId})}>✉ recado</button>}
              </div>
            </div>
            {/* Stats row */}
            <div style={{display:'flex',gap:14,fontSize:12,color:TEXT,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke={MUTED} strokeWidth="1.4" fill="none"/><line x1="1" y1="5" x2="13" y2="5" stroke={MUTED} strokeWidth="1.2"/></svg>
                recados <strong>{scraps.length}</strong>
              </span>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><rect x="0.5" y="1" width="13" height="10" rx="1.5" stroke={MUTED} strokeWidth="1.4" fill="none"/><path d="M0.5 8l3.5-3 3 3 2.5-2.5 5 4" stroke={MUTED} strokeWidth="1.2" strokeLinejoin="round" fill="none"/><circle cx="4" cy="4.5" r="1.2" fill="none" stroke={MUTED} strokeWidth="1.2"/></svg>
                fotos <strong>0</strong>
              </span>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="7,1 9,5.5 14,6 10.5,9.5 11.5,14 7,11.5 2.5,14 3.5,9.5 0,6 5,5.5" stroke={MUTED} strokeWidth="1.2" fill="none"/></svg>
                vídeos <strong>0</strong>
              </span>
              <span style={{display:'flex',alignItems:'center',gap:4}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polygon points="7,1 9,5.5 14,6 10.5,9.5 11.5,14 7,11.5 2.5,14 3.5,9.5 0,6 5,5.5" stroke={MUTED} strokeWidth="1.4" fill="none"/></svg>
                fãs <strong>0</strong>
              </span>
            </div>
            {/* Ratings */}
            <div style={{display:'flex',gap:14,fontSize:12,color:MUTED,alignItems:'center',flexWrap:'wrap'}}>
              <span>confiável <span style={{fontSize:15}}>😊😊😊</span></span>
              <span>legal <span style={{color:'#3b5bdb',fontSize:15}}>■■■</span></span>
              <span>sexy <span style={{color:'#e03131',fontSize:15}}>♥♥♥</span></span>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:'flex',borderTop:`1px solid ${BRD}`,borderBottom:`1px solid ${BRD}`,background:'#f0f4ff'}}>
            {['social','profissional','depoimentos'].map(t=>(
              <div key={t} onClick={()=>{setTab(t);setEditing(false)}} style={{
                padding:'7px 18px',cursor:'pointer',fontSize:12,fontWeight:700,
                background:tab===t?PINK:'transparent',
                color:tab===t?WHITE:MUTED,
                borderRight:`1px solid ${BRD}`,
              }}>{t}</div>
            ))}
          </div>

          {/* Tab content */}
          <div style={{padding:'0'}}>
            {tab==='social'&&(editing
              ? /* ── EDIT FORM ── */
                <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:6}}>
                  {[
                    ['relacionamento','rel_status'],['aniversário','birthday'],['sexo','gender'],
                    ['interesses no orkut','interests'],['quem sou eu','bio'],['filhos','children'],
                    ['etnia','ethnicity'],['humor','humor'],['orientação sexual','orientation'],
                    ['estilo','style'],['fumo','smoking'],['bebo','drinking'],['animais','pets'],
                    ['moro com','living_with'],['cidade','city'],['país','country'],
                    ['cidade natal','hometown'],['página web','website'],['paixões','passions'],
                    ['esportes','sports'],['atividades','activities'],['fortune','fortune'],
                  ].map(([l,k])=>(
                    <div key={k} style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:8,alignItems:'center'}}>
                      <div style={{fontSize:12,color:MUTED,textAlign:'right'}}>{l}:</div>
                      <input style={inp} value={draft[k]||''} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8,marginTop:8,paddingLeft:168}}>
                    <button style={btnBl} onClick={async()=>{
                      await updateProfile(myId,draft); setProfile(draft); setEditing(false); toast('Perfil atualizado!')
                    }}>Salvar</button>
                    <button style={btnGh} onClick={()=>setEditing(false)}>Cancelar</button>
                  </div>
                </div>
              : /* ── SOCIAL VIEW ── */
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <tbody>
                    {[
                      ['relacionamento','rel_status'],['aniversário','birthday'],['sexo','gender'],
                      ['interesses no orkut','interests'],['quem sou eu','bio'],['filhos','children'],
                      ['etnia','ethnicity'],['humor','humor'],['orientação sexual','orientation'],
                      ['estilo','style'],['fumo','smoking'],['bebo','drinking'],['animais','pets'],
                      ['moro com','living_with'],['cidade','city'],['país','country'],
                      ['cidade natal','hometown'],['página web','website'],['paixões','passions'],
                      ['esportes','sports'],['atividades','activities'],['fortune','fortune'],
                    ].map(([l,k],i)=>(
                      <tr key={k} style={{background:i%2===0?'#f8f9fc':WHITE}}>
                        <td style={{padding:'6px 16px',color:MUTED,width:170,fontWeight:600,textAlign:'right',
                          borderRight:`1px solid ${BRD}`,whiteSpace:'nowrap'}}>{l}:</td>
                        <td style={{padding:'6px 16px',color:profile[k]?TEXT:MUTED}}>
                          {profile[k]||'—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
            {tab==='profissional'&&(editing
              ? <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:6}}>
                  {[
                    ['empresa','company'],['cargo','job_title'],['resumo profissional','professional_bio'],
                    ['experiência','experience'],['formação','education'],['habilidades','skills'],
                    ['idiomas','languages'],['interesses profissionais','professional_interests'],
                  ].map(([l,k])=>(
                    <div key={k} style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:8,alignItems:'center'}}>
                      <div style={{fontSize:12,color:MUTED,textAlign:'right'}}>{l}:</div>
                      <input style={inp} value={draft[k]||''} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
                    </div>
                  ))}
                  <div style={{display:'flex',gap:8,marginTop:8,paddingLeft:168}}>
                    <button style={btnBl} onClick={async()=>{
                      await updateProfile(myId,draft); setProfile(draft); setEditing(false); toast('Perfil atualizado!')
                    }}>Salvar</button>
                    <button style={btnGh} onClick={()=>setEditing(false)}>Cancelar</button>
                  </div>
                </div>
              : <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <tbody>
                    {[
                      ['empresa','company'],['cargo','job_title'],['resumo profissional','professional_bio'],
                      ['experiência','experience'],['formação','education'],['habilidades','skills'],
                      ['idiomas','languages'],['interesses profissionais','professional_interests'],
                    ].map(([l,k],i)=>(
                      <tr key={k} style={{background:i%2===0?'#f8f9fc':WHITE}}>
                        <td style={{padding:'6px 16px',color:MUTED,width:170,fontWeight:600,textAlign:'right',
                          borderRight:`1px solid ${BRD}`,whiteSpace:'nowrap'}}>{l}:</td>
                        <td style={{padding:'6px 16px',color:profile[k]?TEXT:MUTED}}>{profile[k]||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )}
            {tab==='depoimentos'&&<div style={{padding:'10px 14px'}}>
              {deps.map(d=>(
                <div key={d.id} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:`1px solid ${BRD}`}}>
                  <Av src={d.from.avatar_url} size={32} name={d.from.name} radius="3px"/>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer',marginBottom:2}}
                      onClick={()=>setPage({name:'userprofile',userId:d.from.id})}>{d.from.name}:</div>
                    <div style={{fontSize:13,color:TEXT,lineHeight:1.5}}>{d.text}</div>
                  </div>
                </div>
              ))}
              {deps.length===0&&<div style={{fontSize:12,color:MUTED}}>Nenhum depoimento ainda.</div>}
              {!tWrite&&!isOwn&&<button style={{...btnBl,marginTop:8}} onClick={()=>setTWrite(true)}>escrever depoimento</button>}
              {tWrite&&<div style={{marginTop:8}}>
                <textarea style={tarea} value={tDraft} onChange={e=>setTDraft(e.target.value)} placeholder="Escreva algo bonito…"/>
                <div style={{display:'flex',gap:8,marginTop:8}}>
                  <button style={btnBl} onClick={submitDep}>Postar</button>
                  <button style={btnGh} onClick={()=>setTWrite(false)}>Cancelar</button>
                </div>
              </div>}
            </div>}
          </div>
        </div>

        {/* Member number watermark — barely visible, people discover it */}
        {isOwn&&memberNum&&<div style={{
          textAlign:'center',padding:'18px 0 4px',
          fontSize:10,color:'rgba(42,75,141,0.12)',
          letterSpacing:4,userSelect:'none',fontFamily:'monospace',
          fontWeight:400,
        }}>
          {String(memberNum).padStart(9,'0')}
        </div>}

        {/* Invites panel — own profile only */}
        {isOwn&&<div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
          overflow:'hidden',marginTop:8}}>
          <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'5px 10px',
            display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}
            onClick={()=>setShowInvites(!showInvites)}>
            <span style={{fontWeight:700,fontSize:13,color:TEXT}}>
              🔒 meus convites ({invites.filter(i=>!i.used_by).length}/{invites.length} restantes)
            </span>
            <span style={{fontSize:11,color:BLUE}}>{showInvites?'▲ fechar':'▼ ver'}</span>
          </div>
          {showInvites&&<div style={{padding:'10px 14px'}}>
            <p style={{fontSize:12,color:MUTED,marginBottom:10,lineHeight:1.6}}>
              Compartilhe estes códigos com pessoas de confiança. Cada código só pode ser usado uma vez.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
              {invites.map(inv=>(
                <div key={inv.id} style={{display:'flex',alignItems:'center',gap:8,
                  padding:'7px 10px',borderRadius:2,
                  background:inv.used_by?'#f0f0f0':'#f0fff4',
                  border:`1px solid ${inv.used_by?BRD:'#b0d8c0'}`}}>
                  <span style={{fontFamily:'monospace',fontWeight:700,fontSize:14,
                    color:inv.used_by?MUTED:BLUE,letterSpacing:2}}>{inv.code}</span>
                  {inv.used_by
                    ?<span style={{fontSize:10,color:MUTED,marginLeft:'auto'}}>✓ usado</span>
                    :<span style={{fontSize:10,color:'#2e7d32',marginLeft:'auto',cursor:'pointer'}}
                      onClick={()=>navigator.clipboard?.writeText(inv.code).then(()=>alert('Copiado!'))}>
                      📋 copiar
                    </span>}
                </div>
              ))}
            </div>
            {invites.length===0&&<div style={{fontSize:12,color:MUTED}}>
              Seus convites estão sendo gerados…
            </div>}
          </div>}
        </div>}
      </div>

      {/* Right */}
      <RightSidebar myId={myId} setPage={setPage}/>
    </div>
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
    const ch=supabase.channel('sc-'+targetId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'recados',filter:'to_id=eq.'+targetId},
        ()=>getRecados(targetId).then(setScraps)).subscribe()
    return()=>supabase.removeChannel(ch)
  },[targetId])
  const post=async()=>{
    if(!text.trim())return
    await sendRecado(myId,targetId,text)
    getRecados(targetId).then(setScraps);setText('');toast('Recado enviado!')
  }
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          fontWeight:700,fontSize:14,color:TEXT}}>
          recados de {isOwn?'mim':targetProfile?.name||'…'}
        </div>
        {isOwn&&<div style={{padding:'10px 12px',borderBottom:`1px solid ${BRD}`}}>
          <textarea style={tarea} value={text} onChange={e=>setText(e.target.value)} placeholder="Deixar um recado…"/>
          <button style={{...btnBl,marginTop:8}} onClick={post}>Enviar</button>
        </div>}
        <div style={{padding:'0 12px'}}>
          {scraps.length===0
            ?<div style={{padding:'18px 0',color:MUTED,fontSize:13}}>Nenhum recado ainda.</div>
            :scraps.map(s=>(
              <div key={s.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BRD}`}}>
                <Av src={s.from.avatar_url} size={34} name={s.from.name} radius="3px"/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer',marginBottom:2}}
                    onClick={()=>setPage({name:'userprofile',userId:s.from.id})}>{s.from.name}</div>
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.5}}>{s.text}</div>
                  <div style={{fontSize:10,color:MUTED,marginTop:3}}>
                    {new Date(s.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  {isOwn&&<span style={{fontSize:11,color:'#cc0000',cursor:'pointer',marginTop:3,display:'inline-block'}}
                    onClick={()=>deleteRecado(s.id,myId).then(()=>setScraps(p=>p.filter(r=>r.id!==s.id)))}>apagar</span>}
                </div>
              </div>
            ))}
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

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          fontWeight:700,fontSize:14,color:TEXT}}>amigos</div>
        <div style={{display:'flex',borderBottom:`1px solid ${BRD}`}}>
          {[['amigos','meus amigos'],['pedidos','pedidos recebidos'],['enviados','pedidos enviados']].map(([t,l])=>(
            <div key={t} onClick={()=>setTab(t)} style={{padding:'7px 14px',cursor:'pointer',fontSize:12,
              fontWeight:tab===t?700:400,color:tab===t?BLUE:MUTED,
              borderBottom:tab===t?`2px solid ${BLUE}`:'2px solid transparent',boxSizing:'border-box'}}>{l}</div>
          ))}
        </div>
        <div style={{padding:'12px 14px'}}>
          {tab==='amigos'&&(friends.length===0
            ?<div style={{color:MUTED,fontSize:13}}>Nada por aqui.</div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10}}>
              {friends.map(f=>(
                <div key={f.id} style={{textAlign:'center',padding:8,border:`1px solid ${BRD}`,borderRadius:2,background:'#f5f7fc'}}>
                  <div style={{cursor:'pointer'}} onClick={()=>setPage({name:'userprofile',userId:f.id})}>
                    <Av src={f.avatar_url} size={55} name={f.name} radius="3px"/>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:TEXT,margin:'5px 0',cursor:'pointer',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                    onClick={()=>setPage({name:'userprofile',userId:f.id})}>{f.name}</div>
                  <button style={{...btnBl,padding:'2px 7px',fontSize:10}} onClick={()=>openChat(f)}>💬 chat</button>
                </div>
              ))}
            </div>)}
          {tab==='pedidos'&&(requests.length===0
            ?<div style={{color:MUTED,fontSize:13}}>Nada por aqui.</div>
            :requests.map(r=>(
              <div key={r.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:`1px solid ${BRD}`}}>
                <Av src={r.requester.avatar_url} size={36} name={r.requester.name} radius="3px"/>
                <div style={{flex:1,fontWeight:600,fontSize:13,color:TEXT}}>{r.requester.name}</div>
                <button style={{...btnBl,padding:'3px 10px',fontSize:11}} onClick={()=>respond(r.id,true)}>aceitar</button>
                <button style={{...btnGh,padding:'3px 10px',fontSize:11}} onClick={()=>respond(r.id,false)}>recusar</button>
              </div>
            )))}
          {tab==='enviados'&&<div style={{color:MUTED,fontSize:13}}>Nada por aqui.</div>}
        </div>
        <div style={{padding:'10px 14px',borderTop:`1px solid ${BRD}`}}>
          <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:8}}>buscar pessoas</div>
          <input style={inp} placeholder="buscar por nome…"/>
        </div>
      </div>
      {chatF&&(
        <div style={{position:'fixed',bottom:20,right:20,width:290,background:WHITE,
          border:`1.5px solid ${BRD}`,borderRadius:3,boxShadow:'0 6px 24px rgba(0,0,0,.15)',zIndex:999,overflow:'hidden'}}>
          <div style={{background:BLUE,padding:'8px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <Av src={chatF.avatar_url} size={22} name={chatF.name} radius="3px"/>
              <span style={{color:WHITE,fontWeight:700,fontSize:12}}>{chatF.name}</span>
            </div>
            <span style={{color:WHITE,cursor:'pointer'}} onClick={()=>setChatF(null)}>✕</span>
          </div>
          <div ref={chatRef} style={{height:200,overflowY:'auto',padding:8,background:'#f5f7fc',display:'flex',flexDirection:'column',gap:5}}>
            {messages.length===0&&<div style={{color:MUTED,fontSize:11,textAlign:'center',marginTop:60}}>Diga olá!</div>}
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
        </div>
      )}
    </div>
  )
}

/* ── COMMUNITIES ── */
function CommunitiesPage({ myId, toast, page }){
  const [all,setAll]=useState([])
  const [mine,setMine]=useState([])
  const [search,setSearch]=useState('')
  const [active,setActive]=useState(null)
  const [posts,setPosts]=useState([])
  const [newPost,setNewPost]=useState('')

  useEffect(()=>{
    getCommunities().then(setAll)
    getMyCommunities(myId).then(setMine)
  },[myId])

  // Open specific community if passed via page state
  useEffect(()=>{
    if(page?.openCommunity){
      setActive(page.openCommunity)
      getCommunityPosts(page.openCommunity.id).then(setPosts)
    }
  },[page?.openCommunity?.id])
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
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
          <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <img src={"https://picsum.photos/seed/"+(active.seed||active.id)+"/40/40"} alt=""
                style={{width:36,height:36,borderRadius:2,objectFit:'cover',border:`1px solid ${BRD}`}}/>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:TEXT}}>{active.name}</div>
                <div style={{fontSize:11,color:MUTED}}>{(active.members_count||0).toLocaleString('pt-BR')} membros</div>
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
              ?<div style={{padding:'18px 0',color:MUTED,fontSize:13}}>{isJ?'Seja o primeiro a postar!':'Entre para ver e postar.'}</div>
              :posts.map(p=>(
                <div key={p.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BRD}`}}>
                  <Av src={p.author.avatar_url} size={32} name={p.author.name} radius="3px"/>
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
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
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
              <div key={c.id} style={{display:'flex',gap:10,padding:'10px',
                border:`1.5px solid ${isJ?BLUE:BRD}`,borderRadius:2,
                background:isJ?'#f0f4ff':'#f8f9fc',alignItems:'center',
                cursor:'pointer'}}
                onClick={()=>openCom(c)}>
                <img src={"https://picsum.photos/seed/"+(c.seed||c.id)+"/55/55"} alt=""
                  style={{width:52,height:52,borderRadius:2,objectFit:'cover',
                    border:`1px solid ${BRD}`,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:BLUE,marginBottom:2,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                  <div style={{fontSize:10,color:MUTED,marginBottom:5}}>{(c.members_count||0).toLocaleString('pt-BR')} membros</div>
                  <button style={{...(isJ?btnBl:btnGh),padding:'2px 10px',fontSize:11}}
                    onClick={e=>{e.stopPropagation();isJ?openCom(c):toggle(c)}}>
                    {isJ?'✓ entrar':'+ participar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── GALERIA — albums style matching image 1 ── */
function GaleriaPage({ myId, profile, isOwn }){
  const [albums,setAlbums]=useState([])
  const [activeAlbum,setActiveAlbum]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [newAlbumName,setNewAlbumName]=useState('')
  const [creating,setCreating]=useState(false)

  const storageKey='albums_'+myId
  useEffect(()=>{
    try{ setAlbums(JSON.parse(localStorage.getItem(storageKey)||'[]')) }catch(e){}
  },[myId])
  const saveAlbums=(a)=>{ setAlbums(a); localStorage.setItem(storageKey,JSON.stringify(a)) }

  const createAlbum=()=>{
    if(!newAlbumName.trim())return
    const a={id:Date.now(),name:newAlbumName.trim(),photos:[],created:new Date().toISOString()}
    saveAlbums([...albums,a]); setNewAlbumName(''); setCreating(false); setActiveAlbum(a)
  }

  const handleUpload=async(e)=>{
    const files=[...e.target.files]; if(!files.length||!activeAlbum)return
    setUploading(true)
    const uploaded=[]
    for(const file of files){
      const reader=new FileReader()
      const dataUrl=await new Promise(res=>{reader.onload=e=>res(e.target.result);reader.readAsDataURL(file)})
      uploaded.push({id:Date.now()+Math.random(),url:dataUrl,name:file.name})
    }
    const updated=albums.map(a=>a.id===activeAlbum.id?{...a,photos:[...a.photos,...uploaded]}:a)
    saveAlbums(updated); setActiveAlbum(updated.find(a=>a.id===activeAlbum.id)); setUploading(false)
  }

  if(activeAlbum) return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:12,color:BLUE,cursor:'pointer'}} onClick={()=>setActiveAlbum(null)}>← álbuns</span>
            <span style={{fontWeight:700,fontSize:14,color:TEXT}}>{activeAlbum.name}</span>
            <span style={{fontSize:11,color:MUTED}}>({activeAlbum.photos.length} fotos)</span>
          </div>
          {isOwn&&<label style={{...btnBl,padding:'3px 12px',fontSize:11,cursor:'pointer'}}>
            {uploading?'Enviando…':'+ adicionar fotos'}
            <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleUpload}/>
          </label>}
        </div>
        {activeAlbum.photos.length===0
          ?<div style={{padding:'40px',textAlign:'center',color:MUTED,fontSize:13}}>Nenhuma foto ainda. Clique em "+ adicionar fotos".</div>
          :<div style={{padding:10,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
            {activeAlbum.photos.map(p=>(
              <div key={p.id} style={{borderRadius:2,overflow:'hidden',border:`1px solid ${BRD}`,aspectRatio:'1'}}>
                <img src={p.url} alt={p.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
              </div>
            ))}
          </div>}
      </div>
    </div>
  )

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          fontWeight:700,fontSize:14,color:TEXT}}>
          álbuns de {profile?.name||'…'}
        </div>
        <div style={{padding:'12px 14px'}}>
          {isOwn&&<div style={{marginBottom:12}}>
            {creating
              ?<div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input autoFocus style={{...inp,width:200}} value={newAlbumName}
                  onChange={e=>setNewAlbumName(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&createAlbum()} placeholder="Nome do álbum"/>
                <button style={btnBl} onClick={createAlbum}>criar</button>
                <button style={btnGh} onClick={()=>setCreating(false)}>cancelar</button>
              </div>
              :<button style={btnBl} onClick={()=>setCreating(true)}>criar álbum</button>}
          </div>}
          {albums.length===0
            ?<div style={{fontSize:13,color:MUTED}}>Nenhum álbum.</div>
            :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
              {albums.map(a=>(
                <div key={a.id} style={{cursor:'pointer',border:`1px solid ${BRD}`,
                  borderRadius:3,overflow:'hidden',background:'#f8f9fc'}} onClick={()=>setActiveAlbum(a)}>
                  <div style={{aspectRatio:'1',background:'#e8edf8',display:'flex',
                    alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
                    {a.photos.length>0
                      ?<img src={a.photos[0].url} alt={a.name}
                          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      :<span style={{fontSize:32}}>🖼️</span>}
                  </div>
                  <div style={{padding:'6px 8px'}}>
                    <div style={{fontSize:12,fontWeight:600,color:TEXT,overflow:'hidden',
                      textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.name}</div>
                    <div style={{fontSize:10,color:MUTED}}>{a.photos.length} fotos</div>
                  </div>
                </div>
              ))}
            </div>}
        </div>
      </div>
    </div>
  )
}

/* ── DEPOIMENTOS ── */
function DepoimentosPage({ myId, setPage }){
  const [deps,setDeps]=useState([])
  useEffect(()=>{ getDepoimentos(myId).then(setDeps) },[myId])
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          fontWeight:700,fontSize:14,color:TEXT}}>
          depoimentos ({deps.length})
        </div>
        <div style={{padding:'10px 14px'}}>
          {deps.length===0
            ?<div style={{color:MUTED,fontSize:13,padding:'14px 0'}}>Nenhum depoimento ainda.</div>
            :deps.map(d=>(
              <div key={d.id} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:`1px solid ${BRD}`}}>
                <Av src={d.from.avatar_url} size={36} name={d.from.name} radius="3px"/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer',marginBottom:2}}
                    onClick={()=>setPage({name:'userprofile',userId:d.from.id})}>{d.from.name}:</div>
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.5}}>{d.text}</div>
                  <div style={{fontSize:10,color:MUTED,marginTop:3}}>{new Date(d.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

/* ── ADMIN CLEANUP (one-time use) ── */
function AdminCleanup({ setToast }){
  const [log,setLog]=useState([])
  const [busy,setBusy]=useState(false)

  const run=async()=>{
    setBusy(true); const out=[]
    try{
      // Fix bio
      const {data:profs}=await supabase.from('profiles')
        .select('id,bio').eq('bio','Olá! Estou de volta no Orkut :)')
      for(const p of profs||[])
        await supabase.from('profiles').update({bio:'Olá! Estou de volta :)'}).eq('id',p.id)
      out.push(`✅ Bios: ${(profs||[]).length}`); setLog([...out])

      const {count:before}=await supabase.from('communities').select('*',{count:'exact',head:true})
      out.push(`📦 Antes: ${before}`); setLog([...out])

      // Delete zero-member communities in batches, stop when count stops decreasing
      let totalDeleted=0, round=0, prevCount=before
      while(round<600){
        round++
        const {data:batch,error}=await supabase.from('communities')
          .select('id').eq('members_count',0).limit(500)
        if(error||!batch||batch.length===0){
          out.push(`✅ Nada mais com 0 membros`); setLog([...out]); break
        }
        const ids=batch.map(c=>c.id)
        await supabase.from('communities').delete().in('id',ids)
        totalDeleted+=batch.length
        if(round%10===0||batch.length<500){
          const {count:cur}=await supabase.from('communities').select('*',{count:'exact',head:true})
          out.push(`🗑 Round ${round}: total apagados ${totalDeleted}, restantes: ${cur}`)
          setLog([...out])
          if(cur===prevCount){ out.push('⛔ Sem progresso, parando'); break }
          prevCount=cur
          if(batch.length<500){ out.push('✅ Menos de 500 retornados, deve ter acabado'); break }
        }
      }
      out.push(`✅ Apagados total: ${totalDeleted}`)
      const {count:after}=await supabase.from('communities').select('*',{count:'exact',head:true})
      out.push(`🏁 Restantes final: ${after}`)
      setToast('Limpeza concluída!')
    }catch(e){ out.push(`❌ Erro: ${e.message}`) }
    setLog([...out]); setBusy(false)
  }

  return (
    <div style={{maxWidth:500,margin:'60px auto',padding:'0 16px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:24}}>
        <div style={{fontWeight:700,fontSize:15,color:TEXT,marginBottom:4}}>🛠 Admin · Limpeza</div>
        <div style={{fontSize:12,color:MUTED,marginBottom:16,lineHeight:1.6}}>
          Corrige bios e remove comunidades com códigos /cXXXX.
        </div>
        <button style={{...btnBl,padding:'8px 20px'}} onClick={run} disabled={busy}>
          {busy?'Executando…':'▶ Executar limpeza'}
        </button>
        {log.length>0&&<div style={{marginTop:16,background:'#f5f7fc',borderRadius:3,
          padding:12,fontFamily:'monospace',fontSize:12,lineHeight:2,border:`1px solid ${BRD}`}}>
          {log.map((l,i)=>(
            <div key={i} style={{color:l.startsWith('✅')||l.startsWith('🏁')?'#2e7d32':l.startsWith('❌')?'#c0392b':TEXT}}>
              {l}
            </div>
          ))}
        </div>}
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
    const onKey=(e)=>{ if(e.ctrlKey&&e.shiftKey&&e.key==='A') setPage('__admin') }
    window.addEventListener('keydown',onKey)
    return()=>{ subscription.unsubscribe(); window.removeEventListener('keydown',onKey) }
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

  const navTo=(pg)=>{
    if(pg?.name==='profile'&&pg?.userId&&pg.userId!==myId)
      setPage({name:'userprofile',userId:pg.userId})
    else setPage(pg)
  }

  const renderPage=()=>{
    switch(cur){
      case 'home':        return <HomePage profile={profile} myId={myId} setPage={navTo}/>
      case 'profile':     return <ProfilePage myId={myId} userId={null} setPage={navTo} toast={setToast}/>
      case 'userprofile': return <ProfilePage myId={myId} userId={page.userId} setPage={navTo} toast={setToast}/>
      case 'scrapbook':   return <ScrapbookPage myId={myId} targetUserId={page?.userId||null} setPage={navTo} toast={setToast}/>
      case 'friends':     return <FriendsPage myId={myId} setPage={navTo} toast={setToast}/>
      case 'communities': return <CommunitiesPage myId={myId} toast={setToast} page={page}/>
      case '__admin':     return <AdminCleanup setToast={setToast}/>
      case 'galeria':     return <GaleriaPage myId={myId} profile={profile} isOwn={true}/>
      case 'depoimentos': return <DepoimentosPage myId={myId} setPage={navTo}/>
      default:            return <HomePage profile={profile} myId={myId} setPage={navTo}/>
    }
  }

  return (
    <div style={{fontFamily:"'Trebuchet MS','Lucida Grande',sans-serif",
      background:BG,minHeight:'100vh',color:TEXT}}>
      <TopNav page={page} setPage={navTo} profile={profile} pendingReqs={pendingReqs}/>
      {renderPage()}
      <footer style={{textAlign:'center',padding:'14px 0 20px',fontSize:11,color:MUTED,
        borderTop:`1px solid ${BRD}`,marginTop:8}}>
        © Recriado com ❤️ · Zero Monetização
      </footer>
      <Toast msg={toast} onDone={()=>setToast('')}/>
    </div>
  )
}
