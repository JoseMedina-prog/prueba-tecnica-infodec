--
-- PostgreSQL database dump
--

\restrict ZZ1U9jgaVhlZpMsmE4zXIjRNUmn2BPSn0UhdfGbnaIazRSvR0hvSCSsW9iZIJTG

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ciudades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ciudades (
    id bigint NOT NULL,
    pais_id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    latitud numeric(9,6) NOT NULL,
    longitud numeric(9,6) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: ciudades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ciudades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ciudades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ciudades_id_seq OWNED BY public.ciudades.id;


--
-- Name: consultas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultas (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    ciudad_id bigint NOT NULL,
    presupuesto_cop numeric(15,2) NOT NULL,
    clima_temperatura numeric(5,2),
    clima_descripcion character varying(255),
    tasa numeric(20,10),
    valor_convertido numeric(18,2),
    fecha_tasa timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: consultas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consultas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: consultas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consultas_id_seq OWNED BY public.consultas.id;


--
-- Name: monedas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monedas (
    id bigint NOT NULL,
    codigo character(3) NOT NULL,
    nombre character varying(255) NOT NULL,
    simbolo character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: monedas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.monedas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: monedas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.monedas_id_seq OWNED BY public.monedas.id;


--
-- Name: paises; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paises (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    codigo character(2) NOT NULL,
    moneda_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: paises_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paises_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paises_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paises_id_seq OWNED BY public.paises.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    token_hash character(64) NOT NULL,
    familia_id uuid NOT NULL,
    expira_en timestamp(0) without time zone NOT NULL,
    usado_en timestamp(0) without time zone,
    revocado_en timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: tasas_cambio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasas_cambio (
    id bigint NOT NULL,
    moneda_origen character(3) NOT NULL,
    moneda_destino character(3) NOT NULL,
    tasa numeric(20,10) NOT NULL,
    fecha_tasa timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tasas_cambio_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasas_cambio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasas_cambio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasas_cambio_id_seq OWNED BY public.tasas_cambio.id;


--
-- Name: tokens_revocados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tokens_revocados (
    id bigint NOT NULL,
    jti uuid NOT NULL,
    usuario_id bigint NOT NULL,
    expira_en timestamp(0) without time zone NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tokens_revocados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tokens_revocados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tokens_revocados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tokens_revocados_id_seq OWNED BY public.tokens_revocados.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    correo character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    idioma character varying(2) DEFAULT 'es'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: ciudades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades ALTER COLUMN id SET DEFAULT nextval('public.ciudades_id_seq'::regclass);


--
-- Name: consultas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas ALTER COLUMN id SET DEFAULT nextval('public.consultas_id_seq'::regclass);


--
-- Name: monedas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monedas ALTER COLUMN id SET DEFAULT nextval('public.monedas_id_seq'::regclass);


--
-- Name: paises id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises ALTER COLUMN id SET DEFAULT nextval('public.paises_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: tasas_cambio id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasas_cambio ALTER COLUMN id SET DEFAULT nextval('public.tasas_cambio_id_seq'::regclass);


--
-- Name: tokens_revocados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_revocados ALTER COLUMN id SET DEFAULT nextval('public.tokens_revocados_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: ciudades; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ciudades (id, pais_id, nombre, latitud, longitud, created_at, updated_at) FROM stdin;
1	1	Londres	51.507400	-0.127800	2026-09-25 18:39:43	2026-09-25 18:39:43
2	1	Mánchester	53.480800	-2.242600	2026-09-25 18:39:43	2026-09-25 18:39:43
3	2	Tokio	35.676200	139.650300	2026-09-25 18:39:43	2026-09-25 18:39:43
4	2	Osaka	34.693700	135.502300	2026-09-25 18:39:43	2026-09-25 18:39:43
5	3	Nueva Delhi	28.613900	77.209000	2026-09-25 18:39:43	2026-09-25 18:39:43
6	3	Bombay	19.076000	72.877700	2026-09-25 18:39:43	2026-09-25 18:39:43
7	4	Copenhague	55.676100	12.568300	2026-09-25 18:39:43	2026-09-25 18:39:43
8	4	Aarhus	56.162900	10.203900	2026-09-25 18:39:43	2026-09-25 18:39:43
\.


--
-- Data for Name: consultas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consultas (id, usuario_id, ciudad_id, presupuesto_cop, clima_temperatura, clima_descripcion, tasa, valor_convertido, fecha_tasa, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: monedas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monedas (id, codigo, nombre, simbolo, created_at, updated_at) FROM stdin;
1	GBP	Libra esterlina	£	2026-09-25 18:39:43	2026-09-25 18:39:43
2	JPY	Yen	¥	2026-09-25 18:39:43	2026-09-25 18:39:43
3	INR	Rupia india	₹	2026-09-25 18:39:43	2026-09-25 18:39:43
4	DKK	Corona danesa	kr	2026-09-25 18:39:43	2026-09-25 18:39:43
\.


--
-- Data for Name: paises; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paises (id, nombre, codigo, moneda_id, created_at, updated_at) FROM stdin;
1	Inglaterra	GB	1	2026-09-25 18:39:43	2026-09-25 18:39:43
2	Japón	JP	2	2026-09-25 18:39:43	2026-09-25 18:39:43
3	India	IN	3	2026-09-25 18:39:43	2026-09-25 18:39:43
4	Dinamarca	DK	4	2026-09-25 18:39:43	2026-09-25 18:39:43
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, usuario_id, token_hash, familia_id, expira_en, usado_en, revocado_en, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tasas_cambio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasas_cambio (id, moneda_origen, moneda_destino, tasa, fecha_tasa, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tokens_revocados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tokens_revocados (id, jti, usuario_id, expira_en, created_at) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nombre, correo, password_hash, idioma, created_at, updated_at) FROM stdin;
1	Usuario Prueba	prueba@travelapp.test	$2y$12$loAZYfBwLn85sOE9NxdJBuaMXKEZDQzA8F7mCmjn.KLvQd79x.mcq	es	2026-09-25 18:39:43	2026-09-25 18:39:43
\.


--
-- Name: ciudades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ciudades_id_seq', 8, true);


--
-- Name: consultas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.consultas_id_seq', 1, false);


--
-- Name: monedas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.monedas_id_seq', 4, true);


--
-- Name: paises_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.paises_id_seq', 4, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);


--
-- Name: tasas_cambio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasas_cambio_id_seq', 1, false);


--
-- Name: tokens_revocados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tokens_revocados_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: ciudades ciudades_pais_id_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades
    ADD CONSTRAINT ciudades_pais_id_nombre_unique UNIQUE (pais_id, nombre);


--
-- Name: ciudades ciudades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades
    ADD CONSTRAINT ciudades_pkey PRIMARY KEY (id);


--
-- Name: consultas consultas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_pkey PRIMARY KEY (id);


--
-- Name: monedas monedas_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monedas
    ADD CONSTRAINT monedas_codigo_unique UNIQUE (codigo);


--
-- Name: monedas monedas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monedas
    ADD CONSTRAINT monedas_pkey PRIMARY KEY (id);


--
-- Name: paises paises_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_codigo_unique UNIQUE (codigo);


--
-- Name: paises paises_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_hash_unique UNIQUE (token_hash);


--
-- Name: tasas_cambio tasas_cambio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasas_cambio
    ADD CONSTRAINT tasas_cambio_pkey PRIMARY KEY (id);


--
-- Name: tokens_revocados tokens_revocados_jti_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_revocados
    ADD CONSTRAINT tokens_revocados_jti_unique UNIQUE (jti);


--
-- Name: tokens_revocados tokens_revocados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_revocados
    ADD CONSTRAINT tokens_revocados_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_correo_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_unique UNIQUE (correo);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: consultas_usuario_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX consultas_usuario_id_created_at_index ON public.consultas USING btree (usuario_id, created_at);


--
-- Name: refresh_tokens_familia_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX refresh_tokens_familia_id_index ON public.refresh_tokens USING btree (familia_id);


--
-- Name: tasas_cambio_moneda_origen_moneda_destino_fecha_tasa_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasas_cambio_moneda_origen_moneda_destino_fecha_tasa_index ON public.tasas_cambio USING btree (moneda_origen, moneda_destino, fecha_tasa);


--
-- Name: ciudades ciudades_pais_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ciudades
    ADD CONSTRAINT ciudades_pais_id_foreign FOREIGN KEY (pais_id) REFERENCES public.paises(id) ON DELETE CASCADE;


--
-- Name: consultas consultas_ciudad_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_ciudad_id_foreign FOREIGN KEY (ciudad_id) REFERENCES public.ciudades(id) ON DELETE RESTRICT;


--
-- Name: consultas consultas_usuario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: paises paises_moneda_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paises
    ADD CONSTRAINT paises_moneda_id_foreign FOREIGN KEY (moneda_id) REFERENCES public.monedas(id) ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_usuario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: tokens_revocados tokens_revocados_usuario_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tokens_revocados
    ADD CONSTRAINT tokens_revocados_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ZZ1U9jgaVhlZpMsmE4zXIjRNUmn2BPSn0UhdfGbnaIazRSvR0hvSCSsW9iZIJTG

