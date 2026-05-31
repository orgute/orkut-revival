import { useState, useRef, useEffect } from "react";

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  pink:      "#e8197d",
  pinkLight: "#fce4f1",
  blue:      "#3b72b8",
  blueDark:  "#1a4a8a",
  bg:        "#eef0f5",
  white:     "#ffffff",
  border:    "#e2e5ec",
  text:      "#1a1a2e",
  textMid:   "#4a4a6a",
  textLight: "#8890a8",
  tagBg:     "#f4f5f8",
  tagBorder: "#dde0ea",
  starYellow:"#f59e0b",
  orange:    "#e8650a",
};

/* ─── Shared styles ──────────────────────────────────────────────────────── */
const card     = { background: C.white, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" };
const lbl      = { fontSize:11, color:C.textLight, textTransform:"lowercase", letterSpacing:0.2, minWidth:120 };
const tag      = { display:"inline-flex", alignItems:"center", padding:"3px 11px", borderRadius:20, border:`1px solid ${C.tagBorder}`, background:C.tagBg, fontSize:12, color:C.textMid, marginRight:5, marginBottom:5, whiteSpace:"nowrap" };
const btn      = { cursor:"pointer", border:"none", borderRadius:6, padding:"6px 14px", fontFamily:"inherit", fontSize:12, fontWeight:600 };
const btnPink  = { ...btn, background:C.pink, color:"#fff" };
const btnBlue  = { ...btn, background:C.blue, color:"#fff" };
const btnGhost = { ...btn, background:"transparent", border:`1px solid ${C.border}`, color:C.textMid };
const inp      = { width:"100%", border:`1px solid ${C.border}`, borderRadius:6, padding:"7px 11px", fontSize:13, fontFamily:"inherit", color:C.text, background:C.white, outline:"none", boxSizing:"border-box" };
const tarea    = { ...inp, resize:"vertical", minHeight:70 };
const div      = { height:1, background:C.border, margin:"10px 0" };

/* ─── Avatar seeds ───────────────────────────────────────────────────────── */
const AV = [
  "https://api.dicebear.com/9.x/personas/svg?seed=Felix",
  "https://api.dicebear.com/9.x/personas/svg?seed=Aneka",
  "https://api.dicebear.com/9.x/personas/svg?seed=Kira",
  "https://api.dicebear.com/9.x/personas/svg?seed=Milo",
  "https://api.dicebear.com/9.x/personas/svg?seed=Zara",
  "https://api.dicebear.com/9.x/personas/svg?seed=Max",
  "https://api.dicebear.com/9.x/personas/svg?seed=Luna",
  "https://api.dicebear.com/9.x/personas/svg?seed=Diego",
  "https://api.dicebear.com/9.x/personas/svg?seed=Rosa",
  "https://api.dicebear.com/9.x/personas/svg?seed=Sam",
];

/* ─── Legacy Orkut Communities — real OG list with categories ───────────── */
const ALL_COMMUNITIES = [
  /* Top viral / identity */
  { id:1,  name:"♥ Eu odeio acordar cedo",              cat:"Humor",         members:10200000, seed:"acordar",  desc:"A comunidade mais icônica do Orkut. Pra quem a cama é o melhor lugar do mundo." },
  { id:2,  name:"Mulher não se pega, conquista!",        cat:"Relacionamentos",members:8700000,  seed:"mulher",   desc:"Para quem acredita que as melhores histórias começam com paciência e conquista." },
  { id:3,  name:"Eu Amo Viajar!",                        cat:"Viagens",        members:7400000,  seed:"viajar",   desc:"Viajantes de plantão. Compartilhe destinos, dicas e saudades de lugares incríveis." },
  { id:4,  name:"♥ Eu amo minha mãe",                   cat:"Família",        members:6900000,  seed:"mae",      desc:"Porque mãe é mãe. Pra quem não tem palavras suficientes pra agradecer." },
  { id:5,  name:"Eu Odeio Falsidade!",                   cat:"Humor",         members:6600000,  seed:"falsidade",desc:"Diz a verdade ou fica quieto. Sem drama, só autenticidade." },
  { id:6,  name:"Sou legal, ñ tô te dando mole",        cat:"Humor",         members:6200000,  seed:"legal",    desc:"Ser legal não é sinal de interesse. Pra quem sabe disso desde sempre." },
  { id:7,  name:"Só mais 5 minutinhos",                  cat:"Humor",         members:5900000,  seed:"cinco",    desc:"Aqueles 5 minutos que viram 2 horas toda vez, sem exceção." },
  { id:8,  name:"Detesto gente falsa!",                  cat:"Humor",         members:5700000,  seed:"falsa",    desc:"Autenticidade acima de tudo. Pra quem não aguenta fingimento." },
  { id:9,  name:"♥ Odeio Falsidade ♥",                  cat:"Humor",         members:5400000,  seed:"odeio",    desc:"Versão alternativa da clássica. A mesma energia, dobrada." },
  { id:10, name:"Eu odeio estudar!",                     cat:"Humor",         members:5100000,  seed:"estudar",  desc:"Pra quem ama aprender mas odeia estudar. Faz sentido? Faz." },
  { id:11, name:"Eu Odeio Segunda-Feira",                cat:"Humor",         members:4800000,  seed:"segunda",  desc:"De domingo à tarde já bate o desânimo. Comunidade dos 4,8 milhões que entendem." },
  { id:12, name:"Eu Amo Meus Amigos",                    cat:"Amizade",       members:4500000,  seed:"amigos",   desc:"Para celebrar quem faz a vida mais leve e os momentos mais especiais." },
  { id:13, name:"Odeio esperar resposta no MSN",         cat:"Nostalgia",     members:4200000,  seed:"msn",      desc:"Aquele bolinha verde que aparecia mas não respondia. Trauma coletivo." },
  { id:14, name:"Eu Odeio Calor",                        cat:"Humor",         members:3900000,  seed:"calor",    desc:"Ar condicionado é fundamental. Calor acima de 25° é desumano." },
  { id:15, name:"♥ Eu Amo Dormir ♥",                    cat:"Humor",         members:3700000,  seed:"dormir",   desc:"Sono é sagrado. Cochilo é medicina. Quem duvida não entende nada." },
  { id:16, name:"♥ AmO MiNhA ViDa ♥",                   cat:"Autoestima",    members:3500000,  seed:"vida",     desc:"Caligrafia orkut vintage. Pra quem ama a vida do jeito que ela é." },
  { id:17, name:"Eu Amo Chocolate",                      cat:"Gastronomia",   members:3300000,  seed:"chocolate",desc:"Chocolate resolve quase tudo. A ciência concorda. Nós também." },
  { id:18, name:"♥ Odeio Gente Falsa ♥",                cat:"Humor",         members:3100000,  seed:"gente",    desc:"Terceira variação. A falsidade tinha muita gente odiando no Orkut." },
  { id:19, name:"Pareço metida(o) mas sou legal",        cat:"Humor",         members:2900000,  seed:"metida",   desc:"Introversão não é arrogância. Explicação necessária desde 2004." },
  { id:20, name:"Eu Odeio Acordar Cedo pra Escola",     cat:"Humor",         members:2700000,  seed:"escola",   desc:"Variação escolar da comunidade mãe. 6h da manhã é uma violência." },
  /* More classics */
  { id:21, name:"Eu já comi o recheio e fechei a bolacha",cat:"Humor",        members:2500000,  seed:"bolacha",  desc:"O crime mais cometido em silêncio pela geração Orkut." },
  { id:22, name:"Te incomodo?? Que peeena!",             cat:"Humor",         members:2300000,  seed:"incomodo", desc:"Alta autoestima em formato de comunidade. Clássico absoluto." },
  { id:23, name:"Deus me disse: desce e arrasa",         cat:"Autoestima",    members:2100000,  seed:"arrasa",   desc:"Missão divina confirmada. Pra quem acredita em si mesmo desde sempre." },
  { id:24, name:"Eu odeio acordar com SMS de operadora", cat:"Humor",         members:1900000,  seed:"sms",      desc:"Claro: Você tem 1 nova mensagem. Grátis. Às 7h da manhã. Ódio." },
  { id:25, name:"♥ Eu Amo Rock ♥",                      cat:"Música",        members:3800000,  seed:"rock",     desc:"De Led Zeppelin a Linkin Park. O rock nunca vai morrer." },
  { id:26, name:"Eu Amo Pagode",                         cat:"Música",        members:3200000,  seed:"pagode",   desc:"Saudade, amor e suingue. A trilha sonora do Brasil." },
  { id:27, name:"Eu Amo Funk",                           cat:"Música",        members:2800000,  seed:"funk",     desc:"A batida que tomou conta do Brasil e não para mais." },
  { id:28, name:"Anime & Manga",                         cat:"Entretenimento",members:4100000,  seed:"anime",    desc:"De Dragon Ball a Naruto. O mundo dos animes nunca foi tão grande." },
  { id:29, name:"Eu amo Harry Potter",                   cat:"Literatura",    members:2600000,  seed:"harry",    desc:"Sempre esperando a carta de Hogwarts. Sempre. Todo ano." },
  { id:30, name:"Twilight — Crepúsculo",                 cat:"Literatura",    members:2200000,  seed:"twilight", desc:"Team Edward vs Team Jacob. Uma guerra que nunca termina." },
  { id:31, name:"Futebol Brasileiro",                    cat:"Esportes",      members:5600000,  seed:"futebol",  desc:"A pátria em chuteiras. Discussões, paixão e muita torcida." },
  { id:32, name:"Flamengo",                              cat:"Esportes",      members:4400000,  seed:"flamengo", desc:"A nação mais apaixonada do Brasil. Mengão, Mengão!" },
  { id:33, name:"Corinthians Fiel",                      cat:"Esportes",      members:4000000,  seed:"corinthians",desc:"A fiel torcida que nunca abandona. Vai Corinthians!" },
  { id:34, name:"Vasco da Gama",                         cat:"Esportes",      members:2000000,  seed:"vasco",    desc:"Gigante da colina. Tradição e força desde 1898." },
  { id:35, name:"São Paulo FC",                         cat:"Esportes",      members:2400000,  seed:"spfc",     desc:"Tricolor do Morumbi. Três mundiais e muito orgulho." },
  { id:36, name:"Counter-Strike Brasil",                 cat:"Games",         members:1800000,  seed:"cs",       desc:"Headshot. Clutch. Rush B. A comunidade dos gamers de FPS." },
  { id:37, name:"The Sims",                              cat:"Games",         members:1500000,  seed:"sims",     desc:"Controlando vidas desde 2000. Máximo de diversão, mínimo de responsabilidade." },
  { id:38, name:"Ragnarok Online Brasil",                cat:"Games",         members:1200000,  seed:"ragnarok", desc:"Prontera, MVP e o Kafra. Saudades de RO nunca passam." },
  { id:39, name:"Fotografia",                            cat:"Arte",          members:1600000,  seed:"foto",     desc:"Para amantes da imagem. Cliques, composição e a magia da luz." },
  { id:40, name:"Arte Digital",                          cat:"Arte",          members:1100000,  seed:"artedigital",desc:"Photoshop, desenho digital e tudo que a criatividade permite." },
  { id:41, name:"Culinária Brasileira",                  cat:"Gastronomia",   members:1900000,  seed:"culinaria",desc:"Feijoada, brigadeiro e pão de queijo. A cozinha que nos une." },
  { id:42, name:"Vegetarianismo",                        cat:"Gastronomia",   members:800000,   seed:"veggie",   desc:"Comer com consciência. Receitas, dicas e estilo de vida saudável." },
  { id:43, name:"Viagem pelo Brasil",                    cat:"Viagens",       members:2100000,  seed:"brasil",   desc:"De Floripa a Fortaleza. O Brasil tem muito mais a oferecer." },
  { id:44, name:"Mochileiros ao Redor do Mundo",        cat:"Viagens",       members:900000,   seed:"mochila",  desc:"Viagem com mochila nas costas e disposição no coração." },
  { id:45, name:"Signos e Astrologia",                  cat:"Espiritualidade",members:2700000,  seed:"astro",    desc:"Solange disse: verifique seu mapa. A astrologia estava no Orkut antes de virar meme." },
  { id:46, name:"Meditação & Equilíbrio",               cat:"Espiritualidade",members:700000,   seed:"medit",    desc:"Paz interior em formato de comunidade. Respira fundo." },
  { id:47, name:"Ciência e Tecnologia",                 cat:"Ciência",       members:1300000,  seed:"ciencia",  desc:"Para os curiosos do universo. Da física quântica à computação." },
  { id:48, name:"Programação",                          cat:"Ciência",       members:950000,   seed:"prog",     desc:"Código, bugs e soluções. A comunidade dos devs do Orkut." },
  { id:49, name:"Eu amo meu cachorro",                  cat:"Animais",       members:3400000,  seed:"cachorro", desc:"Dogs são amor puro. Fotos, histórias e muito afeto." },
  { id:50, name:"Gatos",                                cat:"Animais",       members:2900000,  seed:"gatos",    desc:"Independentes, misteriosos e absolutamente irresistíveis." },
  { id:51, name:"Cinema Nacional",                      cat:"Entretenimento",members:1100000,  seed:"cinema",   desc:"Tropa de Elite, Cidade de Deus e muita produção brasileira de qualidade." },
  { id:52, name:"Friends — A Série",                   cat:"Entretenimento",members:2400000,  seed:"friends",  desc:"Could this BE any more nostalgic? A série que nunca vai morrer." },
  { id:53, name:"Lost",                                 cat:"Entretenimento",members:1700000,  seed:"lost",     desc:"Que raios acontecia naquela ilha? A comunidade que ainda debate." },
  { id:54, name:"Big Brother Brasil",                   cat:"Entretenimento",members:3100000,  seed:"bbb",      desc:"Paredão, festa e muito drama. O reality que parava o Brasil." },
  { id:55, name:"Orkut para sempre ♥",                 cat:"Nostalgia",     members:4800000,  seed:"forever",  desc:"A comunidade da saudade. Para quem nunca vai esquecer o Orkut." },
  { id:56, name:"Geração 90",                           cat:"Nostalgia",     members:3600000,  seed:"noventa",  desc:"Pokémon, Tamagotchi e desenhos da Cartoon Network. A infância perfeita." },
  { id:57, name:"MSN Messenger",                        cat:"Nostalgia",     members:2900000,  seed:"msn2",     desc:"Status, nomes com letras alternadas e nudges sem parar. Era sagrado." },
  { id:58, name:"Eu amo o verão",                       cat:"Humor",         members:1800000,  seed:"verao",    desc:"Praia, sol e picolé. Para quem vive pelo verão." },
  { id:59, name:"Yoga e Bem-Estar",                     cat:"Saúde",         members:600000,   seed:"yoga",     desc:"Corpo e mente em equilíbrio. Para uma vida mais plena." },
  { id:60, name:"Literatura Brasileira",                cat:"Literatura",    members:850000,   seed:"lit",      desc:"Machado, Clarice, Drummond. A riqueza das letras nacionais." },
];

const CATS = ["Todos",...[...new Set(ALL_COMMUNITIES.map(c=>c.cat))]];

/* ─── Friends & Profile data ─────────────────────────────────────────────── */
const FRIENDS_DATA = [
  { id:1, name:"Olivia Joestar",  avatar:AV[0] },
  { id:2, name:"Diavolo H.",      avatar:AV[1] },
  { id:3, name:"Von Dracula",     avatar:AV[2] },
  { id:4, name:"John Joestar",    avatar:AV[3] },
  { id:5, name:"Akali Jin",       avatar:AV[4] },
  { id:6, name:"Kayn Vampyr",     avatar:AV[5] },
  { id:7, name:"Sally Face",      avatar:AV[7] },
  { id:8, name:"Dulce Maria",     avatar:AV[8] },
  { id:9, name:"Mia Colucci",     avatar:AV[9] },
];

const INIT_RECADOS = [
  { id:1, from:"Kayn Vampyr",    avatar:AV[5], date:"26 mai 2026", text:"Meu brother mais vampiro de todos, te considero pakas." },
  { id:2, from:"Olivia Joestar", avatar:AV[0], date:"24 mai 2026", text:"só nos sono chi no sadame hein filhão... HAHAHAHA nóis, migo <3" },
  { id:3, from:"Von Dracula",    avatar:AV[2], date:"22 mai 2026", text:"Nunca vi alguém tão autêntico assim. Orkut te acha incrível haha :)" },
];

const ME = {
  name:"Seu Nome", avatar:AV[6], gender:"masculino", rel:"solteiro(a)", country:"Brasil",
  bio:"Apenas alguém que sente saudades do Orkut e quer se conectar com o mundo :3",
  musica:["Mr. Kitty","Molchat Doma","Blink-182","Maneskin","Grimes"],
  filmes:["Noiva Cadáver","Pulp Fiction","Sweeney Todd"],
  livros:["Fausto – Goethe","Divina Comédia"],
  fas:42, confiavel:3, legal:4, sexy:2,
  friends:128, communities:0, recados:3, galeria:12, depoimentos:7, aplicativos:2,
};

/* ─── AI stub ────────────────────────────────────────────────────────────── */
const CANNED = {
  recado:["Que saudade do Orkut! Época boa demais :)","Oi! Tô de volta no Orkut haha, bons tempos!","Mano esse site me dá tanta nostalgia <3"],
  depoimento:["Uma das pessoas mais legais que já conheci no Orkut. Nunca muda! :D","Parceiro de Orkut desde sempre. Saudades desses tempos hein!"],
  chat:["Oi! Tudo bem? :)","Haha verdade! Saudades do Orkut antigo","Demais! :D","Concordo totalmente haha"],
};
const pick = arr => arr[Math.floor(Math.random()*arr.length)];
async function ai(type){ await new Promise(r=>setTimeout(r,500+Math.random()*700)); return pick(CANNED[type]||CANNED.recado); }

/* ─── LOGO — faithful OG Orkut wordmark (blue lowercase + orange k) ──────── */
function OrkutLogo({ size, id }){
  size = size || 32;
  id   = id || 'ol';
  var h=size, w=size*4.4, gid=id+'g', mid=id+'m';
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
        <mask id={mid}>
          <rect x="0" y="0" width={w} height={h*1.2} fill={"url(#"+gid+")"}/>
        </mask>
      </defs>
      <text x="0" y={h*0.88}
        fontFamily="'Nunito Black','Nunito','Montserrat','Arial Rounded MT Bold',Arial,sans-serif"
        fontSize={h} fontWeight="900" fill="#ff0099" mask={"url(#"+mid+")"} letterSpacing="-1">Orkut</text>
    </svg>
  );
}
/* ─── Avatar ─────────────────────────────────────────────────────────────── */
function Av({ src, size=36, ring=false }){
  return <img src={src} alt="" width={size} height={size} style={{
    borderRadius:"50%", objectFit:"cover", flexShrink:0,
    border: ring ? `2px solid ${C.pink}` : `1px solid ${C.border}`,
    display:"block",
  }}/>;
}

