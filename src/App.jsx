import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase, signUp, signIn, signOut, getProfile, updateProfile,
  getFriends, getFriendRequests, sendFriendRequest, respondFriendRequest,
  getFriendshipStatus, getRecados, sendRecado, deleteRecado,
  getDepoimentos, sendDepoimento, getCommunities, getMyCommunities,
  joinCommunity, leaveCommunity, getCommunityPosts, createCommunityPost, createCommunity,
  getPhotoTags, tagFriendInPhoto, removePhotoTag, getTaggedPhotos, getTaggedPhotoCount,
  uploadCarousel, getOrCreatePostsAlbum, getFotosFeedWithCarousels, getMyFeed, deleteCarousel,
  getMessages, sendMessage, recordVisit, getVisitors, uploadAvatar,
  searchUsers, validateInviteCode, useInviteCode, getMyInvites, getMemberNumber,
  getSignedUrl, uploadPhoto, getAlbums, createAlbum, deleteAlbum,
  getAlbumPhotos, addPhotoToAlbum, deletePhoto, getNovidades,
  getFotosFeed, getPhotoComments, addPhotoComment, deletePhotoComment,
  getSentRequests, getPendingDepoimentos, approveDepoimento, rejectDepoimento,
  getFanCount, getIsFan, addFan, removeFan, getMessageThreads, getFans,
  getWaitlist, markInvited, updateWaitlistNotes, deleteWaitlistEntry,
  CROPS, ANIMALS, xpForLevel, getOrCreateFarm, getFarm, getPlots, getAnimals,
  checkReadyPlots, plantCrop, harvestOwnPlot, stealCrop, giftHarvest,
  collectAnimal, buyAnimal, getFarmActions, getGenerosityPoints, getFarmLeaderboard,
  getFeedback, addFeedback,
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
    fontWeight:600,zIndex:9999,boxShadow:'0 3px 12px rgba(0,0,0,.2)',fontFamily:F_UI}}>
      {msg}
    </div>
}

/* ── AUTH SCREEN ── */
const GRID_PHOTOS = [
  "https://randomuser.me/api/portraits/women/44.jpg",   // woman
  "https://randomuser.me/api/portraits/men/32.jpg",    // man
  "https://randomuser.me/api/portraits/women/63.jpg",  // black woman
  "https://randomuser.me/api/portraits/women/26.jpg",  // woman
  "https://randomuser.me/api/portraits/men/75.jpg",    // elder man
  "https://randomuser.me/api/portraits/men/15.jpg",    // man
]

function WhoGrid(){
  // OG style: rotated/offset squares, alternating pink empty + photo
  // Layout: 2 rows top photos, text center, 2 rows bottom photos
  const photos = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/22.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
    "https://randomuser.me/api/portraits/women/26.jpg",
    "https://randomuser.me/api/portraits/women/41.jpg",
    "https://randomuser.me/api/portraits/men/75.jpg",
    "https://randomuser.me/api/portraits/women/85.jpg",
  ]
  const PINK='#f0a8c0'; const LIGHT='#dce8f0'
  // Each cell: [type, photo_index_or_null, bg, rotation_deg, scale]
  const topCells = [
    {type:'p',bg:PINK,rot:-2,sc:1.02},
    {type:'f',idx:0,rot:1.5,sc:1},
    {type:'p',bg:LIGHT,rot:-1,sc:0.98},
    {type:'f',idx:1,rot:-2,sc:1},
    {type:'f',idx:2,rot:2,sc:1},
    {type:'p',bg:PINK,rot:-1.5,sc:1.01},
    {type:'f',idx:3,rot:1,sc:1},
    {type:'p',bg:LIGHT,rot:2.5,sc:0.99},
  ]
  const botCells = [
    {type:'f',idx:4,rot:-1.5,sc:1},
    {type:'p',bg:LIGHT,rot:2,sc:1.01},
    {type:'f',idx:5,rot:1,sc:1},
    {type:'p',bg:PINK,rot:-2,sc:0.98},
    {type:'p',bg:PINK,rot:1.5,sc:1.02},
    {type:'f',idx:6,rot:-1,sc:1},
    {type:'p',bg:LIGHT,rot:2,sc:0.99},
    {type:'f',idx:7,rot:-2.5,sc:1},
  ]
  const Cell=({c})=>(
    c.type==='p'
      ?<div style={{width:64,height:64,background:c.bg,borderRadius:2,flexShrink:0,
          transform:`rotate(${c.rot}deg) scale(${c.sc})`}}/>
      :<div style={{width:64,height:64,overflow:'hidden',borderRadius:2,flexShrink:0,
          transform:`rotate(${c.rot}deg) scale(${c.sc})`,background:PINK}}>
        <img src={photos[c.idx]} alt="" style={{width:'100%',height:'100%',
          objectFit:'cover',objectPosition:'center top',display:'block',
          filter:'grayscale(15%) contrast(1.05)'}}
          onError={e=>{e.target.parentElement.style.background=PINK;e.target.style.display='none'}}/>
      </div>
  )
  const Row=({cells})=>(
    <div style={{display:'flex',gap:6,justifyContent:'center',alignItems:'center',padding:'4px 0'}}>
      {cells.map((c,i)=><Cell key={i} c={c}/>)}
    </div>
  )
  return (
    <div style={{width:'100%',maxWidth:320,margin:'0 auto',position:'relative'}}>
      <Row cells={topCells.slice(0,4)}/>
      <Row cells={topCells.slice(4,8)}/>
      {/* Text overlaid on grid — absolute center */}
      <div style={{position:'relative',height:0,overflow:'visible',zIndex:10,
        display:'flex',justifyContent:'center',alignItems:'center'}}>
        <div style={{
          position:'absolute',top:'50%',left:'50%',
          transform:'translate(-50%,-50%)',
          background:'rgba(220,227,240,0.82)',
          borderRadius:4,padding:'4px 14px',
          whiteSpace:'nowrap',
        }}>
          <span style={{
            fontSize:26,fontWeight:700,
            fontFamily:"'EB Garamond','Garamond','Georgia','Times New Roman',serif",
            color:'#111',letterSpacing:'0.02em',
          }}>
            quem v<span style={{fontSize:29}}>O</span>cê conhece?
          </span>
        </div>
      </div>
      <Row cells={botCells.slice(0,4)}/>
      <Row cells={botCells.slice(4,8)}/>
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
    return data?.content?.[0]?.text?.trim().toUpperCase()!=='YES'
  }catch{return true}
}

