import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase, signUp, signIn, signOut, getProfile, updateProfile,
  getFriends, getFriendRequests, sendFriendRequest, respondFriendRequest,
  getFriendshipStatus, getRecados, sendRecado, deleteRecado,
  getDepoimentos, sendDepoimento, getCommunities, getMyCommunities,
  joinCommunity, leaveCommunity, getCommunityPosts, createCommunityPost,
  getMessages, sendMessage, recordVisit, getVisitors, uploadAvatar,
  searchUsers, validateInviteCode, useInviteCode, getMyInvites, getMemberNumber,
  getSignedUrl, uploadPhoto, getAlbums, createAlbum, deleteAlbum,
  getAlbumPhotos, addPhotoToAlbum, deletePhoto, getNovidades,
  getFotosFeed, getPhotoComments, addPhotoComment, deletePhotoComment,
  getSentRequests, getPendingDepoimentos, approveDepoimento, rejectDepoimento,
  getFanCount, getIsFan, addFan, removeFan, getMessageThreads, getFans,
} from './lib/supabase.js'

/* ── Design tokens matching screenshot exactly ── */
const NAV_BG  = '#2a3f6f'   // navy, one notch lighter
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

/* ── Responsive hook ── */
function useIsMobile(){ 
  const [mob,setMob]=useState(()=>typeof window!=='undefined'&&window.innerWidth<=600)
  useEffect(()=>{
    const h=()=>setMob(window.innerWidth<=600)
    window.addEventListener('resize',h)
    return()=>window.removeEventListener('resize',h)
  },[])
  return mob
}

/* ── Font schema (2000s era accuracy) ── */
const F_UI  = "Verdana,'DejaVu Sans',Geneva,sans-serif"   // menus, labels, fields
const F_BTN = "Tahoma,'DejaVu Sans Condensed',Arial,sans-serif"  // buttons
const F_NUM = "Arial,'Helvetica Neue',sans-serif"           // numbers, metadata

/* ── Shared styles ── */
const inp  = { width:'100%', border:`1px solid ${BRD}`, borderRadius:2, padding:'4px 7px',
               fontSize:12, fontFamily:F_UI, color:TEXT, background:WHITE,
               outline:'none', boxSizing:'border-box' }
const tarea= { ...inp, resize:'vertical', minHeight:70 }
const btnBl= { cursor:'pointer', border:'none', fontFamily:F_BTN, borderRadius:2,
               fontWeight:700, background:BLUE, color:WHITE, padding:'5px 14px', fontSize:12 }
const btnPk= { ...btnBl, fontFamily:F_BTN, background:PINK }
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

/* ── Avatar — resolves signed URLs for private storage ── */
function Av({ src, size, name, radius }){
  size=size||36; radius=radius!==undefined?radius:'50%'
  const fb="https://api.dicebear.com/9.x/personas/svg?seed="+encodeURIComponent(name||'u')
  const [url,setUrl]=useState(fb)

  useEffect(()=>{
    let cancelled=false
    if(!src){ setUrl(fb); return }
    if(src.startsWith('http')){ setUrl(src+'?t='+Date.now()); return }
    // Storage path — get fresh signed URL every time src changes
    getSignedUrl(src).then(u=>{ if(!cancelled) setUrl(u ? u+'?t='+Date.now() : fb) })
    return()=>{ cancelled=true }
  },[src])

  return <img src={url} alt={name||''} width={size} height={size}
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
const GRID_PHOTOS = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/men/75.jpg",
  "https://randomuser.me/api/portraits/women/26.jpg",
  "https://randomuser.me/api/portraits/men/85.jpg",
  "https://randomuser.me/api/portraits/women/91.jpg",
  "https://randomuser.me/api/portraits/men/15.jpg",
]

function WhoGrid(){
  const colors=['#f0a8c0','#dce3f0','#f0a8c0','#dce3f0','#dce3f0','#f0a8c0']
  return (
    <div style={{width:'100%',maxWidth:300,margin:'0 auto'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginBottom:12}}>
        {GRID_PHOTOS.slice(0,6).map((url,i)=>(
          <div key={i} style={{aspectRatio:'1',background:colors[i],overflow:'hidden',borderRadius:2}}>
            <img src={url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',
              filter:'grayscale(25%) contrast(1.05)',display:'block'}}
              onError={e=>{e.target.style.display='none'}}/>
          </div>
        ))}
      </div>
      <div style={{textAlign:'center',fontSize:20,fontWeight:700,fontFamily:F_UI,color:'#2a3f6f',letterSpacing:1}}>
        quem você <span style={{color:PINK,fontSize:24}}>c</span>onhece<span style={{color:PINK}}>?</span>
      </div>
    </div>
  )
}

