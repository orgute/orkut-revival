-- ============================================================
--  Orkut Revival — Supabase Schema
--  Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text,
  avatar_url    text default 'https://api.dicebear.com/9.x/personas/svg?seed=default',
  bio           text default 'Olá! Estou de volta no Orkut :)',
  city          text default '',
  country       text default 'Brasil',
  gender        text default 'prefiro não dizer',
  rel_status    text default 'solteiro(a)',
  musica        text[] default '{}',
  filmes        text[] default '{}',
  livros        text[] default '{}',
  karma         int  default 10,
  fans_count    int  default 0,
  created_at    timestamptz default now()
);
alter table profiles enable row level security;
create policy "Public profiles readable"  on profiles for select using (true);
create policy "Users update own profile"  on profiles for update using (auth.uid() = id);
create policy "Users insert own profile"  on profiles for insert with check (auth.uid() = id);

-- ── FRIENDSHIPS ─────────────────────────────────────────────
create table if not exists friendships (
  id            uuid primary key default uuid_generate_v4(),
  requester_id  uuid references profiles(id) on delete cascade,
  addressee_id  uuid references profiles(id) on delete cascade,
  status        text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at    timestamptz default now(),
  unique(requester_id, addressee_id)
);
alter table friendships enable row level security;
create policy "Friends visible to participants" on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "Authenticated can request"      on friendships for insert
  with check (auth.uid() = requester_id);
create policy "Addressee can respond"          on friendships for update
  using (auth.uid() = addressee_id or auth.uid() = requester_id);
create policy "Participants can delete"        on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ── RECADOS (scrapbook) ──────────────────────────────────────
create table if not exists recados (
  id          uuid primary key default uuid_generate_v4(),
  from_id     uuid references profiles(id) on delete cascade,
  to_id       uuid references profiles(id) on delete cascade,
  text        text not null,
  created_at  timestamptz default now()
);
alter table recados enable row level security;
create policy "Recados readable by participants" on recados for select
  using (auth.uid() = from_id or auth.uid() = to_id);
create policy "Authenticated can send recados"   on recados for insert
  with check (auth.uid() = from_id);
create policy "Wall owner can delete recados"    on recados for delete
  using (auth.uid() = to_id or auth.uid() = from_id);

-- ── DEPOIMENTOS (testimonials) ───────────────────────────────
create table if not exists depoimentos (
  id          uuid primary key default uuid_generate_v4(),
  from_id     uuid references profiles(id) on delete cascade,
  to_id       uuid references profiles(id) on delete cascade,
  text        text not null,
  created_at  timestamptz default now()
);
alter table depoimentos enable row level security;
create policy "Depoimentos are public"         on depoimentos for select using (true);
create policy "Authenticated can write"        on depoimentos for insert
  with check (auth.uid() = from_id);
create policy "Author or wall owner can delete" on depoimentos for delete
  using (auth.uid() = from_id or auth.uid() = to_id);

-- ── COMMUNITIES ─────────────────────────────────────────────
create table if not exists communities (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  category      text not null,
  description   text,
  seed          text,
  members_count int default 0,
  created_at    timestamptz default now()
);
alter table communities enable row level security;
create policy "Communities are public" on communities for select using (true);

-- ── MEMBERSHIPS ─────────────────────────────────────────────
create table if not exists memberships (
  user_id       uuid references profiles(id) on delete cascade,
  community_id  uuid references communities(id) on delete cascade,
  joined_at     timestamptz default now(),
  primary key (user_id, community_id)
);
alter table memberships enable row level security;
create policy "Memberships readable"       on memberships for select using (true);
create policy "Users manage own membership" on memberships for all using (auth.uid() = user_id);

-- ── COMMUNITY POSTS ─────────────────────────────────────────
create table if not exists community_posts (
  id            uuid primary key default uuid_generate_v4(),
  community_id  uuid references communities(id) on delete cascade,
  author_id     uuid references profiles(id) on delete cascade,
  text          text not null,
  created_at    timestamptz default now()
);
alter table community_posts enable row level security;
create policy "Community posts are public"  on community_posts for select using (true);
create policy "Members can post"            on community_posts for insert
  with check (auth.uid() = author_id);
create policy "Author can delete own post"  on community_posts for delete
  using (auth.uid() = author_id);

-- ── MESSAGES (direct chat) ───────────────────────────────────
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  from_id     uuid references profiles(id) on delete cascade,
  to_id       uuid references profiles(id) on delete cascade,
  text        text not null,
  read_at     timestamptz,
  created_at  timestamptz default now()
);
alter table messages enable row level security;
create policy "Messages visible to participants" on messages for select
  using (auth.uid() = from_id or auth.uid() = to_id);
create policy "Authenticated can send"           on messages for insert
  with check (auth.uid() = from_id);