function GuestbookTab(){
  const [comments,setComments]=useState([])
  const [name,setName]=useState('')
  const [text,setText]=useState('')
  const [submitting,setSubmitting]=useState(false)
  const [error,setError]=useState('')
  const [done,setDone]=useState(false)
  const MAX=140
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
    <div style={{maxWidth:600,margin:'0 auto',padding:'0 16px 16px'}}>
      <div style={{background:'#e8edf7',border:'1px solid #c8d0e0',borderRadius:3,
        padding:'24px 28px',marginBottom:20}}>
        <div style={{fontSize:13,color:TEXT,fontFamily:F_UI,lineHeight:1.9,marginBottom:12}}>
          Olá! Esta página foi criada com IA por diversão e nostalgia. O que você achou?
          O que adicionaria? Na versão para celular tem uma novidade, já encontrou?
          Deixe sua sugestão aqui. 😊
        </div>
        <div style={{fontSize:11,color:MUTED,fontFamily:F_UI,marginBottom:6,fontStyle:'italic'}}>
          Projeto pessoal sem compromisso de manutenção ou continuidade.
        </div>
        <div style={{textAlign:'right',fontSize:13,color:PINK,fontFamily:F_UI,fontWeight:700}}>
          — Elton Vilela
        </div>
      </div>
      <div style={{background:'#e8edf7',border:'1px solid #c8d0e0',borderRadius:3,padding:'16px 20px',marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI,marginBottom:12}}>deixe seu recado</div>
        <input style={{...inp,marginBottom:8}} placeholder="Nome *" value={name}
          onChange={e=>setName(e.target.value)} maxLength={60}/>
        <div style={{position:'relative',marginBottom:8}}>
          <textarea style={{...inp,resize:'none',height:72,fontFamily:F_UI,fontSize:13,paddingBottom:20}}
            placeholder="O que você achou? (máx. 140 caracteres) *"
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
          <div key={c.id||i} style={{background:'#e8edf7',border:'1px solid #c8d0e0',borderRadius:3,
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

function AuthScreen({ onAuth }){
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
    // If "lembrar senha" unchecked, session expires when browser closes
    const {error}=await supabase.auth.signInWithPassword({
      email:form.email,
      password:form.password,
      options:{ persistSession: remember }
    })
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
        <span style={{color:PINK,cursor:'pointer'}} onClick={async()=>{
          if(!form.email){alert('Digite seu e-mail primeiro.');return}
          const {error}=await supabase.auth.resetPasswordForEmail(form.email,{
            redirectTo:'https://orkut-revival-app.vercel.app'
          })
          if(error) alert('Erro: '+error.message)
          else alert('E-mail de redefinição enviado! Verifique sua caixa de entrada.')
        }}>
          Esqueceu sua senha?
        </span>
      </div>
      <div style={{borderTop:`1px solid ${BRD}`,paddingTop:12,textAlign:'center'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginBottom:4}}>
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
    <div style={{minHeight:'100vh',background:BG,fontFamily:F_UI,display:'flex',flexDirection:'column'}}>
      {/* Top tab bar */}
      <div style={{background:WHITE,borderBottom:`1px solid ${BRD}`}}>
        <div style={{maxWidth:880,margin:'0 auto',padding:'0 24px',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex'}}>
            {[['Entrar','login'],['O que você achou?','guestbook']].map(([label,tab])=>(
              <div key={tab} onClick={()=>setAuthTab(tab)} style={{
                padding:'10px 18px',cursor:'pointer',fontSize:13,fontFamily:F_UI,fontWeight:700,
                color:authTab===tab?BLUE:MUTED,
                background:authTab===tab?'#fce8f3':'transparent',
                boxShadow:authTab===tab?'inset 0 2px 4px rgba(0,0,0,.06)':'none',
                boxSizing:'border-box'}}>
                {label}
              </div>
            ))}
          </div>

        </div>
      </div>

      {authTab==='guestbook'
        ?<div style={{paddingTop:28,flex:1}}><GuestbookTab/></div>
        :<div style={{maxWidth:880,margin:'0 auto',padding:'16px 24px',
          display:'flex',gap:32,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div style={{flex:'1 1 300px',minWidth:260}}>
            <div style={{textAlign:'center',marginBottom:12}}>
              <OFadeLogo size={44} id="lg2"/>
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
          <div style={{flex:'0 0 310px',minWidth:260}}>
            <div style={{background:'#e8edf7',border:`1px solid #c8d0e0`,borderRadius:3,
              padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,.06)'}}>
              {mode==='login'?LoginForm:SignupForm}
            </div>
          </div>
        </div>
      }

      {/* Footer */}
      <footer style={{textAlign:'center',padding:'12px 0 16px',fontSize:11,color:MUTED,
        borderTop:`1px solid ${BRD}`,marginTop:'auto',fontFamily:F_UI}}>
        ⚠️ Aviso: Reviva a nostalgia com conexões verdadeiras. &nbsp;·&nbsp;
        © Recriado com ❤️ por IA
      </footer>
    </div>
  )
}

/* ── TOP NAV — desktop unchanged, mobile hamburger ── */
function TopNav({ page, setPage, profile, pendingReqs, newRecados, onBellClick }){
  const [menuOpen,setMenuOpen]=useState(false)
  const cur=typeof page==='string'?page:page?.name
  const links=[['Início','home'],['Perfil','profile'],['Recados','scrapbook'],
               ['Amigos','friends'],['Comunidades','communities'],['Fazendinha','fazendinha']]
  const mobileLinks=[...links,['Fotos Feed','fotosfeed']]
  const go=(pg)=>{ setPage(pg); setMenuOpen(false) }

  return (
    <>
      <header style={{background:NAV_BG,position:'sticky',top:0,zIndex:200,height:40,
        display:'flex',alignItems:'center',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>
        <div style={{maxWidth:980,margin:'0 auto',width:'100%',height:'100%',
          display:'flex',alignItems:'center',padding:'0 10px',gap:0}}>
          <div onClick={()=>go('home')} style={{marginRight:14,flexShrink:0,cursor:'pointer'}}>
            <NavLogo/>
          </div>

          {/* Desktop nav */}
          <nav className="desk-only" style={{display:'flex',alignItems:'center',height:'100%',
}}>
            {links.map(([label,pg])=>(
              <div key={pg} onClick={()=>go(pg)} style={{
                display:'inline-flex',alignItems:'center',height:'100%',
                padding:'0 13px',cursor:'pointer',
                fontFamily:F_UI,fontWeight:700,fontSize:12,
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

          {/* Right side */}
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10,fontSize:11,color:WHITE}}>
            <span style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#4caf50',display:'inline-block'}}/>
              <span style={{cursor:'pointer'}} onClick={()=>go('profile')}>{profile?.name?.split(' ')[0]||'…'}</span>
            </span>
            {/* Notification bell */}
            <span style={{position:'relative',cursor:'pointer'}} onClick={()=>{if(onBellClick)onBellClick();go('scrapbook')}} title="Recados">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1a5 5 0 0 1 5 5v3l1.5 2H1.5L3 9V6a5 5 0 0 1 5-5z" stroke="white" strokeWidth="1.4" fill="none"/>
                <path d="M6 13a2 2 0 0 0 4 0" stroke="white" strokeWidth="1.4" fill="none"/>
              </svg>
              {(newRecados>0||pendingReqs>0)&&<span style={{
                position:'absolute',top:-4,right:-5,
                background:PINK,color:WHITE,borderRadius:10,
                padding:'0 4px',fontSize:9,fontWeight:700,lineHeight:'14px',
                minWidth:14,textAlign:'center',
              }}>{newRecados+pendingReqs}</span>}
            </span>
            {/* Sair — desktop only */}
            <span className="desk-only" style={{cursor:'pointer',opacity:.85,
              fontFamily:F_UI,fontSize:11,color:WHITE}}
              onClick={()=>signOut()}>Sair</span>
            {/* Hamburger — mobile only, hidden on desktop via minWidth */}
            <button className="mob-only" onClick={()=>setMenuOpen(o=>!o)} style={{
              background:'transparent',border:'none',color:WHITE,cursor:'pointer',
              padding:'4px',display:'flex',flexDirection:'column',gap:4,
            }} aria-label="menu">
              <span style={{width:20,height:2,background:WHITE,borderRadius:1,display:'block',
                transform:menuOpen?'rotate(45deg) translate(4px,4px)':'none',transition:'all .2s'}}/>
              <span style={{width:20,height:2,background:WHITE,borderRadius:1,display:'block',
                opacity:menuOpen?0:1,transition:'all .2s'}}/>
              <span style={{width:20,height:2,background:WHITE,borderRadius:1,display:'block',
                transform:menuOpen?'rotate(-45deg) translate(4px,-4px)':'none',transition:'all .2s'}}/>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen&&<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:300,
        background:'rgba(0,0,0,.3)'}} onClick={()=>setMenuOpen(false)}>
        {/* Slide-in panel from right — image 3 style */}
        <div style={{position:'absolute',top:0,right:0,bottom:0,width:'75%',maxWidth:320,
          background:WHITE,boxShadow:'-4px 0 20px rgba(0,0,0,.2)',
          display:'flex',flexDirection:'column'}}
          onClick={e=>e.stopPropagation()}>
          {/* Header: user + close */}
          <div style={{padding:'18px 20px',borderBottom:`1px solid ${BRD}`,
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:10,height:10,borderRadius:'50%',background:'#4caf50',display:'inline-block'}}/>
              <span style={{fontWeight:700,fontSize:15,color:TEXT}}>{profile?.name?.split(' ')[0]||'…'}</span>
            </div>
            <span style={{fontSize:20,cursor:'pointer',color:MUTED,lineHeight:1}}
              onClick={()=>setMenuOpen(false)}>✕</span>
          </div>
          {/* Nav links */}
          {mobileLinks.map(([label,pg])=>(
            <div key={pg} onClick={()=>go(pg)} style={{
              padding:'16px 20px',fontSize:14,fontFamily:F_UI,cursor:'pointer',
              color:cur===pg?BLUE:BLUE,
              fontWeight:cur===pg?700:400,
              borderBottom:`1px solid ${BRD}`,
              background:cur===pg?'#f0f4ff':'transparent',
              display:'flex',justifyContent:'space-between',alignItems:'center',
            }}>
              {label}
              {pg==='friends'&&pendingReqs>0&&<span style={{background:PINK,color:WHITE,
                borderRadius:10,padding:'1px 8px',fontSize:11,fontWeight:700}}>{pendingReqs}</span>}
            </div>
          ))}
          {/* Logout at bottom */}
          <div style={{marginTop:'auto',padding:'16px 20px',borderTop:`1px solid ${BRD}`,
            fontSize:14,color:MUTED,cursor:'pointer'}} onClick={()=>signOut()}>
            Sair
          </div>
        </div>
      </div>}
    </>
  )
}

/* ── RIGHT PANEL — matches screenshot style exactly ── */
function RightPanel({ title, children, onTitleClick }){
  return (
    <div style={{background:WHITE,border:`1px solid ${RH_BRD}`,borderRadius:3,
      marginBottom:10,overflow:'hidden'}}>
      <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
        padding:'5px 10px',fontWeight:700,fontSize:13,color:TEXT,
        cursor:onTitleClick?'pointer':'default'}}
        onClick={onTitleClick}>
        {title}
      </div>
      <div style={{padding:'8px 10px'}}>{children}</div>
    </div>
  )
}

/* ── FARM SIDEBAR WIDGET ── */
function FarmSidebarWidget({ myId, navId, setPage }){
  const [farm,setFarm]=useState(null)
  const [plots,setPlots]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    getFarm(myId).then(async f=>{
      if(!f){ setLoading(false); return }
      setFarm(f)
      await checkReadyPlots(f.id)
      getPlots(f.id).then(p=>{ setPlots(p); setLoading(false) })
    })
  },[myId])

  const ready=plots.filter(p=>p.state==='ready').length
  const withered=plots.filter(p=>p.state==='withered').length
  const planted=plots.filter(p=>p.state==='planted').length

  const plotColor=(p)=>{
    if(p.state==='empty') return '#7a4f28'
    if(p.state==='planted') return '#8ba865'
    if(p.state==='ready') return '#f5d060'
    if(p.state==='weed') return '#5a7a2a'
    if(p.state==='withered') return '#6b4a2a'
    return '#c8b89a'
  }

  if(loading||!farm) return null

  return (
    <RightPanel title={
      <span onClick={()=>setPage(navId?{name:'fazendinha',userId:navId}:'fazendinha')} style={{cursor:'pointer'}}>
        🌾 fazendinha
        {ready>0&&<span style={{marginLeft:6,background:PINK,color:WHITE,
          fontSize:9,borderRadius:8,padding:'1px 6px',fontWeight:700}}>
          {ready} pronto{ready>1?'s':''}!
        </span>}
        {withered>0&&<span style={{marginLeft:4,background:'#8B4513',color:WHITE,
          fontSize:9,borderRadius:8,padding:'1px 6px',fontWeight:700}}>
          {withered} 🥀
        </span>}
      </span>
    }>
      {/* Mini farm grid 4x4 */}
      <div style={{
        background:'linear-gradient(180deg,#87ceeb 0%,#87ceeb 25%,#5a8a3c 25%,#6aaa3c 100%)',
        borderRadius:3,padding:'6px',marginBottom:8,cursor:'pointer',
        position:'relative',
      }} onClick={()=>setPage(navId?{name:'fazendinha',userId:navId}:'fazendinha')}>
        {/* Tiny farmhouse */}
        <div style={{position:'absolute',top:2,right:4,fontSize:12}}>🏡</div>
        <div style={{
          display:'grid',gridTemplateColumns:'repeat(4,1fr)',
          gap:2,marginTop:10,
        }}>
          {plots.slice(0,16).map(p=>(
            <div key={p.id} style={{
              aspectRatio:'1',borderRadius:2,
              background:plotColor(p),
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:10,
            }}>
              {p.state==='ready'&&<span style={{fontSize:9}}>
                {CROPS[p.crop_type]?.emoji||'✨'}
              </span>}
              {p.state==='planted'&&<span style={{fontSize:8}}>🌱</span>}
              {p.state==='weed'&&<span style={{fontSize:8}}>🌿</span>}
              {p.state==='withered'&&<span style={{fontSize:8}}>🥀</span>}
            </div>
          ))}
        </div>
      </div>
      {/* Stats row */}
      <div style={{display:'flex',justifyContent:'space-between',
        fontSize:11,fontFamily:F_UI,color:MUTED}}>
        <span>💰 {farm.coins}</span>
        <span>⭐ nível {farm.level}</span>
        <span>🌾 {planted}</span>
      </div>
    </RightPanel>
  )
}

/* ── RIGHT SIDEBAR ── */
function RightSidebar({ myId, viewId, setPage }){
  const isOwnSidebar = !viewId || viewId===myId
  const targetSidebarId = viewId || myId
  const [friends,setFriends]=useState([])
  const [mine,setMine]=useState([])
  useEffect(()=>{
    getFriends(targetSidebarId).then(setFriends)
    getMyCommunities(targetSidebarId).then(setMine)
  },[targetSidebarId])
  return (
    <aside style={{width:250,flexShrink:0}}>
      <RightPanel
        title={<span>{isOwnSidebar?'meus ':' '}amigos{' '}
          <span style={{color:BLUE,textDecoration:'underline'}}>({friends.length})</span>
        </span>}
        onTitleClick={isOwnSidebar?()=>setPage('friends'):undefined}>
        {friends.length===0?(
          <>
            <input placeholder="buscar amigos" style={{...inp,marginBottom:7,fontSize:11}}/>
            <div style={{fontSize:12,color:MUTED}}>Sem amigos ainda.</div>
          </>
        ):(
          <>
            <input placeholder="buscar amigos" style={{...inp,marginBottom:8,fontSize:11}}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(64px,1fr))',gap:8}}>
              {friends.slice(0,6).map(f=>(
                <div key={f.id} style={{textAlign:'center',cursor:'pointer'}}
                  onClick={()=>setPage({name:'userprofile',userId:f.id})}>
                  <Av src={f.avatar_url} size={64} name={f.name} radius="3px"/>
                  <div style={{fontSize:10,color:MUTED,marginTop:3,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:F_UI}}>{f.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </RightPanel>
      <RightPanel
        title={<span>{isOwnSidebar?'minhas ':' '}comunidades{' '}
          <span style={{color:BLUE,textDecoration:'underline'}}>({mine.length})</span>
        </span>}
        onTitleClick={isOwnSidebar?()=>setPage('communities'):undefined}>
        {mine.length===0
          ?<div style={{fontSize:12,color:MUTED}}>Sem comunidades.</div>
          :<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(64px,1fr))',gap:8}}>
            {mine.slice(0,6).map(c=>(
              <div key={c.id} style={{textAlign:'center',cursor:'pointer'}}
                onClick={()=>setPage({name:'communities',openCommunity:c})}>
                <img src={"https://picsum.photos/seed/"+(c.seed||c.id)+"/64/64"} alt=""
                  style={{width:64,height:64,borderRadius:3,objectFit:'cover',
                    border:`1px solid ${BRD}`,display:'block',margin:'0 auto'}}/>
                <div style={{fontSize:10,color:MUTED,marginTop:3,overflow:'hidden',
                  textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:F_UI}}>
                  {(c.name||'').replace(/[♥❤★]/g,'').trim()}
                </div>
              </div>
            ))}
          </div>}
      </RightPanel>
      <FarmSidebarWidget myId={isOwnSidebar?myId:targetSidebarId} navId={isOwnSidebar?null:targetSidebarId} setPage={setPage}/>
    </aside>
  )
}

/* ── NOVIDADES — friends' recent album uploads (stories-as-albums) ── */
function Novidades({ myId, setPage }){
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [avatars,setAvatars]=useState({})

  useEffect(()=>{
    getNovidades(myId).then(async data=>{
      setItems(data)
      // Resolve signed URLs for avatars
      const urls={}
      for(const item of data){
        const path=item.author?.avatar_url
        if(path&&!urls[path]) urls[path]=await getSignedUrl(path)
      }
      setAvatars(urls)
      setLoading(false)
    })
  },[myId])

  if(loading||!items.length) return null

  const isRecent=(dateStr)=>Date.now()-new Date(dateStr)<24*3600*1000

  return (
    <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
      overflow:'hidden',marginBottom:8}}>
      <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
        padding:'5px 10px',fontWeight:700,fontSize:12,color:TEXT}}>
        novidades
      </div>
      {items.map((item,i)=>{
        const fresh=isRecent(item.created_at)
        const authorPath=item.author?.avatar_url
        return (
          <div key={item.id} style={{display:'flex',gap:10,padding:'9px 12px',
            borderBottom:i<items.length-1?`1px solid ${BRD}`:'none',alignItems:'center',
            background:fresh?'#fffef0':'transparent'}}>
            <div style={{cursor:'pointer',flexShrink:0,position:'relative'}}
              onClick={()=>setPage({name:'userprofile',userId:item.author.id})}>
              <Av src={avatars[authorPath]||authorPath} size={32} name={item.author.name} radius="3px"/>
              {fresh&&<span style={{position:'absolute',top:-3,right:-3,fontSize:9}}>✨</span>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,color:TEXT,lineHeight:1.5}}>
                <span style={{fontWeight:700,color:BLUE,cursor:'pointer'}}
                  onClick={()=>setPage({name:'userprofile',userId:item.author.id})}>{item.author.name}</span>
                {' adicionou '}<strong>{item.count}</strong>{' foto'}{item.count!==1?'s':''}{' ao álbum '}
                <span style={{fontWeight:700,color:BLUE,cursor:'pointer'}}
                  onClick={()=>setPage({name:'galeria',userId:item.author.id,albumId:item.album.id})}>
                  {item.album.name}
                </span>
              </div>
              <div style={{fontSize:10,color:MUTED,marginTop:2}}>
                {new Date(item.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                {fresh&&<span style={{color:'#b8860b',marginLeft:6,fontWeight:600}}>novo</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── TESTIMONIALS BLOCK (home page) ── */
function TestimonialsBlock({ myId, setPage }){
  const [deps,setDeps]=useState([])
  useEffect(()=>{
    supabase.from('depoimentos')
      .select('id,text,created_at,from:profiles!depoimentos_from_id_fkey(id,name,avatar_url)')
      .eq('to_id',myId).eq('approved',true)
      .order('created_at',{ascending:false}).limit(5)
      .then(({data})=>setDeps(data||[]))
  },[myId])

  if(!deps.length) return null

  return (
    <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden',marginTop:8}}>
      <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
        padding:'5px 10px',fontWeight:700,fontSize:12,color:TEXT,
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span>testimonials</span>
        <span style={{fontSize:11,color:MUTED,fontWeight:400}}>{deps.length}</span>
      </div>
      <div>
        {deps.map((d,i)=>(
          <div key={d.id} style={{display:'flex',gap:10,padding:'10px 12px',
            borderBottom:i<deps.length-1?`1px solid ${BRD}`:'none',alignItems:'flex-start'}}>
            <div style={{cursor:'pointer',flexShrink:0}}
              onClick={()=>setPage({name:'userprofile',userId:d.from.id})}>
              <Av src={d.from.avatar_url} size={32} name={d.from.name} radius="50%"/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:12,fontFamily:F_UI,color:BLUE,
                cursor:'pointer',marginBottom:2}}
                onClick={()=>setPage({name:'userprofile',userId:d.from.id})}>{d.from.name}</div>
              <div style={{fontSize:12,fontFamily:F_UI,color:TEXT,lineHeight:1.5,
                fontStyle:'italic'}}>"{d.text}"</div>
              <div style={{fontSize:10,fontFamily:F_UI,color:MUTED,marginTop:3}}>
                {new Date(d.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short',year:'numeric'})}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── HOME PAGE — pixel match of screenshot ── */
function HomePage({ profile, myId, setPage }){
  const [scrapCount,setScrapCount]=useState(0)
  const [comCount,setComCount]=useState(0)
  const [homeFanCount,setHomeFanCount]=useState(0)
  const [homePhotoCount,setHomePhotoCount]=useState(0)
  const [taggedCount,setTaggedCount]=useState(0)
  const [visitCount,setVisitCount]=useState(0)
  const [recentVisitors,setRecentVisitors]=useState([])
  const [showVisitors,setShowVisitors]=useState(false)
  const [fortune,setFortune]=useState('Tenha um ótimo dia!')
  const [editingFortune,setEditingFortune]=useState(false)
  const [fortuneDraft,setFortuneDraft]=useState('')
  useEffect(()=>{
    if(!myId)return
    getRecados(myId).then(r=>setScrapCount(r.length))
    getMyCommunities(myId).then(c=>setComCount(c.length))
    getFanCount(myId).then(setHomeFanCount)
    supabase.from('album_photos').select('id',{count:'exact',head:true}).eq('user_id',myId).then(({count})=>setHomePhotoCount(count||0))
    getTaggedPhotoCount(myId).then(setTaggedCount)
    getVisitors(myId).then(v=>{
      const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-10)
      const today=new Date().toDateString()
      setVisitCount(v.filter(x=>new Date(x.visited_at).toDateString()===today).length)
      setRecentVisitors(v.filter(x=>new Date(x.visited_at)>=cutoff).slice(0,20))
    })
  },[myId])

  // Icon row — colored icons matching screenshot
  const icons=[
    { emoji:'✏️',  color:'#e8700a', label:'scraps',       count:scrapCount, pg:'scrapbook' },
    { emoji:'📷',  color:'#555577', label:'fotos',         count:homePhotoCount, pg:'galeria' },
    { emoji:'🏷️',  color:'#e8700a', label:'fotos de mim',  count:taggedCount, pg:'taggedphotos' },
    { emoji:'⭐',  color:'#f5a623', label:'fãs',            count:homeFanCount, pg:'fans' },
    { emoji:'✉️',  color:'#757575', label:'mensagens',      count:0,          pg:'inbox' },
  ]

  const mob=useIsMobile()
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px',
      display:'grid',
      gridTemplateColumns:mob?'1fr':'210px 1fr 230px',
      gap:8,alignItems:'flex-start'}}>

      {/* LEFT COL — desktop: stacked photo+nav / mobile: side-by-side */}
      <div>
        {mob
          /* ── MOBILE: photo left, name+links right (image 1 style) ── */
          ?<div style={{display:'grid',gridTemplateColumns:'110px 1fr',gap:8,marginBottom:8}}>
            {/* Photo */}
            <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
              overflow:'hidden',cursor:'pointer'}} onClick={()=>setPage('profile')}>
              <div style={{padding:4,background:WHITE}}>
              <img src={profile?.avatar_url||("https://api.dicebear.com/9.x/personas/svg?seed="+(profile?.name||'u'))}
                alt={profile?.name||''}
                style={{width:'100%',aspectRatio:'1',objectFit:'cover',display:'block',
                  boxShadow:'0 0 0 2px white, 0 0 0 3px #c8d0e0'}}
                onError={e=>{e.target.src="https://api.dicebear.com/9.x/personas/svg?seed=u"}}/>
              </div>
              <div style={{padding:'5px 8px'}}>
                <div style={{fontWeight:700,fontSize:13,color:PINK,marginBottom:2}}>{profile?.name||'…'}</div>
                <div style={{fontSize:11,color:'#4caf50'}}>● disponível</div>
              </div>
            </div>
            {/* Nav links card */}
            <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
              <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
                padding:'4px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,fontSize:12,color:TEXT}}>perfil</span>
                <span style={{fontSize:11,color:BLUE,cursor:'pointer'}}
                  onClick={()=>setPage('profile')}>editar</span>
              </div>
              {[['scrapbook','scrapbook'],['fotos','galeria'],['amigos','friends'],
                ['comunidades','communities'],['depoimentos','depoimentos']].map(([label,pg])=>(
                <div key={label} onClick={()=>setPage(pg)} style={{
                  padding:'9px 10px',fontSize:14,cursor:'pointer',
                  color:BLUE,borderBottom:`1px solid ${BRD}`,
                }}>{label}</div>
              ))}
              <div onClick={()=>setPage('fazendinha')} style={{
                padding:'9px 10px',fontSize:14,cursor:'pointer',
                color:'#5a8a3c',fontWeight:600,borderBottom:`1px solid ${BRD}`,
              }}>🌾 fazendinha</div>

            </div>
          </div>
          /* ── DESKTOP: stacked as before ── */
          :<>
            <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
              overflow:'hidden',marginBottom:6}}>
              <div style={{padding:6,background:WHITE,cursor:'pointer',
                borderBottom:`1px solid ${BRD}`}}
                onClick={()=>setPage('profile')}>
                <img src={profile?.avatar_url||("https://api.dicebear.com/9.x/personas/svg?seed="+(profile?.name||'u'))}
                  alt={profile?.name||''}
                  style={{width:'100%',aspectRatio:'1',objectFit:'cover',display:'block',
                    boxShadow:'0 0 0 3px white, 0 0 0 4px #c8d0e0'}}
                  onError={e=>{e.target.src="https://api.dicebear.com/9.x/personas/svg?seed=u"}}/>
              </div>
              <div style={{padding:'8px 10px'}}>
                <div style={{fontWeight:700,fontSize:14,color:PINK,cursor:'pointer',marginBottom:3}}
                  onClick={()=>setPage('profile')}>{profile?.name||'…'}</div>
                <div style={{fontSize:11,color:'#4caf50'}}>● disponível</div>
              </div>
            </div>
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
                  padding:'5px 10px',fontSize:13,cursor:pg?'pointer':'default',
                  color:BLUE,borderBottom:`1px solid ${BRD}`,
                }}>{label}</div>
              ))}
            </div>
          </>
        }
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
                <div style={{fontSize:11,fontWeight:700,color:BLUE,marginBottom:2,fontFamily:F_NUM}}>{count}</div>
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
            <div><strong>Visitas ao perfil:</strong> desde hoje: {visitCount}</div>
            <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
              <strong>Visitantes recentes:</strong>
              {recentVisitors.length===0
                ?<span style={{color:MUTED}}> —</span>
                :<span style={{cursor:'pointer',color:BLUE,fontSize:12,textDecoration:'underline'}}
                  onClick={()=>setShowVisitors(v=>!v)}>
                  ver
                </span>}
            </div>
            {showVisitors&&recentVisitors.length>0&&<div style={{
              display:'flex',flexWrap:'wrap',gap:6,marginTop:6,
              background:'#f8f9fc',borderRadius:3,padding:'8px',border:`1px solid ${BRD}`}}>
              {recentVisitors.map(v=>(
                <div key={v.visitor?.id} style={{textAlign:'center',cursor:'pointer',width:44}}
                  onClick={()=>setPage({name:'userprofile',userId:v.visitor?.id})}>
                  <Av src={v.visitor?.avatar_url} size={32} name={v.visitor?.name} radius="50%"/>
                  <div style={{fontSize:9,color:MUTED,marginTop:2,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap',fontFamily:F_UI}}>
                    {v.visitor?.name?.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>}
            <div><strong>Fortuna do dia:</strong> {fortune}</div>
          </div>
        </div>
        {/* Novidades — friends' recent activity */}
        <Novidades myId={myId} setPage={setPage}/>

        {/* Testimonials */}
        <TestimonialsBlock myId={myId} setPage={setPage}/>
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
  const [pendingDeps,setPendingDeps]=useState([])
  const [tWrite,setTWrite]=useState(false)
  const [tDraft,setTDraft]=useState('')
  const [fStatus,setFStatus]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [scraps,setScraps]=useState([])
  const [photoCount,setPhotoCount]=useState(0)
  const [scrapCount,setScrapCount]=useState(0)
  const [fanCount,setFanCount]=useState(0)
  const [iAmFan,setIAmFan]=useState(false)
  const [invites,setInvites]=useState([])
  const [showInvites,setShowInvites]=useState(false)
  const [tab,setTab]=useState('social')
  const [memberNum,setMemberNum]=useState(null)
  const [newScrap,setNewScrap]=useState('')
  const [scrapPrivacy,setScrapPrivacy]=useState('friends')

  useEffect(()=>{
    if(!targetId)return
    getProfile(targetId).then(p=>{setProfile(p);setDraft(p||{});if(p?.scrapbook_privacy) setScrapPrivacy(p.scrapbook_privacy)})
    getDepoimentos(targetId).then(setDeps)
    if(!userId||userId===myId) getPendingDepoimentos(myId).then(setPendingDeps)
    getRecados(targetId).then(d=>{ setScraps(d); setScrapCount(d.length) })
    // Photo count — works for friends via are_friends() RLS
    supabase.from('album_photos').select('id',{count:'exact',head:true})
      .eq('user_id',targetId)
      .then(({count,error})=>{
        if(error) console.error('photo count:',error.message)
        else setPhotoCount(count||0)
      })
    if(isOwn){ getMyInvites(myId).then(setInvites); getMemberNumber(targetId).then(setMemberNum) }
    getFanCount(targetId).then(setFanCount)
    if(!isOwn){recordVisit(myId,targetId);getFriendshipStatus(myId,targetId).then(setFStatus);getIsFan(myId,targetId).then(setIAmFan)}
  },[targetId])

  const toggleFan=async()=>{
    if(iAmFan){ await removeFan(myId,targetId); setIAmFan(false); setFanCount(n=>n-1) }
    else { await addFan(myId,targetId); setIAmFan(true); setFanCount(n=>n+1) }
  }
  const [profileReplyOpen,setProfileReplyOpen]=useState(null)
  const [profileReplyText,setProfileReplyText]=useState('')
  const postProfileReply=async(toId,toName)=>{
    if(!profileReplyText.trim()) return
    await sendRecado(myId,toId,profileReplyText.trim())
    setProfileReplyOpen(null); setProfileReplyText('')
    getRecados(targetId).then(d=>{setScraps(d);setScrapCount(d.length)})
  }
  const submitScrap=async()=>{
    if(!newScrap.trim()) return
    await sendRecado(myId, targetId, newScrap.trim())
    setNewScrap('')
    getRecados(targetId).then(d=>{setScraps(d);setScrapCount(d.length)})
  }

  const save=async()=>{
    await updateProfile(myId,{name:draft.name,bio:draft.bio,city:draft.city,
      country:draft.country,gender:draft.gender,rel_status:draft.rel_status,
      birthday:draft.birthday,interests:draft.interests,children:draft.children,
      ethnicity:draft.ethnicity,humor:draft.humor,orientation:draft.orientation,
      style:draft.style,smoking:draft.smoking,drinking:draft.drinking,pets:draft.pets,
      living_with:draft.living_with,hometown:draft.hometown,website:draft.website,
      passions:draft.passions,sports:draft.sports,activities:draft.activities,
      fortune:draft.fortune,company:draft.company,job_title:draft.job_title,
      professional_bio:draft.professional_bio,experience:draft.experience,
      education:draft.education,skills:draft.skills,languages:draft.languages,
      professional_interests:draft.professional_interests,
      musica:draft.musica||[],filmes:draft.filmes||[]})
    setProfile(draft);setEditing(false);toast('Perfil atualizado!')
  }
  const handleAvatar=async(e)=>{
    const file=e.target.files[0];if(!file)return
    setUploading(true)
    try{
      const path=await uploadAvatar(myId,file)
      await updateProfile(myId,{avatar_url:path})
      // Re-fetch profile to get the saved path and trigger Av re-render
      const fresh=await getProfile(myId)
      setProfile(fresh)
      setDraft(fresh)
      toast('Foto atualizada!')
    }
    catch(err){toast('Erro: '+err.message); console.error('Avatar upload error:',err)}
    setUploading(false)
  }
  const handleFriend=async()=>{
    if(!fStatus){await sendFriendRequest(myId,targetId);setFStatus({status:'pending',requester_id:myId});toast('Pedido enviado!')}
  }
  const submitDep=async()=>{
    if(!tDraft.trim())return
    await sendDepoimento(myId,targetId,tDraft)
    getDepoimentos(targetId).then(setDeps)
    if(!userId||userId===myId) getPendingDepoimentos(myId).then(setPendingDeps);setTDraft('');setTWrite(false);toast('Enviado!')
  }
  const af=(k,v)=>setDraft(p=>({...p,[k]:v.split(',').map(s=>s.trim()).filter(Boolean)}))
  const mob=useIsMobile()  // must be before any early returns
  const tag={display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:10,
    border:`1px solid ${BRD}`,background:'#f0f4ff',fontSize:12,color:MUTED,marginRight:4,marginBottom:4}

  if(!profile)return <div style={{padding:20,color:MUTED,textAlign:'center'}}>Carregando…</div>
  // Non-friends see minimal profile
  if(!isOwn&&fStatus?.status!=='accepted'){
    return (
      <div style={{maxWidth:980,margin:'0 auto',padding:'8px',
        display:'grid',gridTemplateColumns:mob?'1fr':'210px 1fr 230px',gap:8}}>
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
          <div style={{lineHeight:0}}><img src={profile.avatar_url||("https://api.dicebear.com/9.x/personas/svg?seed="+profile.name)}
            alt={profile.name} style={{width:'100%',aspectRatio:'1',objectFit:'cover',display:'block'}}/></div>
          <div style={{padding:'8px 10px'}}>
            <div style={{fontWeight:700,fontSize:14,color:PINK}}>{profile.name}</div>
          </div>
        </div>
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:20,textAlign:'center'}}>
          <div style={{fontWeight:700,fontSize:16,color:TEXT,marginBottom:8}}>{profile.name}</div>
          <div style={{fontSize:13,color:MUTED,marginBottom:16,lineHeight:1.6}}>
            Este perfil é privado.<br/>Adicione como amigo para ver fotos, recados e mais.
          </div>
          <button style={{...btnBl,padding:'8px 20px'}} onClick={handleFriend}>
            {!fStatus?'+ Adicionar amigo':fStatus.status==='pending'&&fStatus.requester_id===myId?'Pedido enviado…':'Aceitar pedido'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px',
      display:'grid',
      gridTemplateColumns:mob?'1fr':'210px 1fr 230px',
      gap:8,alignItems:'flex-start'}}>
      {/* Left — hidden on mobile */}
      {!mob&&<div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{padding:6,background:WHITE,borderBottom:`1px solid ${BRD}`}}>
          <img src={profile.avatar_url||("https://api.dicebear.com/9.x/personas/svg?seed="+(profile.name||'u'))}
            alt={profile.name} style={{width:'100%',aspectRatio:'1',objectFit:'cover',display:'block',
              boxShadow:'0 0 0 3px white, 0 0 0 4px #c8d0e0'}}/>
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
          <div onClick={()=>setPage({name:'fazendinha',userId:targetId})} style={{
            padding:'3px 10px',fontSize:13,cursor:'pointer',color:'#5a8a3c',fontWeight:600}}>
            🌾 fazendinha
          </div>
        </div>
      </div>}

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
                {!isOwn&&(fStatus?.status==='accepted'
                  ?<span style={{fontSize:12,fontFamily:F_UI,color:'#2e7d32',
                      border:'1px solid #b0d8b0',borderRadius:2,padding:'4px 10px',
                      background:'#f0fff4'}}>amigos</span>
                  :fStatus?.status==='pending'
                    ?<span style={{fontSize:12,fontFamily:F_UI,color:MUTED,
                        border:`1px solid ${BRD}`,borderRadius:2,padding:'4px 10px',
                        background:'#f8f9fc'}}>
                        {fStatus.requester_id===myId?'pendente':'aceitar pedido'}
                      </span>
                    :<button style={btnBl} onClick={handleFriend}>adicionar</button>
                )}
                {!isOwn&&<button style={btnPk} onClick={()=>setPage({name:'scrapbook',userId:targetId})}>✉ recado</button>}
              </div>
            </div>
            {/* Stats row — clickable to friend's pages */}
            <div style={{display:'flex',gap:14,fontSize:12,color:TEXT,marginBottom:8,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}
                onClick={()=>setPage({name:'scrapbook',userId:targetId})}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke={BLUE} strokeWidth="1.4" fill="none"/><line x1="1" y1="5" x2="13" y2="5" stroke={BLUE} strokeWidth="1.2"/></svg>
                <span style={{color:BLUE,textDecoration:'underline'}}>recados</span> <strong style={{fontFamily:F_NUM}}>{scrapCount}</strong>
              </span>
              <span style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}
                onClick={()=>setPage({name:'galeria',userId:targetId})}>
                <svg width="14" height="12" viewBox="0 0 14 12" fill="none"><rect x="0.5" y="1" width="13" height="10" rx="1.5" stroke={BLUE} strokeWidth="1.4" fill="none"/><path d="M0.5 8l3.5-3 3 3 2.5-2.5 5 4" stroke={BLUE} strokeWidth="1.2" strokeLinejoin="round" fill="none"/><circle cx="4" cy="4.5" r="1.2" fill="none" stroke={BLUE} strokeWidth="1.2"/></svg>
                <span style={{color:BLUE,textDecoration:'underline'}}>fotos</span> <strong style={{fontFamily:F_NUM}}>{photoCount}</strong>
              </span>

              <span style={{display:'flex',alignItems:'center',gap:4}}>
                {/* Fan count — always links to fan list */}
                <span style={{display:'flex',alignItems:'center',gap:4,cursor:'pointer'}}
                  onClick={()=>setPage({name:'fans',userId:targetId})}>
                  <svg width="14" height="14" viewBox="0 0 14 14"
                    fill={!isOwn&&iAmFan?'#f5a623':'none'}>
                    <polygon points="7,1 9,5.5 14,6 10.5,9.5 11.5,14 7,11.5 2.5,14 3.5,9.5 0,6 5,5.5"
                      stroke={!isOwn&&iAmFan?'#f5a623':MUTED} strokeWidth="1.4"/>
                  </svg>
                  <span style={{color:BLUE,textDecoration:'underline'}}>fãs</span>
                  <strong style={{fontFamily:F_NUM}}>{fanCount}</strong>
                </span>
                {/* Toggle fan — only when visiting someone else */}
                {!isOwn&&<span style={{fontSize:10,fontFamily:F_UI,color:iAmFan?'#f5a623':MUTED,
                  cursor:'pointer',marginLeft:2,border:`1px solid ${BRD}`,
                  borderRadius:2,padding:'1px 6px'}}
                  onClick={toggleFan}>
                  {iAmFan?'- deixar de ser fã':'+ ser fã'}
                </span>}
              </span>
              {invites.length>0&&<span style={{display:'flex',alignItems:'center',gap:4,
                color:MUTED,fontSize:11,opacity:.75}} title="convites usados">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="3" width="10" height="7" rx="1" stroke={MUTED} strokeWidth="1.2" fill="none"/>
                  <path d="M1 5l5 3 5-3" stroke={MUTED} strokeWidth="1.2" fill="none"/>
                </svg>
                {invites.filter(i=>i.used_by).length}/{invites.length} convites
              </span>}
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
                position:'relative',
              }}>
                {t}
                {t==='depoimentos'&&isOwn&&pendingDeps.length>0&&<span style={{
                  position:'absolute',top:3,right:3,
                  background:'#e03131',color:WHITE,borderRadius:10,
                  padding:'0 5px',fontSize:9,fontWeight:700,lineHeight:'14px',
                }}>{pendingDeps.length}</span>}
              </div>
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
              : /* ── SOCIAL VIEW — only populated fields ── */
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
                    ].filter(([l,k])=>profile[k]&&String(profile[k]).trim()).map(([l,k],i)=>(
                      <tr key={k} style={{background:i%2===0?'#f8f9fc':WHITE}}>
                        <td style={{padding:'6px 16px',color:MUTED,width:170,fontWeight:600,textAlign:'right',
                          borderRight:`1px solid ${BRD}`,whiteSpace:'nowrap'}}>{l}:</td>
                        <td style={{padding:'6px 16px',color:TEXT}}>{profile[k]}</td>
                      </tr>
                    ))}
                    {![
                      'rel_status','birthday','gender','interests','bio','children',
                      'ethnicity','humor','orientation','style','smoking','drinking','pets',
                      'living_with','city','country','hometown','website','passions','sports',
                      'activities','fortune'
                    ].some(k=>profile[k]&&String(profile[k]).trim())&&(
                      <tr><td colSpan={2} style={{padding:'14px 16px',color:MUTED,
                        fontSize:12,fontStyle:'italic',textAlign:'center'}}>
                        {isOwn?'Clique em "editar perfil" para preencher seu perfil.':'Nenhuma informação preenchida.'}
                      </td></tr>
                    )}
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
                    ].filter(([l,k])=>profile[k]&&String(profile[k]).trim()).map(([l,k],i)=>(
                      <tr key={k} style={{background:i%2===0?'#f8f9fc':WHITE}}>
                        <td style={{padding:'6px 16px',color:MUTED,width:170,fontWeight:600,textAlign:'right',
                          borderRight:`1px solid ${BRD}`,whiteSpace:'nowrap'}}>{l}:</td>
                        <td style={{padding:'6px 16px',color:TEXT}}>{profile[k]}</td>
                      </tr>
                    ))}
                    {!['company','job_title','professional_bio','experience','education',
                       'skills','languages','professional_interests'].some(k=>profile[k]&&String(profile[k]).trim())&&(
                      <tr><td colSpan={2} style={{padding:'14px 16px',color:MUTED,
                        fontSize:12,fontStyle:'italic',textAlign:'center'}}>
                        {isOwn?'Clique em "editar perfil" para preencher seu informações profissionais.':'Nenhuma informação profissional preenchida.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
            )}
            {tab==='depoimentos'&&<div style={{padding:'10px 14px'}}>
              {/* Pending approval — only visible to profile owner */}
              {isOwn&&pendingDeps.length>0&&<div style={{marginBottom:14,background:'#fffbea',
                border:`1px solid #e8d87a`,borderRadius:3,padding:'10px 12px'}}>
                <div style={{fontWeight:700,fontSize:12,color:'#8a6d00',marginBottom:8,fontFamily:F_UI}}>
                  ⏳ aguardando sua aprovação ({pendingDeps.length})
                </div>
                {pendingDeps.map(d=>(
                  <div key={d.id} style={{display:'flex',gap:10,padding:'7px 0',
                    borderBottom:`1px solid #e8d87a`,alignItems:'flex-start'}}>
                    <Av src={d.from.avatar_url} size={30} name={d.from.name} radius="3px"/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:12,color:BLUE,marginBottom:2,fontFamily:F_UI}}>{d.from.name}:</div>
                      <div style={{fontSize:13,color:TEXT,lineHeight:1.5,fontFamily:F_UI}}>{d.text}</div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button style={{...btnBl,padding:'2px 8px',fontSize:11}} onClick={async()=>{
                        await approveDepoimento(d.id)
                        setPendingDeps(p=>p.filter(x=>x.id!==d.id))
                        getDepoimentos(myId).then(setDeps)
                      }}>✓ aprovar</button>
                      <button style={{...btnGh,padding:'2px 8px',fontSize:11,color:'#cc0000',borderColor:'#cc0000'}} onClick={async()=>{
                        await rejectDepoimento(d.id)
                        setPendingDeps(p=>p.filter(x=>x.id!==d.id))
                      }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>}
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
          fontSize:11,color:'rgba(42,75,141,0.22)',
          letterSpacing:4,userSelect:'none',fontFamily:'monospace',
          fontWeight:400,
        }}>
          {String(memberNum).padStart(9,'0')}
        </div>}

        {/* Scrapbook section — OG Orkut style ── */}
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
          overflow:'hidden',marginBottom:8}}>
          <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,
            padding:'5px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI}}>
              recados ({scrapCount})
            </span>
            {isOwn&&<select value={scrapPrivacy} onChange={async e=>{
              setScrapPrivacy(e.target.value)
              await updateProfile(myId,{scrapbook_privacy:e.target.value})
            }} style={{fontSize:11,fontFamily:F_UI,border:`1px solid ${BRD}`,
              borderRadius:2,padding:'2px 6px',color:MUTED,background:WHITE,cursor:'pointer'}}>
              <option value="friends">só amigos</option>
              <option value="friends_of_friends">amigos de amigos</option>
            </select>}
          </div>

          {/* Write a scrap */}
          {!isOwn&&<div style={{padding:'10px 12px',borderBottom:`1px solid ${BRD}`,
            background:'#f8f9fc'}}>
            <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
              <textarea value={newScrap} onChange={e=>setNewScrap(e.target.value)}
                style={{...inp,flex:1,resize:'vertical',minHeight:54,fontFamily:F_UI,fontSize:12}}
                placeholder={`escrever um recado para ${profile.name}…`}/>
              <button style={{...btnBl,padding:'6px 12px',fontSize:12,flexShrink:0}}
                onClick={submitScrap}>enviar</button>
            </div>
          </div>}

          {/* Scrap list */}
          <div>
            {scraps.slice(0,10).map((s,i)=>(
              <div key={s.id} style={{display:'flex',gap:10,padding:'9px 12px',
                borderBottom:i<Math.min(scraps.length,5)-1?`1px solid ${BRD}`:'none',
                alignItems:'flex-start'}}>
                <div style={{cursor:'pointer',flexShrink:0}}
                  onClick={()=>setPage({name:'userprofile',userId:s.from.id})}>
                  <Av src={s.from.avatar_url} size={30} name={s.from.name} radius="3px"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:12,color:BLUE,cursor:'pointer',
                    marginBottom:2,fontFamily:F_UI}}
                    onClick={()=>setPage({name:'userprofile',userId:s.from.id})}>
                    {s.from.name}:
                  </div>
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.5,fontFamily:F_UI,
                    wordBreak:'break-word'}}>{s.text}</div>
                  <div style={{display:'flex',gap:12,alignItems:'center',marginTop:4}}>
                    <div style={{fontSize:10,color:MUTED,fontFamily:F_UI}}>
                      {new Date(s.created_at).toLocaleDateString('pt-BR',{
                        day:'numeric',month:'short',year:'numeric',
                        hour:'2-digit',minute:'2-digit'})}
                    </div>
                    {myId!==targetId&&<span style={{fontSize:11,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
                      onClick={()=>{
                        setProfileReplyOpen(profileReplyOpen===s.id?null:s.id)
                        setProfileReplyText('')
                      }}>
                      ↩ responder
                    </span>}
                    <span style={{fontSize:11,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
                      onClick={()=>setPage({name:'scrapbook',userId:targetId})}>
                      ver conversa
                    </span>
                  </div>
                  {profileReplyOpen===s.id&&<div style={{marginTop:8,background:'#f8f9fc',
                    border:`1px solid ${BRD}`,borderRadius:3,padding:'8px 10px'}}>
                    <textarea style={{...tarea,minHeight:72,fontSize:14,lineHeight:1.5,
                      WebkitAppearance:'none',borderRadius:3}}
                      value={profileReplyText}
                      onChange={e=>setProfileReplyText(e.target.value)}
                      placeholder={`responder para ${s.from.name}…`}
                      ref={el=>{if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),100)}}/>
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <button style={{...btnBl,padding:'8px 16px',fontSize:13,flex:1}}
                        onClick={()=>postProfileReply(s.from.id,s.from.name)}>
                        enviar
                      </button>
                      <button style={{...btnGh,padding:'8px 14px',fontSize:13}}
                        onClick={()=>{setProfileReplyOpen(null);setProfileReplyText('')}}>
                        cancelar
                      </button>
                    </div>
                  </div>}
                </div>
              </div>
            ))}
            {scraps.length===0&&<div style={{padding:'14px 12px',color:MUTED,
              fontSize:12,fontStyle:'italic',fontFamily:F_UI}}>
              Nenhum recado ainda.
            </div>}
            {scraps.length>10&&<div style={{padding:'7px 12px',borderTop:`1px solid ${BRD}`,
              textAlign:'right'}}>
              <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
                onClick={()=>setPage({name:'scrapbook',userId:targetId})}>
                ver todos os {scraps.length} recados →
              </span>
            </div>}
          </div>
        </div>

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
                  background:inv.used_by?'#f5f5f5':'#f0fff4',
                  border:`1px solid ${inv.used_by?'#ddd':'#b0d8c0'}`,
                  opacity:inv.used_by?0.55:1,
                }}>
                  <span style={{fontFamily:'monospace',fontWeight:700,fontSize:14,
                    color:inv.used_by?'#aaa':BLUE,letterSpacing:2,
                    textDecoration:inv.used_by?'line-through':'none'}}>{inv.code}</span>
                  {inv.used_by
                    ?<span style={{fontSize:10,color:'#aaa',marginLeft:'auto'}}>✓ usado</span>
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

      {/* Right — hidden on mobile */}
      {!mob&&<RightSidebar myId={myId} viewId={targetId} setPage={setPage}/>}
      {mob&&!isOwn&&<div style={{marginTop:8}}>
        <FarmSidebarWidget myId={targetId} setPage={setPage} viewOnly={true}/>
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
          marginBottom:8,overflow:'hidden'}}>
          {[['📝 recados',{name:'scrapbook',userId:targetId}],
            ['📷 fotos',{name:'galeria',userId:targetId}],
            ['🌾 fazendinha',{name:'fazendinha',userId:targetId}]].map(([label,pg])=>(
            <div key={label} onClick={()=>setPage(pg)} style={{
              padding:'10px 14px',fontSize:14,cursor:'pointer',
              color:label.includes('🌾')?'#5a8a3c':BLUE,
              fontWeight:label.includes('🌾')?700:400,
              borderBottom:`1px solid ${BRD}`}}>
              {label}
            </div>
          ))}
        </div>
        <RightSidebar myId={myId} viewId={targetId} setPage={setPage}/>
      </div>}
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
  const [selected,setSelected]=useState(new Set())
  const [replyOpen,setReplyOpen]=useState(null)   // scrap id
  const [replyText,setReplyText]=useState('')
  const [convOpen,setConvOpen]=useState(null)     // {userId, name}
  const [convScraps,setConvScraps]=useState([])

  useEffect(()=>{
    getRecados(targetId).then(setScraps)
    if(!isOwn) getProfile(targetId).then(setTargetProfile)
  },[targetId])

  useEffect(()=>{
    const ch=supabase.channel('sc-'+targetId)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'recados',
        filter:'to_id=eq.'+targetId},
        ()=>getRecados(targetId).then(setScraps)).subscribe()
    return()=>supabase.removeChannel(ch)
  },[targetId])

  const post=async()=>{
    if(!text.trim()) return
    await sendRecado(myId,targetId,text)
    getRecados(targetId).then(setScraps); setText(''); toast('Recado enviado!')
  }

  const postReply=async(toId)=>{
    if(!replyText.trim()) return
    await sendRecado(myId,toId,replyText)
    setReplyOpen(null); setReplyText(''); toast('Recado enviado!')
    // If replying from own scrapbook, also refresh
    getRecados(targetId).then(setScraps)
  }

  const toggleSelect=(id)=>{
    setSelected(prev=>{
      const s=new Set(prev)
      s.has(id)?s.delete(id):s.add(id)
      return s
    })
  }

  const deleteSelected=async()=>{
    for(const id of selected) await deleteRecado(id,myId)
    setScraps(p=>p.filter(s=>!selected.has(s.id)))
    setSelected(new Set())
    toast('Recados apagados.')
  }

  const selectAll=()=>setSelected(new Set(scraps.map(s=>s.id)))
  const selectNone=()=>setSelected(new Set())

  const openConv=async(partnerId,partnerName)=>{
    // Fetch all scraps between myId and partnerId (both directions)
    const {data}=await supabase.from('recados')
      .select('id,text,created_at,from:profiles!recados_from_id_fkey(id,name,avatar_url)')
      .or(`and(from_id.eq.${myId},to_id.eq.${partnerId}),and(from_id.eq.${partnerId},to_id.eq.${myId})`)
      .order('created_at',{ascending:true})
    setConvScraps(data||[])
    setConvOpen({userId:partnerId,name:partnerName})
  }

  // ── Conversation view ───────────────────────────────────────
  if(convOpen) return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
            onClick={()=>setConvOpen(null)}>← voltar</span>
          <span style={{fontWeight:700,fontSize:14,color:TEXT,fontFamily:F_UI}}>
            conversa com {convOpen.name}
          </span>
        </div>
        <div style={{padding:'0 12px'}}>
          {convScraps.map((s,i)=>{
            const isMe=s.from.id===myId
            return (
              <div key={s.id} style={{display:'flex',gap:10,padding:'10px 0',
                borderBottom:i<convScraps.length-1?`1px solid ${BRD}`:'none',
                flexDirection:isMe?'row-reverse':'row'}}>
                <Av src={s.from.avatar_url} size={34} name={s.from.name} radius="3px"/>
                <div style={{flex:1,background:isMe?'#f0f4ff':'#f8f9fc',
                  borderRadius:3,padding:'8px 10px',border:`1px solid ${BRD}`}}>
                  <div style={{fontWeight:700,fontSize:12,color:isMe?BLUE:TEXT,
                    marginBottom:4,fontFamily:F_UI}}>{s.from.name}</div>
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.5,fontFamily:F_UI}}>{s.text}</div>
                  <div style={{fontSize:10,color:MUTED,marginTop:4,fontFamily:F_UI}}>
                    {new Date(s.created_at).toLocaleDateString('pt-BR',{
                      day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )

  // ── Main scrapbook view ─────────────────────────────────────
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',alignItems:'center',gap:10}}>
          {!isOwn&&<span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
            onClick={()=>setPage({name:'userprofile',userId:targetUserId})}>← voltar</span>}
          <span style={{fontWeight:700,fontSize:14,color:TEXT,fontFamily:F_UI}}>
            {isOwn?`meus recados (${scraps.length})`:`recados de ${targetProfile?.name||'…'}`}
          </span>
        </div>



        {/* Bulk actions — own scrapbook only */}
        {isOwn&&scraps.length>0&&<div style={{padding:'8px 12px',borderBottom:`1px solid ${BRD}`,
          display:'flex',alignItems:'center',gap:12,background:'#f8f9fc'}}>
          <button style={{...btnGh,padding:'3px 12px',fontSize:11,
            color:'#cc0000',borderColor:'#cc0000'}}
            onClick={deleteSelected} disabled={selected.size===0}>
            apagar selecionados ({selected.size})
          </button>
          <span style={{fontSize:11,fontFamily:F_UI,color:MUTED}}>
            Selecionar:{' '}
            <span style={{color:BLUE,cursor:'pointer'}} onClick={selectAll}>Todos</span>
            {', '}
            <span style={{color:BLUE,cursor:'pointer'}} onClick={selectNone}>Nenhum</span>
          </span>
        </div>}

        {/* Scrap list */}
        <div style={{padding:'0 12px'}}>
          {scraps.length===0
            ?<div style={{padding:'18px 0',color:MUTED,fontSize:13,fontFamily:F_UI}}>
              Nenhum recado ainda.
            </div>
            :scraps.map((s,i)=>(
              <div key={s.id} style={{display:'flex',gap:10,padding:'10px 0',
                borderBottom:i<scraps.length-1?`1px solid ${BRD}`:'none',alignItems:'flex-start'}}>

                {/* Checkbox — own scrapbook only */}
                {isOwn&&<input type="checkbox" checked={selected.has(s.id)}
                  onChange={()=>toggleSelect(s.id)}
                  style={{marginTop:4,flexShrink:0,cursor:'pointer'}}/>}

                <Av src={s.from.avatar_url} size={40} name={s.from.name} radius="3px"/>

                <div style={{flex:1,minWidth:0}}>
                  {/* Name + timestamp */}
                  <div style={{display:'flex',justifyContent:'space-between',
                    alignItems:'baseline',marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:13,color:BLUE,cursor:'pointer',
                      fontFamily:F_UI}}
                      onClick={()=>setPage({name:'userprofile',userId:s.from.id})}>
                      {s.from.name}:
                    </span>
                    <span style={{fontSize:10,color:MUTED,fontFamily:F_UI,flexShrink:0,marginLeft:8}}>
                      {new Date(s.created_at).toLocaleDateString('pt-BR',{
                        day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </span>
                  </div>

                  {/* Text */}
                  <div style={{fontSize:13,color:TEXT,lineHeight:1.6,
                    fontFamily:F_UI,marginBottom:6}}>{s.text}</div>

                  {/* Actions */}
                  <div style={{display:'flex',gap:14,alignItems:'center'}}>
                    {/* Reply — only if friend or own */}
                    <span style={{fontSize:11,color:BLUE,cursor:'pointer',fontFamily:F_UI,
                      display:'flex',alignItems:'center',gap:3}}
                      onClick={()=>{
                        setReplyOpen(replyOpen===s.id?null:s.id)
                        setReplyText('')
                      }}>
                      ↩ responder
                    </span>
                    {/* Ver conversa */}
                    <span style={{fontSize:11,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
                      onClick={()=>openConv(s.from.id,s.from.name)}>
                      ver conversa
                    </span>
                    {/* Delete single */}
                    {isOwn&&<span style={{fontSize:11,color:'#cc0000',cursor:'pointer',
                      fontFamily:F_UI,marginLeft:'auto'}}
                      onClick={()=>{
                        deleteRecado(s.id,myId).then(()=>{
                          setScraps(p=>p.filter(r=>r.id!==s.id))
                          setSelected(prev=>{const s2=new Set(prev);s2.delete(s.id);return s2})
                        })
                      }}>apagar</span>}
                  </div>

                  {/* Inline reply box */}
                  {replyOpen===s.id&&<div style={{marginTop:8,background:'#f8f9fc',
                    border:`1px solid ${BRD}`,borderRadius:3,padding:'8px 10px'}}>
                    <textarea style={{...tarea,minHeight:72,fontSize:14,lineHeight:1.5,
                      WebkitAppearance:'none',borderRadius:3}}
                      value={replyText}
                      onChange={e=>setReplyText(e.target.value)}
                      placeholder={`responder para ${s.from.name}…`}
                      ref={el=>{if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'nearest'}),100)}}/>
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <button style={{...btnBl,padding:'8px 16px',fontSize:13,flex:1}}
                        onClick={()=>postReply(s.from.id)}>enviar</button>
                      <button style={{...btnGh,padding:'8px 14px',fontSize:13}}
                        onClick={()=>{setReplyOpen(null);setReplyText('')}}>cancelar</button>
                    </div>
                  </div>}
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

/* ── SEARCH PEOPLE ── */
function SearchPeople({ myId, setPage }){
  const [query,setQuery]=useState('')
  const [results,setResults]=useState([])
  const [searching,setSearching]=useState(false)
  const [friendStatuses,setFriendStatuses]=useState({})

  useEffect(()=>{
    if(query.length<2){ setResults([]); return }
    setSearching(true)
    const t=setTimeout(async()=>{
      const data=await searchUsers(query)
      // Exclude self
      setResults(data.filter(u=>u.id!==myId))
      setSearching(false)
    },300)
    return()=>clearTimeout(t)
  },[query])

  const sendRequest=async(userId)=>{
    await sendFriendRequest(myId,userId)
    setFriendStatuses(p=>({...p,[userId]:'pending'}))
  }

  return (
    <div>
      <div style={{position:'relative'}}>
        <input style={{...inp,paddingRight:28}} value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="buscar por nome…"/>
        {searching&&<span style={{position:'absolute',right:8,top:'50%',
          transform:'translateY(-50%)',fontSize:11,color:MUTED}}>…</span>}
      </div>
      {results.length>0&&<div style={{
        border:`1px solid ${BRD}`,borderTop:'none',borderRadius:'0 0 3px 3px',
        background:WHITE,maxHeight:240,overflowY:'auto'
      }}>
        {results.map(u=>(
          <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,
            padding:'8px 12px',borderBottom:`1px solid ${BRD}`}}>
            <div style={{cursor:'pointer',flexShrink:0}}
              onClick={()=>setPage({name:'userprofile',userId:u.id})}>
              <Av src={u.avatar_url} size={36} name={u.name} radius="50%"/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,fontFamily:F_UI,color:BLUE,
                cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                onClick={()=>setPage({name:'userprofile',userId:u.id})}>{u.name}</div>
              {u.city&&<div style={{fontSize:11,fontFamily:F_UI,color:MUTED}}>{u.city}{u.country?`, ${u.country}`:''}</div>}
            </div>
            <button
              style={{...btnBl,padding:'3px 10px',fontSize:11,flexShrink:0,
                background:friendStatuses[u.id]==='pending'?MUTED:BLUE}}
              disabled={friendStatuses[u.id]==='pending'}
              onClick={()=>sendRequest(u.id)}>
              {friendStatuses[u.id]==='pending'?'enviado':'+ adicionar'}
            </button>
          </div>
        ))}
      </div>}
      {query.length>=2&&!searching&&results.length===0&&<div style={{
        fontSize:12,fontFamily:F_UI,color:MUTED,padding:'8px 0'
      }}>Nenhum resultado para "{query}"</div>}
    </div>
  )
}

/* ── FRIENDS ── */
function FriendsPage({ myId, setPage, toast }){
  const [tab,setTab]=useState('amigos')
  const [friends,setFriends]=useState([])
  const [requests,setRequests]=useState([])
  const [sent,setSent]=useState([])
  const [chatF,setChatF]=useState(null)
  const [messages,setMessages]=useState([])
  const [chatInput,setChatInput]=useState('')
  const chatRef=useRef()

  const load=()=>{
    getFriends(myId).then(setFriends)
    getFriendRequests(myId).then(setRequests)
    getSentRequests(myId).then(setSent)
  }
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
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:'8px 16px',cursor:'pointer',fontSize:13,
              fontWeight:tab===t?700:400,
              color:tab===t?BLUE:MUTED,
              borderBottom:tab===t?`3px solid ${BLUE}`:'3px solid transparent',
              borderRight:t!=='enviados'?`1px solid ${BRD}`:'none',
              boxSizing:'border-box',background:tab===t?WHITE:'#f0f4ff',
            }}>{l}</div>
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
                  {/* chat disabled */}
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
          {tab==='enviados'&&(sent.length===0
            ?<div style={{color:MUTED,fontSize:13,fontFamily:F_UI}}>Nenhum pedido enviado ainda.</div>
            :sent.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,
                padding:'8px 0',borderBottom:`1px solid ${BRD}`}}>
                <Av src={s.addressee.avatar_url} size={36} name={s.addressee.name} radius="50%"/>
                <div style={{flex:1,fontFamily:F_UI,fontSize:13,color:TEXT}}>{s.addressee.name}</div>
                <span style={{fontSize:11,fontFamily:F_UI,color:MUTED,fontStyle:'italic'}}>aguardando…</span>
              </div>
            ))
          )}
        </div>
        <div style={{padding:'10px 14px',borderTop:`1px solid ${BRD}`}}>
          <div style={{fontWeight:700,fontSize:13,color:TEXT,marginBottom:8,fontFamily:F_UI}}>buscar pessoas</div>
          <SearchPeople myId={myId} setPage={setPage}/>
        </div>
      </div>
      {false&&chatF&&(
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
  const [showCreate,setShowCreate]=useState(false)
  const [newComName,setNewComName]=useState('')
  const [newComDesc,setNewComDesc]=useState('')
  const [newComCat,setNewComCat]=useState('')
  const [creating,setCreating]=useState(false)
  const submitCreate=async()=>{
    if(!newComName.trim()) return
    setCreating(true)
    try{
      const c=await createCommunity(myId,{name:newComName.trim(),description:newComDesc.trim(),category:newComCat.trim()})
      setAll(p=>[c,...p]); setMine(p=>[c,...p])
      setNewComName(''); setNewComDesc(''); setNewComCat('')
      setShowCreate(false); toast('Comunidade criada!')
    }catch(e){ toast('Erro: '+e.message) }
    setCreating(false)
  }

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
          <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontWeight:600}}
            onClick={()=>setShowCreate(v=>!v)}>+ criar comunidade</span>
        </div>
        {showCreate&&<div style={{padding:'12px 14px',borderBottom:`1px solid ${BRD}`,background:'#f8f9fc'}}>
          <div style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI,marginBottom:10}}>nova comunidade</div>
          {[['nome *','text',newComName,setNewComName],
            ['descrição','text',newComDesc,setNewComDesc],
            ['categoria','text',newComCat,setNewComCat]].map(([l,t,v,s])=>(
            <div key={l} style={{marginBottom:8}}>
              <label style={{fontSize:11,color:MUTED,fontFamily:F_UI,display:'block',marginBottom:3}}>{l}</label>
              <input style={inp} type={t} value={v} onChange={e=>s(e.target.value)}/>
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:10}}>
            <button style={{...btnBl,padding:'8px 16px',fontSize:13,flex:1}}
              onClick={submitCreate} disabled={creating}>
              {creating?'criando…':'criar'}
            </button>
            <button style={{...btnGh,padding:'8px 14px',fontSize:13}}
              onClick={()=>setShowCreate(false)}>cancelar</button>
          </div>
        </div>}
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

/* ── PHOTO TAG BAR ── */
function PhotoTagBar({ photoId, myId, ownerId }){
  const [tags,setTags]=useState([])
  const [showAdd,setShowAdd]=useState(false)
  const [query,setQuery]=useState('')
  const [results,setResults]=useState([])
  const canTag=myId===ownerId

  useEffect(()=>{ if(photoId) getPhotoTags(photoId).then(setTags) },[photoId])

  const [friends,setFriends]=useState([])
  useEffect(()=>{ getFriends(ownerId).then(f=>setFriends(f)) },[ownerId])

  useEffect(()=>{
    if(query.length<1){setResults([]);return}
    const q=query.toLowerCase()
    setResults(
      friends.filter(f=>f.name.toLowerCase().includes(q)&&!tags.find(tg=>tg.tagged_user?.id===f.id)).slice(0,5)
    )
  },[query,tags,friends])

  const doTag=async(u)=>{
    await tagFriendInPhoto(photoId,u.id,myId)
    setTags(p=>[...p,{id:Date.now()+'',tagged_user:u}])
    setQuery('');setResults([]);setShowAdd(false)
  }
  const doRemove=async(tag)=>{
    await removePhotoTag(photoId,tag.tagged_user?.id)
    setTags(p=>p.filter(t=>t.id!==tag.id))
  }
  return (
    <div style={{padding:'10px 12px',borderTop:`1px solid ${BRD}`,background:'#f8f9fc'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
        <span style={{fontSize:11,color:MUTED,fontFamily:F_UI}}>marcados:</span>
        {tags.length===0&&!showAdd&&<span style={{fontSize:11,color:MUTED,fontFamily:F_UI}}>—</span>}
        {tags.map(t=>(
          <span key={t.id} style={{display:'inline-flex',alignItems:'center',gap:4,
            background:WHITE,border:`1px solid ${BRD}`,borderRadius:10,
            padding:'3px 10px',fontSize:12,fontFamily:F_UI,color:BLUE}}>
            {t.tagged_user?.name}
            {canTag&&<span style={{cursor:'pointer',color:MUTED,marginLeft:3,fontSize:14,lineHeight:1}}
              onClick={()=>doRemove(t)}>×</span>}
          </span>
        ))}
      </div>
      {canTag&&!showAdd&&(
        <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
          onClick={()=>setShowAdd(true)}>+ marcar amigo</span>
      )}
      {canTag&&showAdd&&(
        <div style={{position:'relative',marginTop:6}}>
          <input style={{...inp,fontSize:13,padding:'6px 10px'}}
            value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="buscar amigo pelo nome…"/>
          {results.length>0&&(
            <div style={{position:'absolute',bottom:'100%',left:0,right:0,
              background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
              zIndex:9999,boxShadow:'0 -4px 12px rgba(0,0,0,.15)',maxHeight:200,overflowY:'auto'}}>
              {results.map(u=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,
                  padding:'10px 12px',cursor:'pointer',borderBottom:`1px solid ${BRD}`}}
                  onClick={()=>doTag(u)}>
                  <Av src={u.avatar_url} size={28} name={u.name} radius="50%"/>
                  <span style={{fontSize:13,fontFamily:F_UI,color:TEXT}}>{u.name}</span>
                </div>
              ))}
            </div>
          )}
          <button style={{...btnGh,marginTop:8,padding:'6px 14px',fontSize:12}}
            onClick={()=>{setShowAdd(false);setQuery('');setResults([])}}>cancelar</button>
        </div>
      )}
    </div>
  )
}