async function moderateText(text){
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:10,
        messages:[{role:'user',content:'Is this text offensive, obscene, or abusive? Reply only YES or NO: '+text}]})
    })
    const data=await res.json()
    return (data?.content?.[0]?.text?.trim().toUpperCase()!=='YES')
  }catch{return true}
}

function GuestbookTab(){
  const [comments,setComments]=useState([])
  const [name,setName]=useState('')
  const [text,setText]=useState('')
  const [submitting,setSubmitting]=useState(false)
  const [error,setError]=useState('')
  const [done,setDone]=useState(false)
  const MAX=280
  useEffect(()=>{getFeedback().then(setComments)},[])
  const submit=async()=>{
    setError('')
    if(!name.trim()||name.trim().length<2){setError('Por favor informe seu nome.');return}
    if(!text.trim()||text.trim().length<3){setError('Escreva um comentário.');return}
    setSubmitting(true)
    const safe=await moderateText(name+' '+text)
    if(!safe){setError('Seu comentário não pôde ser publicado. Por favor revise o texto.');setSubmitting(false);return}
    try{
      const c=await addFeedback(name.trim(),text.trim())
      setComments(prev=>[c,...prev])
      setName('');setText('');setDone(true)
      setTimeout(()=>setDone(false),4000)
    }catch{setError('Erro ao enviar. Tente novamente.')}
    setSubmitting(false)
  }
  return (
    <div style={{maxWidth:600,margin:'0 auto',padding:'0 16px 32px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
        padding:'20px 24px',marginBottom:20,textAlign:'center'}}>
        <img src="https://uakmvwwgtjrwdymfwtrf.supabase.co/storage/v1/object/public/avatars/7a55048c-70bb-44a1-9195-818c9b865689/avatar.jpeg"
          alt="Elton" onError={e=>{e.target.style.display='none'}}
          style={{width:72,height:72,borderRadius:'50%',objectFit:'cover',
            border:'3px solid white',boxShadow:'0 0 0 2px #c8d0e0',
            display:'block',margin:'0 auto 10px'}}/>
        <div style={{fontWeight:700,fontSize:14,color:BLUE,fontFamily:F_UI,marginBottom:8}}>Elton</div>
        <div style={{fontSize:13,color:TEXT,fontFamily:F_UI,lineHeight:1.8,maxWidth:440,margin:'0 auto'}}>
          Oi! Recriei o Orkut por diversão e nostalgia. O que você achou da recriação?
          O que adicionaria? Deixe uma nota aqui. 😊
        </div>
        <div style={{fontSize:11,color:MUTED,fontFamily:F_UI,marginTop:10,fontStyle:'italic'}}>
          Projeto pessoal sem compromisso de manutenção ou continuidade.
        </div>
      </div>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:'16px 20px',marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI,marginBottom:12}}>deixe sua nota</div>
        <input style={{...inp,marginBottom:8}} placeholder="Nome *" value={name}
          onChange={e=>setName(e.target.value)} maxLength={60}/>
        <div style={{position:'relative',marginBottom:8}}>
          <textarea style={{...inp,resize:'none',height:72,fontFamily:F_UI,fontSize:13,paddingBottom:20}}
            placeholder="O que você achou? (máx. 280 caracteres) *"
            value={text} onChange={e=>setText(e.target.value.slice(0,MAX))}/>
          <span style={{position:'absolute',bottom:6,right:8,fontSize:10,color:MUTED,fontFamily:F_UI}}>
            {text.length}/{MAX}
          </span>
        </div>
        {error&&<div style={{fontSize:12,color:'#c0392b',fontFamily:F_UI,marginBottom:8}}>{error}</div>}
        {done&&<div style={{fontSize:12,color:'#2e7d32',fontFamily:F_UI,marginBottom:8}}>✓ Publicado!</div>}
        <button style={{...btnBl,padding:'6px 18px'}} onClick={submit} disabled={submitting}>
          {submitting?'Enviando…':'publicar'}
        </button>
      </div>
      {comments.length===0
        ?<div style={{textAlign:'center',color:MUTED,fontSize:12,fontFamily:F_UI,padding:'20px 0'}}>
          Seja o primeiro a deixar uma nota!
        </div>
        :comments.map((c,i)=>(
          <div key={c.id} style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
            padding:'12px 16px',marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontWeight:700,fontSize:13,fontFamily:F_UI,color:BLUE}}>{c.name}</span>
              <span style={{fontSize:10,color:MUTED,fontFamily:F_UI}}>
                {new Date(c.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'})}
              </span>
            </div>
            <div style={{fontSize:13,fontFamily:F_UI,color:TEXT,lineHeight:1.6}}>{c.text}</div>
          </div>
        ))
      }
    </div>
  )
}

