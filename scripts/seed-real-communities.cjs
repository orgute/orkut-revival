const https = require("https")

const PROJECT = "uakmvwwgtjrwdymfwtrf"
const KEY     = process.env.SUPABASE_SERVICE_KEY

function supa(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req  = https.request({
      hostname: `${PROJECT}.supabase.co`,
      path: `/rest/v1/${path}`, method,
      headers: {
        "apikey": KEY, "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates,return=minimal",
        ...(data ? {"Content-Length": Buffer.byteLength(data)} : {})
      }
    }, res => {
      let b = ""; res.on("data", d => b += d)
      res.on("end", () => resolve({ status: res.statusCode, body: b }))
    })
    req.on("error", reject)
    if (data) req.write(data)
    req.end()
  })
}

// Full curated list from multiple Brazilian nostalgia sources
// Format: [name, category, members_count, seed, description]
const communities = [
  // ── TOP 10 MAIORES (from ctrlzeta.com.br + multiple sources) ─────────────
  ["Eu odeio acordar cedo", "Humor", 10200000, "acordar", "A maior comunidade do Orkut. Pra quem a cama é o melhor lugar do mundo."],
  ["SE CORRER O BICHO PEGA, SE FICAR O BICHO COME", "Humor", 5655166, "bichocome", "A situação sem saída resumida em uma frase perfeita."],
  ["Deus me disse: desce e arrasa!", "Autoestima", 5437016, "deusarrasa", "Puro suco de Orkut. Aposto que você tinha essa frase no seu perfil."],
  ["PEDE PRA SUA MÃE!", "Humor", 5103366, "pedepramaee", "Comunidade que homenageava nosso querido 'pede pra sua mãe!'"],
  ["TE INCOMODO? QUE PEEENA!!!", "Humor", 4786012, "incomodo", "Indiretas level Orkut."],
  ["Eu amo o fim de semana", "Humor", 4385485, "fimdesemana", "Comunidade que homenageava nosso querido fim de semana."],
  ["Sou legal, não tô te dando mole", "Humor", 3932662, "soulegal", "Ser legal não é sinal de interesse. Todo mundo precisava explicar isso."],
  ["Antes de nascer nós estávamos mortos?", "Filosofia", 3747384, "antesnascer", "A comunidade existencial do Orkut."],
  ["SUA MÃE É TÃO GORDA QUE...", "Humor", 3549932, "suamae", "A comunidade das indiretinhas que ganhou destaque."],
  ["Mulher não se pega, CONQUISTA!", "Relacionamentos", 3415286, "conquista", "A única comunidade romântica do top 10. Ironicamente, homens participavam pra pegar mulheres."],

  // ── 51 CLÁSSICAS (from okcomentei.com.br) ────────────────────────────────
  ["Eu durmo na sala de aula", "Humor", 2800000, "dormosaula", "Para os estudantes que transformavam a carteira em cama."],
  ["Adoro fazer tic tic na caneta", "Humor", 1200000, "tictic", "A comunidade dos ansiosos que não conseguiam ficar parados."],
  ["Nos EUA, até pobre fala inglês", "Humor", 2100000, "eua", "O sonho americano em forma de comunidade."],
  ["Queria sorvete, mas era feijão", "Humor", 980000, "sorvetefeijao", "A dura realidade da vida resumida em uma frase."],
  ["A mulher do xampu me vê pelado", "Humor", 850000, "xampupelado", "Uma comunidade que não precisava de mais explicações."],
  ["Só mais 5 minutinhos", "Humor", 3200000, "5minutinhos", "A comunidade da procrastinação aguda."],
  ["Eu abro a geladeira pra pensar", "Humor", 1800000, "geladeira", "Os filósofos culinários que buscavam inspiração entre as prateleiras."],
  ["Leio o shampoo no banho", "Humor", 1500000, "shampoo", "Antes dos smartphones, era isso que tínhamos para ler no banho."],
  ["Bocejei ao ver essa comunidade", "Humor", 700000, "bocejei", "E você bocejou agora, não bocejou?"],
  ["Pego ninguém, mas é cada olhada", "Humor", 1100000, "olhada", "Os solteiros convictos que não perdiam uma boa chance de flertar com os olhos."],
  ["Detesto erros de digitassão", "Humor", 890000, "digitassao", "A comunidade dos gramáticos de plantão. Com erro de propósito."],
  ["Hoje é dia de maldade", "Humor", 750000, "maldade", "Para liberar a tensão com um pouco de humor ácido."],
  ["Não fui eu, foi meu Eu lírico", "Humor", 620000, "eulirico", "O nível de maldade e ironia era outro. Precisava de muito letramento."],
  ["Eu morro de ciúmes, mas ñ falo", "Relacionamentos", 540000, "ciumes", "Os ciumentos resignados que sofriam em silêncio."],
  ["Eu amo chocolate", "Gastronomia", 3300000, "chocolate", "Para os chocólatras assumidos que não resistiam a um bom bombom."],
  ["Comer dá sono e dormir dá fome", "Humor", 890000, "comerdorme", "O maior dilema da vida."],
  ["Cachorros que morrem em filmes", "Entretenimento", 430000, "cachorrosfilmes", "Nunca superamos isso."],
  ["Maldade inata do ser inanimado", "Humor", 380000, "serinanimado", "Para os que acreditavam que objetos tramavam contra a humanidade."],
  ["Só observo", "Humor", 920000, "soobservo", "A frase é famosa até hoje."],
  ["Eu nunca terminei uma borracha", "Humor", 680000, "borracha", "O marketing sempre nos fazia querer outra antes de acabar."],
  ["Tocava campainha e corria", "Nostalgia", 1200000, "campainha", "Quem nunca, né?"],
  ["Eu nunca morri na minha vida", "Humor", 560000, "nuncamorri", "Verdade, né?"],
  ["Adoro botar pilha em bêbado", "Humor", 440000, "pilhabebado", "Para quem se divertia com as confusões dos amigos alcoolizados."],
  ["Grande merda tocar violão", "Humor", 720000, "violao", "Só quem viveu nessa época sabe a verdade nessa frase."],
  ["Mão na cintura é um charme", "Humor", 480000, "maocintura", "O ápice da sensualidade e da autoconfiança."],
  ["Sou fluente em palavrões", "Humor", 860000, "palavroes", "Todo brasileiro é."],
  ["Putz… tá fuçando no meu Orkut né?", "Humor", 1400000, "fucando", "Quando as pessoas podiam ver se você acessou o perfil delas."],
  ["Anão vestido de palhaço mata 8", "Humor", 290000, "anaopalhaco", "Manchetes absurdas em forma de comunidade."],
  ["Odeio comunidade que muda de nome", "Humor", 640000, "mudanome", "E sempre mudava para algo constrangedor. SEMPRE."],
  ["Não sei individualizar duplas", "Humor", 380000, "duplas", "Chitãozinho e Xororó, Sandy e Júnior..."],
  ["Corrigindo palavras nas ruas", "Humor", 310000, "corrigindo", "Os integrantes teriam um colapso nos dias de hoje."],
  ["Pica-Pau desce as Cataratas", "Humor", 270000, "picapau", "Bordão nonsense que só quem viveu o Orkut entenderia."],
  ["Eu colho flores e Tony Ramos", "Humor", 220000, "tonyramos", "Uma comunidade que conversa com um tipo muito específico de humor."],
  ["Vocativos motivacionais", "Humor", 180000, "vocativos", "Doutor, rei, mestre, querido, maestro, paladino…"],
  ["Tenho medo do Zé Gotinha", "Humor", 410000, "zegotinha", "Ele entrou para o folclore brasileiro."],
  ["Observe eu não me importar", "Humor", 290000, "naoimportar", "Todos os introvertidos estavam aqui."],
  ["Já que a culpa é minha", "Humor", 350000, "culpaminha", "Certíssimos."],
  ["Ladrões de banco", "Humor", 240000, "ladroesdbanco", "Ironia nível Orkut."],
  ["Mudos não vão a Roma", "Humor", 180000, "mudosroma", "Politicamente correto, por que choras?"],
  ["Antes uma pedra no caminho", "Humor", 420000, "pedracaminho", "Hidrate-se!"],
  ["Imagina se pega no olho", "Humor", 330000, "pegaolho", "Você leu com a voz da sua mãe, não leu?"],
  ["É msm? Poxa, que legal campeão!", "Humor", 510000, "legalcampeao", "A resposta padrão do Orkut."],
  ["Cabo USB", "Humor", 190000, "cabousb", "Muito engraçadinho."],
  ["Tô fazendo amor com 8 pessoas", "Humor", 160000, "8pessoas", "A letra foi 'aprimorada' pela geração Orkut."],
  ["Um mamão vi na cabeça", "Humor", 200000, "mamao", "Quem nunca pensou nisso enquanto cantava essa música?"],
  ["Bala perdida", "Humor", 170000, "balaperdida", "Mais uma pérola do humor duvidoso dos tempos do Orkut."],

  // ── MAIS CLÁSSICAS (from other sources) ──────────────────────────────────
  ["♥ Eu odeio segunda-feira", "Humor", 4800000, "segunda", "De domingo à tarde já bate o desânimo."],
  ["Eu Amo Meus Amigos", "Amizade", 4500000, "amigos", "Para celebrar quem faz a vida mais leve."],
  ["Odeio esperar resposta no MSN", "Nostalgia", 4200000, "msn", "Aquela bolinha verde que aparecia mas não respondia. Trauma coletivo."],
  ["Eu Odeio Calor", "Humor", 3900000, "calor", "Ar condicionado é fundamental. Calor acima de 25° é desumano."],
  ["♥ Eu Amo Dormir ♥", "Humor", 3700000, "dormir", "Sono é sagrado. Cochilo é medicina."],
  ["Pareço metida(o) mas sou legal", "Humor", 2900000, "metida", "Introversão não é arrogância. Explicação necessária desde 2004."],
  ["Eu já comi o recheio e fechei a bolacha", "Humor", 2500000, "bolacha", "O crime mais cometido em silêncio pela geração Orkut."],
  ["Orkut para sempre ♥", "Nostalgia", 4800000, "forever", "A comunidade da saudade. Para quem nunca vai esquecer o Orkut."],
  ["Geração 90", "Nostalgia", 3600000, "noventa", "Pokémon, Tamagotchi e Cartoon Network. A infância perfeita."],
  ["MSN Messenger", "Nostalgia", 2900000, "msnmessenger", "Status com letras alternadas e nudges sem parar. Era sagrado."],
  ["Eu amo minha mãe", "Família", 6900000, "mae", "Porque mãe é mãe. Pra quem não tem palavras pra agradecer."],
  ["Eu Odeio Falsidade!", "Humor", 6600000, "falsidade", "Diz a verdade ou fica quieto. Sem drama, só autenticidade."],
  ["Detesto gente falsa!", "Humor", 5700000, "gente", "Autenticidade acima de tudo."],
  ["Eu odeio estudar!", "Humor", 5100000, "estudar", "Pra quem ama aprender mas odeia estudar."],
  ["Eu Amo Viajar!", "Viagens", 7400000, "viajar", "Compartilhe destinos, dicas e saudades de lugares incríveis."],
  ["♥ AmO MiNhA ViDa ♥", "Autoestima", 3500000, "amovida", "Caligrafia orkut vintage. Clássico atemporal."],
  ["Eu amo meu cachorro", "Animais", 3400000, "cachorro", "Dogs são amor puro."],
  ["Gatos", "Animais", 2900000, "gatos", "Independentes, misteriosos e absolutamente irresistíveis."],
  ["Anime & Manga", "Entretenimento", 4100000, "anime", "De Dragon Ball a Naruto."],
  ["Futebol Brasileiro", "Esportes", 5600000, "futebol", "A pátria em chuteiras."],
  ["Flamengo", "Esportes", 4400000, "flamengo", "Mengão, Mengão!"],
  ["Corinthians Fiel", "Esportes", 4000000, "corinthians", "A fiel torcida que nunca abandona."],
  ["♥ Eu amo Rock ♥", "Música", 3800000, "rock", "De Led Zeppelin a Linkin Park."],
  ["Eu amo Harry Potter", "Literatura", 2600000, "harry", "Sempre esperando a carta de Hogwarts."],
  ["Friends — A Série", "Entretenimento", 2400000, "friends", "Could this BE any more nostalgic?"],
  ["Big Brother Brasil", "Entretenimento", 3100000, "bbb", "Paredão, festa e muito drama."],
  ["Counter-Strike Brasil", "Games", 1800000, "cs", "Headshot. Clutch. Rush B."],
  ["The Sims", "Games", 1500000, "sims", "Controlando vidas desde 2000."],
  ["Ragnarok Online Brasil", "Games", 1200000, "ragnarok", "Prontera, MVP e o Kafra. Saudades de RO nunca passam."],
  ["Fotografia", "Arte", 1600000, "foto", "Para amantes da imagem."],
  ["Culinária Brasileira", "Gastronomia", 1900000, "culinaria", "Feijoada, brigadeiro e pão de queijo."],
  ["Signos e Astrologia", "Espiritualidade", 2700000, "astro", "Verifique seu mapa."],
  ["Ciência e Tecnologia", "Ciência", 1300000, "ciencia", "Para os curiosos do universo."],
  ["Programação", "Ciência", 950000, "prog", "Código, bugs e soluções."],
  ["Cinema Nacional", "Entretenimento", 1100000, "cinema", "Tropa de Elite, Cidade de Deus e muito mais."],
  ["Vegetarianismo", "Gastronomia", 800000, "veggie", "Comer com consciência."],
  ["Literatura Brasileira", "Literatura", 850000, "lit", "Machado, Clarice, Drummond."],
  ["Emo stuff", "Música", 1200000, "emo", "O movimento que definiu uma geração."],
  ["Gothic art", "Arte", 980000, "gothic", "Arte sombria, bela e atemporal."],
  ["Meditação & Equilíbrio", "Espiritualidade", 700000, "medit", "Paz interior em formato de comunidade."],
  ["Yoga e Bem-Estar", "Saúde", 600000, "yoga", "Corpo e mente em equilíbrio."],
  ["Mochileiros ao Redor do Mundo", "Viagens", 900000, "mochila", "Viagem com mochila nas costas."],
  ["Viagem pelo Brasil", "Viagens", 2100000, "brasil", "De Floripa a Fortaleza."],
  ["São Paulo FC", "Esportes", 2400000, "spfc", "Tricolor do Morumbi. Três mundiais."],
  ["Vasco da Gama", "Esportes", 2000000, "vasco", "Gigante da colina."],
  ["Lost", "Entretenimento", 1700000, "lost", "Que raios acontecia naquela ilha?"],
  ["Twilight — Crepúsculo", "Literatura", 2200000, "twilight", "Team Edward vs Team Jacob."],
  ["Arte Digital", "Arte", 1100000, "artedigital", "Photoshop, desenho digital e criatividade."],
  ["Eu amo minha vida ♥", "Autoestima", 3500000, "vida", "Pra quem ama a vida do jeito que ela é."],
  ["Eu amo o verão", "Humor", 1800000, "verao", "Praia, sol e picolé."],
  ["Eu odeio acordar cedo pra escola", "Humor", 2700000, "escola", "6h da manhã é uma violência."],
]

async function main() {
  console.log(`=== Seeding ${communities.length} real OG Orkut communities ===\n`)

  // Check current count
  let r = await supa("GET", "communities?select=count", null)
  console.log(`Current: ${r.body}`)

  // Map to DB schema
  const rows = communities.map(([name, category, members_count, seed, description]) => ({
    name, category, description, seed,
    members_count: members_count || 0,
  }))

  // Insert in batches of 50
  let inserted = 0, errors = 0
  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const res = await supa("POST", "communities", batch)
    if (res.status >= 200 && res.status < 300) {
      inserted += batch.length
      console.log(`  ✅ Batch ${i}-${i+batch.length}: inserted`)
    } else {
      errors++
      console.log(`  ❌ Batch ${i}: ${res.status} — ${res.body.slice(0, 150)}`)
    }
  }

  r = await supa("GET", "communities?select=count", null)
  console.log(`\n✅ Done! Inserted: ${inserted}, Errors: ${errors}`)
  console.log(`Total in DB: ${r.body}`)
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1) })
