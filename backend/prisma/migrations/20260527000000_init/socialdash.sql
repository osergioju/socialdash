--
-- PostgreSQL database dump
--

\restrict qzNFN6aWI9S7JJgaFnNvw8RRZ1hRmIXA7y5Iu4u01cYyJ2wegayA6ffT4mAeUmC

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: ConnectionStatus; Type: TYPE; Schema: public; Owner: socialdash
--

CREATE TYPE "ConnectionStatus" AS ENUM (
    'PENDING',
    'CONNECTED',
    'EXPIRED',
    'REVOKED',
    'ERROR'
);


ALTER TYPE public."ConnectionStatus" OWNER TO socialdash;

--
-- Name: OAuthPlatform; Type: TYPE; Schema: public; Owner: socialdash
--

CREATE TYPE "OAuthPlatform" AS ENUM (
    'META',
    'GOOGLE_ANALYTICS',
    'LINKEDIN'
);


ALTER TYPE public."OAuthPlatform" OWNER TO socialdash;

--
-- Name: Platform; Type: TYPE; Schema: public; Owner: socialdash
--

CREATE TYPE "Platform" AS ENUM (
    'INSTAGRAM',
    'LINKEDIN'
);


ALTER TYPE public."Platform" OWNER TO socialdash;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: socialdash
--

CREATE TYPE "Role" AS ENUM (
    'ADMIN',
    'EDITOR',
    'VIEWER'
);