/* ── GALERIA — private albums backed by Supabase ── */
function GaleriaPage({ myId, userId, setPage, openAlbumId }){
  const isOwn=!userId||userId===myId
  const targetId=userId||myId
  const [albums,setAlbums]=useState([])
  const [activeAlbum,setActiveAlbum]=useState(null)
  const [photos,setPhotos]=useState([])
  const [signedPhotos,setSignedPhotos]=useState({})
  const [uploading,setUploading]=useState(false)
  const [creating,setCreating]=useState(false)
  const [newName,setNewName]=useState('')
  const [loading,setLoading]=useState(true)
  const [albumCovers,setAlbumCovers]=useState({})

  const loadAlbums=async()=>{
    const a=await getAlbums(targetId)
    setAlbums(a)
    setLoading(false)
    const covers={}
    for(const album of a){
      if(album.cover_path) covers[album.id]=await getSignedUrl(album.cover_path)
    }
    setAlbumCovers(covers)
  }
  useEffect(()=>{loadAlbums()},[targetId])

  // Open specific album if passed via navigation
  useEffect(()=>{
    if(openAlbumId&&albums.length){
      const a=albums.find(x=>x.id===openAlbumId)
      if(a) openAlbum(a)
    }
  },[openAlbumId,albums.length])

  const openAlbum=async(album)=>{
    setActiveAlbum(album)
    const ps=await getAlbumPhotos(album.id)
    setPhotos(ps)
    // Get signed URLs for all photos
    const urls={}
    for(const p of ps){
      urls[p.id]=await getSignedUrl(p.storage_path)
    }
    setSignedPhotos(urls)
  }

  const handleCreate=async()=>{
    if(!newName.trim())return
    const album=await createAlbum(myId,newName.trim())
    setNewName('');setCreating(false)
    await loadAlbums()
    openAlbum(album)
  }

  const handleUpload=async(e)=>{
    const files=[...e.target.files];if(!files.length||!activeAlbum)return
    setUploading(true)
    for(const file of files){
      const path=await uploadPhoto(myId,file)
      await addPhotoToAlbum(myId,activeAlbum.id,path,'')
    }
    await openAlbum(activeAlbum)
    await loadAlbums()
    setUploading(false)
  }

  const [selectedPhoto,setSelectedPhoto]=useState(null)

  const handleDeletePhoto=async(photoId,storagePath)=>{
    await deletePhoto(photoId)
    await supabase.storage.from('avatars').remove([storagePath])
    setPhotos(p=>p.filter(x=>x.id!==photoId))
  }

  // ── Album detail view ───────────────────────────────────────
  if(activeAlbum) return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:12,color:BLUE,cursor:'pointer'}} onClick={()=>setActiveAlbum(null)}>← álbuns</span>
            <span style={{fontWeight:700,fontSize:14,color:TEXT}}>{activeAlbum.name}</span>
            <span style={{fontSize:11,color:MUTED}}>({photos.length} fotos)</span>
          </div>
          {isOwn&&<label style={{...btnBl,padding:'3px 12px',fontSize:11,cursor:'pointer'}}>
            {uploading?'Enviando…':'+ adicionar fotos'}
            <input type="file" accept="image/*,video/*" multiple style={{display:'none'}} onChange={handleUpload}/>
          </label>}
        </div>
        {photos.length===0
          ?<div style={{padding:'40px',textAlign:'center',color:MUTED,fontSize:13}}>
            {isOwn?'Nenhuma foto ainda. Clique em "+ adicionar fotos".':'Nenhuma foto neste álbum.'}
          </div>
          :<div style={{padding:10,display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
            {photos.map(p=>(
              <div key={p.id} style={{position:'relative',borderRadius:2,overflow:'hidden',
                border:`1px solid ${BRD}`,aspectRatio:'1',background:'#f0f0f0',cursor:'pointer'}}
                onClick={()=>setSelectedPhoto(p)}>
                {signedPhotos[p.id]
                  ?<img src={signedPhotos[p.id]} alt=""
                      style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                  :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',
                      justifyContent:'center',color:MUTED,fontSize:11}}>…</div>
                }
                {isOwn&&<button onClick={e=>{e.stopPropagation();handleDeletePhoto(p.id,p.storage_path)}}
                  style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,.5)',
                    color:WHITE,border:'none',borderRadius:2,cursor:'pointer',
                    fontSize:10,padding:'2px 5px'}}>✕</button>}
              </div>
            ))}
          </div>}

        {/* Photo viewer with tagging */}
        {selectedPhoto&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.88)',
          zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={()=>setSelectedPhoto(null)}>
          <div style={{background:WHITE,borderRadius:4,overflow:'hidden',
            maxWidth:'min(96vw,540px)',width:'100%',display:'flex',flexDirection:'column'}}
            onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
              padding:'8px 12px',borderBottom:`1px solid ${BRD}`}}>
              <span style={{fontSize:12,color:MUTED,fontFamily:F_UI}}>{activeAlbum.name}</span>
              <span style={{fontSize:20,cursor:'pointer',color:MUTED,lineHeight:1}}
                onClick={()=>setSelectedPhoto(null)}>✕</span>
            </div>
            {/* Photo */}
            <div style={{background:'#111',display:'flex',alignItems:'center',justifyContent:'center',
              maxHeight:'60vh',overflow:'hidden'}}>
              {signedPhotos[selectedPhoto.id]
                ?<img src={signedPhotos[selectedPhoto.id]} alt=""
                    style={{maxWidth:'100%',maxHeight:'60vh',objectFit:'contain',display:'block'}}/>
                :<div style={{padding:40,color:'#888',fontSize:13}}>Carregando…</div>}
            </div>
            {/* TagBar — tagging section */}
            <PhotoTagBar photoId={selectedPhoto.id} myId={myId} ownerId={targetId}/>
          </div>
        </div>}
      </div>
    </div>
  )

  // ── Album list ──────────────────────────────────────────────
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',alignItems:'center',gap:10}}>
          {!isOwn&&<span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
            onClick={()=>setPage({name:'userprofile',userId:userId})}>← voltar</span>}
          <span style={{fontWeight:700,fontSize:14,color:TEXT}}>
            {isOwn?'meus álbuns':'álbuns'}
          </span>
        </div>
        <div style={{padding:'12px 14px'}}>
          {/* Upload options */}
          {isOwn&&<div style={{marginBottom:14,display:'flex',gap:8,flexWrap:'wrap'}}>
            {/* Single/multiple to Minhas fotos */}
            <label style={{...btnBl,cursor:'pointer',padding:'8px 16px',fontSize:13,
              display:'inline-flex',alignItems:'center',gap:6}}>
              📷 foto
              <input type="file" accept="image/*,video/*" style={{display:'none'}}
                onChange={async(e)=>{
                  const files=[...e.target.files]; if(!files.length) return
                  let defaultAlbum=albums.find(a=>a.name==='Minhas fotos')
                  if(!defaultAlbum){ defaultAlbum=await createAlbum(myId,'Minhas fotos'); await loadAlbums() }
                  setActiveAlbum(defaultAlbum); setUploading(true)
                  const path=await uploadPhoto(myId,files[0])
                  await addPhotoToAlbum(myId,defaultAlbum.id,path,'')
                  await openAlbum(defaultAlbum); await loadAlbums(); setUploading(false)
                }}/>
            </label>
            {/* Carousel post */}
            <label style={{...btnPk,cursor:'pointer',padding:'8px 16px',fontSize:13,
              display:'inline-flex',alignItems:'center',gap:6}}>
              ⊞ carrossel (até 10)
              <input type="file" accept="image/*,video/*" multiple style={{display:'none'}}
                onChange={async(e)=>{
                  const files=[...e.target.files].slice(0,10); if(!files.length) return
                  setUploading(true)
                  await uploadCarousel(myId,files)
                  await loadAlbums()
                  setUploading(false)
                }}/>
            </label>
            {uploading&&<span style={{fontSize:12,color:MUTED,alignSelf:'center'}}>Enviando…</span>}
          </div>}

          {/* Albums grid */}
          {loading
            ?<div style={{color:MUTED,fontSize:13}}>Carregando…</div>
            :<>
              {/* New album button — outside the grid */}
              {isOwn&&(creating
                ?<div style={{border:`1px solid ${BLUE}`,borderRadius:3,padding:10,
                    background:'#f0f4ff',marginBottom:10}}>
                  <input autoFocus style={{...inp,marginBottom:7}} value={newName}
                    onChange={e=>setNewName(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&handleCreate()} placeholder="Nome do álbum"/>
                  <div style={{display:'flex',gap:6}}>
                    <button style={{...btnBl,flex:1,fontSize:11}} onClick={handleCreate}>criar</button>
                    <button style={{...btnGh,flex:1,fontSize:11}} onClick={()=>setCreating(false)}>✕</button>
                  </div>
                </div>
                :<div style={{marginBottom:10}}>
                  <button style={{...btnBl,padding:'6px 16px',fontSize:13}}
                    onClick={()=>setCreating(true)}>+ novo álbum</button>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
              {albums.filter(a=>a.name!=='__posts__').map(a=>{
                const count=a.photo_count?.[0]?.count||0
                const coverUrl=albumCovers[a.id]
                const isMine=a.name==='Minhas fotos'
                return (
                  <div key={a.id} style={{
                    border:`1px solid ${isMine&&isOwn?PINK:BRD}`,
                    borderRadius:3,overflow:'hidden',background:WHITE,
                    display:'flex',flexDirection:'column',
                    boxShadow:isMine&&isOwn?`0 0 0 2px ${PINK}`:'none',
                    position:'relative'}}>
                    {/* Cover */}
                    <div style={{aspectRatio:'1',background:'#e8edf8',overflow:'hidden',
                      cursor:'pointer',position:'relative'}}
                      onClick={()=>openAlbum(a)}>
                      {coverUrl
                        ?<img src={coverUrl} alt="" style={{width:'100%',height:'100%',
                            objectFit:'cover',display:'block'}}/>
                        :<div style={{width:'100%',height:'100%',display:'flex',
                            alignItems:'center',justifyContent:'center',
                            fontSize:36,color:'#c0c8d8'}}>
                          {isMine?'📷':'🖼️'}
                        </div>}
                    </div>
                    {/* Info row */}
                    <div style={{padding:'6px 8px',flex:1,display:'flex',
                      flexDirection:'column',justifyContent:'space-between'}}>
                      <div style={{fontSize:12,fontWeight:600,
                        color:isMine&&isOwn?PINK:TEXT,
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                        cursor:'pointer',marginBottom:2}}
                        onClick={()=>openAlbum(a)}>
                        {isMine&&!isOwn?'fotos':a.name}
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:10,color:MUTED}}>{count} fotos</span>
                        {isOwn&&count===0&&<span style={{fontSize:10,color:'#cc0000',
                          cursor:'pointer',fontFamily:F_UI}}
                          onClick={async e=>{
                            e.stopPropagation()
                            await deleteAlbum(a.id)
                            setAlbums(p=>p.filter(x=>x.id!==a.id))
                          }}>apagar</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
              </div>
            </>}
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

/* ── FANS PAGE ── */
function FansPage({ userId, myId, setPage }){
  const [fans,setFans]=useState([])
  const [loading,setLoading]=useState(true)
  const [name,setName]=useState('')

  useEffect(()=>{
    getProfile(userId).then(p=>setName(p?.name||''))
    getFans(userId).then(data=>{ setFans(data); setLoading(false) })
  },[userId])

  const isOwn=userId===myId

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
            onClick={()=>setPage(isOwn?'profile':{name:'userprofile',userId})}>← voltar</span>
          <span style={{fontWeight:700,fontSize:14,color:TEXT,fontFamily:F_UI}}>
            {isOwn?'meus fãs':`fãs de ${name}`}
          </span>
          <span style={{fontSize:12,color:MUTED,fontFamily:F_UI}}>({fans.length})</span>
        </div>
        {loading
          ?<div style={{padding:20,color:MUTED,fontFamily:F_UI,fontSize:13}}>Carregando…</div>
          :fans.length===0
            ?<div style={{padding:24,textAlign:'center',color:MUTED,fontFamily:F_UI,fontSize:13}}>
              {isOwn?'Você ainda não tem fãs.':'Nenhum fã ainda.'}
            </div>
            :fans.map((f,i)=>(
              <div key={f.id} onClick={()=>setPage({name:'userprofile',userId:f.id})}
                style={{display:'flex',gap:12,padding:'10px 14px',cursor:'pointer',
                  alignItems:'center',
                  borderBottom:i<fans.length-1?`1px solid ${BRD}`:'none'}}>
                <Av src={f.avatar_url} size={44} name={f.name} radius="50%"/>
                <div style={{fontWeight:700,fontSize:13,fontFamily:F_UI,color:BLUE}}>{f.name}</div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

/* ── TAGGED PHOTOS PAGE ── */
function TaggedPhotosPage({ myId, setPage }){
  const [photos,setPhotos]=useState([])
  const [signedUrls,setSignedUrls]=useState({})
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    getTaggedPhotos(myId).then(async data=>{
      setPhotos(data)
      const urls={}
      for(const p of data){
        if(p.storage_path) urls[p.id]=await getSignedUrl(p.storage_path)
      }
      setSignedUrls(urls)
      setLoading(false)
    })
  },[myId])
  return (
    <div style={{maxWidth:980,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:BLUE,cursor:'pointer',fontFamily:F_UI}}
            onClick={()=>setPage('home')}>← início</span>
          <span style={{fontWeight:700,fontSize:14,color:TEXT,fontFamily:F_UI}}>
            fotos de mim ({photos.length})
          </span>
        </div>
        {loading
          ?<div style={{padding:24,color:MUTED,fontFamily:F_UI,fontSize:13}}>Carregando…</div>
          :photos.length===0
            ?<div style={{padding:24,textAlign:'center',color:MUTED,fontFamily:F_UI,fontSize:13}}>
              Você não foi marcado(a) em nenhuma foto ainda.
            </div>
            :<div style={{padding:'12px',display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
              {photos.map(p=>(
                <div key={p.id} style={{cursor:'pointer'}}
                  onClick={()=>setPage({name:'galeria',userId:p.album?.user_id})}>
                  <div style={{aspectRatio:'1',overflow:'hidden',borderRadius:3,
                    boxShadow:'0 0 0 3px white,0 0 0 4px #c8d0e0',background:'#eee'}}>
                    {signedUrls[p.id]
                      ?<img src={signedUrls[p.id]} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                      :<div style={{width:'100%',height:'100%',background:'#e8edf0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📷</div>}
                  </div>
                  <div style={{fontSize:10,color:MUTED,fontFamily:F_UI,marginTop:4,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {p.album?.name} · {p.album?.owner?.name}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  )
}

/* ── INBOX PAGE ── */
function InboxPage({ myId, setPage }){
  const [threads,setThreads]=useState([])
  const [loading,setLoading]=useState(true)

  useEffect(()=>{
    getMessageThreads(myId).then(data=>{
      setThreads(data)
      setLoading(false)
    })
  },[myId])

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        <div style={{background:RH_BG,borderBottom:`1px solid ${RH_BRD}`,padding:'6px 12px',
          fontWeight:700,fontSize:14,color:TEXT,fontFamily:F_UI}}>
          mensagens
        </div>
        {loading
          ?<div style={{padding:20,color:MUTED,fontFamily:F_UI,fontSize:13}}>Carregando…</div>
          :threads.length===0
            ?<div style={{padding:24,textAlign:'center',color:MUTED,fontFamily:F_UI,fontSize:13}}>
              Nenhuma mensagem ainda.
            </div>
            :threads.map((t,i)=>(
              <div key={t.partnerId} onClick={()=>setPage({name:'userprofile',userId:t.partnerId})}
                style={{display:'flex',gap:12,padding:'12px 14px',cursor:'pointer',
                  alignItems:'center',borderBottom:i<threads.length-1?`1px solid ${BRD}`:'none',
                  background:'transparent'}}>
                <Av src={t.partner?.avatar_url} size={44} name={t.partner?.name} radius="50%"/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:F_UI,
                    color:BLUE,marginBottom:2}}>{t.partner?.name}</div>
                  <div style={{fontSize:12,fontFamily:F_UI,color:MUTED,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {t.lastMsg.from_id===myId?'Você: ':''}{t.lastMsg.text}
                  </div>
                </div>
                <div style={{fontSize:10,fontFamily:F_UI,color:MUTED,flexShrink:0}}>
                  {new Date(t.lastMsg.created_at).toLocaleDateString('pt-BR',{
                    day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

/* ── CAROUSEL VIEWER ── */
function Carousel({ photos, signedUrls }){
  const [idx,setIdx]=useState(0)
  const total=photos.length
  if(!total) return null
  const url=signedUrls[photos[idx]?.id]
  return (
    <div style={{position:'relative',background:'#111',userSelect:'none'}}>
      {/* Photo */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',
        minHeight:260,maxHeight:480,overflow:'hidden'}}>
        {url
          ?<img src={url} alt="" style={{width:'100%',maxHeight:480,objectFit:'contain',display:'block'}}/>
          :<div style={{padding:60,color:'#888',fontSize:13}}>Carregando…</div>}
      </div>
      {/* Prev / Next arrows */}
      {total>1&&<>
        <button onClick={()=>setIdx(i=>(i-1+total)%total)} style={{
          position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',
          background:'rgba(0,0,0,.45)',border:'none',color:WHITE,
          borderRadius:'50%',width:32,height:32,cursor:'pointer',
          fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <button onClick={()=>setIdx(i=>(i+1)%total)} style={{
          position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',
          background:'rgba(0,0,0,.45)',border:'none',color:WHITE,
          borderRadius:'50%',width:32,height:32,cursor:'pointer',
          fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
        {/* Dots */}
        <div style={{position:'absolute',bottom:8,left:0,right:0,
          display:'flex',justifyContent:'center',gap:5}}>
          {photos.map((_,i)=>(
            <div key={i} onClick={()=>setIdx(i)} style={{
              width:i===idx?18:7,height:7,borderRadius:4,cursor:'pointer',
              background:i===idx?WHITE:'rgba(255,255,255,.45)',
              transition:'all .2s'}}/>
          ))}
        </div>
        {/* Counter */}
        <div style={{position:'absolute',top:8,right:10,
          background:'rgba(0,0,0,.45)',color:WHITE,fontSize:11,
          padding:'2px 7px',borderRadius:10,fontFamily:F_UI}}>
          {idx+1}/{total}
        </div>
      </>}
    </div>
  )
}

/* ── QUICK POST MODAL ── */
function QuickPostModal({ myId, onClose, onPosted, toast }){
  const [mode,setMode]=useState(null) // null | 'single' | 'carousel'
  const [temporary,setTemporary]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [files,setFiles]=useState([])
  const [previews,setPreviews]=useState([])

  const getExpiry=()=>temporary?new Date(Date.now()+24*60*60*1000).toISOString():null

  const handleFiles=(e,isCarousel)=>{
    const f=[...e.target.files].slice(0,isCarousel?10:1)
    setFiles(f)
    setPreviews(f.map(x=>URL.createObjectURL(x)))
    setMode(isCarousel?'carousel':'single')
  }

  const post=async()=>{
    if(!files.length) return
    setUploading(true)
    const expiry=getExpiry()
    try{
      if(mode==='carousel'){
        await uploadCarousel(myId,files,expiry)
      } else {
        const albumId=await getOrCreatePostsAlbum(myId)
        const path=await uploadPhoto(myId,files[0])
        await addPhotoToAlbum(myId,albumId,path,'',expiry)
      }
      toast(temporary?'Post publicado! Expira em 24h 🕐':'Post publicado!')
      onPosted()
      onClose()
    }catch(e){ toast('Erro ao publicar.') }
    setUploading(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',
      zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
      onClick={onClose}>
      <div style={{background:WHITE,borderRadius:'12px 12px 0 0',width:'100%',
        maxWidth:480,padding:'20px 16px 32px'}}
        onClick={e=>e.stopPropagation()}>
        {/* Handle bar */}
        <div style={{width:36,height:4,background:'#c8d0e0',borderRadius:2,
          margin:'0 auto 16px'}}/>
        <div style={{fontWeight:700,fontSize:16,fontFamily:F_UI,
          color:TEXT,marginBottom:16,textAlign:'center'}}>nova publicação</div>

        {!mode&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
          <label style={{display:'flex',alignItems:'center',gap:10,
            padding:'12px 14px',border:`1px solid ${BRD}`,borderRadius:8,
            cursor:'pointer',background:'#f8f9fc'}}>
            <span style={{fontSize:22}}>📷</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,fontFamily:F_UI,color:TEXT}}>foto</div>
              <div style={{fontSize:10,color:MUTED,fontFamily:F_UI}}>1 imagem</div>
            </div>
            <input type="file" accept="image/*" style={{display:'none'}}
              onChange={e=>handleFiles(e,false)}/>
          </label>
          <label style={{display:'flex',alignItems:'center',gap:10,
            padding:'12px 14px',border:`1px solid ${PINK}`,borderRadius:8,
            cursor:'pointer',background:'#fef0f7'}}>
            <span style={{fontSize:22}}>⊞</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,fontFamily:F_UI,color:PINK}}>carrossel</div>
              <div style={{fontSize:10,color:MUTED,fontFamily:F_UI}}>até 10 fotos</div>
            </div>
            <input type="file" accept="image/*" multiple style={{display:'none'}}
              onChange={e=>handleFiles(e,true)}/>
          </label>
        </div>}

        {previews.length>0&&<div style={{marginBottom:14}}>
          <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4}}>
            {previews.map((p,i)=>(
              <img key={i} src={p} alt="" style={{width:72,height:72,
                objectFit:'cover',borderRadius:6,flexShrink:0,
                border:`2px solid ${i===0?BLUE:BRD}`}}/>
            ))}
          </div>
          <div style={{fontSize:11,color:MUTED,fontFamily:F_UI,marginTop:4}}>
            {files.length} foto{files.length!==1?'s':''} selecionada{files.length!==1?'s':''}
          </div>
        </div>}

        {/* Temporary toggle */}
        {mode&&<div style={{display:'flex',alignItems:'center',gap:10,
          marginBottom:16,padding:'10px 12px',background:'#f8f9fc',
          borderRadius:8,border:`1px solid ${BRD}`,cursor:'pointer'}}
          onClick={()=>setTemporary(v=>!v)}>
          <div style={{width:38,height:22,borderRadius:11,
            background:temporary?BLUE:'#c8d0e0',
            position:'relative',transition:'background .2s',flexShrink:0}}>
            <div style={{position:'absolute',top:3,
              left:temporary?18:3,width:16,height:16,
              borderRadius:'50%',background:WHITE,transition:'left .2s'}}/>
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:600,fontFamily:F_UI,color:TEXT}}>
              🕐 post temporário
            </div>
            <div style={{fontSize:11,color:MUTED,fontFamily:F_UI}}>
              {temporary?'expira em 24 horas':'permanente'}
            </div>
          </div>
        </div>}

        {mode&&<div style={{display:'flex',gap:8}}>
          <button style={{...btnGh,flex:1,padding:'10px',fontSize:13}}
            onClick={()=>{setMode(null);setFiles([]);setPreviews([])}}>
            ← escolher outro
          </button>
          <button style={{...btnPk,flex:2,padding:'10px',fontSize:13}}
            onClick={post} disabled={uploading||!files.length}>
            {uploading?'Publicando…':'publicar'}
          </button>
        </div>}
      </div>
    </div>
  )
}

/* ── FOTOS FEED — mobile chronological photo feed ── */
function FotosFeed({ myId, setPage }){
  const [feedTab,setFeedTab]=useState('amigos')
  const [showPost,setShowPost]=useState(false)
  const [posts,setPosts]=useState([])
  const [signedUrls,setSignedUrls]=useState({})
  const [feedPage,setFeedPage]=useState(0)
  const [loading,setLoading]=useState(true)
  const [loadingMore,setLoadingMore]=useState(false)
  const [hasMore,setHasMore]=useState(true)
  const [openComments,setOpenComments]=useState(null)
  const [comments,setComments]=useState({})
  const [commentText,setCommentText]=useState('')
  const PAGE_SIZE=10

  const resolvePostUrls=async(data)=>{
    const urls={}
    for(const p of data){
      for(const photo of (p.photos||[p])){
        if(photo.storage_path&&!signedUrls[photo.id])
          urls[photo.id]=await getSignedUrl(photo.storage_path)
      }
    }
    setSignedUrls(prev=>({...prev,...urls}))
  }

  useEffect(()=>{ setPosts([]); setFeedPage(0); setSignedUrls({}) },[feedTab])

  useEffect(()=>{
    if(!myId) return
    setLoading(true)
    const loader=feedTab==='meus'
      ?getMyFeed(myId,feedPage,PAGE_SIZE)
      :getFotosFeedWithCarousels(myId,feedPage,PAGE_SIZE)
    loader.then(async data=>{
      await resolvePostUrls(data)
      setPosts(prev=>feedPage===0?data:[...prev,...data])
      setHasMore(data.length===PAGE_SIZE)
      setLoading(false)
      setLoadingMore(false)
    })
  },[myId,feedPage,feedTab])

  const loadMore=()=>{ setLoadingMore(true); setFeedPage(p=>p+1) }

  const toggleComments=async(photoId)=>{
    if(openComments===photoId){ setOpenComments(null); return }
    setOpenComments(photoId)
    if(!comments[photoId]){
      const data=await getPhotoComments(photoId)
      setComments(prev=>({...prev,[photoId]:data}))
    }
  }

  const submitComment=async(photoId)=>{
    if(!commentText.trim()) return
    const c=await addPhotoComment(myId,photoId,commentText.trim())
    setComments(prev=>({...prev,[photoId]:[...(prev[photoId]||[]),{
      ...c, author:{id:myId,name:'Você',avatar_url:null}
    }]}))
    setCommentText('')
  }

  const deletePost=async(post)=>{
    if(post.isCarousel) await deleteCarousel(post.photos[0].carousel_id)
    else await deletePhoto(post.id)
    setPosts(p=>p.filter(x=>
      post.isCarousel
        ?x.photos?.[0]?.carousel_id!==post.photos[0].carousel_id
        :x.id!==post.id
    ))
  }

  if(loading) return (
    <div style={{padding:40,textAlign:'center',color:MUTED,fontFamily:F_UI}}>Carregando…</div>
  )

  return (
    <div style={{maxWidth:600,margin:'0 auto',padding:'8px'}}>
      {/* Tabs + Post button */}
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
        marginBottom:10,overflow:'hidden'}}>
        <div style={{display:'flex',borderBottom:`1px solid ${BRD}`,alignItems:'center'}}>
          {[['amigos','amigos'],['meus posts','meus']].map(([label,tab])=>(
            <div key={tab} onClick={()=>setFeedTab(tab)} style={{
              flex:1,padding:'9px',cursor:'pointer',fontSize:13,fontWeight:700,
              fontFamily:F_UI,color:feedTab===tab?BLUE:MUTED,textAlign:'center',
              background:feedTab===tab?'#fce8f3':'transparent',
              borderBottom:feedTab===tab?`2px solid ${BLUE}`:'2px solid transparent',
              boxSizing:'border-box'}}>
              {label}
            </div>
          ))}
          <button style={{...btnPk,margin:'0 8px',padding:'5px 12px',fontSize:12,flexShrink:0}}
            onClick={()=>setShowPost(true)}>+ post</button>
        </div>
      </div>
      {showPost&&<QuickPostModal myId={myId}
        onClose={()=>setShowPost(false)}
        onPosted={()=>{setPosts([]);setFeedPage(0);setFeedTab('meus')}}
        toast={msg=>{}}/>}

      {posts.length===0&&!loading&&(
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
          padding:32,textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:12}}>🖼️</div>
          <div style={{fontSize:13,color:MUTED,fontFamily:F_UI}}>
            {feedTab==='meus'
              ?'Você ainda não postou nenhuma foto.'
              :'Nenhuma foto de amigos ainda.'}
          </div>
        </div>
      )}

      {posts.map(post=>{
        const firstPhotoId=post.isCarousel?post.photos[0]?.id:post.id
        const url=signedUrls[post.id]
        const isOpen=openComments===firstPhotoId
        const photoComments=comments[firstPhotoId]||[]
        const author=post.user

        return (
          <div key={post.isCarousel?post.photos[0]?.carousel_id:post.id}
            style={{background:WHITE,border:`1px solid ${BRD}`,
              borderRadius:3,marginBottom:12,overflow:'hidden'}}>

            {/* Header */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px'}}>
              <div style={{cursor:'pointer',flexShrink:0}}
                onClick={()=>setPage({name:'userprofile',userId:author?.id})}>
                <Av src={author?.avatar_url} size={36} name={author?.name} radius="50%"/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,fontFamily:F_UI,color:BLUE,cursor:'pointer'}}
                  onClick={()=>setPage({name:'userprofile',userId:author?.id})}>
                  {author?.name}
                </div>
                <div style={{fontSize:11,fontFamily:F_UI,color:MUTED}}>
                  {post.album?.name==='__posts__'?'post':post.album?.name}
                  {post.expires_at&&<span style={{marginLeft:6,fontSize:10,
                    background:'#fff3cd',borderRadius:4,padding:'1px 6px',color:'#856404'}}>
                    🕐 {Math.max(0,Math.round((new Date(post.expires_at)-Date.now())/3600000))}h
                  </span>}
                  {' · '}{new Date(post.created_at).toLocaleDateString('pt-BR',{
                    day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  {post.isCarousel&&<span style={{marginLeft:6,fontSize:10,
                    background:'#e8edf7',borderRadius:4,padding:'1px 6px',color:BLUE}}>
                    ⊞ {post.photos.length} fotos
                  </span>}
                </div>
              </div>
            </div>

            {/* Photo or Carousel */}
            {post.isCarousel
              ?<Carousel photos={post.photos} signedUrls={signedUrls}/>
              :<div style={{padding:'0 10px 10px'}}>
                <div style={{padding:6,background:WHITE,
                  boxShadow:'0 0 0 1px #e0e4ee,2px 2px 6px rgba(0,0,0,.1)',borderRadius:1}}>
                  {signedUrls[post.id]
                    ?<img src={signedUrls[post.id]} alt=""
                        style={{width:'100%',display:'block',borderRadius:1,
                          maxHeight:480,objectFit:'cover'}}/>
                    :<div style={{height:200,background:'#f0f0f0',display:'flex',
                        alignItems:'center',justifyContent:'center',color:MUTED,fontSize:12}}>
                      Carregando…</div>}
                </div>
              </div>
            }

            {/* Actions */}
            <div style={{display:'flex',alignItems:'center',
              justifyContent:'space-between',padding:'6px 14px 10px',
              borderTop:`1px solid ${BRD}`}}>
              <button onClick={()=>toggleComments(firstPhotoId)} style={{
                ...btnGh,padding:'3px 10px',fontSize:11,fontFamily:F_BTN,
                color:isOpen?BLUE:MUTED,borderColor:isOpen?BLUE:BRD}}>
                💬 {photoComments.length>0?photoComments.length:''} comentários
              </button>
              {feedTab==='meus'&&<button style={{
                ...btnGh,padding:'3px 10px',fontSize:11,
                color:'#cc0000',borderColor:'#cc0000'}}
                onClick={()=>deletePost(post)}>
                apagar
              </button>}
            </div>

            {/* Comments */}
            {isOpen&&<div style={{borderTop:`1px solid ${BRD}`,background:'#f8f9fc',padding:'8px 12px'}}>
              {photoComments.length===0
                ?<div style={{fontSize:12,color:MUTED,fontFamily:F_UI,marginBottom:8}}>
                  Nenhum comentário ainda.
                </div>
                :photoComments.map(c=>(
                  <div key={c.id} style={{display:'flex',gap:8,marginBottom:8,alignItems:'flex-start'}}>
                    <Av src={c.author?.avatar_url} size={24} name={c.author?.name} radius="50%"/>
                    <div style={{flex:1,background:WHITE,borderRadius:3,
                      padding:'5px 9px',border:`1px solid ${BRD}`}}>
                      <div style={{fontWeight:700,fontSize:11,color:BLUE,
                        fontFamily:F_UI,marginBottom:2}}>{c.author?.name}</div>
                      <div style={{fontSize:12,color:TEXT,fontFamily:F_UI}}>{c.text}</div>
                    </div>
                  </div>
                ))
              }
              <div style={{display:'flex',gap:6,marginTop:6}}>
                <input style={{...inp,flex:1,fontSize:12,padding:'5px 8px'}}
                  value={commentText} onChange={e=>setCommentText(e.target.value)}
                  placeholder="comentar…"
                  onKeyDown={e=>e.key==='Enter'&&submitComment(firstPhotoId)}/>
                <button style={{...btnBl,padding:'5px 12px',fontSize:12}}
                  onClick={()=>submitComment(firstPhotoId)}>→</button>
              </div>
            </div>}
          </div>
        )
      })}

      {hasMore&&!loading&&(
        <div style={{textAlign:'center',padding:'10px 0'}}>
          <button style={{...btnGh,padding:'6px 24px',fontSize:12}}
            onClick={loadMore} disabled={loadingMore}>
            {loadingMore?'Carregando…':'ver mais'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── INCOMING CHAT POPUP ── */
function IncomingChatPopup({ chat, onOpen, onClose }){
  useEffect(()=>{
    const t=setTimeout(onClose, 8000)
    return()=>clearTimeout(t)
  },[])
  return (
    <div style={{position:'fixed',bottom:24,right:24,zIndex:9999,
      background:WHITE,border:`1.5px solid ${BLUE}`,borderRadius:4,
      boxShadow:'0 4px 20px rgba(0,0,0,.18)',overflow:'hidden',
      width:280,fontFamily:F_UI}}>
      <div style={{background:BLUE,padding:'8px 12px',display:'flex',
        justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <Av src={chat.sender?.avatar_url} size={22} name={chat.sender?.name} radius="50%"/>
          <span style={{color:WHITE,fontWeight:700,fontSize:12}}>{chat.sender?.name}</span>
        </div>
        <span style={{color:'rgba(255,255,255,.7)',cursor:'pointer',fontSize:14}}
          onClick={onClose}>✕</span>
      </div>
      <div style={{padding:'10px 12px'}}>
        <div style={{fontSize:13,color:TEXT,lineHeight:1.5,marginBottom:10,
          overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',
          WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{chat.text}</div>
        <button style={{...btnBl,width:'100%',padding:'6px',fontSize:12}}
          onClick={onOpen} style={{display:'none'}}>💬 responder</button>
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

/* ── FARM CSS ── */
const FarmStyle=()=><style>{`
  @keyframes coinFloat {
    0%   { opacity:1; transform:translateX(-50%) translateY(0); }
    100% { opacity:0; transform:translateX(-50%) translateY(-60px); }
  }
  @keyframes weedPop {
    0%   { transform:scale(0) rotate(-20deg); }
    60%  { transform:scale(1.2) rotate(5deg); }
    100% { transform:scale(1) rotate(0deg); }
  }
`}</style>

/* ── CROP ANIMATOR — 2-frame sprite ── */
function CropAnim({ f1, f2, sz, speed, id }){
  const [frame,setFrame]=useState(0)
  useEffect(()=>{
    const t=setInterval(()=>setFrame(f=>1-f), speed*500)
    return()=>clearInterval(t)
  },[speed])
  const emoji=frame===0?f1:f2
  const rotate=frame===0?-2:2
  const scale=frame===0?1:1.08
  return (
    <span style={{
      fontSize:sz,lineHeight:1,display:'inline-block',
      transform:`scale(${scale}) rotate(${rotate}deg)`,
      transition:`transform ${speed*0.4}s ease`,
      userSelect:'none',
    }}>{emoji}</span>
  )
}

/* ── FAZENDINHA PAGE ── */
function FazendinhaPage({ myId, setPage, userId }){
  const isOwn = userId === myId
  const [farm, setFarm] = useState(null)
  const [plots, setPlots] = useState([])
  const [animals, setAnimals] = useState([])
  const [actions, setActions] = useState([])
  const [genPoints, setGenPoints] = useState(0)
  const [popularity, setPopularity] = useState(0)
  const [tab, setTab] = useState('farm') // farm | market | leaderboard
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [activeTool, setActiveTool] = useState('harvest') // plant|water|harvest|clean
  const [coinAnim, setCoinAnim] = useState(null)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)
  const [myFarm, setMyFarm] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = async () => {
    const f = await getOrCreateFarm(userId)
    setFarm(f)
    if (!isOwn) { const mf = await getOrCreateFarm(myId); setMyFarm(mf) }
    await checkReadyPlots(f.id)
    const [p, a, acts, g] = await Promise.all([
      getPlots(f.id), getAnimals(f.id),
      getFarmActions(f.id), getGenerosityPoints(isOwn ? myId : userId)
    ])
    setPlots(p); setAnimals(a); setActions(acts)
    setGenPoints(g.total_earned); setPopularity(g.total_earned*10); setLoading(false)
    // Warn if withered plots
    const withered=(await getPlots(f.id)).filter(p=>p.state==='withered')
    if(withered.length>0) showToast(`⚠️ ${withered.length} planta(s) murcharam! Use limpar.`)
  }

  useEffect(() => { load() }, [userId])

  // Timer to refresh ready plots every 30s + random weed spawn
  useEffect(() => {
    const t = setInterval(async () => {
      if (!farm) return
      await checkReadyPlots(farm.id)
      // 8% chance per refresh that a planted plot gets a weed
      const p = await getPlots(farm.id)
      for (const plot of p) {
        if (plot.state === 'planted' && Math.random() < 0.08) {
          await supabase.from('plots').update({state:'weed'}).eq('id',plot.id)
        }
      }
      // Wither check handled in checkReadyPlots
      setPlots(await getPlots(farm.id))
    }, 30000)
    return () => clearInterval(t)
  }, [farm])

  const triggerCoin = (val) => {
    setCoinAnim(val)
    setTimeout(() => setCoinAnim(null), 1200)
  }

  const handlePlotClick = async (plot) => {
    if (!farm) return
    if (isOwn) {
      if (activeTool === 'plant' || (activeTool === null && plot.state === 'empty')) {
        setSelectedPlot(plot); setTab('market')
      } else if (activeTool === 'harvest' || (activeTool === null && plot.state === 'ready')) {
        if (plot.state !== 'ready') { showToast('Ainda não está pronto!'); return }
        const r = await harvestOwnPlot(plot.id, myId)
        if (r) { triggerCoin(r.crop.value); load() }
      } else if (activeTool === 'water') {
        if (plot.state !== 'planted') { showToast('Nada para regar aqui!'); return }
        // Water speeds up grow by 20% — update ready_at
        const crop = CROPS[plot.crop_type]
        if (!crop) return
        const newReady = new Date(new Date(plot.ready_at).getTime() - crop.growHours*3600000*0.2).toISOString()
        await supabase.from('plots').update({ready_at:newReady}).eq('id',plot.id)
        showToast('💧 Regado! +20% velocidade'); load()
      } else if (activeTool === 'clean') {
        if (plot.state !== 'weed' && plot.state !== 'withered') { showToast('Nada para limpar aqui!'); return }
        await supabase.from('plots').update({state:'empty',crop_type:null,planted_at:null,ready_at:null}).eq('id',plot.id)
        const msg = plot.state==='withered'?'🪣 Planta murcha removida!':'🪣 Praga removida!'
        showToast(msg); load()
      } else if (plot.state === 'empty') {
        setSelectedPlot(plot); setTab('market')
      } else if (plot.state === 'ready') {
        const r = await harvestOwnPlot(plot.id, myId)
        if (r) { triggerCoin(r.crop.value); load() }
      }
    } else {
      if (plot.state !== 'ready') return
      setSelectedPlot(plot)
    }
  }

  const handleSteal = async (plot) => {
    const r = await stealCrop(plot.id, farm.id, myId)
    if (r) { showToast(`Roubou ${r.crop.emoji} +${r.value} moedas 🦹`); setSelectedPlot(null); load() }
  }

  const handleGift = async (plot) => {
    const farmOwner = farm.user_id
    const r = await giftHarvest(plot.id, farm.id, myId, farmOwner)
    if (r) { showToast(`Colheu pra eles +${r.bonus} moedas 🤝`); setSelectedPlot(null); load() }
  }

  const handleCollect = async (animal) => {
    const r = await collectAnimal(animal.id, isOwn ? myId : null)
    if (r) { showToast(`+${r.animal.value} moedas ${r.animal.emoji}`); load() }
    else showToast('Ainda não está pronto!')
  }

  const handlePlant = async (cropType) => {
    if (!selectedPlot || !farm) return
    const crop = CROPS[cropType]
    if ((myFarm || farm).coins < crop.cost) { showToast('Moedas insuficientes!'); return }
    await plantCrop(selectedPlot.id, cropType, myId)
    showToast(`${crop.emoji} plantado! Pronto em ${crop.growHours < 1 ? crop.growHours*60+'min' : crop.growHours+'h'}`)
    setSelectedPlot(null); setTab('farm'); load()
  }

  const handleBuyAnimal = async (type) => {
    const cat = ANIMALS[type]
    if ((myFarm || farm).coins < cat.cost) { showToast('Moedas insuficientes!'); return }
    await buyAnimal(farm.id, type, myId)
    showToast(`${cat.emoji} ${cat.name} comprada!`); load()
  }

  const timeLeft = (readyAt) => {
    const diff = new Date(readyAt) - Date.now()
    if (diff <= 0) return 'pronto!'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}h${m}m` : `${m}m`
  }

  const plotColor = (plot) => {
    if (plot.state === 'empty') return '#3d1f08'
    if (plot.state === 'planted') return '#2d5a18'
    if (plot.state === 'weed') return '#1a4010'
    if (plot.state === 'withered') return '#2a1005'
    return '#2d5a18' // ready — stays green, glow handles it
  }

  const coinsBal = isOwn ? farm?.coins : myFarm?.coins

  if (loading) return <div style={{padding:40,textAlign:'center',color:MUTED,fontFamily:F_UI}}>Carregando fazenda…</div>

  return (
    <div style={{maxWidth:700,margin:'0 auto',padding:'8px'}}>
      <FarmStyle/>
      {/* Toast */}
      {toast&&<div style={{position:'fixed',top:60,left:'50%',transform:'translateX(-50%)',
        background:'#2a3f6f',color:WHITE,padding:'8px 20px',borderRadius:20,
        fontSize:13,fontFamily:F_UI,fontWeight:700,zIndex:9999,
        boxShadow:'0 2px 12px rgba(0,0,0,.2)'}}>{toast}</div>}

      {/* Header */}
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
        marginBottom:8,overflow:'hidden'}}>
        <div style={{background:'#5a8a3c',padding:'8px 14px',
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
          <div>
            <span style={{fontSize:15,fontWeight:700,color:WHITE,fontFamily:F_UI}}>
              🌾 {isOwn?'Minha Fazendinha':'Fazenda do amigo'}
            </span>
            {!isOwn&&<span style={{fontSize:11,color:'rgba(255,255,255,.7)',
              marginLeft:8,fontFamily:F_UI}}>nível {farm?.level}</span>}
          </div>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            {isOwn&&<span style={{fontSize:13,color:WHITE,fontFamily:F_UI}}>
              💰 {farm?.coins} &nbsp;⭐ nível {farm?.level} &nbsp;🌟 pop {popularity}
            </span>}
            {!isOwn&&<span style={{fontSize:13,color:WHITE,fontFamily:F_UI}}>
              💰 {coinsBal} moedas
            </span>}
            {!isOwn&&<button style={{...btnGh,fontSize:11,padding:'3px 10px',color:WHITE,borderColor:'rgba(255,255,255,.4)'}}
              onClick={()=>setPage({name:'userprofile',userId})}>← perfil</button>}
          </div>
        </div>

        {/* XP bar — own only */}
        {isOwn&&farm&&<div style={{height:4,background:'#e0e6d0'}}>
          <div style={{height:4,background:'#5a8a3c',
            width:`${Math.min(100,(farm.xp%(farm.level*100))/(farm.level*100)*100)}%`,
            transition:'width .5s'}}/>
        </div>}

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:`1px solid ${BRD}`}}>
          {(isOwn?[['🌾 Fazenda','farm'],['🏪 Mercado','market'],['🏆 Ranking','leaderboard'],['📜 Histórico','history']]
                 :[['🌾 Fazenda','farm'],['📜 Histórico','history']]).map(([l,t])=>(
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:'8px 14px',cursor:'pointer',fontSize:12,fontFamily:F_UI,fontWeight:700,
              color:tab===t?'#5a8a3c':MUTED,
              borderBottom:tab===t?'2px solid #5a8a3c':'2px solid transparent',
              boxSizing:'border-box'}}>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* ── FARM TAB ── */}
      {tab==='farm'&&<>
        {/* ── FARM VISUAL ── */}
        <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
          marginBottom:8,overflow:'hidden'}}>

          {/* Farm — OG Colheita Feliz style */}
          <div style={{
            background:'linear-gradient(180deg,#a8d878 0%,#7cbd4a 60%,#5a9a2a 100%)',
            padding:'10px 10px 0',position:'relative',minHeight:300,
            borderRadius:'3px 3px 0 0',
          }}>
            {/* Decorative elements */}
            <div style={{position:'absolute',top:6,left:8,fontSize:26,
              filter:'drop-shadow(1px 2px 2px rgba(0,0,0,.3))'}}>🌳</div>
            <div style={{position:'absolute',top:8,left:36,fontSize:20}}>🌳</div>
            <div style={{position:'absolute',top:4,right:10,fontSize:24,
              filter:'drop-shadow(1px 2px 2px rgba(0,0,0,.3))'}}>🏡</div>
            <div style={{position:'absolute',top:10,right:42,fontSize:16}}>🌻</div>

            {/* Wooden fence top */}
            <div style={{display:'flex',gap:3,marginBottom:6,marginTop:28,paddingLeft:4}}>
              {Array.from({length:12}).map((_,i)=>(
                <div key={i} style={{width:12,height:18,background:'#c8882a',
                  borderRadius:'2px 2px 0 0',flexShrink:0,
                  boxShadow:'inset -2px 0 3px rgba(0,0,0,.2)',
                  borderBottom:'3px solid #a06820'}}/>
              ))}
            </div>

            {/* Coin animation */}
            {coinAnim&&<div style={{
              position:'absolute',top:'35%',left:'50%',
              transform:'translateX(-50%)',
              fontSize:18,fontWeight:700,color:'#f5d060',
              fontFamily:F_UI,pointerEvents:'none',
              animation:'coinFloat 1.2s ease-out forwards',
              textShadow:'0 1px 6px rgba(0,0,0,.8)',
              zIndex:10,
            }}>+{coinAnim} 💰</div>}

            {/* Plot grid — dark soil look */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(4,1fr)',
              gap:3,
              padding:'4px',
              background:'#5a3010',
              borderRadius:'2px',
              boxShadow:'0 4px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.1)',
              border:'3px solid #8B5020',
            }}>
            {plots.map(plot=>(
              <div key={plot.id} onClick={()=>handlePlotClick(plot)}
                style={{aspectRatio:'1',borderRadius:4,background:plotColor(plot),
                  cursor:plot.state==='empty'&&!isOwn?'default':'pointer',
                  display:'flex',flexDirection:'column',alignItems:'center',
                  justifyContent:'center',border:selectedPlot?.id===plot.id?'2px solid #2a3f6f':'2px solid transparent',
                  position:'relative',transition:'transform .1s',
                  transform:plot.state==='ready'?'scale(1.02)':'scale(1)',
                  boxShadow:plot.state==='ready'?'0 0 8px rgba(245,208,96,.8)':'none'}}>
                {plot.state==='planted'&&(()=>{
                  const crop=CROPS[plot.crop_type]
                  const total=crop?crop.growHours*3600000:1
                  const elapsed=Date.now()-new Date(plot.planted_at).getTime()
                  const pct=Math.min(elapsed/total,1)
                  // Two-frame definitions: [frame1, frame2, fontSize, label]
                  const stages=[
                    {f1:'🌱',f2:'🪴',sz:28,label:'semente',speed:1.2},
                    {f1:'🌿',f2:'☘️', sz:32,label:'brotando',speed:1.0},
                    {f1:'🌾',f2:'🎋',sz:36,label:'crescendo',speed:0.8},
                    {f1:crop?.emoji||'🌾',f2:crop?.emoji||'🌾',sz:40,label:'quase!',speed:0.6},
                  ]
                  const s=pct<0.25?stages[0]:pct<0.5?stages[1]:pct<0.75?stages[2]:stages[3]
                  const animId=`crop-${plot.id}`
                  return (
                    <div style={{
                      width:'100%',height:'100%',display:'flex',
                      alignItems:'center',justifyContent:'center',
                      position:'relative',overflow:'hidden',
                    }}>
                      <CropAnim f1={s.f1} f2={s.f2} sz={s.sz} speed={s.speed} id={animId}/>
                      <div style={{position:'absolute',bottom:2,left:0,right:0,
                        textAlign:'center',fontSize:8,color:'rgba(255,255,255,.9)',
                        fontFamily:F_UI,fontWeight:700,
                        textShadow:'0 1px 3px rgba(0,0,0,.6)',
                        letterSpacing:'0.03em'}}>
                        {timeLeft(plot.ready_at)}
                      </div>
                    </div>
                  )
                })()}
                {plot.state==='ready'&&(()=>{
                  const crop=CROPS[plot.crop_type]
                  return (
                    <div style={{width:'100%',height:'100%',display:'flex',
                      alignItems:'center',justifyContent:'center',
                      position:'relative',overflow:'hidden'}}>
                      <CropAnim f1={crop?.emoji||'✨'} f2={crop?.emoji||'🌟'}
                        sz={44} speed={0.5} id={`r-${plot.id}`}/>
                      <div style={{position:'absolute',bottom:2,left:0,right:0,
                        textAlign:'center',fontSize:8,fontFamily:F_UI,fontWeight:700,
                        color:'#1a1a1a',textShadow:'0 1px 2px rgba(255,255,255,.8)'}}>
                        colher!
                      </div>
                    </div>
                  )
                })()}
                {plot.state==='withered'&&<div style={{
                  width:'100%',height:'100%',display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'center',gap:2}}>
                  <span style={{fontSize:32}}>🥀</span>
                  <span style={{fontSize:9,color:'#fff',fontFamily:F_UI,fontWeight:700,
                    background:'rgba(80,40,0,.7)',borderRadius:8,padding:'1px 6px'}}>
                    murcha!
                  </span>
                </div>}
                {plot.state==='weed'&&<div style={{
                  width:'100%',height:'100%',display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'center',gap:2}}>
                  <span style={{fontSize:32,animation:'weedPop .4s ease'}}>🌿</span>
                  <span style={{fontSize:9,color:'#fff',fontFamily:F_UI,fontWeight:700,
                    background:'rgba(180,0,0,.6)',borderRadius:8,padding:'1px 6px'}}>
                    praga!
                  </span>
                </div>}
                {plot.state==='empty'&&<div style={{
                  width:'100%',height:'100%',position:'relative',overflow:'hidden',
                  background:'linear-gradient(160deg,#4a2510 0%,#3a1a08 60%,#2d1205 100%)',
                }}>
                  {/* OG-style furrows */}
                  {[0,1,2,3,4,5].map(i=>(
                    <div key={i} style={{position:'absolute',
                      top:`${8+i*16}%`,left:0,right:0,
                      height:3,
                      background:'linear-gradient(90deg,transparent,rgba(120,60,0,.5),transparent)',
                    }}/>
                  ))}
                  {/* Highlight ridges */}
                  {[0,1,2,3,4].map(i=>(
                    <div key={i} style={{position:'absolute',
                      top:`${14+i*16}%`,left:'5%',right:'5%',
                      height:1,background:'rgba(180,100,30,.3)',
                    }}/>
                  ))}
                </div>}
              </div>
            ))}
          </div>{/* end plot grid */}
        </div>{/* end farm background */}

        {/* Bottom toolbar */}
        {isOwn&&<div style={{
          background:'#5a3a1a',padding:'8px 12px',
          display:'flex',gap:6,alignItems:'center',
          justifyContent:'center',flexWrap:'wrap',
        }}>
          {[
            {icon:'🌱',label:'plantar',action:'plant'},
            {icon:'💧',label:'regar',action:'water'},
            {icon:'🌾',label:'colher',action:'harvest'},
            {icon:'🪣',label:'limpar',action:'clean'},
          ].map(t=>(
            <button key={t.action}
              onClick={()=>setActiveTool(activeTool===t.action?null:t.action)}
              style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                background:activeTool===t.action?'#f5d060':'rgba(255,255,255,.15)',
                border:`2px solid ${activeTool===t.action?'#c8a000':'rgba(255,255,255,.3)'}`,
                borderRadius:5,padding:'4px 8px',cursor:'pointer',
                color:activeTool===t.action?'#1a1a1a':WHITE,
                transition:'all .15s',minWidth:44,
              }}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <span style={{fontSize:9,fontFamily:F_UI,fontWeight:700}}>{t.label}</span>
            </button>
          ))}
          <div style={{marginLeft:8,fontSize:11,color:'rgba(255,255,255,.7)',fontFamily:F_UI}}>
            {activeTool==='clean'?'toque em 🌿 pragas ou 🥀 murchas':activeTool?`modo: ${activeTool}`:'selecione uma ação'}
          </div>
        </div>}
        </div>{/* end farm card */}

        {/* Friend action modal */}
        {!isOwn&&selectedPlot&&selectedPlot.state==='ready'&&(
          <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
            padding:16,marginBottom:8,textAlign:'center'}}>
            <div style={{fontSize:28,marginBottom:8}}>{CROPS[selectedPlot.crop_type]?.emoji}</div>
            <div style={{fontSize:13,fontFamily:F_UI,color:TEXT,marginBottom:14}}>
              {CROPS[selectedPlot.crop_type]?.name} está pronto!
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button style={{...btnGh,padding:'8px 18px',fontSize:13,color:'#cc0000',borderColor:'#cc0000'}}
                onClick={()=>handleSteal(selectedPlot)}>🦹 Roubar (+{Math.floor(CROPS[selectedPlot.crop_type]?.stealValue)} moedas)</button>
              <button style={{...btnBl,padding:'8px 18px',fontSize:13}}
                onClick={()=>handleGift(selectedPlot)}>🤝 Colher pra eles (+bônus)</button>
            </div>
            <div style={{fontSize:10,color:MUTED,fontFamily:F_UI,marginTop:8}}>
              Roubar: você ganha 60% · Colher: eles ganham tudo + você ganha bônus e pontos de generosidade
            </div>
          </div>
        )}

        {/* Animals — on grass like OG */}
        {animals.length>0&&<div style={{background:'#6aaa3c',border:`1px solid #4a8a2a`,
          borderRadius:'0 0 3px 3px',padding:'8px 10px',marginBottom:8,
          borderTop:'2px solid #3a7a1a'}}>
          <div style={{fontWeight:700,fontSize:11,color:'#1a3a0a',fontFamily:F_UI,
            marginBottom:6}}>🐾 Animais</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {animals.map(a=>{
              const cat=ANIMALS[a.animal_type]
              const readyTime=new Date(a.last_collected).getTime()+cat.produceHours*3600000
              const ready=Date.now()>=readyTime
              return (
                <div key={a.id} onClick={()=>isOwn&&handleCollect(a)}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                    padding:'8px 12px',border:`2px solid ${ready?'#f5d060':'rgba(0,0,0,.2)'}`,
                    borderRadius:8,cursor:isOwn?'pointer':'default',
                    background:ready?'rgba(255,240,180,.95)':'rgba(255,255,255,.85)',
                    boxShadow:ready?'0 0 10px rgba(245,208,96,.7)':'0 1px 3px rgba(0,0,0,.2)'}}>
                  <div style={{fontSize:28}}>{cat.emoji}</div>
                  <div style={{fontSize:11,fontFamily:F_UI,fontWeight:700,color:TEXT}}>{cat.name}</div>
                  {(()=>{
                    const pct=Math.min((Date.now()-new Date(a.last_collected).getTime())/(cat.produceHours*3600000),1)
                    const stage=pct<0.33?'dormindo 💤':pct<0.66?'produzindo...':pct<1?'quase pronto!':'✓ coletar!'
                    return <>
                      <div style={{fontSize:10,fontFamily:F_UI,
                        color:ready?'#856404':pct>0.66?'#5a8a3c':MUTED,fontWeight:ready?700:400}}>
                        {ready?`✓ coletar +${cat.value}`:stage}
                      </div>
                      <div style={{width:'100%',height:3,background:'rgba(0,0,0,.1)',
                        borderRadius:2,marginTop:2}}>
                        <div style={{height:3,borderRadius:2,
                          background:ready?'#f5d060':pct>0.66?'#90c060':'#c8d8a0',
                          width:`${pct*100}%`,transition:'width 1s'}}/>
                      </div>
                      {!ready&&<div style={{fontSize:9,color:MUTED,fontFamily:F_UI}}>
                        {timeLeft(new Date(readyTime).toISOString())}
                      </div>}
                    </>
                  })()}
                </div>
              )
            })}
          </div>
        </div>}

        {/* Farm log */}
        {actions.length>0&&<div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:12}}>
          <div style={{fontWeight:700,fontSize:12,color:MUTED,fontFamily:F_UI,marginBottom:8}}>Últimas ações</div>
          {actions.map(a=>(
            <div key={a.id} style={{display:'flex',gap:8,alignItems:'center',
              padding:'5px 0',borderBottom:`1px solid ${BRD}`,fontSize:12,fontFamily:F_UI}}>
              <Av src={a.actor?.avatar_url} size={22} name={a.actor?.name} radius="50%"/>
              <span style={{flex:1,color:TEXT}}>
                <strong style={{color:a.action==='stole'?'#cc0000':a.action==='gifted'?'#2e7d32':BLUE}}>
                  {a.actor?.name}
                </strong>
                {a.action==='stole'?' roubou ':a.action==='gifted'?' colheu pra você ':' visitou '}
                {CROPS[a.crop_type]?.emoji}{' '}
                {a.crop_type&&CROPS[a.crop_type]?.name}
              </span>
              <span style={{color:MUTED,fontSize:10}}>
                {new Date(a.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>
          ))}
        </div>}
      </>}

      {/* ── MARKET TAB ── */}
      {tab==='market'&&isOwn&&<div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:14}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI,marginBottom:2}}>
          🏪 Mercado
        </div>
        <div style={{fontSize:11,color:MUTED,fontFamily:F_UI,marginBottom:14}}>
          💰 {farm?.coins} moedas disponíveis
          {selectedPlot&&<span style={{color:BLUE,marginLeft:8}}>
            · terreno #{selectedPlot.position+1} selecionado
          </span>}
        </div>

        {/* Seeds */}
        <div style={{fontWeight:700,fontSize:12,color:MUTED,fontFamily:F_UI,marginBottom:8}}>Sementes</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:16}}>
          {Object.entries(CROPS).filter(([,c])=>!c.generosityOnly&&c.minLevel<=farm?.level).map(([key,crop])=>(
            <div key={key} style={{border:`1px solid ${BRD}`,borderRadius:6,padding:'10px 12px',
              display:'flex',gap:10,alignItems:'center',
              opacity:selectedPlot?1:.6,cursor:selectedPlot?'pointer':'default',
              background:selectedPlot&&farm?.coins>=crop.cost?'#f8fff0':WHITE}}
              onClick={()=>selectedPlot&&farm?.coins>=crop.cost&&handlePlant(key)}>
              <div style={{fontSize:26}}>{crop.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12,fontFamily:F_UI,color:TEXT}}>{crop.name}</div>
                <div style={{fontSize:10,fontFamily:F_UI,color:MUTED}}>
                  {crop.growHours<1?crop.growHours*60+'min':crop.growHours+'h'} · +{crop.value} moedas
                </div>
                <div style={{fontSize:11,fontFamily:F_UI,color:farm?.coins>=crop.cost?'#2e7d32':'#cc0000',fontWeight:700}}>
                  💰 {crop.cost} moedas
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Animals */}
        <div style={{fontWeight:700,fontSize:12,color:MUTED,fontFamily:F_UI,marginBottom:8}}>Animais</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}>
          {Object.entries(ANIMALS).filter(([,a])=>!a.generosityOnly&&a.minLevel<=farm?.level).map(([key,cat])=>(
            <div key={key} style={{border:`1px solid ${BRD}`,borderRadius:6,padding:'10px 12px',
              display:'flex',gap:10,alignItems:'center',cursor:'pointer',
              background:farm?.coins>=cat.cost?'#f8fff0':WHITE}}
              onClick={()=>farm?.coins>=cat.cost&&handleBuyAnimal(key)}>
              <div style={{fontSize:26}}>{cat.emoji}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12,fontFamily:F_UI,color:TEXT}}>{cat.name}</div>
                <div style={{fontSize:10,fontFamily:F_UI,color:MUTED}}>
                  {cat.product} a cada {cat.produceHours}h
                </div>
                <div style={{fontSize:11,fontFamily:F_UI,color:farm?.coins>=cat.cost?'#2e7d32':'#cc0000',fontWeight:700}}>
                  💰 {cat.cost} moedas
                </div>
              </div>
            </div>
          ))}
        </div>
        {!selectedPlot&&<div style={{marginTop:12,padding:'8px 12px',background:'#fff3cd',
          borderRadius:4,fontSize:11,fontFamily:F_UI,color:'#856404'}}>
          ⬅ Volte para a fazenda e clique em um terreno vazio para plantar
        </div>}
      </div>}

      {/* ── LEADERBOARD TAB ── */}
      {tab==='leaderboard'&&<LeaderboardTab myId={myId}/>}

      {/* ── HISTORY TAB ── */}
      {tab==='history'&&<div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:14}}>
        <div style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI,marginBottom:12}}>📜 Histórico</div>
        {actions.length===0
          ?<div style={{color:MUTED,fontSize:12,fontFamily:F_UI}}>Nenhuma ação ainda.</div>
          :actions.map(a=>(
            <div key={a.id} style={{display:'flex',gap:10,padding:'8px 0',
              borderBottom:`1px solid ${BRD}`,alignItems:'center'}}>
              <Av src={a.actor?.avatar_url} size={28} name={a.actor?.name} radius="50%"/>
              <div style={{flex:1,fontFamily:F_UI,fontSize:12,color:TEXT}}>
                <strong style={{color:a.action==='stole'?'#cc0000':'#2e7d32'}}>{a.actor?.name}</strong>
                {a.action==='stole'?' 🦹 roubou ':`' 🤝 colheu pra você '`}
                {CROPS[a.crop_type]?.emoji} {CROPS[a.crop_type]?.name}
                {a.coins_gained>0&&<span style={{color:MUTED}}> (+{a.coins_gained} moedas)</span>}
              </div>
              <div style={{fontSize:10,color:MUTED,fontFamily:F_UI}}>
                {new Date(a.created_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
              </div>
            </div>
          ))
        }
      </div>}
    </div>
  )
}

function LeaderboardTab({ myId }){
  const [data,setData]=useState([])
  useEffect(()=>{ getFarmLeaderboard().then(setData) },[])
  return (
    <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,padding:14}}>
      <div style={{fontWeight:700,fontSize:13,color:TEXT,fontFamily:F_UI,marginBottom:12}}>🏆 Fazendeiros mais ricos</div>
      {data.map((f,i)=>(
        <div key={i} style={{display:'flex',gap:10,padding:'8px 0',
          borderBottom:`1px solid ${BRD}`,alignItems:'center'}}>
          <div style={{width:24,height:24,borderRadius:'50%',
            background:i===0?'#f5d060':i===1?'#c8c8c8':i===2?'#cd7f32':'#f0f4ff',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:12,fontWeight:700,color:i<3?'#1a1a1a':MUTED,flexShrink:0}}>
            {i+1}
          </div>
          <Av src={f.user?.avatar_url} size={30} name={f.user?.name} radius="50%"/>
          <div style={{flex:1,fontFamily:F_UI}}>
            <div style={{fontSize:13,fontWeight:700,color:f.user?.id===myId?BLUE:TEXT}}>{f.user?.name}</div>
            <div style={{fontSize:10,color:MUTED}}>nível {f.level}</div>
          </div>
          <div style={{fontSize:13,fontFamily:F_UI,fontWeight:700,color:'#856404'}}>💰 {f.coins}</div>
        </div>
      ))}
    </div>
  )
}

/* ── WAITLIST ADMIN PANEL ── */
function WaitlistPanel({ myId }){
  const [list,setList]=useState([])
  const [loading,setLoading]=useState(true)
  const [filter,setFilter]=useState('all') // all | pending | invited
  const [copied,setCopied]=useState(null)

  useEffect(()=>{
    getWaitlist().then(d=>{setList(d);setLoading(false)})
  },[])

  const filtered=list.filter(e=>{
    if(filter==='pending') return !e.invited_at
    if(filter==='invited') return !!e.invited_at
    return true
  })

  const copyEmail=(email,id)=>{
    navigator.clipboard.writeText(email)
    setCopied(id); setTimeout(()=>setCopied(null),2000)
  }

  const copyAllPending=()=>{
    const emails=list.filter(e=>!e.invited_at).map(e=>e.email).join(', ')
    navigator.clipboard.writeText(emails)
    setCopied('all'); setTimeout(()=>setCopied(null),2000)
  }

  const sendInvite=async(entry)=>{
    // Generate invite code for this person
    const {data:invite}=await supabase.from('invites')
      .select('code').eq('owner_id',myId).eq('used',false).limit(1).single()
    if(!invite){alert('Sem convites disponíveis.');return}
    const link=`https://orgute.org?convite=${invite.code}`
    navigator.clipboard.writeText(link)
    await markInvited(entry.id)
    setList(p=>p.map(e=>e.id===entry.id?{...e,invited_at:new Date().toISOString()}:e))
    setCopied(entry.id+'inv'); setTimeout(()=>setCopied(null),2000)
  }

  const pending=list.filter(e=>!e.invited_at).length
  const invited=list.filter(e=>!!e.invited_at).length

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'8px'}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,overflow:'hidden'}}>
        {/* Header */}
        <div style={{background:'#1a2a4a',padding:'10px 16px',
          display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div>
            <span style={{fontWeight:700,fontSize:15,color:WHITE,fontFamily:F_UI}}>
              Waitlist Admin
            </span>
            <span style={{fontSize:11,color:'rgba(255,255,255,.6)',marginLeft:12,fontFamily:F_UI}}>
              {list.length} total · {pending} pendentes · {invited} convidados
            </span>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {[['all','todos'],['pending','pendentes'],['invited','convidados']].map(([v,l])=>(
              <span key={v} onClick={()=>setFilter(v)} style={{
                fontSize:11,fontFamily:F_UI,cursor:'pointer',padding:'3px 10px',
                borderRadius:10,fontWeight:filter===v?700:400,
                background:filter===v?PINK:'rgba(255,255,255,.15)',
                color:WHITE}}>
                {l}
              </span>
            ))}
            <button style={{...btnPk,fontSize:11,padding:'4px 12px'}}
              onClick={copyAllPending}>
              {copied==='all'?'✓ copiado!':'copiar pendentes'}
            </button>
          </div>
        </div>

        {/* List */}
        {loading
          ?<div style={{padding:24,color:MUTED,fontFamily:F_UI}}>Carregando…</div>
          :filtered.length===0
            ?<div style={{padding:24,color:MUTED,fontFamily:F_UI,textAlign:'center'}}>
              Nenhuma entrada.
            </div>
            :filtered.map((e,i)=>(
              <div key={e.id} style={{
                display:'flex',gap:12,padding:'10px 16px',
                borderBottom:i<filtered.length-1?`1px solid ${BRD}`:'none',
                alignItems:'center',
                background:e.invited_at?'#f0fff4':WHITE}}>
                {/* Status dot */}
                <div style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                  background:e.invited_at?'#4caf50':'#f5a623'}}/>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,fontFamily:F_UI,color:TEXT}}>
                    {e.name}
                  </div>
                  <div style={{fontSize:11,fontFamily:F_UI,color:MUTED,
                    display:'flex',gap:10,flexWrap:'wrap',marginTop:2}}>
                    <span>{e.email}</span>
                    <span>{new Date(e.created_at).toLocaleDateString('pt-BR',{
                      day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                    {e.invited_at&&<span style={{color:'#2e7d32'}}>
                      ✓ convidado {new Date(e.invited_at).toLocaleDateString('pt-BR',{day:'numeric',month:'short'})}
                    </span>}
                  </div>
                </div>
                {/* Actions */}
                <div style={{display:'flex',gap:6,flexShrink:0}}>
                  <button style={{...btnGh,fontSize:10,padding:'3px 8px'}}
                    onClick={()=>copyEmail(e.email,e.id)}>
                    {copied===e.id?'✓':'copiar email'}
                  </button>
                  {!e.invited_at&&<button style={{...btnBl,fontSize:10,padding:'3px 8px'}}
                    onClick={()=>sendInvite(e)}>
                    {copied===e.id+'inv'?'✓ link copiado!':'gerar convite'}
                  </button>}
                  <button style={{...btnGh,fontSize:10,padding:'3px 8px',
                    color:'#cc0000',borderColor:'#cc0000'}}
                    onClick={async()=>{
                      await deleteWaitlistEntry(e.id)
                      setList(p=>p.filter(x=>x.id!==e.id))
                    }}>✕</button>
                </div>
              </div>
            ))
        }
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
  const [newRecados,setNewRecados]=useState(0)
  const [toast,setToast]=useState('')
  const [resetMode,setResetMode]=useState(false)
  const [newPwd,setNewPwd]=useState('')
  const [newPwdConfirm,setNewPwdConfirm]=useState('')

  useEffect(()=>{
    // Check if this is a password recovery redirect
    const params=new URLSearchParams(window.location.hash.replace('#','?'))
    if(params.get('type')==='recovery') setResetMode(true)
    supabase.auth.getSession().then(({data:{session}})=>setSession(session))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{
      setSession(s)
      if(event==='PASSWORD_RECOVERY') setResetMode(true)
    })
    const onKey=(e)=>{
      if(e.ctrlKey&&e.shiftKey&&e.key==='A') setPage('__admin')
      if(e.ctrlKey&&e.shiftKey&&e.key==='W') setPage('__waitlist')
    }
    window.addEventListener('keydown',onKey)
    return()=>{ subscription.unsubscribe(); window.removeEventListener('keydown',onKey) }
  },[])

  // Password reset screen
  if(resetMode) return (
    <div style={{minHeight:'100vh',background:BG,display:'flex',
      alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:WHITE,border:`1px solid ${BRD}`,borderRadius:3,
        padding:32,width:'100%',maxWidth:360,boxShadow:'0 2px 20px rgba(0,0,0,.1)'}}>
        <div style={{fontSize:36,fontFamily:"'EB Garamond',serif",color:PINK,marginBottom:4}}>Oi</div>
        <div style={{fontWeight:700,fontSize:16,color:TEXT,fontFamily:F_UI,marginBottom:20}}>
          criar nova senha
        </div>
        <input type="password" placeholder="nova senha (mín. 6 caracteres)"
          value={newPwd} onChange={e=>setNewPwd(e.target.value)}
          style={{...inp,marginBottom:10,fontSize:13,width:'100%'}}/>
        <input type="password" placeholder="confirmar nova senha"
          value={newPwdConfirm} onChange={e=>setNewPwdConfirm(e.target.value)}
          style={{...inp,marginBottom:16,fontSize:13,width:'100%'}}/>
        <button style={{...btnPk,width:'100%',padding:'10px',fontSize:13,fontWeight:700}}
          onClick={async()=>{
            if(newPwd.length<6){alert('Senha deve ter pelo menos 6 caracteres.');return}
            if(newPwd!==newPwdConfirm){alert('As senhas não coincidem.');return}
            const {error}=await supabase.auth.updateUser({password:newPwd})
            if(error) alert('Erro: '+error.message)
            else{ setResetMode(false); setNewPwd(''); setNewPwdConfirm('') }
          }}>
          salvar nova senha
        </button>
      </div>
    </div>
  )

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
    const bellCleared = localStorage.getItem('bellCleared_'+uid) || new Date(Date.now()-48*3600*1000).toISOString()
    supabase.from('recados').select('id',{count:'exact',head:true})
      .eq('to_id',uid)
      .gte('created_at',bellCleared)
      .then(({count})=>setNewRecados(count||0))
    // Show popup for unread messages — only ones newer than last dismissed
    const lastSeen = localStorage.getItem('lastSeenMsg_'+uid) || '1970-01-01'
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
  if(resetMode)return null // already rendered above
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
      case 'taggedphotos': return <TaggedPhotosPage myId={myId} setPage={navTo}/>
      case 'fans':        return <FansPage userId={page?.userId||myId} myId={myId} setPage={navTo}/>
      case 'fazendinha':  return <FazendinhaPage myId={myId} setPage={navTo} userId={page?.userId||myId}/>
      case 'galeria':     return <GaleriaPage myId={myId} userId={page?.userId||null} setPage={navTo} openAlbumId={page?.albumId||null}/>
      case 'depoimentos': return <DepoimentosPage myId={myId} setPage={navTo}/>
      default:            return <HomePage profile={profile} myId={myId} setPage={navTo}/>
    }
  }

  return (
    <div style={{fontFamily:F_UI,
      background:BG,minHeight:'100vh',color:TEXT}}>
      <TopNav page={page} setPage={navTo} profile={profile} pendingReqs={pendingReqs} newRecados={newRecados} onBellClick={()=>{ setNewRecados(0); localStorage.setItem('bellCleared_'+myId, new Date().toISOString()) }}/>
      {renderPage()}
      <footer style={{textAlign:'center',padding:'14px 0 20px',fontSize:11,color:MUTED,
        borderTop:`1px solid ${BRD}`,marginTop:8}}>
        © Recriado com ❤️ por IA · Zero Monetização
      </footer>
      <Toast msg={toast} onDone={()=>setToast('')}/>
      {/* chat popup disabled — {incomingChat&&<IncomingChatPopup/>} */}
    </div>
  )
}