-- ── PROFILE VISITS ───────────────────────────────────────────
create table if not exists profile_visits (
  visitor_id  uuid references profiles(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete cascade,
  visited_at  timestamptz default now(),
  primary key (visitor_id, profile_id)
);
alter table profile_visits enable row level security;
create policy "Visit owner can see visitors" on profile_visits for select
  using (auth.uid() = profile_id);
create policy "Authenticated can record visit" on profile_visits for all
  using (auth.uid() = visitor_id);

-- ── MEMBER COUNT HELPERS ────────────────────────────────────
create or replace function increment_members(community_id uuid)
returns void language sql as $$
  update communities set members_count = members_count + 1 where id = community_id;
$$;
create or replace function decrement_members(community_id uuid)
returns void language sql as $$
  update communities set members_count = greatest(members_count - 1, 0) where id = community_id;
$$;

-- ── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── REALTIME ────────────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table recados;
alter publication supabase_realtime add table community_posts;
alter publication supabase_realtime add table friendships;

-- ── STORAGE BUCKET ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "Users can upload own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can update own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── SEED: 60 legacy communities ─────────────────────────────
insert into communities (name, category, description, seed, members_count) values
('♥ Eu odeio acordar cedo',           'Humor',          'A comunidade mais icônica do Orkut. Pra quem a cama é o melhor lugar do mundo.','acordar',10200000),
('Mulher não se pega, conquista!',     'Relacionamentos','Para quem acredita que as melhores histórias começam com paciência e conquista.','mulher',8700000),
('Eu Amo Viajar!',                     'Viagens',        'Compartilhe destinos, dicas e saudades de lugares incríveis.','viajar',7400000),
('♥ Eu amo minha mãe',               'Família',        'Porque mãe é mãe. Pra quem não tem palavras suficientes pra agradecer.','mae',6900000),
('Eu Odeio Falsidade!',               'Humor',          'Diz a verdade ou fica quieto. Sem drama, só autenticidade.','falsidade',6600000),
('Sou legal, ñ tô te dando mole',     'Humor',          'Ser legal não é sinal de interesse. Pra quem sabe disso desde sempre.','legal',6200000),
('Só mais 5 minutinhos',              'Humor',          'Aqueles 5 minutos que viram 2 horas toda vez, sem exceção.','cinco',5900000),
('Detesto gente falsa!',              'Humor',          'Autenticidade acima de tudo. Pra quem não aguenta fingimento.','falsa',5700000),
('Eu odeio estudar!',                 'Humor',          'Pra quem ama aprender mas odeia estudar. Faz sentido? Faz.','estudar',5100000),
('Eu Odeio Segunda-Feira',            'Humor',          'De domingo à tarde já bate o desânimo. 4,8 milhões que entendem.','segunda',4800000),
('Eu Amo Meus Amigos',               'Amizade',        'Para celebrar quem faz a vida mais leve e os momentos mais especiais.','amigos',4500000),
('Odeio esperar resposta no MSN',     'Nostalgia',      'Aquele bolinha verde que aparecia mas não respondia. Trauma coletivo.','msn',4200000),
('Eu Odeio Calor',                    'Humor',          'Ar condicionado é fundamental. Calor acima de 25° é desumano.','calor',3900000),
('♥ Eu Amo Dormir ♥',               'Humor',          'Sono é sagrado. Cochilo é medicina. Quem duvida não entende nada.','dormir',3700000),
('Eu Amo Chocolate',                  'Gastronomia',    'Chocolate resolve quase tudo. A ciência concorda. Nós também.','chocolate',3300000),
('Pareço metida(o) mas sou legal',    'Humor',          'Introversão não é arrogância. Explicação necessária desde 2004.','metida',2900000),
('Eu já comi o recheio e fechei a bolacha','Humor',     'O crime mais cometido em silêncio pela geração Orkut.','bolacha',2500000),
('Te incomodo?? Que peeena!',         'Humor',          'Alta autoestima em formato de comunidade. Clássico absoluto.','incomodo',2300000),
('Deus me disse: desce e arrasa',     'Autoestima',     'Missão divina confirmada. Pra quem acredita em si mesmo.','arrasa',2100000),
('♥ Eu Amo Rock ♥',                 'Música',         'De Led Zeppelin a Linkin Park. O rock nunca vai morrer.','rock',3800000),
('Eu Amo Pagode',                     'Música',         'Saudade, amor e suingue. A trilha sonora do Brasil.','pagode',3200000),
('Eu Amo Funk',                       'Música',         'A batida que tomou conta do Brasil e não para mais.','funk',2800000),
('Anime & Manga',                     'Entretenimento', 'De Dragon Ball a Naruto. O mundo dos animes nunca foi tão grande.','anime',4100000),
('Eu amo Harry Potter',               'Literatura',     'Sempre esperando a carta de Hogwarts. Sempre. Todo ano.','harry',2600000),
('Twilight — Crepúsculo',             'Literatura',     'Team Edward vs Team Jacob. Uma guerra que nunca termina.','twilight',2200000),
('Futebol Brasileiro',                'Esportes',       'A pátria em chuteiras. Discussões, paixão e muita torcida.','futebol',5600000),
('Flamengo',                          'Esportes',       'A nação mais apaixonada do Brasil. Mengão, Mengão!','flamengo',4400000),
('Corinthians Fiel',                  'Esportes',       'A fiel torcida que nunca abandona. Vai Corinthians!','corinthians',4000000),
('Vasco da Gama',                     'Esportes',       'Gigante da colina. Tradição e força desde 1898.','vasco',2000000),
('São Paulo FC',                      'Esportes',       'Tricolor do Morumbi. Três mundiais e muito orgulho.','spfc',2400000),
('Counter-Strike Brasil',             'Games',          'Headshot. Clutch. Rush B. A comunidade dos gamers de FPS.','cs',1800000),
('The Sims',                          'Games',          'Controlando vidas desde 2000. Máximo de diversão, mínimo de responsabilidade.','sims',1500000),
('Ragnarok Online Brasil',            'Games',          'Prontera, MVP e o Kafra. Saudades de RO nunca passam.','ragnarok',1200000),
('Fotografia',                        'Arte',           'Para amantes da imagem. Cliques, composição e a magia da luz.','foto',1600000),
('Arte Digital',                      'Arte',           'Photoshop, desenho digital e tudo que a criatividade permite.','artedigital',1100000),
('Culinária Brasileira',              'Gastronomia',    'Feijoada, brigadeiro e pão de queijo. A cozinha que nos une.','culinaria',1900000),
('Vegetarianismo',                    'Gastronomia',    'Comer com consciência. Receitas, dicas e estilo de vida saudável.','veggie',800000),
('Viagem pelo Brasil',                'Viagens',        'De Floripa a Fortaleza. O Brasil tem muito mais a oferecer.','brasil',2100000),
('Mochileiros ao Redor do Mundo',     'Viagens',        'Viagem com mochila nas costas e disposição no coração.','mochila',900000),
('Signos e Astrologia',               'Espiritualidade','Verifique seu mapa. A astrologia estava no Orkut antes de virar meme.','astro',2700000),
('Ciência e Tecnologia',              'Ciência',        'Para os curiosos do universo. Da física quântica à computação.','ciencia',1300000),
('Programação',                       'Ciência',        'Código, bugs e soluções. A comunidade dos devs do Orkut.','prog',950000),
('Eu amo meu cachorro',               'Animais',        'Dogs são amor puro. Fotos, histórias e muito afeto.','cachorro',3400000),
('Gatos',                             'Animais',        'Independentes, misteriosos e absolutamente irresistíveis.','gatos',2900000),
('Friends — A Série',                 'Entretenimento', 'Could this BE any more nostalgic? A série que nunca vai morrer.','friends',2400000),
('Lost',                              'Entretenimento', 'Que raios acontecia naquela ilha? A comunidade que ainda debate.','lost',1700000),
('Big Brother Brasil',                'Entretenimento', 'Paredão, festa e muito drama. O reality que parava o Brasil.','bbb',3100000),
('Orkut para sempre ♥',              'Nostalgia',      'A comunidade da saudade. Para quem nunca vai esquecer o Orkut.','forever',4800000),
('Geração 90',                        'Nostalgia',      'Pokémon, Tamagotchi e Cartoon Network. A infância perfeita.','noventa',3600000),
('MSN Messenger',                     'Nostalgia',      'Status com letras alternadas e nudges sem parar. Era sagrado.','msn2',2900000),
('Meditação & Equilíbrio',            'Espiritualidade','Paz interior em formato de comunidade. Respira fundo.','medit',700000),
('Literatura Brasileira',             'Literatura',     'Machado, Clarice, Drummond. A riqueza das letras nacionais.','lit',850000),
('Yoga e Bem-Estar',                  'Saúde',          'Corpo e mente em equilíbrio. Para uma vida mais plena.','yoga',600000),
('Eu amo minha vida ♥',              'Autoestima',     'Pra quem ama a vida do jeito que ela é.','vida',3500000),
('Cinema Nacional',                   'Entretenimento', 'Tropa de Elite, Cidade de Deus e muita produção brasileira de qualidade.','cinema',1100000),
('♥ Odeio Gente Falsa ♥',           'Humor',          'A mesma energia, dobrada.','gente',3100000),
('Eu amo o verão',                    'Humor',          'Praia, sol e picolé. Para quem vive pelo verão.','verao',1800000),
('Eu odeio acordar cedo pra escola',  'Humor',          'Variação escolar da clássica. 6h da manhã é uma violência.','escola',2700000),
('♥ AmO MiNhA ViDa ♥',             'Autoestima',     'Caligrafia orkut vintage. Clássico atemporal.','vida2',3500000),
('Emo stuff',                         'Música',         'O movimento que definiu uma geração inteira de adolescentes.','emo',1200000),
('Gothic art',                        'Arte',           'Arte sombria, bela e atemporal. Para quem aprecia o lado obscuro.','gothic',980000)
on conflict do nothing;