function AuthScreen(){
  const [authTab,setAuthTab]=useState('login')
  const [mode,setMode]=useState('login')
  const [form,setForm]=useState({email:'',password:'',name:'',invite:''})
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const [signupDone,setSignupDone]=useState(false)
  const [remember,setRemember]=useState(false)
  const f=(k,v)=>setForm(p=>({...p,[k]:v}))

  const doLogin=async()=>{
    setErr('');setLoading(true)
    const {error}=await supabase.auth.signInWithPassword({email:form.email,password:form.password})
    if(error) setErr('E-mail ou senha incorretos.')
    setLoading(false)
  }

  const doSignup=async()=>{
    setErr('');setLoading(true)
    try{
      if(!form.name.trim()) throw new Error('Digite seu nome')
      const invite=await validateInviteCode(form.invite)
      if(!invite) throw new Error('Código de convite inválido ou já utilizado')
      const {data,error}=await supabase.auth.signUp({
        email:form.email,password:form.password,options:{data:{name:form.name.trim()}}
      })
      if(error) throw new Error(error.message)
      if(data?.user) await useInviteCode(form.invite,data.user.id)
      setSignupDone(true)
    }catch(e){setErr(e.message)}
    setLoading(false)
  }

  const ri={...inp,border:'1px solid #a0a8c0',borderRadius:1,padding:'3px 5px',width:200}

  const LoginForm=(
    <div>
      {[['e-mail:','email','email'],['senha:','password','password']].map(([l,k,t])=>(
        <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <label style={{fontSize:12,fontFamily:F_UI,color:TEXT,width:68,textAlign:'right'}}>{l}</label>
          <input style={ri} type={t} value={form[k]} onChange={e=>f(k,e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
      ))}
      <div style={{paddingLeft:76,marginBottom:10}}>
        <button style={{...btnBl,padding:'3px 16px',fontSize:12}} onClick={doLogin} disabled={loading}>
          {loading?'…':'entrar »'}
        </button>
      </div>
      <div style={{paddingLeft:76,display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
        <input type="checkbox" id="rem" checked={remember} onChange={e=>setRemember(e.target.checked)}/>
        <label htmlFor="rem" style={{fontSize:11,fontFamily:F_UI,color:MUTED,cursor:'pointer'}}>lembrar senha</label>
      </div>
      {err&&<div style={{paddingLeft:76,fontSize:11,color:'#c0392b',fontFamily:F_UI,marginBottom:6}}>{err}</div>}
      <div style={{paddingLeft:76,fontSize:11,fontFamily:F_UI,marginBottom:16}}>
        <span style={{color:PINK,cursor:'pointer'}} onClick={()=>supabase.auth.resetPasswordForEmail(form.email)}>
          Esqueceu sua senha?
        </span>
      </div>
      <div style={{borderTop:`1px solid ${BRD}`,paddingTop:12}}>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
          <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
            <rect x="1" y="6" width="9" height="7" rx="1.5" fill="#9aa0b0"/>
            <path d="M2.5 6V4.5a3 3 0 0 1 6 0V6" stroke="#9aa0b0" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <circle cx="5.5" cy="9.5" r="1" fill="white"/>
          </svg>
          <span style={{fontSize:11,fontFamily:F_UI,color:MUTED}}>Comunidade por convite.</span>
        </div>
        <div style={{fontSize:11,fontFamily:F_UI,color:MUTED,marginBottom:10,lineHeight:1.6}}>
          Cada membro pode convidar até 10 pessoas de confiança.
        </div>
        <span style={{fontSize:12,fontFamily:F_BTN,fontWeight:700,color:PINK,cursor:'pointer'}}
          onClick={()=>setMode('signup')}>ENTRAR JÁ →</span>
      </div>
    </div>
  )

  const SignupForm=signupDone
    ?<div style={{textAlign:'center',padding:'16px 0'}}>
      <div style={{fontSize:16,color:BLUE,fontFamily:F_UI,fontWeight:700,marginBottom:8}}>✓ Quase lá!</div>
      <div style={{fontSize:13,fontFamily:F_UI,color:TEXT,lineHeight:1.7}}>
        Verifique seu e-mail para confirmar o cadastro.
      </div>
      <button style={{...btnGh,marginTop:14}} onClick={()=>{setMode('login');setSignupDone(false)}}>
        voltar ao login
      </button>
    </div>
    :<div>
      {[['nome:','name','text'],['e-mail:','email','email'],
        ['senha:','password','password'],['convite:','invite','text']].map(([l,k,t])=>(
        <div key={k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <label style={{fontSize:12,fontFamily:F_UI,color:TEXT,width:68,textAlign:'right'}}>{l}</label>
          <input style={ri} type={t} value={form[k]} onChange={e=>f(k,e.target.value)}/>
        </div>
      ))}
      {err&&<div style={{paddingLeft:76,fontSize:11,color:'#c0392b',fontFamily:F_UI,marginBottom:6}}>{err}</div>}
      <div style={{paddingLeft:76,display:'flex',gap:8}}>
        <button style={{...btnBl,padding:'3px 14px',fontSize:12}} onClick={doSignup} disabled={loading}>
          {loading?'…':'cadastrar'}
        </button>
        <button style={{...btnGh,padding:'3px 10px',fontSize:12}} onClick={()=>{setMode('login');setErr('')}}>
          cancelar
        </button>
      </div>
    </div>

  return (
    <div style={{minHeight:'100vh',background:BG,fontFamily:F_UI}}>
      {/* Top tab bar */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BRD}`}}>
        <div style={{maxWidth:880,margin:'0 auto',padding:'0 24px',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex'}}>
            {[['Entrar','login'],['O que você achou?','guestbook']].map(([label,tab])=>(
              <div key={tab} onClick={()=>setAuthTab(tab)} style={{
                padding:'10px 18px',cursor:'pointer',fontSize:13,fontFamily:F_UI,fontWeight:700,
                color:authTab===tab?BLUE:MUTED,
                borderBottom:authTab===tab?`2px solid ${BLUE}`:'2px solid transparent',
                boxSizing:'border-box'}}>
                {label}
              </div>
            ))}
          </div>
          <OFadeLogo size={26} id="tl2"/>
        </div>
      </div>

      {/* Banner */}
      <div style={{background:NAV_BG,padding:'6px 0',textAlign:'center'}}>
        <span style={{color:'rgba(255,255,255,.85)',fontSize:12,fontFamily:F_UI}}>
          ⚠️ Aviso: Reviva a nostalgia com conexões verdadeiras.
        </span>
      </div>

      {authTab==='guestbook'
        ?<div style={{paddingTop:28}}><GuestbookTab/></div>
        :<div style={{maxWidth:880,margin:'0 auto',padding:'32px 24px',
          display:'flex',gap:48,alignItems:'flex-start',flexWrap:'wrap'}}>

          {/* LEFT col */}
          <div style={{flex:'1 1 300px',minWidth:260}}>
            <div style={{textAlign:'center',marginBottom:28}}>
              <OFadeLogo size={60} id="lg2"/>
              <p style={{fontSize:13,fontFamily:F_UI,color:TEXT,lineHeight:1.8,
                maxWidth:320,margin:'16px auto 0',textAlign:'center'}}>
                <strong style={{color:PINK}}>Uma comunidade de conexões reais</strong>{' '}
                para socializar, reencontrar amigos e criar memórias com quem realmente importa.<br/>
                <span style={{color:MUTED,fontSize:12}}>
                  Sem anúncios. Sem rastreamento. Sem influencers. Sem monetização.
                </span>
              </p>
            </div>
            <WhoGrid/>
          </div>

          {/* RIGHT col — form */}
          <div style={{flex:'0 0 310px',minWidth:260}}>
            <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
              padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.08)'}}>
              {mode==='login'?LoginForm:SignupForm}
            </div>
          </div>
        </div>
      }
    </div>
  )
}

/* ── ROOT ── */
export default function App(){
  const [session,setSession]=useState(undefined)
  const [profile,setProfile]=useState(null)
  const [page,setPage]=useState('home')
  const [pendingReqs,setPendingReqs]=useState(0)
  const [newRecados,setNewRecados]=useState(0)
  const [toast,setToast]=useState('')

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setSession(session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,s)=>setSession(s))
    const onKey=(e)=>{ if(e.ctrlKey&&e.shiftKey&&e.key==='A') setPage('__admin') }
    window.addEventListener('keydown',onKey)
    return()=>{ subscription.unsubscribe(); window.removeEventListener('keydown',onKey) }
  },[])

  // Global chat listener — pops up incoming messages
  const [incomingChat,setIncomingChat]=useState(null)
  useEffect(()=>{
    if(!session?.user) return
    const uid=session.user.id
    const ch=supabase.channel('global-msgs-'+uid)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',
        filter:`to_id=eq.${uid}`},
        async(payload)=>{
          const msg=payload.new
          // Get sender profile
          const {data:sender}=await supabase.from('profiles')
            .select('id,name,avatar_url').eq('id',msg.from_id).single()
          const ts=new Date().toISOString()
          setIncomingChat({sender, text:msg.text, id:msg.id, ts})
          setNewRecados(n=>n+1)
        })
      .subscribe()
    return()=>supabase.removeChannel(ch)
  },[session?.user?.id])
  useEffect(()=>{
    if(!session?.user)return
    const uid=session.user.id
    getProfile(uid).then(setProfile)
    getFriendRequests(uid).then(r=>setPendingReqs(r.length))
    supabase.from('recados').select('id',{count:'exact',head:true})
      .eq('to_id',uid)
      .gte('created_at',new Date(Date.now()-48*3600*1000).toISOString())
      .then(({count})=>setNewRecados(count||0))
    // Show popup for unread messages — only ones newer than last dismissed
    const lastSeen = sessionStorage.getItem('lastSeenMsg_'+uid) || '1970-01-01'
    supabase.from('messages')
      .select('id,text,from_id,created_at')
      .eq('to_id',uid)
      .gt('created_at',lastSeen)
      .order('created_at',{ascending:false})
      .limit(1)
      .then(async({data})=>{
        if(data&&data[0]){
          const {data:sender}=await supabase.from('profiles')
            .select('id,name,avatar_url').eq('id',data[0].from_id).single()
          setIncomingChat({sender,text:data[0].text,id:data[0].id,ts:data[0].created_at})
        }
      })
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
      case 'fotosfeed':   return <FotosFeed myId={myId} setPage={navTo}/>
      case 'inbox':       return <InboxPage myId={myId} setPage={navTo}/>
      case 'fans':        return <FansPage userId={page?.userId||myId} myId={myId} setPage={navTo}/>
      case 'galeria':     return <GaleriaPage myId={myId} userId={page?.userId||null} setPage={navTo} openAlbumId={page?.albumId||null}/>
      case 'depoimentos': return <DepoimentosPage myId={myId} setPage={navTo}/>
      default:            return <HomePage profile={profile} myId={myId} setPage={navTo}/>
    }
  }

  return (
    <div style={{fontFamily:F_UI,
      background:BG,minHeight:'100vh',color:TEXT}}>
      <TopNav page={page} setPage={navTo} profile={profile} pendingReqs={pendingReqs} newRecados={newRecados}/>
      {renderPage()}
      <footer style={{textAlign:'center',padding:'14px 0 20px',fontSize:11,color:MUTED,
        borderTop:`1px solid ${BRD}`,marginTop:8}}>
        © Recriado com ❤️ · Zero Monetização
      </footer>
      <Toast msg={toast} onDone={()=>setToast('')}/>
      {incomingChat&&<IncomingChatPopup
        chat={incomingChat}
        onOpen={()=>{
          if(incomingChat.ts) sessionStorage.setItem('lastSeenMsg_'+myId,incomingChat.ts)
          setNewRecados(0); setIncomingChat(null); setPage('friends')
        }}
        onClose={()=>{
          if(incomingChat.ts) sessionStorage.setItem('lastSeenMsg_'+myId,incomingChat.ts)
          setNewRecados(0); setIncomingChat(null)
        }}/>}
    </div>
  )
}