/* ─── Rating row ─────────────────────────────────────────────────────────── */
function RatingRow({ fas }){
  return (
    <div style={{display:"flex",gap:24,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
      {[
        ["fãs",      <><span style={{color:C.starYellow}}>★</span> {fas}</>],
        ["confiável",<>😊 😊 😊</>],
        ["legal",    <><span style={{fontSize:15}}>👍</span><span style={{fontSize:15}}>👍</span><span style={{fontSize:15}}>👍</span></>],
        ["sexy",     <><span style={{color:"#e11d48"}}>❤</span><span style={{color:"#e11d48"}}>❤</span><span style={{color:"#e11d48"}}>❤</span></>],
      ].map(([l,v])=>(
        <div key={l} style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:C.textLight,marginBottom:2}}>{l}</div>
          <div style={{fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:2}}>{v}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Community thumbnail ────────────────────────────────────────────────── */
function ComThumb({ seed, size=44, radius=6 }){
  return (
    <img
      src={`https://picsum.photos/seed/${seed}/80/80`}
      alt="" width={size} height={size}
      style={{borderRadius:radius, objectFit:"cover", border:`1px solid ${C.border}`, flexShrink:0, display:"block"}}
    />
  );
}

/* ─── TOP NAV ────────────────────────────────────────────────────────────── */
function TopNav({ page, setPage, me }){
  const [search,setSearch]=useState("");
  const links=[["Início","home"],["Perfil","perfil"],["Recados","recados"],["Amigos","amigos"],["Comunidades","comunidades"],["Aplicativos","apps"]];
  return (
    <nav style={{background:C.white,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:200,
      display:"flex",alignItems:"center",padding:"0 20px",height:50,boxShadow:"0 1px 3px rgba(0,0,0,.07)"}}>
      <div onClick={()=>setPage("home")} style={{cursor:"pointer",marginRight:24,flexShrink:0,paddingTop:4}}>
        <OrkutLogo size={26} id="nav"/>
      </div>
      <div style={{display:"flex",flex:1,alignItems:"center",height:"100%"}}>
        {links.map(([label,pg])=>(
          <div key={pg} onClick={()=>setPage(pg)} style={{
            padding:"0 12px",height:"100%",display:"flex",alignItems:"center",fontSize:13,
            fontWeight:page===pg?700:400,cursor:"pointer",
            color:page===pg?C.pink:C.textMid,
            borderBottom:page===pg?`2px solid ${C.pink}`:"2px solid transparent",
            boxSizing:"border-box",transition:"color .12s",
          }}>{label}</div>
        ))}
      </div>
      <div style={{position:"relative",marginRight:14}}>
        <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",color:C.textLight,fontSize:12}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Pesquisar no Orkut"
          style={{...inp,width:190,paddingLeft:28,borderRadius:18,fontSize:12,background:C.bg}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"4px 8px",
        borderRadius:7,border:`1px solid ${C.border}`}} onClick={()=>setPage("perfil")}>
        <Av src={me.avatar} size={26}/>
        <span style={{fontSize:13,fontWeight:600,color:C.text}}>{me.name}</span>
        <span style={{fontSize:10,color:C.textLight}}>▾</span>
      </div>
    </nav>
  );
}

/* ─── LEFT SIDEBAR ───────────────────────────────────────────────────────── */
function LeftSidebar({ page, setPage, me }){
  return (
    <aside style={{width:205,flexShrink:0}}>
      <div style={{...card,padding:14,marginBottom:10,textAlign:"center"}}>
        <div style={{display:"inline-block",marginBottom:8}}>
          <Av src={me.avatar} size={78} ring/>
        </div>
        <div style={{fontWeight:700,fontSize:14,color:C.text}}>{me.name}</div>
        <div style={{fontSize:11,color:C.textLight,marginTop:2}}>{me.gender}, {me.rel}</div>
        <div style={{fontSize:11,color:C.textLight}}>{me.country}</div>
        <div style={{height:1,background:C.border,margin:"10px 0"}}/>
        <div style={{display:"flex",flexDirection:"column",gap:1,textAlign:"left"}}>
          {[
            ["👤","Perfil","perfil"],
            ["✉","Recados","recados",me.recados],
            ["🖼","Galeria","galeria",me.galeria],
            ["📝","Depoimentos","depoimentos",me.depoimentos],
            ["🎮","Aplicativos","apps",me.aplicativos],
          ].map(([icon,label,pg,count])=>(
            <div key={pg} onClick={()=>setPage(pg)} style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"6px 8px",borderRadius:6,cursor:"pointer",
              background:page===pg?"#eff4fb":"transparent",
              color:page===pg?C.blue:C.textMid,fontWeight:page===pg?700:400,fontSize:13,
            }}>
              <span style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:13}}>{icon}</span>{label}
              </span>
              {count!==undefined&&<span style={{fontSize:11,color:page===pg?C.blue:C.textLight}}>({count})</span>}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ─── HOME ───────────────────────────────────────────────────────────────── */
function HomePage({ setPage, me, joined }){
  return (
    <div>
      <div style={{...card,padding:16,marginBottom:10,background:"linear-gradient(135deg,#eef4ff,#f0f7ff)"}}>
        <div style={{fontWeight:700,fontSize:16,color:C.blue,marginBottom:3}}>Bem-vindo(a) de volta, {me.name}! 👋</div>
        <div style={{fontSize:12,color:C.textMid}}>Seu Orkut está de volta. Mais de 60 comunidades clássicas esperando por você.</div>
      </div>
      <div style={{...card,padding:16,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:10}}>🔔 Atualizações</div>
        {[
          ["💬","Kayn Vampyr te deixou um recado novo!"],
          ["👥","Olivia Joestar adicionou você como amigo(a)."],
          ["🌍",`Você está em ${joined} comunidade${joined!==1?"s":""} clássica${joined!==1?"s":""}.`],
          ["⭐","Você recebeu 2 novos fãs!"],
        ].map(([icon,msg],i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",
            borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
            <span style={{fontSize:16}}>{icon}</span>
            <span style={{fontSize:13,color:C.textMid}}>{msg}</span>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:10}}>
        {[["👥","Amigos",me.friends,"amigos"],["❤️","Fãs",me.fas,null],["🌍","Comunidades",joined,"comunidades"]].map(([icon,l,v,pg])=>(
          <div key={l} style={{...card,padding:14,textAlign:"center",cursor:pg?"pointer":"default"}} onClick={()=>pg&&setPage(pg)}>
            <div style={{fontSize:22,marginBottom:3}}>{icon}</div>
            <div style={{fontSize:19,fontWeight:700,color:C.blue}}>{v}</div>
            <div style={{fontSize:11,color:C.textLight}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{...card,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:13,color:C.text}}>✉️ Recados recentes</div>
          <span style={{fontSize:12,color:C.blue,cursor:"pointer"}} onClick={()=>setPage("recados")}>Ver todos</span>
        </div>
        {INIT_RECADOS.slice(0,2).map(r=>(
          <div key={r.id} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
            <Av src={r.avatar} size={34}/>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:C.blue}}>{r.from}</div>
              <div style={{fontSize:12,color:C.text,marginTop:2,lineHeight:1.5}}>{r.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PROFILE ────────────────────────────────────────────────────────────── */
function PerfilPage({ me, setMe }){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(me);
  const [tab,setTab]=useState("sobre");
  const [deps,setDeps]=useState(INIT_RECADOS.map(r=>({...r})));
  const [tWrite,setTWrite]=useState(false);
  const [tDraft,setTDraft]=useState("");
  const [tLoad,setTLoad]=useState(false);

  const aiDep=async()=>{setTLoad(true);const t=await ai("depoimento");setTDraft(t);setTLoad(false);};
  const submitDep=()=>{
    if(!tDraft.trim())return;
    setDeps(p=>[{id:Date.now(),from:"Você",avatar:me.avatar,date:"agora",text:tDraft},...p]);
    setTDraft("");setTWrite(false);
  };

  const Field=({l,children})=>(
    <div style={{display:"flex",alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{...lbl,paddingTop:1}}>{l}</div>
      <div style={{flex:1}}>{children}</div>
    </div>
  );

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Perfil</span>
      </div>
      <div style={{...card,padding:18,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <h1 style={{fontSize:21,fontWeight:700,color:C.text,margin:0}}>{me.name}</h1>
          <button style={btnBlue} onClick={()=>setEditing(!editing)}>{editing?"Cancelar":"Editar perfil"}</button>
        </div>
        {!editing
          ? <div style={{background:C.bg,borderRadius:7,padding:"7px 13px",fontSize:13,color:C.textMid,marginBottom:8,fontStyle:"italic"}}>{me.bio}</div>
          : <textarea style={{...tarea,marginBottom:8}} value={draft.bio} onChange={e=>setDraft({...draft,bio:e.target.value})}/>
        }
        <RatingRow fas={me.fas}/>
        <div style={{height:1,background:C.border,margin:"12px 0"}}/>
        {editing ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["nome","name"],["gênero","gender"],["relacionamento","rel"],["país","country"]].map(([l,k])=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{...lbl}}>{l}</div>
                <input style={{...inp,flex:1}} value={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.value})}/>
              </div>
            ))}
            <button style={{...btnBlue,alignSelf:"flex-start",marginTop:4}} onClick={()=>{setMe(draft);setEditing(false);}}>Salvar</button>
          </div>
        ) : (
          <>
            <Field l="relacionamento"><span style={{fontSize:13}}>{me.rel}</span></Field>
            <Field l="quem sou eu"><span style={{fontSize:13,lineHeight:1.6}}>{me.bio}</span></Field>
            <Field l="país"><span style={{fontSize:13}}>{me.country}</span></Field>
            <Field l="música"><div style={{display:"flex",flexWrap:"wrap",marginTop:3}}>{me.musica.map(t=><span key={t} style={tag}>{t}</span>)}</div></Field>
            <Field l="filmes"><div style={{display:"flex",flexWrap:"wrap",marginTop:3}}>{me.filmes.map(t=><span key={t} style={tag}>{t}</span>)}</div></Field>
            <Field l="livros"><div style={{display:"flex",flexWrap:"wrap",marginTop:3}}>{me.livros.map(t=><span key={t} style={tag}>{t}</span>)}</div></Field>
          </>
        )}
      </div>
      {/* Tabs */}
      <div style={{...card}}>
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,background:"#f8f9fc"}}>
          {["sobre","depoimentos"].map(t=>(
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:"9px 16px",cursor:"pointer",fontSize:12,fontWeight:tab===t?700:400,
              borderBottom:tab===t?`2px solid ${C.blue}`:"2px solid transparent",
              color:tab===t?C.blue:C.textMid,boxSizing:"border-box",
            }}>{t.charAt(0).toUpperCase()+t.slice(1)}</div>
          ))}
        </div>
        <div style={{padding:16}}>
          {tab==="sobre"&&(
            <div style={{fontSize:12,color:C.textMid,lineHeight:1.9}}>
              <p>👥 <b>{me.friends}</b> amigos · ❤️ <b>{me.fas}</b> fãs</p>
              <p>✉️ <b>{INIT_RECADOS.length}</b> recados · 📝 <b>{me.depoimentos}</b> depoimentos</p>
            </div>
          )}
          {tab==="depoimentos"&&(
            <div>
              {deps.map(d=>(
                <div key={d.id} style={{display:"flex",gap:11,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
                  <Av src={d.avatar} size={36}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:C.blue,marginBottom:2}}>{d.from}:</div>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{d.text}</div>
                    <div style={{fontSize:11,color:C.textLight,marginTop:3}}>{d.date}</div>
                  </div>
                </div>
              ))}
              {!tWrite
                ? <button style={{...btnBlue,marginTop:8}} onClick={()=>setTWrite(true)}>Escrever depoimento</button>
                : <div style={{marginTop:8,background:C.bg,borderRadius:7,padding:12}}>
                    <textarea style={tarea} value={tDraft} onChange={e=>setTDraft(e.target.value)} placeholder="Escreva um depoimento…"/>
                    <div style={{display:"flex",gap:8,marginTop:8}}>
                      <button style={btnBlue} onClick={submitDep}>Postar</button>
                      <button style={btnGhost} onClick={aiDep} disabled={tLoad}>{tLoad?"Gerando…":"✨ Gerar com IA"}</button>
                      <button style={btnGhost} onClick={()=>setTWrite(false)}>Cancelar</button>
                    </div>
                  </div>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── RECADOS ────────────────────────────────────────────────────────────── */
function RecadosPage({ me }){
  const [recados,setRecados]=useState(INIT_RECADOS);
  const [text,setText]=useState("");
  const [aiName,setAiName]=useState("");
  const [loading,setLoading]=useState(false);
  const [replyId,setReplyId]=useState(null);
  const [replyTxt,setReplyTxt]=useState("");
  const [replies,setReplies]=useState({});

  const post=()=>{ if(!text.trim())return; setRecados(p=>[{id:Date.now(),from:"Você",avatar:me.avatar,date:"agora",text},...p]); setText(""); };
  const aiScrap=async()=>{ if(!aiName.trim())return; setLoading(true); const msg=await ai("recado"); setRecados(p=>[{id:Date.now(),from:aiName,avatar:AV[Math.floor(Math.random()*AV.length)],date:"agora",text:msg},...p]); setAiName("");setLoading(false); };
  const sendReply=(id)=>{ if(!replyTxt.trim())return; setReplies(p=>({...p,[id]:[...(p[id]||[]),{from:"Você",text:replyTxt,date:"agora"}]})); setReplyTxt("");setReplyId(null); };

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Recados</span>
      </div>
      <div style={{...card,padding:16,marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:8}}>Deixar um recado</div>
        <textarea style={tarea} value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva um recado…"/>
        <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
          <button style={btnBlue} onClick={post}>Enviar</button>
          <span style={{fontSize:11,color:C.textLight}}>ou receba um recado de IA:</span>
          <input style={{...inp,width:120,flex:"none"}} placeholder="Nome do amigo…" value={aiName} onChange={e=>setAiName(e.target.value)}/>
          <button style={{...btnGhost,opacity:loading?.6:1}} onClick={aiScrap} disabled={loading}>{loading?"Enviando…":"✨ Recado IA"}</button>
        </div>
      </div>
      <div style={{...card,padding:16}}>
        <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:12}}>Recados ({recados.length})</div>
        {recados.map(r=>(
          <div key={r.id} style={{display:"flex",gap:11,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
            <Av src={r.avatar} size={38}/>
            <div style={{flex:1}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontWeight:700,fontSize:13,color:C.blue}}>{r.from}</span>
                <span style={{fontSize:11,color:C.textLight}}>{r.date}</span>
              </div>
              <div style={{fontSize:13,color:C.text,marginTop:3,lineHeight:1.5}}>{r.text}</div>
              <div style={{display:"flex",gap:12,marginTop:5}}>
                <span style={{fontSize:11,color:C.blue,cursor:"pointer"}} onClick={()=>setReplyId(replyId===r.id?null:r.id)}>↩ Responder</span>
                <span style={{fontSize:11,color:"#ef4444",cursor:"pointer"}} onClick={()=>setRecados(p=>p.filter(x=>x.id!==r.id))}>Apagar</span>
              </div>
              {(replies[r.id]||[]).map((rep,i)=>(
                <div key={i} style={{marginTop:7,paddingLeft:11,borderLeft:`2px solid #dde4f0`,fontSize:12,color:C.textMid}}>
                  <b style={{color:C.text}}>Você:</b> {rep.text}
                </div>
              ))}
              {replyId===r.id&&(
                <div style={{marginTop:7,display:"flex",gap:8}}>
                  <input style={{...inp,flex:1}} placeholder="Responder…" value={replyTxt}
                    onChange={e=>setReplyTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendReply(r.id)}/>
                  <button style={btnBlue} onClick={()=>sendReply(r.id)}>Enviar</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── AMIGOS ─────────────────────────────────────────────────────────────── */
function AmigosPage({ me }){
  const [friends,setFriends]=useState(FRIENDS_DATA);
  const [chatF,setChatF]=useState(null);
  const [hist,setHist]=useState([]);
  const [inp2,setInp2]=useState("");
  const [chatLoad,setChatLoad]=useState(false);
  const chatRef=useRef();

  const send=async()=>{
    if(!inp2.trim()||chatLoad)return;
    const msg=inp2;setInp2("");
    setHist(h=>[...h,{me:true,text:msg}]);
    setChatLoad(true);
    const r=await ai("chat");
    setHist(h=>[...h,{me:false,text:r}]);
    setChatLoad(false);
    setTimeout(()=>chatRef.current?.scrollTo(0,9999),50);
  };

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Amigos</span>
      </div>
      <div style={{...card,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Amigos ({friends.length})</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {friends.map(f=>(
            <div key={f.id} style={{textAlign:"center",padding:11,borderRadius:8,border:`1px solid ${C.border}`,background:C.bg}}>
              <Av src={f.avatar} size={54}/>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginTop:6,marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                <button style={{...btnBlue,padding:"3px 9px",fontSize:11}} onClick={()=>{setChatF(f);setHist([]);}}>Conversar</button>
                <button style={{...btnGhost,padding:"3px 9px",fontSize:11}} onClick={()=>setFriends(p=>p.filter(x=>x.id!==f.id))}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {chatF&&(
        <div style={{position:"fixed",bottom:20,right:20,width:295,background:C.white,border:`1.5px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 30px rgba(0,0,0,.13)",zIndex:999,overflow:"hidden"}}>
          <div style={{background:C.blue,padding:"9px 13px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Av src={chatF.avatar} size={24}/>
              <span style={{color:"#fff",fontWeight:700,fontSize:13}}>{chatF.name}</span>
            </div>
            <span style={{color:"#fff",cursor:"pointer"}} onClick={()=>setChatF(null)}>✕</span>
          </div>
          <div ref={chatRef} style={{height:210,overflowY:"auto",padding:10,background:C.bg,display:"flex",flexDirection:"column",gap:6}}>
            {hist.length===0&&<div style={{color:C.textLight,fontSize:11,textAlign:"center",marginTop:65}}>Diga olá!</div>}
            {hist.map((m,i)=>(
              <div key={i} style={{alignSelf:m.me?"flex-end":"flex-start",maxWidth:"80%",
                background:m.me?C.blue:"#fff",color:m.me?"#fff":C.text,
                padding:"5px 9px",borderRadius:9,fontSize:12}}>
                {m.text}
              </div>
            ))}
            {chatLoad&&<div style={{fontSize:11,color:C.textLight,fontStyle:"italic"}}>{chatF.name} está digitando…</div>}
          </div>
          <div style={{padding:7,borderTop:`1px solid ${C.border}`,display:"flex",gap:6}}>
            <input style={{...inp,flex:1,fontSize:12}} value={inp2} onChange={e=>setInp2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Mensagem…"/>
            <button style={{...btnBlue,padding:"6px 11px"}} onClick={send}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── COMUNIDADES — full legacy list ─────────────────────────────────────── */
function ComunidadesPage({ joinedIds, setJoinedIds, me }){
  const [activeCat,setActiveCat]=useState("Todos");
  const [search,setSearch]=useState("");
  const [activeCom,setActiveCom]=useState(null);
  const [posts,setPosts]=useState({});
  const [newPost,setNewPost]=useState("");
  const [tab,setTab]=useState("todas"); // todas | minhas

  const toggle=(id)=>{
    setJoinedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  };

  const filtered = ALL_COMMUNITIES.filter(c=>{
    const matchCat = activeCat==="Todos" || c.cat===activeCat;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.cat.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab==="todas" || joinedIds.includes(c.id);
    return matchCat && matchSearch && matchTab;
  });

  const submitPost=(id)=>{
    if(!newPost.trim())return;
    setPosts(p=>({...p,[id]:[{id:Date.now(),from:"Você",avatar:me.avatar,text:newPost,date:"agora"},...(p[id]||[])]}));
    setNewPost("");
  };

  if(activeCom){
    const com=ALL_COMMUNITIES.find(c=>c.id===activeCom);
    const cp=posts[activeCom]||[];
    const isJoined=joinedIds.includes(activeCom);
    return (
      <div>
        <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
          <span style={{color:C.blue,cursor:"pointer"}} onClick={()=>setActiveCom(null)}>Comunidades</span>
          {" "}<span style={{color:C.textLight}}>›</span>{" "}
          <span style={{color:C.blue,fontWeight:600}}>{com.name}</span>
        </div>
        <div style={{...card,padding:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div style={{display:"flex",gap:13,alignItems:"center"}}>
              <ComThumb seed={com.seed} size={56} radius={8}/>
              <div>
                <div style={{fontWeight:700,fontSize:17,color:C.text,marginBottom:2}}>{com.name}</div>
                <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>{com.cat} · {com.members.toLocaleString()} membros no auge</div>
                <div style={{fontSize:12,color:C.textMid,fontStyle:"italic"}}>{com.desc}</div>
              </div>
            </div>
            <button style={isJoined?btnGhost:btnBlue} onClick={()=>toggle(activeCom)}>
              {isJoined?"✓ Membro":"+ Participar"}
            </button>
          </div>
          {isJoined&&(
            <div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:6}}>Postar na comunidade</div>
              <textarea style={tarea} value={newPost} onChange={e=>setNewPost(e.target.value)} placeholder="O que você quer compartilhar?"/>
              <button style={{...btnBlue,marginTop:8}} onClick={()=>submitPost(com.id)}>Postar</button>
            </div>
          )}
          {cp.length>0 ? cp.map(p=>(
            <div key={p.id} style={{display:"flex",gap:11,padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
              <Av src={p.avatar} size={36}/>
              <div>
                <div style={{fontWeight:700,fontSize:13,color:C.blue}}>{p.from}</div>
                <div style={{fontSize:13,color:C.text,marginTop:3,lineHeight:1.5}}>{p.text}</div>
                <div style={{fontSize:11,color:C.textLight,marginTop:3}}>{p.date}</div>
              </div>
            </div>
          )) : (
            <div style={{textAlign:"center",color:C.textLight,padding:24,fontSize:13}}>
              {isJoined?"Seja o primeiro a postar nesta comunidade!":"Entre na comunidade para ver e postar conteúdo."}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Comunidades</span>
      </div>

      {/* Header */}
      <div style={{...card,padding:14,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:C.text}}>Comunidades Clássicas do Orkut</div>
            <div style={{fontSize:11,color:C.textLight,marginTop:2}}>
              {ALL_COMMUNITIES.length} comunidades históricas · {joinedIds.length} das suas
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <input style={{...inp,width:180,fontSize:12}} placeholder="Buscar comunidade…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>

        {/* Tab: todas / minhas */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:12}}>
          {[["todas","Todas as comunidades"],["minhas","Minhas comunidades"]].map(([t,l])=>(
            <div key={t} onClick={()=>setTab(t)} style={{
              padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:tab===t?700:400,
              borderBottom:tab===t?`2px solid ${C.blue}`:"2px solid transparent",
              color:tab===t?C.blue:C.textMid,boxSizing:"border-box",
            }}>
              {l} {t==="minhas"&&joinedIds.length>0&&<span style={{background:C.blue,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:4}}>{joinedIds.length}</span>}
            </div>
          ))}
        </div>

        {/* Category filters */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {CATS.map(cat=>(
            <span key={cat} onClick={()=>setActiveCat(cat)} style={{
              ...tag,cursor:"pointer",
              background:activeCat===cat?C.blue:C.tagBg,
              color:activeCat===cat?"#fff":C.textMid,
              border:activeCat===cat?`1px solid ${C.blue}`:`1px solid ${C.tagBorder}`,
              fontWeight:activeCat===cat?600:400,
            }}>{cat}</span>
          ))}
        </div>

        {/* Community grid */}
        {filtered.length===0
          ? <div style={{textAlign:"center",color:C.textLight,padding:30,fontSize:13}}>
              {tab==="minhas"?"Você ainda não entrou em nenhuma comunidade. Explore a aba 'Todas'!":"Nenhuma comunidade encontrada."}
            </div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
              {filtered.map(c=>{
                const isJ=joinedIds.includes(c.id);
                return (
                  <div key={c.id} style={{
                    border:`1px solid ${isJ?C.blue:C.border}`,borderRadius:9,overflow:"hidden",
                    background:isJ?"#eff4fb":C.bg,transition:"border-color .15s",
                  }}>
                    <div onClick={()=>setActiveCom(c.id)} style={{cursor:"pointer",position:"relative"}}>
                      <ComThumb seed={c.seed} size="100%" radius={0}/>
                      <img src={`https://picsum.photos/seed/${c.seed}/300/100`} alt=""
                        style={{width:"100%",height:70,objectFit:"cover",display:"block"}}/>
                      {isJ&&<div style={{position:"absolute",top:6,right:6,background:C.blue,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:10,fontWeight:700}}>✓</div>}
                    </div>
                    <div style={{padding:"8px 10px"}}>
                      <div style={{fontSize:12,fontWeight:600,color:C.text,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}}
                        onClick={()=>setActiveCom(c.id)}>{c.name}</div>
                      <div style={{fontSize:10,color:C.textLight,marginBottom:2}}>{c.cat}</div>
                      <div style={{fontSize:10,color:C.textLight,marginBottom:7}}>{c.members.toLocaleString()} membros no auge</div>
                      <div style={{display:"flex",gap:5}}>
                        <button style={{...btnBlue,padding:"2px 8px",fontSize:10,flex:1,opacity:isJ?0.6:1}}
                          onClick={()=>!isJ&&(toggle(c.id),setActiveCom(c.id))}>
                          {isJ?"Entrar →":"+ Entrar"}
                        </button>
                        {isJ&&<button style={{...btnBlue,padding:"2px 8px",fontSize:10,flex:1}} onClick={()=>setActiveCom(c.id)}>Ver →</button>}
                        {isJ&&<button style={{...btnGhost,padding:"2px 8px",fontSize:10}} onClick={()=>toggle(c.id)}>Sair</button>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    </div>
  );
}

/* ─── RIGHT COLUMN ───────────────────────────────────────────────────────── */
function RightColumn({ setPage, joinedIds }){
  const myComms = ALL_COMMUNITIES.filter(c=>joinedIds.includes(c.id)).slice(0,9);
  return (
    <aside style={{width:196,flexShrink:0}}>
      <div style={{...card,padding:13,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:12,color:C.text}}>Amigos ({FRIENDS_DATA.length})</div>
          <span style={{fontSize:11,color:C.blue,cursor:"pointer"}} onClick={()=>setPage("amigos")}>Ver todos</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {FRIENDS_DATA.slice(0,9).map(f=>(
            <div key={f.id} style={{textAlign:"center"}}>
              <Av src={f.avatar} size={42}/>
              <div style={{fontSize:10,color:C.textLight,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{...card,padding:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:12,color:C.text}}>Comunidades ({joinedIds.length})</div>
          <span style={{fontSize:11,color:C.blue,cursor:"pointer"}} onClick={()=>setPage("comunidades")}>Ver todas</span>
        </div>
        {myComms.length===0
          ? <div style={{fontSize:11,color:C.textLight,textAlign:"center",padding:"10px 0"}}>
              <span style={{cursor:"pointer",color:C.blue}} onClick={()=>setPage("comunidades")}>Explore comunidades →</span>
            </div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
              {myComms.map(c=>(
                <div key={c.id} style={{textAlign:"center"}}>
                  <img src={`https://picsum.photos/seed/${c.seed}/60/60`} alt="" style={{width:42,height:42,borderRadius:6,objectFit:"cover",border:`1px solid ${C.border}`,display:"block"}}/>
                  <div style={{fontSize:9,color:C.textLight,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name.replace(/[♥❤]/g,"").trim()}</div>
                </div>
              ))}
            </div>
        }
      </div>
    </aside>
  );
}

/* ─── GALERIA ────────────────────────────────────────────────────────────── */
function GaleriaPage(){
  const photos=Array.from({length:12},(_,i)=>({id:i,src:`https://picsum.photos/seed/${i+30}/240/180`}));
  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Galeria</span>
      </div>
      <div style={{...card,padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h2 style={{fontSize:14,fontWeight:700,margin:0}}>Galeria ({photos.length} fotos)</h2>
          <button style={btnBlue}>+ Adicionar foto</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {photos.map(p=>(
            <div key={p.id} style={{borderRadius:7,overflow:"hidden",border:`1px solid ${C.border}`,aspectRatio:"4/3"}}>
              <img src={p.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── APPS ───────────────────────────────────────────────────────────────── */
function AppsPage(){
  const apps=[
    {id:1,name:"Horóscopo",icon:"♈",desc:"Veja seu signo e previsões do dia"},
    {id:2,name:"Fortune Cookie",icon:"🥠",desc:"Receba uma mensagem do destino"},
    {id:3,name:"Comparar Perfis",icon:"👥",desc:"Compare com seus amigos do Orkut"},
    {id:4,name:"Quiz Musical",icon:"🎵",desc:"Teste seu conhecimento musical"},
  ];
  const [fortune,setFortune]=useState(null);
  const fortunes=["Grandes coisas estão a caminho :)","Confie no processo!","Uma surpresa agradável te espera.","Velhas amizades serão renovadas."];
  return (
    <div>
      <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>
        <span style={{color:C.blue}}>Início</span> › <span style={{color:C.blue,fontWeight:600}}>Aplicativos</span>
      </div>
      <div style={{...card,padding:16}}>
        <h2 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Aplicativos</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
          {apps.map(a=>(
            <div key={a.id} style={{border:`1px solid ${C.border}`,borderRadius:9,padding:14,background:C.bg}}>
              <div style={{fontSize:26,marginBottom:5}}>{a.icon}</div>
              <div style={{fontWeight:700,fontSize:13,color:C.text,marginBottom:3}}>{a.name}</div>
              <div style={{fontSize:12,color:C.textLight,marginBottom:10}}>{a.desc}</div>
              <button style={btnBlue} onClick={()=>a.id===2&&setFortune(pick(fortunes))}>Abrir</button>
              {a.id===2&&fortune&&<div style={{marginTop:8,fontSize:12,fontStyle:"italic",background:"#fff",borderRadius:6,padding:"6px 10px"}}>{fortune}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────── */
export default function App(){
  const [page,setPage]=useState("home");
  const [me,setMe]=useState(ME);
  const [joinedIds,setJoinedIds]=useState([]);

  // sync community count to profile
  const meWithComms = { ...me, communities: joinedIds.length };

  const showRight=["home","perfil","recados"].includes(page);

  const renderMain=()=>{
    switch(page){
      case "home":         return <HomePage setPage={setPage} me={meWithComms} joined={joinedIds.length}/>;
      case "perfil":       return <PerfilPage me={meWithComms} setMe={setMe}/>;
      case "recados":      return <RecadosPage me={meWithComms}/>;
      case "amigos":       return <AmigosPage me={meWithComms}/>;
      case "comunidades":  return <ComunidadesPage joinedIds={joinedIds} setJoinedIds={setJoinedIds} me={meWithComms}/>;
      case "galeria":      return <GaleriaPage/>;
      case "depoimentos":  return <PerfilPage me={meWithComms} setMe={setMe}/>;
      case "apps":         return <AppsPage/>;
      default:             return <HomePage setPage={setPage} me={meWithComms} joined={joinedIds.length}/>;
    }
  };

  return (
    <div style={{fontFamily:"'Trebuchet MS','Lucida Grande','Lucida Sans Unicode',sans-serif",background:C.bg,minHeight:"100vh",color:C.text}}>
      <TopNav page={page} setPage={setPage} me={meWithComms}/>
      <div style={{maxWidth:1040,margin:"0 auto",padding:"14px 14px",display:"flex",gap:11,alignItems:"flex-start"}}>
        <LeftSidebar page={page} setPage={setPage} me={meWithComms}/>
        <main style={{flex:1,minWidth:0}}>{renderMain()}</main>
        {showRight&&<RightColumn setPage={setPage} joinedIds={joinedIds}/>}
      </div>
      <div style={{textAlign:"center",padding:"18px 0 28px",fontSize:11,color:C.textLight}}>
        © 2026 Orkut Revival · Feito com ❤️ e saudade · Não afiliado ao Google
      </div>
    </div>
  );
}