ALTER TYPE public."Role" OWNER TO socialdash;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE _prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO socialdash;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE cities (
    id text NOT NULL,
    name text NOT NULL,
    platform "Platform" NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.cities OWNER TO socialdash;

--
-- Name: city_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE city_metrics (
    id text NOT NULL,
    "cityId" text NOT NULL,
    month text NOT NULL,
    seguidores integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.city_metrics OWNER TO socialdash;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE clients (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "logoUrl" text,
    website text,
    notes text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.clients OWNER TO socialdash;

--
-- Name: client_users; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE client_users (
    id text NOT NULL,
    "clientId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.client_users OWNER TO socialdash;

--
-- Name: ga4_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE ga4_metrics (
    id text NOT NULL,
    month text NOT NULL,
    "monthLabel" text NOT NULL,
    "usuariosAtivos" integer NOT NULL,
    "novosUsuarios" integer NOT NULL,
    "usuariosTotais" integer NOT NULL,
    sessoes integer NOT NULL,
    "sessoesEngajadas" integer NOT NULL,
    "taxaEngajamento" double precision NOT NULL,
    "tempoMedioEngajamento" integer NOT NULL,
    "tempoMedioSessao" integer,
    "viewsPorSessao" double precision NOT NULL,
    "numEventos" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.ga4_metrics OWNER TO socialdash;

--
-- Name: ga4_origin_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE ga4_origin_metrics (
    id text NOT NULL,
    "originId" text NOT NULL,
    month text NOT NULL,
    sessoes integer,
    "taxaEng" double precision,
    "tempoMedio" integer
);


ALTER TABLE public.ga4_origin_metrics OWNER TO socialdash;

--
-- Name: ga4_origins; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE ga4_origins (
    id text NOT NULL,
    fonte text NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.ga4_origins OWNER TO socialdash;

--
-- Name: ga4_page_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE ga4_page_metrics (
    id text NOT NULL,
    "pageId" text NOT NULL,
    month text NOT NULL,
    views integer,
    "tempoMedio" integer
);


ALTER TABLE public.ga4_page_metrics OWNER TO socialdash;

--
-- Name: ga4_pages; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE ga4_pages (
    id text NOT NULL,
    pagina text NOT NULL,
    label text NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.ga4_pages OWNER TO socialdash;

--
-- Name: instagram_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE instagram_metrics (
    id text NOT NULL,
    month text NOT NULL,
    "monthLabel" text NOT NULL,
    seguidores integer NOT NULL,
    "novosSeguidores" integer NOT NULL,
    "alcanceOrganico" integer NOT NULL,
    visualizacoes integer NOT NULL,
    interacoes integer NOT NULL,
    "visitasPerfil" integer NOT NULL,
    "postagensTotal" integer NOT NULL,
    "reelsQtd" integer NOT NULL,
    "reelsAlcance" integer NOT NULL,
    "reelsInteracoes" integer NOT NULL,
    "storiesQtd" integer NOT NULL,
    "storiesViews" integer NOT NULL,
    "curtidasPosts" integer NOT NULL,
    "comentariosPosts" integer NOT NULL,
    "salvamentosPosts" integer NOT NULL,
    "compartilhamentosPosts" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.instagram_metrics OWNER TO socialdash;

--
-- Name: linkedin_industries; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE linkedin_industries (
    id text NOT NULL,
    nome text NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.linkedin_industries OWNER TO socialdash;

--
-- Name: linkedin_industry_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE linkedin_industry_metrics (
    id text NOT NULL,
    "industryId" text NOT NULL,
    month text NOT NULL,
    seguidores integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.linkedin_industry_metrics OWNER TO socialdash;

--
-- Name: linkedin_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE linkedin_metrics (
    id text NOT NULL,
    month text NOT NULL,
    "monthLabel" text NOT NULL,
    seguidores integer NOT NULL,
    "novosSeguidores" integer NOT NULL,
    alcance integer NOT NULL,
    impressoes integer NOT NULL,
    engajamento integer NOT NULL,
    cliques integer NOT NULL,
    reacoes integer NOT NULL,
    postagens integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.linkedin_metrics OWNER TO socialdash;

--
-- Name: linkedin_roles; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE linkedin_roles (
    id text NOT NULL,
    nome text NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.linkedin_roles OWNER TO socialdash;

--
-- Name: linkedin_role_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE linkedin_role_metrics (
    id text NOT NULL,
    "roleId" text NOT NULL,
    month text NOT NULL,
    seguidores integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.linkedin_role_metrics OWNER TO socialdash;

--
-- Name: platform_connections; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE platform_connections (
    id text NOT NULL,
    "clientId" text NOT NULL,
    platform "OAuthPlatform" NOT NULL,
    status "ConnectionStatus" DEFAULT 'PENDING'::"ConnectionStatus" NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "expiresAt" timestamp(3) without time zone,
    "accountId" text,
    "accountName" text,
    "accountEmail" text,
    metadata text,
    "connectedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastSyncAt" timestamp without time zone
);


ALTER TABLE public.platform_connections OWNER TO socialdash;

--
-- Name: themes; Type: TABLE; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE TABLE themes (
    id text NOT NULL,
    tema text NOT NULL,
    icon text NOT NULL,
    platform "Platform" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "clientId" text NOT NULL
);


ALTER TABLE public.themes OWNER TO socialdash;

--
-- Name: theme_metrics; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE theme_metrics (
    id text NOT NULL,
    "themeId" text NOT NULL,
    month text NOT NULL,
    curtidas integer,
    comentarios integer,
    compartilhamentos integer,
    "alcanceMedio" integer,
    engajamento integer,
    cliques integer,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.theme_metrics OWNER TO socialdash;

--
-- Name: users; Type: TABLE; Schema: public; Owner: socialdash; Tablespace:
--

CREATE TABLE users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    role "Role" DEFAULT 'VIEWER'::"Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO socialdash;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
67c6fd7b-1983-4feb-8c87-15998f934e68	727175cc70674e9498a40347f457fafac6b3885775eee231e6abb87d1ef77b41	2026-05-27 00:00:00.000000+00	20260527000000_init	\N	\N	2026-05-27 00:00:00.000000+00	1
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY cities (id, name, platform, "clientId") FROM stdin;
cmo39u1xm0001133p5s03f731	Ribeirão Prêto, São Paulo (state)	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1xy0005133p9jky131l	São Paulo, São Paulo (state)	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1y60009133pph8c4f8q	São Luís, Maranhão	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1yd000d133peh7qa74h	Passo Fundo, Rio Grande do Sul	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1yi000h133pjab6yt1y	Rio de Janeiro, Rio de Janeiro (state)	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1yo000l133ps6zvmxct	Palhoça, Santa Catarina	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1yv000p133p5kw8lt96	Juazeiro do Norte, Ceará	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1z1000t133pvum2fuis	Núcleo Bandeirante, Federal District	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1z6000x133pvgtitbio	Maceió, Alagoas	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo39u1zc0011133pk2hlshdy	Rio Branco, Acre (state)	INSTAGRAM	cmo399kfi0001gswtqp07m8xx
cmo3avt3c002d6725ivehohui	Casablanca, Grand Casablanca	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avt62002h67257mk1vwfz	São Caetano do Sul, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avt8a002l6725s68e9wqy	Ribeirão Prêto, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avta3002p6725ebz2jbeg	São Paulo, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avtbm002t6725mlwkwv6d	Passo Fundo, Rio Grande do Sul	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avtcn002x6725o7v0iq25	Rio de Janeiro, Rio de Janeiro (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avtd900316725uw3ues9o	São José dos Campos, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avtdv00356725h2sjwjyr	Itapecerica de Serra, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avtek003967259z5kybs8	Osasco, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3avtf6003d6725turw63ug	Assis, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmo3cf5gu000d11z9awqs9cm2	São Paulo, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5i2000h11z9amrx5qhq	Atibaia, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5iq000l11z9kfu71ysb	Bragança Paulista, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5jf000p11z9fc5b6aoa	Santa Tereza do Tocantins, Tocantins	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5k6000t11z9v90o55ic	Nova Friburgo, Rio de Janeiro (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5kp000x11z9zlykliym	Porto Nacional, Tocantins	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5la001111z9f2qz5uai	Rio de Janeiro, Rio de Janeiro (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5lw001511z9rhr0m4fc	São José dos Campos, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5mi001911z9p1qbftgv	Araguaína, Tocantins	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3cf5n1001d11z9iauvibrw	Americana, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmo3f1435001p35585p3aw7h4	São Paulo, São Paulo (state)	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f143s001t35585febfwwj	Araranguá, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f143y001x3558mpvzysyu	Blumenau, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f144800213558xd8b5alm	Barra Velha, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f144g002535586dr3kggj	São Bento do Sul, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f144q00293558f9y7hp32	Rio de Janeiro, Rio de Janeiro (state)	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f1450002d3558noa2lc2v	Palhoça, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f1458002h3558ytnk4evw	Canoinhas, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f145e002l35580shzg4ib	Camboriú, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo3f145o002p3558lbpwovnc	Biguaçu, Santa Catarina	INSTAGRAM	cmo3ey6c6000t3558s4xu80g6
cmo74upna002t3558a19lri14	Mamanguape, Paraíba	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmp2xximp000p3dz4zpytag9w	Araguari, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxin3000t3dz416xl165m	Pirapora, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxin9000x3dz40ko21jd4	Divinópolis, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxing00113dz414kal6m3	Sabará, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxinm00153dz4tdxp1zy5	Pouso Alegre, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxinu00193dz45nvuwobd	Contagem, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxio0001d3dz4j2b73feg	Araxá, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxio6001h3dz4xu6oe4oo	Ituiutaba, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxioc001l3dz41gkybkdr	Muriaé, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp2xxioh001p3dz4yo4huqrb	Uberlândia, Minas Gerais	INSTAGRAM	cmo3eyxii000v3558fkno1zw5
cmp4d6c2x0005kueb2mjp4elv	São Caetano do Sul, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmp4d6c41000pkuebwlhwisd2	Presidente Prudente, São Paulo (state)	INSTAGRAM	cmo37dbff00015wkl105xjv72
cmp5reipd002p11kb15lmlioq	Ponta Grossa, Paraná	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmp5reipn002v11kbwjcz48ft	Camaçari, Bahia	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
cmp5reipt002z11kbwwa80ysf	Praia Grande, São Paulo (state)	INSTAGRAM	cmo37qcgs000933z3w1lagvwz
\.


--
-- Data for Name: city_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY city_metrics (id, "cityId", month, seguidores, "createdAt") FROM stdin;
cmo3cf5jr000r11z94ioj7pe5	cmo3cf5jf000p11z9fc5b6aoa	2026-04	3	2026-04-17 20:10:47.128
cmo3cf5kg000v11z93gavjoue	cmo3cf5k6000t11z9v90o55ic	2026-04	5	2026-04-17 20:10:47.153
cmo39u1y00007133pgkoeoj6a	cmo39u1xy0005133p9jky131l	2026-04	70	2026-04-17 18:58:23.449
cmo39u1ya000b133p27yvym4d	cmo39u1y60009133pph8c4f8q	2026-04	4	2026-04-17 18:58:23.458
cmo39u1yf000f133pe7fvxbs0	cmo39u1yd000d133peh7qa74h	2026-04	4	2026-04-17 18:58:23.464
cmo39u1yl000j133p8duuyoqb	cmo39u1yi000h133pjab6yt1y	2026-04	25	2026-04-17 18:58:23.469
cmo39u1yr000n133pqkn2mom8	cmo39u1yo000l133ps6zvmxct	2026-04	4	2026-04-17 18:58:23.475
cmo3cf5kz000z11z9h68kujfh	cmo3cf5kp000x11z9zlykliym	2026-04	4	2026-04-17 20:10:47.172
cmo3cf5lk001311z9d4s3fjkt	cmo3cf5la001111z9f2qz5uai	2026-04	17	2026-04-17 20:10:47.193
cmo3cf5m7001711z9y16jl30y	cmo3cf5lw001511z9rhr0m4fc	2026-04	4	2026-04-17 20:10:47.216
cmo3cf5ms001b11z9y7hcaiti	cmo3cf5mi001911z9p1qbftgv	2026-04	10	2026-04-17 20:10:47.237
cmo74upne002v35589rz3aqn4	cmo74upna002t3558a19lri14	2026-04	4	2026-04-20 11:50:00.795
cmp2xximx000r3dz4a7dd5ayx	cmp2xximp000p3dz4zpytag9w	2026-05	165	2026-05-12 18:04:51.994
cmp2xxin6000v3dz4zglh5xu2	cmp2xxin3000t3dz416xl165m	2026-05	152	2026-05-12 18:04:52.002
cmp2xxinc000z3dz4s1ljsxr3	cmp2xxin9000x3dz40ko21jd4	2026-05	314	2026-05-12 18:04:52.009
cmp2xxinj00133dz4mk753abz	cmp2xxing00113dz414kal6m3	2026-05	175	2026-05-12 18:04:52.015
cmp2xxinr00173dz4kxxffkh4	cmp2xxinm00153dz4tdxp1zy5	2026-05	187	2026-05-12 18:04:52.023
cmp2xxinx001b3dz4e84c8eli	cmp2xxinu00193dz45nvuwobd	2026-05	729	2026-05-12 18:04:52.03
cmp2xxio3001f3dz49odhxn55	cmp2xxio0001d3dz4j2b73feg	2026-05	175	2026-05-12 18:04:52.035
cmp2xxio9001j3dz46d7a55b1	cmp2xxio6001h3dz4xu6oe4oo	2026-05	153	2026-05-12 18:04:52.041
cmp2xxioe001n3dz4wywnbeya	cmp2xxioc001l3dz41gkybkdr	2026-05	248	2026-05-12 18:04:52.047
cmp2xxiok001r3dz4e02aseb9	cmp2xxioh001p3dz4yo4huqrb	2026-05	785	2026-05-12 18:04:52.052
cmo39u1yy000r133py83bdrvu	cmo39u1yv000p133p5kw8lt96	2026-04	4	2026-04-17 18:58:23.482
cmo39u1z3000v133pluo5x5re	cmo39u1z1000t133pvum2fuis	2026-04	17	2026-04-17 18:58:23.488
cmo39u1z9000z133pgr4punne	cmo39u1z6000x133pvgtitbio	2026-04	4	2026-04-17 18:58:23.493
cmo39u1ze0013133pmqcuaukg	cmo39u1zc0011133pk2hlshdy	2026-04	10	2026-04-17 18:58:23.499
cmo3f143o001r3558dh0joh0j	cmo3f1435001p35585p3aw7h4	2026-04	367	2026-04-17 21:23:50.917
cmo3f143v001v3558we6w5mnk	cmo3f143s001t35585febfwwj	2026-04	600	2026-04-17 21:23:50.924
cmo3f1443001z3558pusqyqrc	cmo3f143y001x3558mpvzysyu	2026-04	1554	2026-04-17 21:23:50.931
cmo3f144c00233558swnm0et0	cmo3f144800213558xd8b5alm	2026-04	277	2026-04-17 21:23:50.941
cmo3f144m00273558454fqd5v	cmo3f144g002535586dr3kggj	2026-04	486	2026-04-17 21:23:50.951
cmo3f144x002b3558axhirirw	cmo3f144q00293558f9y7hp32	2026-04	336	2026-04-17 21:23:50.961
cmo3cf5na001f11z9kmrtgud9	cmo3cf5n1001d11z9iauvibrw	2026-04	4	2026-04-17 20:10:47.255
cmp4d6c3n000hkuebsoje2sj9	cmo3cf5kp000x11z9zlykliym	2026-05	3	2026-05-13 17:59:23.843
cmo3f1455002f3558efbmh6wh	cmo3f1450002d3558noa2lc2v	2026-04	1498	2026-04-17 21:23:50.969
cmo3f145b002j3558o969ssle	cmo3f1458002h3558ytnk4evw	2026-04	364	2026-04-17 21:23:50.975
cmo3f145h002n3558dmfrjyt6	cmo3f145e002l35580shzg4ib	2026-04	450	2026-04-17 21:23:50.982
cmo3f145t002r3558wg0nibqv	cmo3f145o002p3558lbpwovnc	2026-04	533	2026-04-17 21:23:50.993
cmp4d6c3r000jkueb7v01fk43	cmo3cf5la001111z9f2qz5uai	2026-05	13	2026-05-13 17:59:23.847
cmp4d6c3u000lkueb9yk4a5t3	cmo3cf5mi001911z9p1qbftgv	2026-05	11	2026-05-13 17:59:23.851
cmo3avt4p002f6725frd7z6n5	cmo3avt3c002d6725ivehohui	2026-04	3	2026-04-17 19:27:44.953
cmo3avt77002j67252g9dqjbv	cmo3avt62002h67257mk1vwfz	2026-04	4	2026-04-17 19:27:45.043
cmo3avt99002n67250eble9y6	cmo3avt8a002l6725s68e9wqy	2026-04	9	2026-04-17 19:27:45.118
cmo3avtax002r6725pqrymtud	cmo3avta3002p6725ebz2jbeg	2026-04	208	2026-04-17 19:27:45.178
cmo3avtcc002v6725k27f79qy	cmo3avtbm002t6725mlwkwv6d	2026-04	4	2026-04-17 19:27:45.229
cmo3avtcw002z6725l7xpqhzt	cmo3avtcn002x6725o7v0iq25	2026-04	40	2026-04-17 19:27:45.249
cmo3avtdk00336725nh1dert5	cmo3avtd900316725uw3ues9o	2026-04	6	2026-04-17 19:27:45.273
cmo3avte400376725pvqtc05z	cmo3avtdv00356725h2sjwjyr	2026-04	3	2026-04-17 19:27:45.293
cmo3avtew003b6725kgu4mklp	cmo3avtek003967259z5kybs8	2026-04	5	2026-04-17 19:27:45.321
cmo3avtfg003f6725iy37c1y7	cmo3avtf6003d6725turw63ug	2026-04	2	2026-04-17 19:27:45.341
cmo39u1xt0003133p7gldlj4w	cmo39u1xm0001133p5s03f731	2026-04	7	2026-04-17 18:58:23.442
cmp4d6c3y000nkuebizor1s7r	cmo74upna002t3558a19lri14	2026-05	4	2026-05-13 17:59:23.854
cmp4d6c44000rkueb3zc4s3lr	cmp4d6c41000pkuebwlhwisd2	2026-05	8	2026-05-13 17:59:23.861
cmp5reiph002r11kbksp1s8uy	cmp5reipd002p11kb15lmlioq	2026-05	2	2026-05-14 17:25:26.453
cmp5reipk002t11kbgixul9qb	cmo3avtek003967259z5kybs8	2026-05	5	2026-05-14 17:25:26.457
cmp5reipq002x11kbjwc3f79i	cmp5reipn002v11kbwjcz48ft	2026-05	3	2026-05-14 17:25:26.462
cmp5reipw003111kbvwr2bkaj	cmp5reipt002z11kbwwa80ysf	2026-05	2	2026-05-14 17:25:26.468
cmo3cf5hs000f11z9lhpbv33b	cmo3cf5gu000d11z9awqs9cm2	2026-04	68	2026-04-17 20:10:47.056
cmo3cf5ig000j11z9ae6fj5si	cmo3cf5i2000h11z9amrx5qhq	2026-04	9	2026-04-17 20:10:47.08
cmo3cf5j2000n11z93mymwphj	cmo3cf5iq000l11z9kfu71ysb	2026-04	137	2026-04-17 20:10:47.103
cmp4d6c320007kuebelkfevm8	cmp4d6c2x0005kueb2mjp4elv	2026-05	4	2026-05-13 17:59:23.823
cmp4d6c370009kuebvqm78wpc	cmo3cf5gu000d11z9awqs9cm2	2026-05	40	2026-05-13 17:59:23.828
cmp4d6c3b000bkuebd2wspl82	cmo3cf5iq000l11z9kfu71ysb	2026-05	115	2026-05-13 17:59:23.832
cmp4d6c3f000dkuebzq0k08rt	cmo3cf5k6000t11z9v90o55ic	2026-05	5	2026-05-13 17:59:23.835
cmp4d6c3j000fkuebsyjz8hzi	cmo3cf5jf000p11z9fc5b6aoa	2026-05	5	2026-05-13 17:59:23.839
cmp5reiop002d11kbpao4yd52	cmo3avt8a002l6725s68e9wqy	2026-05	4	2026-05-14 17:25:26.425
cmp5reiou002f11kbu72e7p6p	cmo3avta3002p6725ebz2jbeg	2026-05	175	2026-05-14 17:25:26.43
cmp5reiox002h11kbstdcbx3o	cmo3avtbm002t6725mlwkwv6d	2026-05	2	2026-05-14 17:25:26.434
cmp5reip1002j11kboeb478uw	cmo3avtcn002x6725o7v0iq25	2026-05	34	2026-05-14 17:25:26.438
cmp5reip5002l11kb6rz1crx9	cmo3avtd900316725uw3ues9o	2026-05	11	2026-05-14 17:25:26.441
cmp5reip8002n11kbe82qw2s6	cmo3avtdv00356725h2sjwjyr	2026-05	4	2026-05-14 17:25:26.445
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY clients (id, name, slug, "logoUrl", website, notes, "createdById", "createdAt", "updatedAt") FROM stdin;
cmo37dbff00015wkl105xjv72	Energisaprev	energisaprev	\N	https://energisaprev.com.br/	\N	cmo06ktjh00001t7222eivqi0	2026-04-17 17:49:23.355	2026-04-17 17:49:23.355
cmo37qcgs000933z3w1lagvwz	Previbayer	previbayer	\N	https://www.previbayer.com.br/	\N	cmo06ktjh00001t7222eivqi0	2026-04-17 17:59:31.228	2026-04-17 17:59:31.228
cmo399kfi0001gswtqp07m8xx	BB Previdência	bb-previdencia	\N	https://bbprevidencia.com.br/	\N	cmo06ktjh00001t7222eivqi0	2026-04-17 18:42:27.631	2026-04-17 18:42:27.631
cmo3eu9zn00013558w4lqq16d	CRT Comunicação	crt-comunicacao	\N	https://agenciacrt.com.br/	\N	cmo06ktjh00001t7222eivqi0	2026-04-17 21:18:31.955	2026-04-17 21:18:31.955
cmo3ey6c6000t3558s4xu80g6	OABPREV SC	oabprev-sc	\N	https://www.oabprev-sc.org.br/	\N	cmo06ktjh00001t7222eivqi0	2026-04-17 21:21:33.846	2026-04-17 21:21:33.846
cmo3eyxii000v3558fkno1zw5	PREVCOM MG	prevcom-mg	\N	https://prevcommg.com.br/	\N	cmo06ktjh00001t7222eivqi0	2026-04-17 21:22:09.066	2026-04-17 21:22:09.066
\.


--
-- Data for Name: client_users; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY client_users (id, "clientId", name, email, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ga4_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY ga4_metrics (id, month, "monthLabel", "usuariosAtivos", "novosUsuarios", "usuariosTotais", sessoes, "sessoesEngajadas", "taxaEngajamento", "tempoMedioEngajamento", "tempoMedioSessao", "viewsPorSessao", "numEventos", "createdAt", "updatedAt", "clientId") FROM stdin;
cmp4eme52000111kb619m1jwi	2026-05	Mai/26	3605	3098	3853	5295	2656	50.1599999999999966	45	\N	1.60000000000000009	24654	2026-05-13 18:39:52.598	2026-05-13 20:54:29.365	cmo37dbff00015wkl105xjv72
\.


--
-- Data for Name: ga4_origin_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY ga4_origin_metrics (id, "originId", month, sessoes, "taxaEng", "tempoMedio") FROM stdin;
cmp4jfipr001911kbgiobn0rk	cmp4jfipk001711kb4ej2onr0	2026-05	2479	42	29
cmp4jfiq6001d11kbo9el82sg	cmp4jfiq0001b11kbd8xvt2nh	2026-05	2179	57.5	55
cmp4jfiqf001h11kba42pkar6	cmp4jfiqa001f11kbii08z5n2	2026-05	179	67.5999999999999943	63
cmp4jfiqm001l11kb6h9kb8ek	cmp4jfiqj001j11kbnxh9lpum	2026-05	166	0	48
cmp4jfir0001p11kbmuexpd1x	cmp4jfiqr001n11kbad4bxj4y	2026-05	128	75.7999999999999972	60
cmp4jfirb001t11kbeoa6valr	cmp4jfir5001r11kbrhn8a0ad	2026-05	70	37.1000000000000014	72
cmp4jfirh001x11kbhgnlwvpk	cmp4jfire001v11kbvdq8t2ye	2026-05	52	44.2000000000000028	53
cmp4jfirm002111kbxfak7w92	cmp4jfirk001z11kb3rees4b9	2026-05	46	67.4000000000000057	101
cmp4jfirv002511kbwqrkn7yj	cmp4jfirr002311kbeu9xbkby	2026-05	32	53.1000000000000014	41
cmp4jfis0002911kbgrbq5nn4	cmp4jfirx002711kby6ckfw3e	2026-05	16	68.7999999999999972	264
\.


--
-- Data for Name: ga4_origins; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY ga4_origins (id, fonte, "clientId") FROM stdin;
cmp4jfipk001711kb4ej2onr0	(direct)	cmo37dbff00015wkl105xjv72
cmp4jfiq0001b11kbd8xvt2nh	google	cmo37dbff00015wkl105xjv72
cmp4jfiqa001f11kbii08z5n2	conecta.energisa.com.br	cmo37dbff00015wkl105xjv72
cmp4jfiqj001j11kbnxh9lpum	(not set)	cmo37dbff00015wkl105xjv72
cmp4jfiqr001n11kbad4bxj4y	bing	cmo37dbff00015wkl105xjv72
cmp4jfir5001r11kbrhn8a0ad	shre.ink	cmo37dbff00015wkl105xjv72
cmp4jfire001v11kbvdq8t2ye	l.wl.co	cmo37dbff00015wkl105xjv72
cmp4jfirk001z11kb3rees4b9	statics.teams.cdn.office.net	cmo37dbff00015wkl105xjv72
cmp4jfirr002311kbeu9xbkby	energisaprevsimulador.com.br	cmo37dbff00015wkl105xjv72
cmp4jfirx002711kby6ckfw3e	crtcomunicacao.share.taskrow.com	cmo37dbff00015wkl105xjv72
\.


--
-- Data for Name: ga4_page_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY ga4_page_metrics (id, "pageId", month, views, "tempoMedio") FROM stdin;
cmp4jfigu000511kbb2nhh1ei	cmp4jfigh000311kb3bxq0chh	2026-05	3219	12
cmp4jfih1000911kbcyjcq1i1	cmp4jfigy000711kbh2665ocf	2026-05	1296	11
cmp4jfih6000d11kbaurvfwb2	cmp4jfih4000b11kbvgd7ljvi	2026-05	1059	28
cmp4jfihc000h11kbeo6kt9rx	cmp4jfih9000f11kb8mv4ru0z	2026-05	724	33
cmp4jfihh000l11kbfjpztq1q	cmp4jfihe000j11kb3pb9anwg	2026-05	345	19
cmp4jfiho000p11kbuxajohao	cmp4jfihm000n11kbk381xyrr	2026-05	230	26
cmp4jfiht000t11kbh3zk2tpp	cmp4jfihr000r11kb51pmibsz	2026-05	222	26
cmp4jfihy000x11kbgt713spe	cmp4jfihw000v11kbjtqi8j5u	2026-05	147	36
cmp4jfii4001111kbpibpzra4	cmp4jfii1000z11kbnuhgu2wm	2026-05	105	28
cmp4jfiib001511kbqhna3ixi	cmp4jfii8001311kbhbxu9tj7	2026-05	85	33
\.


--
-- Data for Name: ga4_pages; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY ga4_pages (id, pagina, label, "clientId") FROM stdin;
cmp4jfigh000311kb3bxq0chh	/	Home	cmo37dbff00015wkl105xjv72
cmp4jfigy000711kbh2665ocf	/consulte-as-datas-de-solicitacao-de-emprestimos/	consulte-as-datas-de-solicitacao-de-emprestimos	cmo37dbff00015wkl105xjv72
cmp4jfih4000b11kbvgd7ljvi	/emprestimo/	emprestimo	cmo37dbff00015wkl105xjv72
cmp4jfih9000f11kb8mv4ru0z	/simulador/	simulador	cmo37dbff00015wkl105xjv72
cmp4jfihe000j11kb3pb9anwg	/12475-2/	12475-2	cmo37dbff00015wkl105xjv72
cmp4jfihm000n11kbk381xyrr	/fale-conosco/	fale-conosco	cmo37dbff00015wkl105xjv72
cmp4jfihr000r11kb51pmibsz	/adesao/	adesao	cmo37dbff00015wkl105xjv72
cmp4jfihw000v11kbjtqi8j5u	/imposto-de-renda/	imposto-de-renda	cmo37dbff00015wkl105xjv72
cmp4jfii1000z11kbnuhgu2wm	/plano/plano-energisa/	plano-energisa	cmo37dbff00015wkl105xjv72
cmp4jfii8001311kbhbxu9tj7	/investimentos/	investimentos	cmo37dbff00015wkl105xjv72
\.


--
-- Data for Name: instagram_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY instagram_metrics (id, month, "monthLabel", seguidores, "novosSeguidores", "alcanceOrganico", visualizacoes, interacoes, "visitasPerfil", "postagensTotal", "reelsQtd", "reelsAlcance", "reelsInteracoes", "storiesQtd", "storiesViews", "curtidasPosts", "comentariosPosts", "salvamentosPosts", "compartilhamentosPosts", "createdAt", "updatedAt", "clientId") FROM stdin;
cmo3a7tdj0009qmflcr234eym	2025-06	Jun/25	10587	0	6803	0	437	490	8	6	7440	404	0	0	407	30	0	0	2026-04-17 19:09:05.527	2026-04-17 21:16:15.878	cmo399kfi0001gswtqp07m8xx
cmo39ae7h000fgswt7ygqig9p	2025-11	Nov/25	10587	0	648243	1208203	578	20551	8	5	7869	493	0	0	510	68	0	0	2026-04-17 18:43:06.221	2026-04-17 21:16:11.484	cmo399kfi0001gswtqp07m8xx
cmo3avnb4001t6725lm90n2rf	2026-02	Fev/26	1473	0	597	3514	116	93	8	3	608	72	0	0	108	8	0	0	2026-04-17 19:27:37.409	2026-05-14 17:25:18.858	cmo37qcgs000933z3w1lagvwz
cmo3avnob001v6725qiy6vilx	2026-01	Jan/26	1473	0	683	5818	146	94	9	4	925	95	0	0	132	14	0	0	2026-04-17 19:27:37.884	2026-05-14 17:25:19.709	cmo37qcgs000933z3w1lagvwz
cmo38muas0003caxhyps0b1vg	2026-03	Mar/26	2249	15	1011	5618	99	327	13	5	1056	73	0	0	91	8	0	0	2026-04-17 18:24:47.332	2026-05-13 20:54:23.375	cmo37dbff00015wkl105xjv72
cmo38mub20005caxhwmgmq7g2	2026-02	Fev/26	2249	0	1053	4346	99	331	10	4	978	72	0	0	97	2	0	0	2026-04-17 18:24:47.342	2026-05-13 20:54:23.972	cmo37dbff00015wkl105xjv72
cmo3avo22001x67255xl5iuuy	2025-12	Dez/25	1473	0	717	6947	139	107	15	3	582	67	0	0	118	21	0	0	2026-04-17 19:27:38.378	2026-05-14 17:25:20.394	cmo37qcgs000933z3w1lagvwz
cmo3avodo001z6725x5dyt88f	2025-11	Nov/25	1473	0	521	5574	108	82	12	3	510	43	0	0	104	4	0	0	2026-04-17 19:27:38.797	2026-05-14 17:25:21.173	cmo37qcgs000933z3w1lagvwz
cmo39ae7d000dgswtt2uuwmiz	2025-12	Dez/25	10587	0	142561	474899	908	1194	10	5	6982	840	0	0	843	65	0	0	2026-04-17 18:43:06.217	2026-04-17 21:16:10.902	cmo399kfi0001gswtqp07m8xx
cmo3a7rvc0001qmfl96px00ew	2025-10	Out/25	10587	0	1362710	5048092	938	62139	14	8	15358	747	0	0	895	43	0	0	2026-04-17 19:09:03.576	2026-04-17 21:16:12.352	cmo399kfi0001gswtqp07m8xx
cmo3a7sd70003qmflsz1texuh	2025-09	Set/25	10587	0	775450	1925869	841	23636	14	6	11471	589	0	0	793	48	0	0	2026-04-17 19:09:04.219	2026-04-17 21:16:13.245	cmo399kfi0001gswtqp07m8xx
cmo3a7sph0005qmfl6g7zvebo	2025-08	Ago/25	10587	0	170890	74857	605	6286	16	6	9221	364	0	0	556	49	0	0	2026-04-17 19:09:04.661	2026-04-17 21:16:14.213	cmo399kfi0001gswtqp07m8xx
cmo3a7sz30007qmfl8ky7zj01	2025-07	Jul/25	10587	0	174527	0	619	6180	8	6	10348	453	0	0	572	47	0	0	2026-04-17 19:09:05.008	2026-04-17 21:16:15.019	cmo399kfi0001gswtqp07m8xx
cmo3a7tq9000bqmflxg9oep96	2025-05	Mai/25	10587	0	8381	0	618	457	15	8	10395	518	0	0	567	51	0	0	2026-04-17 19:09:05.985	2026-04-17 21:16:16.599	cmo399kfi0001gswtqp07m8xx
cmo3avops00216725ph8r0vz1	2025-10	Out/25	1473	0	772	6364	115	79	11	4	847	74	0	0	100	15	0	0	2026-04-17 19:27:39.232	2026-05-14 17:25:21.915	cmo37qcgs000933z3w1lagvwz
cmo3avp0x00236725cgzlq06i	2025-09	Set/25	1473	0	441	4806	73	87	11	2	288	28	0	0	71	2	0	0	2026-04-17 19:27:39.633	2026-05-14 17:25:22.645	cmo37qcgs000933z3w1lagvwz
cmo39ae700007gswtz4gkxmwm	2026-03	Mar/26	10587	56	1083	5168	132	359	3	1	391	75	0	0	120	12	0	0	2026-04-17 18:43:06.204	2026-04-17 21:16:08.748	cmo399kfi0001gswtqp07m8xx
cmo39ae740009gswt3hw0muu6	2026-02	Fev/26	10587	0	1392	4406	113	210	3	2	1230	108	0	0	110	3	0	0	2026-04-17 18:43:06.209	2026-04-17 21:16:09.553	cmo399kfi0001gswtqp07m8xx
cmo39ae78000bgswtcaieua53	2026-01	Jan/26	10587	0	4267	13154	591	348	9	4	4514	512	0	0	551	40	0	0	2026-04-17 18:43:06.212	2026-04-17 21:16:10.181	cmo399kfi0001gswtqp07m8xx
cmo3avpfc002567257yd39ik4	2025-08	Ago/25	1473	0	531	2403	127	143	10	2	481	56	0	0	110	17	0	0	2026-04-17 19:27:40.152	2026-05-14 17:25:24.112	cmo37qcgs000933z3w1lagvwz
cmo38mub90007caxh59tgwz5l	2026-01	Jan/26	2249	0	2392	9416	275	470	15	10	3761	237	0	0	251	24	0	0	2026-04-17 18:24:47.349	2026-05-13 20:54:24.568	cmo37dbff00015wkl105xjv72
cmo38mubi0009caxhuf97w2fn	2025-12	Dez/25	2249	0	1214	10173	99	311	15	3	844	48	0	0	99	0	0	0	2026-04-17 18:24:47.358	2026-05-13 20:54:25.117	cmo37dbff00015wkl105xjv72
cmo38mubp000bcaxhb9fnn6a3	2025-11	Nov/25	2249	0	1828	25353	230	807	16	4	1294	112	0	0	214	16	0	0	2026-04-17 18:24:47.365	2026-05-13 20:54:25.578	cmo37dbff00015wkl105xjv72
cmo3apjwd0001n9vnrinrphvh	2026-04	Abr/26	1473	2	466	3404	65	124	9	1	138	13	0	0	64	1	0	0	2026-04-17 19:22:53.053	2026-05-14 17:25:17.281	cmo37qcgs000933z3w1lagvwz
cmo3avn0b001r6725hpqebk4f	2026-03	Mar/26	1473	7	559	4372	127	121	10	1	250	29	0	0	114	13	0	0	2026-04-17 19:27:37.019	2026-05-14 17:25:17.966	cmo37qcgs000933z3w1lagvwz
cmo3avprb002767259qav8ist	2025-07	Jul/25	1473	0	397	0	89	61	11	1	119	4	0	0	83	6	0	0	2026-04-17 19:27:40.583	2026-05-14 17:25:24.821	cmo37qcgs000933z3w1lagvwz
cmo3avq64002967250fc5yqn0	2025-06	Jun/25	1473	0	422	0	68	73	10	1	95	7	0	0	67	1	0	0	2026-04-17 19:27:41.116	2026-05-14 17:25:25.734	cmo37qcgs000933z3w1lagvwz
cmo3avqgr002b6725idqs6l8f	2025-05	Mai/25	1465	0	489	0	43	36	9	1	240	5	0	0	42	1	0	0	2026-04-17 19:27:41.499	2026-04-17 21:15:24.927	cmo37qcgs000933z3w1lagvwz
cmo39ae6u0005gswtmtahhzs8	2026-04	Abr/26	10657	70	890	2580	69	238	2	2	697	69	0	0	65	4	0	0	2026-04-17 18:43:06.198	2026-04-17 21:16:08.017	cmo399kfi0001gswtqp07m8xx
cmp2xxdvz00093dz421ojrjgq	2026-01	Jan/26	1444	0	502	2661	56	95	6	0	0	0	0	0	55	1	0	0	2026-05-12 18:04:45.84	2026-05-12 18:04:45.84	cmo3eyxii000v3558fkno1zw5
cmo3cf3g3000111z9q7ck3uzx	2025-10	Out/25	2249	0	998	13780	205	471	20	5	1426	78	0	0	194	11	0	0	2026-04-17 20:10:44.403	2026-05-13 20:54:26.104	cmo37dbff00015wkl105xjv72
cmo3cf3s2000311z9okpqpp1z	2025-09	Set/25	2249	0	1000	10527	138	351	13	6	1433	90	0	0	130	8	0	0	2026-04-17 20:10:44.834	2026-05-13 20:54:26.925	cmo37dbff00015wkl105xjv72
cmo3cf50g000b11z92i5ezqyn	2025-05	Mai/25	2219	0	951	0	126	297	11	3	954	81	0	0	118	8	0	0	2026-04-17 20:10:46.432	2026-04-20 11:53:14.06	cmo37dbff00015wkl105xjv72
cmp2xxbiv00013dz4ur83sqyq	2026-05	Mai/26	1451	7	12435	35228	43	78	5	0	0	0	0	0	43	0	0	0	2026-05-12 18:04:42.775	2026-05-12 18:04:42.775	cmo3eyxii000v3558fkno1zw5
cmp2xxc3c00033dz45hyvpcxk	2026-04	Abr/26	1444	0	31297	97988	152	262	15	1	74	9	0	0	152	0	0	0	2026-05-12 18:04:43.512	2026-05-12 18:04:43.512	cmo3eyxii000v3558fkno1zw5
cmo3evk6a00053558pbs1dd7q	2026-04	Abr/26	493	5	31	280	0	35	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:31.81	2026-04-17 21:19:31.81	cmo3eu9zn00013558w4lqq16d
cmo3evks5000735580ijigg6i	2026-03	Mar/26	488	0	987	3282	73	242	2	1	797	52	0	0	56	17	0	0	2026-04-17 21:19:32.598	2026-04-17 21:19:32.598	cmo3eu9zn00013558w4lqq16d
cmo3evl5k00093558fisqypyh	2026-02	Fev/26	488	0	44	1655	0	58	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:33.081	2026-04-17 21:19:33.081	cmo3eu9zn00013558w4lqq16d
cmo3evoey000b3558t7mwwurz	2026-01	Jan/26	488	0	26	1917	0	59	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:37.307	2026-04-17 21:19:37.307	cmo3eu9zn00013558w4lqq16d
cmo3evova000d3558ucw047da	2025-12	Dez/25	488	0	41	1491	0	73	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:37.894	2026-04-17 21:19:37.894	cmo3eu9zn00013558w4lqq16d
cmo3evpda000f35581es8vxzr	2025-11	Nov/25	488	0	150	2067	0	49	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:38.542	2026-04-17 21:19:38.542	cmo3eu9zn00013558w4lqq16d
cmo3evpy5000h3558k7rbinqo	2025-10	Out/25	488	0	166	6338	0	177	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:39.293	2026-04-17 21:19:39.293	cmo3eu9zn00013558w4lqq16d
cmo3evqft000j35582fguwuqa	2025-09	Set/25	488	0	53	2465	0	68	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:39.929	2026-04-17 21:19:39.929	cmo3eu9zn00013558w4lqq16d
cmo3evqzq000l3558qij6e7n7	2025-08	Ago/25	488	0	126	752	0	64	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:40.647	2026-04-17 21:19:40.647	cmo3eu9zn00013558w4lqq16d
cmo3evrml000n3558sgiqca2k	2025-07	Jul/25	488	0	44	0	0	56	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:41.469	2026-04-17 21:19:41.469	cmo3eu9zn00013558w4lqq16d
cmo3evs3b000p3558eqa3qfxf	2025-06	Jun/25	488	0	49	0	0	54	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:42.071	2026-04-17 21:19:42.071	cmo3eu9zn00013558w4lqq16d
cmo3evsjn000r3558psbmna0f	2025-05	Mai/25	488	0	169	0	0	71	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:19:42.66	2026-04-17 21:19:42.66	cmo3eu9zn00013558w4lqq16d
cmo3f0vyt00113558gqmvmgds	2026-04	Abr/26	7781	28	43830	80980	42	127	3	0	0	0	1	51	41	1	0	0	2026-04-17 21:23:40.373	2026-04-17 21:23:40.373	cmo3ey6c6000t3558s4xu80g6
cmo3f0wli00133558qiydr7kj	2026-03	Mar/26	7753	0	63613	119714	106	244	7	2	946	27	0	0	105	1	0	0	2026-04-17 21:23:41.191	2026-04-17 21:23:41.191	cmo3ey6c6000t3558s4xu80g6
cmo3f0x4y00153558t3e2wbpu	2026-02	Fev/26	7753	0	14887	28808	0	188	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:23:41.89	2026-04-17 21:23:41.89	cmo3ey6c6000t3558s4xu80g6
cmo3f0y0t001735581lfcvoy0	2026-01	Jan/26	7753	0	19737	42173	99	256	4	4	1886	99	0	0	99	0	0	0	2026-04-17 21:23:43.037	2026-04-17 21:23:43.037	cmo3ey6c6000t3558s4xu80g6
cmo3f0yhv00193558ip7upx43	2025-12	Dez/25	7753	0	17917	46326	52	244	3	3	1327	52	0	0	50	2	0	0	2026-04-17 21:23:43.651	2026-04-17 21:23:43.651	cmo3ey6c6000t3558s4xu80g6
cmo3f0z8r001b3558jn5yggd8	2025-11	Nov/25	7753	0	13025	34414	52	341	2	2	574	52	0	0	50	2	0	0	2026-04-17 21:23:44.619	2026-04-17 21:23:44.619	cmo3ey6c6000t3558s4xu80g6
cmo3f0zyr001d3558h84dk62b	2025-10	Out/25	7753	0	3274	12621	0	255	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:23:45.555	2026-04-17 21:23:45.555	cmo3ey6c6000t3558s4xu80g6
cmo3f10wq001f35584mwxk5hf	2025-09	Set/25	7753	0	2542	10163	0	179	0	0	0	0	0	0	0	0	0	0	2026-04-17 21:23:46.779	2026-04-17 21:23:46.779	cmo3ey6c6000t3558s4xu80g6
cmo3f11n5001h3558owgf2j6g	2025-08	Ago/25	7753	0	4120	1692	16	242	1	1	890	16	0	0	16	0	0	0	2026-04-17 21:23:47.729	2026-04-17 21:23:47.729	cmo3ey6c6000t3558s4xu80g6
cmo3f126l001j3558t1ule1es	2025-07	Jul/25	7753	0	1081	0	16	148	1	1	309	16	0	0	16	0	0	0	2026-04-17 21:23:48.43	2026-04-17 21:23:48.43	cmo3ey6c6000t3558s4xu80g6
cmo3f12zk001l3558696fwp8v	2025-06	Jun/25	7753	0	931	0	9	155	1	1	172	9	0	0	9	0	0	0	2026-04-17 21:23:49.472	2026-04-17 21:23:49.472	cmo3ey6c6000t3558s4xu80g6
cmo3f13n7001n35583l3ektmj	2025-05	Mai/25	7753	0	1772	0	58	166	3	3	959	58	0	0	53	5	0	0	2026-04-17 21:23:50.323	2026-04-17 21:23:50.323	cmo3ey6c6000t3558s4xu80g6
cmp2xxcpr00053dz4wdie34vl	2026-03	Mar/26	1444	0	32659	128946	155	161	14	3	446	40	0	0	153	2	0	0	2026-05-12 18:04:44.319	2026-05-12 18:04:44.319	cmo3eyxii000v3558fkno1zw5
cmp2xxdc700073dz4ba8c1jw4	2026-02	Fev/26	1444	0	27889	114047	98	137	12	3	581	19	0	0	96	2	0	0	2026-05-12 18:04:45.127	2026-05-12 18:04:45.127	cmo3eyxii000v3558fkno1zw5
cmp2xxejx000b3dz4zn62ed3n	2025-12	Dez/25	1444	0	25602	124824	71	199	7	0	0	0	0	0	69	2	0	0	2026-05-12 18:04:46.701	2026-05-12 18:04:46.701	cmo3eyxii000v3558fkno1zw5
cmp2xxf52000d3dz48flwro59	2025-11	Nov/25	1444	0	20103	100405	130	168	15	2	143	16	0	0	129	1	0	0	2026-05-12 18:04:47.463	2026-05-12 18:04:47.463	cmo3eyxii000v3558fkno1zw5
cmp2xxfpy000f3dz4nmsklzgy	2025-10	Out/25	1444	0	19257	96812	199	226	16	4	480	72	0	0	191	8	0	0	2026-05-12 18:04:48.214	2026-05-12 18:04:48.214	cmo3eyxii000v3558fkno1zw5
cmo3cf43y000511z9spc8gjla	2025-08	Ago/25	2249	0	767	2755	105	285	10	5	792	59	0	0	97	8	0	0	2026-04-17 20:10:45.262	2026-05-13 20:54:27.377	cmo37dbff00015wkl105xjv72
cmo3cf4fw000711z9ab0o3hb4	2025-07	Jul/25	2249	0	918	0	114	196	13	3	602	41	0	0	111	3	0	0	2026-04-17 20:10:45.692	2026-05-13 20:54:27.929	cmo37dbff00015wkl105xjv72
cmo3cf4rf000911z97p0j4qd3	2025-06	Jun/25	2249	0	1353	0	185	289	14	7	1659	139	0	0	162	23	0	0	2026-04-17 20:10:46.107	2026-05-13 20:54:28.418	cmo37dbff00015wkl105xjv72
cmp2xxgc9000h3dz44f2lwywj	2025-09	Set/25	1444	0	17913	79755	140	188	13	4	378	59	0	0	140	0	0	0	2026-05-12 18:04:49.017	2026-05-12 18:04:49.017	cmo3eyxii000v3558fkno1zw5
cmp2xxgvs000j3dz4rmtmar0t	2025-08	Ago/25	1444	0	20374	21281	86	521	11	1	74	8	0	0	84	2	0	0	2026-05-12 18:04:49.72	2026-05-12 18:04:49.72	cmo3eyxii000v3558fkno1zw5
cmp2xxhmj000l3dz41vc2941f	2025-07	Jul/25	1444	0	19207	0	123	237	14	4	503	40	0	0	123	0	0	0	2026-05-12 18:04:50.683	2026-05-12 18:04:50.683	cmo3eyxii000v3558fkno1zw5
cmp2xxi8g000n3dz47vfzey5d	2025-06	Jun/25	1444	0	9791	0	115	148	13	1	49	11	0	0	115	0	0	0	2026-05-12 18:04:51.472	2026-05-12 18:04:51.472	cmo3eyxii000v3558fkno1zw5
cmp4d65340003kuebgjyqqeio	2026-05	Mai/26	2266	17	1112	3618	57	171	10	3	935	27	0	0	54	3	0	0	2026-05-13 17:59:14.752	2026-05-13 20:54:22.271	cmo37dbff00015wkl105xjv72
cmo38muai0001caxh3orx03zz	2026-04	Abr/26	2249	29	947	4717	68	360	10	3	809	40	0	0	65	3	0	0	2026-04-17 18:24:47.322	2026-05-13 20:54:22.823	cmo37dbff00015wkl105xjv72
cmp5reb03002b11kbdcez3qzz	2026-05	Mai/26	1474	1	359	1208	26	78	3	1	178	15	1	76	24	2	0	0	2026-05-14 17:25:16.467	2026-05-14 17:25:16.467	cmo37qcgs000933z3w1lagvwz
\.


--
-- Data for Name: linkedin_industries; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY linkedin_industries (id, nome, "clientId") FROM stdin;
\.


--
-- Data for Name: linkedin_industry_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY linkedin_industry_metrics (id, "industryId", month, seguidores, "createdAt") FROM stdin;
\.


--
-- Data for Name: linkedin_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY linkedin_metrics (id, month, "monthLabel", seguidores, "novosSeguidores", alcance, impressoes, engajamento, cliques, reacoes, postagens, "createdAt", "updatedAt", "clientId") FROM stdin;
\.


--
-- Data for Name: linkedin_roles; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY linkedin_roles (id, nome, "clientId") FROM stdin;
\.


--
-- Data for Name: linkedin_role_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY linkedin_role_metrics (id, "roleId", month, seguidores, "createdAt") FROM stdin;
\.


--
-- Data for Name: platform_connections; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY platform_connections (id, "clientId", platform, status, "accessToken", "refreshToken", "expiresAt", "accountId", "accountName", "accountEmail", metadata, "connectedAt", "createdAt", "updatedAt", "lastSyncAt") FROM stdin;
cmo3eusy4000335589xm561gm	cmo3eu9zn00013558w4lqq16d	META	CONNECTED	f3473615956ad25fe667b9f4:91318e143f69a32bba37315fb51da1f0:7b2ab0a00338b9389fa567e0fc241cdc8b5235a3bc7e454d9abfca6650c12ddf96206ac97975bc793d248f3eae6b2f8e0b8ecbac794610285d7ccf37190f33c18cbf661552a588e39844466f1463408045946358f18f9ea85cdf48805ebba430486e1cfc995dd51ce822b48d7d479673979efc829e32d45756ce7cb2eaf321275b99cfc14b7ddfbbab3502b3f5bf534632a15529fb796ee8c8015f15b51af7b433b7ab9b9d3b4377e3f74ef8242a93777852e394c1d04b99fca63c7ec9163bcbee669b1b9749171c975b88e43e2aab6e0d55f6f58414142accf0f8b69c0c765f04195d775d45852dd7fb507b28de40af577efea281b0c54983267850b2584c0bf0d8047f16f553cef9f6577512da402ac02a4a4afb53afb623a866c572362a3c26be2502b97fe4d5	\N	\N	1686531069193729	Carlota Pereira	\N	{"pageId":"101046667950108","pageName":"CRT Comunicação","instagramBusinessAccountId":"17841420402170902","instagramName":"Agência CRT","instagramUsername":"agenciacrt"}	2026-04-17 21:18:56.52	2026-04-17 21:18:56.524	2026-04-17 21:19:43.253	2026-04-17 21:19:43.252
cmo37qr8j000b33z3ig7rnuj1	cmo37qcgs000933z3w1lagvwz	META	CONNECTED	4a37057c862eb4a2d296bec5:7241a43a3682ea34dee8cdc4d23db285:2f922f7295043fcd780d1af95fe49d42119bced81457b6607419d760d8f06152654d28c60d9a7403d024b8efa7bcac6c316b8549e13e5d2c734b309e61f5ef8e9ec912c8805b2b5d59d57ef17fd1b805d41eebdd0bb8069f647406023d868946b942e2c17ba53042bdda009972f2e079a8be008a117c7eb8c2004e9ac4c78ac6b135545fd5ec0b85f143998d3c0beb7861118baf37d5eb483f9b6e6c6ed6896c27f6c8cea69b78ddc3a959efb32d716c17f8e7f5709d66bbc54b52c26b73b843c0fc0b997b9753896b0d84d90c9672c6fe543ac827e330e5c26dd24ff581985ce8fd7c9bdf0aed8a90e15a21fcba2e0134f78e0587c804678e0b70d1789ce8324439886c528c0213805da0b426dfbedd097a24d00d8cc5b3ae4b8c72d04b3cf3fa58d063d0b6b0025e630b	\N	\N	1686531069193729	Carlota Pereira	\N	{"pageId":"524243034357368","pageName":"Previbayer","instagramBusinessAccountId":"17841445732742906","instagramName":"Previbayer","instagramUsername":"previbayer.oficial"}	2026-04-17 17:59:50.366	2026-04-17 17:59:50.371	2026-05-14 17:25:26.47	2026-05-14 17:25:26.469
cmo399yok0003gswtr9u0akka	cmo399kfi0001gswtqp07m8xx	META	CONNECTED	d8c9edea9640f56e5f215a4a:7d325c97ef37e35c247d044459c53316:d8d7dc7be637d6f4e171c025d4edc3ff07d78128168ad77dc5b34dcefb2ff6ac215dc61853d61290fea5ec6bbd9feebb1f2ba776d3c38603510f4e7dfd1f056a44952926cb111af4af3001e7989ad61a461de43ca86824fdcb3d3ff5e3c3e6c10e53aa012a3e8a50af320b1dffb16ec67117fbd0050063e81a8b57e552ea0ea55da467500456fbd3a8abd2ad344b21030ea93db2a01c5b4410a8e59d8f48356e81c6057e88a283cd0ac0d4cdd9fe2da9510583f252bd35e5d18622f58a0774eee15df0ad9bd2f46ad84ea66328fa93f551ff5bae0bbfcc8fb248032925cd38bc5d7f3a734708a579c194ddbbfe80f18d91da8037e74e4a451ea5da9309e3a1f636441ca6d08dadf92925908480f9befdc4879602628f2f9d0595373e95f3fc0057f30e6b24a9ad900c55d8166b49	\N	\N	1686531069193729	Carlota Pereira	\N	{"pageId":"608214205870948","pageName":"BB Previdência","instagramBusinessAccountId":"17841439029520376","instagramName":"BB Previdência","instagramUsername":"bbprevidencia"}	2026-04-17 18:42:46.095	2026-04-17 18:42:46.1	2026-04-17 21:16:17.878	2026-04-17 21:16:17.876
cmo3ezi3c000x3558balims51	cmo3eyxii000v3558fkno1zw5	META	CONNECTED	a9ce8ecf8886d4548640f6f7:42b6754d965ca6eb9510736374c8262e:0c1d404009dcb2d4d9ca6cdf36cc9433ea2df103e3c81f481f6ce41925f805ffc0383b3deff367b4adb90df5e2b0016e553a2ca842fe3737e4d71e0f9492b0ac301bc8b1e1fd103377dbdeb8e0d9c5bc4d48d7ad17c0f2dbe31821738dd62ac1953dce26af8ced29e875e60279ce9dae135c142bd18e16743531bbc30c81c085409bfb74438d8ddd984f8132379009af591f8efd617c9a2313edf0fd8b5ce6e42a95f8500b192cb6b4f4bba9faed89c5fda34182e34c141a2868b2a1e8868b029d66fc51dbf9cc796cd5509c38a2a3a14bd38061df1d04b79b1371081917c10c98afa34489b59a97049b11f3e8a01a8e674ae5e9e5730d52b2f4cc4259084b4b08e13c38080a03b565486e8cbc27cd6546cfa2fef5745a918a41ede3d915246a17ceb35d117218d03c29	\N	\N	1686531069193729	Carlota Pereira	\N	{"pageId":"109711250706153","pageName":"Prevcom-MG","instagramBusinessAccountId":"17841433626681499","instagramName":"Prevcom-MG","instagramUsername":"prevcom.mg"}	2026-04-17 21:22:35.732	2026-04-17 21:22:35.736	2026-05-12 18:04:52.062	2026-05-12 18:04:52.053
cmo3f03m0000z35587jgxoocv	cmo3ey6c6000t3558s4xu80g6	META	CONNECTED	d66f933ddeec54207b8180bd:673c052daafdf488d37f68e61f75fd9a:b20f24a5b4915633046cf833f6e3a72a93074c7b7fd4646113ed63816a4f05a31e2810e1ab5f0ea866ffbe02a141c28b1f09bfa41f73b2b155ff881a430988a58ab9d332d6aa7246d7276f11790c1dc187750ba0be41c587d01b633bc583aff8a8872b9a1b9534f6724556b99a060788dbc05f9d152f661c6dd543fab727479c63257528fd7fee52402f91a35231a45f20f39cdc8d949430b6e9efec8c06dee740dc7544c5f3ae6ebd8f24a00365f6dba11988de6f2a6e9dbe0e954d345c0b4709efce5ea4b1fdee82fd571e65c7976e3d5c883a8ab0d98868d02defa50fd96b792e2c4223ec89ecff01e5a27e84ac4e3b6e2543f513d288508ed12be0ebfb2a02b7deb990e0df55ef49f7c1b0ac5b50fc21814c61a77f3f7523b2ed9d36701073b416e2f0a77cf15510	\N	\N	1686531069193729	Carlota Pereira	\N	{"pageId":"574329699319555","pageName":"OABPrev Santa Catarina","instagramBusinessAccountId":"17841402956408386","instagramName":"OABPrev Santa Catarina","instagramUsername":"oabprevsc"}	2026-04-17 21:23:03.621	2026-04-17 21:23:03.625	2026-04-17 21:23:50.998	2026-04-17 21:23:50.997
cmo37eg0q00035wklusiiklw3	cmo37dbff00015wkl105xjv72	META	CONNECTED	f8b678c29463fb092e1c76d1:db8452bd7063fe848619ca61f6e8b5d3:6cbb71761dc7e83c369689021e3a67493f0084a4cb2568dccd9443ebfdc8ff83cd480d706df9616bb0abac78369dc92f3778f2f60af24dc24a34dff0b959f63c2f7500fbf67e748019140f5732be5afc987201651b3fad73d08d6cdab8f7210317b2b8812212d075ce3d7ca5d295e1ed24a7ce81ad6abac7252ad143f40ccc30bb152b021aaf4cc9726d85e85c01f46df6484c1c91783a440d6788977d74510eedd36c395b582804e8b9761a1cfbdcae342ef83c36d9e32a86643f35897ce546a25bcb791b6df7017fc8abece803070e2ba1833c9663429c6700b10ab40b88c34a4cecf3995ef821872cfc49308d6f26bcaeac57efdc81c90df8aa665a8be37f31c49061ebd03ca3b1c16dbc1f52dfff708d92cd34ffb0a873e7edc3c21a30dc51a375da4a60ef	\N	\N	1686531069193729	Carlota Pereira	\N	{"pageId":"104760457848061","pageName":"EnergisaPrev","instagramBusinessAccountId":"17841449666820991","instagramName":"EnergisaPrev Previdência","instagramUsername":"energisaprev"}	2026-04-17 17:55:21.876	2026-04-17 17:50:15.962	2026-05-13 20:54:28.944	2026-05-13 20:54:28.943
cmp4d4tm40001kueb7pby8feb	cmo37dbff00015wkl105xjv72	GOOGLE_ANALYTICS	CONNECTED	a424e1ec7a2adf5a310f7b7d:bd2894c291c850f4e597baea72a79a1b:04bfe7bf7e5d9bffce30adbf58a7ac3372e71f48a3746779fee59b6052e20f9f8e7c0c09c34ecb3087d90a9273ba340cb1d1706a5cad449eb15af06fe607fc4e4044a8988c0419ce2f6a43db7eb4891455dcc672b8391b0c4e8a0ae66fab8c40dbe09613ce1dfb1fc7077314731cb8a88bb9ba7cbb616fe40b365cae296b751d78cf492ce1dd092610749187de38d0012b95bfd777bce4e53d2c9cdf5ea0e6dca2fd2c56860f48e0c195dd5d19149b08108ae5cc8a010bfafa4813068af76575d25f0059adf9e7ea5752aecce7a6ee3443ded662086d978e28d0e59b8ddb208163c99dd62c170efa2fff8a7c04b73d902a687b3b313145889b282141c5	cdebe0420ad6a8ae7819ba01:fab22b8be5606e815752749a4cae3801:db579ff9f76f1ba7dc53e1d6c92a37a39756a1cc121035ba64e56ec3f8bbd24f5083fa478c89981b975268e342ebad98221d618e4f870399b151085da20431431b701ab35b6dcea67db43af634794b5a60cc0a4a3b434a1c54b94661c40a922c8e6a93734c96bc	2026-05-13 21:47:35.98	113409152927338848322	\N	crtpropaganda@gmail.com	{"propertyId":"properties/372954264","propertyName":"Visão Geral - GA4"}	2026-05-13 20:47:36.98	2026-05-13 17:58:13.229	2026-05-13 20:54:30.098	2026-05-13 20:54:30.097
\.


--
-- Data for Name: themes; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY themes (id, tema, icon, platform, "createdAt", "clientId") FROM stdin;
\.


--
-- Data for Name: theme_metrics; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY theme_metrics (id, "themeId", month, curtidas, comentarios, compartilhamentos, "alcanceMedio", engajamento, cliques, "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: socialdash
--

COPY users (id, email, name, password, role, "createdAt", "updatedAt") FROM stdin;
cmo3ayjfu0000n70p3scut3kg	giu@crtcomunicacao.com.br	Giu	$2a$10$RwBm3bA/o.m3rEh3uL904.u7Hmeik/4ah/u.EEXoeFFUoLiyTl56u	ADMIN	2026-04-17 19:29:52.362	2026-04-17 19:29:52.362
cmo06ktjh00001t7222eivqi0	junior@crtcomunicacao.com.br	Sergio Junior	$2a$10$Xo6yXNqFGveBbrEsGiTXmeCN8pjU6M3I1VnP1Zxp9ONJi17cAc.gy	VIEWER	2026-04-15 15:03:55.278	2026-04-17 19:32:17.365
\.


--
-- Name: _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY _prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: cities_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: city_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY city_metrics
    ADD CONSTRAINT city_metrics_pkey PRIMARY KEY (id);


--
-- Name: clients_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: ga4_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY ga4_metrics
    ADD CONSTRAINT ga4_metrics_pkey PRIMARY KEY (id);


--
-- Name: ga4_origin_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY ga4_origin_metrics
    ADD CONSTRAINT ga4_origin_metrics_pkey PRIMARY KEY (id);


--
-- Name: ga4_origins_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY ga4_origins
    ADD CONSTRAINT ga4_origins_pkey PRIMARY KEY (id);


--
-- Name: ga4_page_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY ga4_page_metrics
    ADD CONSTRAINT ga4_page_metrics_pkey PRIMARY KEY (id);


--
-- Name: ga4_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY ga4_pages
    ADD CONSTRAINT ga4_pages_pkey PRIMARY KEY (id);


--
-- Name: instagram_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY instagram_metrics
    ADD CONSTRAINT instagram_metrics_pkey PRIMARY KEY (id);


--
-- Name: linkedin_industries_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY linkedin_industries
    ADD CONSTRAINT linkedin_industries_pkey PRIMARY KEY (id);


--
-- Name: linkedin_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY linkedin_metrics
    ADD CONSTRAINT linkedin_metrics_pkey PRIMARY KEY (id);


--
-- Name: linkedin_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY linkedin_roles
    ADD CONSTRAINT linkedin_roles_pkey PRIMARY KEY (id);


--
-- Name: platform_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY platform_connections
    ADD CONSTRAINT platform_connections_pkey PRIMARY KEY (id);


--
-- Name: themes_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace: 
--

ALTER TABLE ONLY themes
    ADD CONSTRAINT themes_pkey PRIMARY KEY (id);


--
-- Name: theme_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace:
--

ALTER TABLE ONLY theme_metrics
    ADD CONSTRAINT theme_metrics_pkey PRIMARY KEY (id);


--
-- Name: client_users_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace:
--

ALTER TABLE ONLY client_users
    ADD CONSTRAINT client_users_pkey PRIMARY KEY (id);


--
-- Name: linkedin_industry_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace:
--

ALTER TABLE ONLY linkedin_industry_metrics
    ADD CONSTRAINT linkedin_industry_metrics_pkey PRIMARY KEY (id);


--
-- Name: linkedin_role_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace:
--

ALTER TABLE ONLY linkedin_role_metrics
    ADD CONSTRAINT linkedin_role_metrics_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: socialdash; Tablespace:
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cities_clientId_name_platform_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "cities_clientId_name_platform_key" ON cities USING btree ("clientId", name, platform);


--
-- Name: city_metrics_cityId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "city_metrics_cityId_month_key" ON city_metrics USING btree ("cityId", month);


--
-- Name: clients_slug_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX clients_slug_key ON clients USING btree (slug);


--
-- Name: ga4_metrics_clientId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "ga4_metrics_clientId_month_key" ON ga4_metrics USING btree ("clientId", month);


--
-- Name: ga4_origin_metrics_originId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "ga4_origin_metrics_originId_month_key" ON ga4_origin_metrics USING btree ("originId", month);


--
-- Name: ga4_origins_clientId_fonte_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "ga4_origins_clientId_fonte_key" ON ga4_origins USING btree ("clientId", fonte);


--
-- Name: ga4_page_metrics_pageId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "ga4_page_metrics_pageId_month_key" ON ga4_page_metrics USING btree ("pageId", month);


--
-- Name: ga4_pages_clientId_pagina_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "ga4_pages_clientId_pagina_key" ON ga4_pages USING btree ("clientId", pagina);


--
-- Name: instagram_metrics_clientId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "instagram_metrics_clientId_month_key" ON instagram_metrics USING btree ("clientId", month);


--
-- Name: linkedin_industries_clientId_nome_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "linkedin_industries_clientId_nome_key" ON linkedin_industries USING btree ("clientId", nome);


--
-- Name: linkedin_metrics_clientId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "linkedin_metrics_clientId_month_key" ON linkedin_metrics USING btree ("clientId", month);


--
-- Name: linkedin_roles_clientId_nome_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "linkedin_roles_clientId_nome_key" ON linkedin_roles USING btree ("clientId", nome);


--
-- Name: platform_connections_clientId_platform_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "platform_connections_clientId_platform_key" ON platform_connections USING btree ("clientId", platform);


--
-- Name: platform_connections_clientid_platform_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX platform_connections_clientid_platform_key ON platform_connections USING btree ("clientId", platform);


--
-- Name: themes_clientId_platform_tema_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX "themes_clientId_platform_tema_key" ON themes USING btree ("clientId", platform, tema);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace: 
--

CREATE UNIQUE INDEX users_email_key ON users USING btree (email);


--
-- Name: client_users_clientId_email_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace:
--

CREATE UNIQUE INDEX "client_users_clientId_email_key" ON client_users USING btree ("clientId", email);


--
-- Name: theme_metrics_themeId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace:
--

CREATE UNIQUE INDEX "theme_metrics_themeId_month_key" ON theme_metrics USING btree ("themeId", month);


--
-- Name: linkedin_industry_metrics_industryId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace:
--

CREATE UNIQUE INDEX "linkedin_industry_metrics_industryId_month_key" ON linkedin_industry_metrics USING btree ("industryId", month);


--
-- Name: linkedin_role_metrics_roleId_month_key; Type: INDEX; Schema: public; Owner: socialdash; Tablespace:
--

CREATE UNIQUE INDEX "linkedin_role_metrics_roleId_month_key" ON linkedin_role_metrics USING btree ("roleId", month);


--
-- Name: clients_createdById_idx; Type: INDEX; Schema: public; Owner: socialdash; Tablespace:
--

CREATE INDEX "clients_createdById_idx" ON clients USING btree ("createdById");


--
-- Name: platform_connections_status_idx; Type: INDEX; Schema: public; Owner: socialdash; Tablespace:
--

CREATE INDEX platform_connections_status_idx ON platform_connections USING btree (status);


--
-- Name: cities_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY cities
    ADD CONSTRAINT "cities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: city_metrics_cityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY city_metrics
    ADD CONSTRAINT "city_metrics_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: clients_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY clients
    ADD CONSTRAINT "clients_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ga4_metrics_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY ga4_metrics
    ADD CONSTRAINT "ga4_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ga4_origin_metrics_originId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY ga4_origin_metrics
    ADD CONSTRAINT "ga4_origin_metrics_originId_fkey" FOREIGN KEY ("originId") REFERENCES ga4_origins(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ga4_origins_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY ga4_origins
    ADD CONSTRAINT "ga4_origins_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ga4_page_metrics_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY ga4_page_metrics
    ADD CONSTRAINT "ga4_page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES ga4_pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ga4_pages_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY ga4_pages
    ADD CONSTRAINT "ga4_pages_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instagram_metrics_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY instagram_metrics
    ADD CONSTRAINT "instagram_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: linkedin_industries_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY linkedin_industries
    ADD CONSTRAINT "linkedin_industries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: linkedin_metrics_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY linkedin_metrics
    ADD CONSTRAINT "linkedin_metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: linkedin_roles_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY linkedin_roles
    ADD CONSTRAINT "linkedin_roles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: platform_connections_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY platform_connections
    ADD CONSTRAINT "platform_connections_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: themes_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY themes
    ADD CONSTRAINT "themes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: client_users_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY client_users
    ADD CONSTRAINT "client_users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES clients(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: theme_metrics_themeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY theme_metrics
    ADD CONSTRAINT "theme_metrics_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES themes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: linkedin_industry_metrics_industryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY linkedin_industry_metrics
    ADD CONSTRAINT "linkedin_industry_metrics_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES linkedin_industries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: linkedin_role_metrics_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: socialdash
--

ALTER TABLE ONLY linkedin_role_metrics
    ADD CONSTRAINT "linkedin_role_metrics_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES linkedin_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: public; Type: ACL; Schema: -; Owner: socialdash
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM socialdash;
GRANT ALL ON SCHEMA public TO socialdash;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES  FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES  FROM postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES  TO socialdash;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS  FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS  FROM postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS  TO socialdash;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES  FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES  FROM postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES  TO socialdash;


--
-- PostgreSQL database dump complete
--

\unrestrict qzNFN6aWI9S7JJgaFnNvw8RRZ1hRmIXA7y5Iu4u01cYyJ2wegayA6ffT4mAeUmC

