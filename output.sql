--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (84bec44)
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_email text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_active_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address text,
    user_agent text,
    status text DEFAULT 'Online'::text
);


ALTER TABLE public.admin_sessions OWNER TO neondb_owner;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text DEFAULT 'Administrator'::text,
    profile_image_url text,
    dob date,
    contact text,
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer,
    address text,
    type text,
    status text DEFAULT 'Not Responded'::text,
    occurred_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    responder_id integer,
    responded_at timestamp without time zone,
    description text
);


ALTER TABLE public.alerts OWNER TO neondb_owner;

--
-- Name: barangays; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.barangays (
    id integer NOT NULL,
    name text NOT NULL,
    municipality_id integer
);


ALTER TABLE public.barangays OWNER TO neondb_owner;

--
-- Name: barangays_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.barangays_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.barangays_id_seq OWNER TO neondb_owner;

--
-- Name: barangays_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.barangays_id_seq OWNED BY public.barangays.id;


--
-- Name: chat_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chat_history (
    id integer NOT NULL,
    username text NOT NULL,
    message text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_history OWNER TO neondb_owner;

--
-- Name: chat_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chat_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_history_id_seq OWNER TO neondb_owner;

--
-- Name: chat_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chat_history_id_seq OWNED BY public.chat_history.id;


--
-- Name: login_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.login_logs (
    id integer NOT NULL,
    admin_id integer,
    email text,
    ip_address text,
    user_agent text,
    login_time timestamp with time zone DEFAULT now()
);


ALTER TABLE public.login_logs OWNER TO neondb_owner;

--
-- Name: login_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.login_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_logs_id_seq OWNER TO neondb_owner;

--
-- Name: login_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.login_logs_id_seq OWNED BY public.login_logs.id;


--
-- Name: municipalities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.municipalities (
    id integer NOT NULL,
    name text NOT NULL,
    province_id integer
);


ALTER TABLE public.municipalities OWNER TO neondb_owner;

--
-- Name: municipalities_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.municipalities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.municipalities_id_seq OWNER TO neondb_owner;

--
-- Name: municipalities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.municipalities_id_seq OWNED BY public.municipalities.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    account_type character varying(20) NOT NULL,
    account_id integer NOT NULL,
    sender_type character varying(20),
    sender_id integer,
    sender_name character varying(255) NOT NULL,
    recipient_name character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['admin'::character varying, 'responder'::character varying])::text[]))),
    CONSTRAINT notifications_sender_type_check CHECK (((sender_type)::text = ANY ((ARRAY['admin'::character varying, 'responder'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: pcr_forms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pcr_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_name text NOT NULL,
    date date NOT NULL,
    location text,
    recorder text NOT NULL,
    full_form jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by_type text NOT NULL,
    created_by_id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pcr_forms_created_by_type_check CHECK ((created_by_type = ANY (ARRAY['admin'::text, 'responder'::text])))
);


ALTER TABLE public.pcr_forms OWNER TO neondb_owner;

--
-- Name: pins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pins (
    id integer NOT NULL,
    user_id integer NOT NULL,
    pin text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pins OWNER TO neondb_owner;

--
-- Name: pins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pins_id_seq OWNER TO neondb_owner;

--
-- Name: pins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pins_id_seq OWNED BY public.pins.id;


--
-- Name: provinces; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.provinces (
    id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.provinces OWNER TO neondb_owner;

--
-- Name: provinces_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.provinces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.provinces_id_seq OWNER TO neondb_owner;

--
-- Name: provinces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.provinces_id_seq OWNED BY public.provinces.id;


--
-- Name: responder_pins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.responder_pins (
    id integer NOT NULL,
    responder_id integer NOT NULL,
    pin text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.responder_pins OWNER TO neondb_owner;

--
-- Name: responder_pins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.responder_pins ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.responder_pins_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: responder_sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.responder_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    responder_id integer,
    is_active boolean DEFAULT true,
    status text DEFAULT 'offline'::text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_active_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address text,
    user_agent text,
    CONSTRAINT responder_sessions_status_check CHECK ((status = ANY (ARRAY['offline'::text, 'online'::text, 'standby'::text, 'ready to go'::text])))
);


ALTER TABLE public.responder_sessions OWNER TO neondb_owner;

--
-- Name: responders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.responders (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    profile_image_url text,
    dob date,
    contact text,
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    pin text
);


ALTER TABLE public.responders OWNER TO neondb_owner;

--
-- Name: responders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

ALTER TABLE public.responders ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.responders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: streets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.streets (
    id integer NOT NULL,
    name text NOT NULL,
    barangay_id integer
);


ALTER TABLE public.streets OWNER TO neondb_owner;

--
-- Name: streets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.streets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.streets_id_seq OWNER TO neondb_owner;

--
-- Name: streets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.streets_id_seq OWNED BY public.streets.id;


--
-- Name: token_blacklist; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.token_blacklist (
    token text NOT NULL,
    responder_id character varying(50) NOT NULL,
    blacklisted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.token_blacklist OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password text,
    dob date,
    contact character varying(20),
    address text,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: barangays id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.barangays ALTER COLUMN id SET DEFAULT nextval('public.barangays_id_seq'::regclass);


--
-- Name: chat_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_history ALTER COLUMN id SET DEFAULT nextval('public.chat_history_id_seq'::regclass);


--
-- Name: login_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_logs ALTER COLUMN id SET DEFAULT nextval('public.login_logs_id_seq'::regclass);


--
-- Name: municipalities id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.municipalities ALTER COLUMN id SET DEFAULT nextval('public.municipalities_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pins ALTER COLUMN id SET DEFAULT nextval('public.pins_id_seq'::regclass);


--
-- Name: provinces id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.provinces ALTER COLUMN id SET DEFAULT nextval('public.provinces_id_seq'::regclass);


--
-- Name: streets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.streets ALTER COLUMN id SET DEFAULT nextval('public.streets_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admin_sessions (id, admin_email, is_active, created_at, last_active_at, ip_address, user_agent, status) FROM stdin;
05b1ffe4-932e-468b-8876-60942c69b2b6	admin@mdrrmo.com	f	2025-07-30 05:57:48.903998	2025-07-30 06:44:54.117839	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
75dafa88-681f-4838-9505-21f2df173e4a	admin@mdrrmo.com	t	2025-07-30 06:45:39.061969	2025-07-30 06:45:39.061969	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
0e6eeb2d-439d-4627-8839-3bd3aa7e5f8b	admin@mdrrmo.com	f	2025-07-30 06:45:43.47508	2025-07-30 07:54:22.945631	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
dfe23d35-6b35-46e4-89da-c4cd3d4b649a	admin@mdrrmo.com	f	2025-07-30 07:54:53.921577	2025-07-30 07:56:58.959938	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
bf102a95-6afe-4e49-a91f-fcfd4f11cc91	admin@mdrrmo.com	f	2025-07-30 07:58:36.10687	2025-07-30 07:58:50.764048	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
89b8f001-8d77-4da0-8082-9323113e182f	admin@yahoo.com	f	2025-07-30 07:57:34.659124	2025-07-30 07:59:33.478601	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
d6c41028-87a3-455c-ba94-07bcaf6d176f	admin@yahoo.com	t	2025-07-30 08:02:32.499767	2025-07-30 08:02:32.499767	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
3d8c0623-4ff9-4025-96e1-63ba1658f927	admin@yahoo.com	f	2025-07-30 08:02:34.2063	2025-07-30 08:04:33.091077	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
b68ce8bd-3c23-4f54-9db8-d6af13d4b2ef	admin@yahoo.com	t	2025-07-30 08:04:42.481927	2025-07-30 08:04:42.481927	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
08295bfc-eb29-4813-ac6d-dfbdb55b4d28	admin@mdrrmo.com	f	2025-07-30 11:34:41.103239	2025-07-30 11:35:16.92664	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
08d1c170-3941-436a-a67f-b74029ac112f	admin@yahoo.com	t	2025-07-31 06:00:28.430866	2025-07-31 06:00:28.430866	2001:4455:277:7900:2d23:d8d3:ad4b:9033 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
1825cb2d-cae0-47b6-8fcc-8d86e62549d1	admin@yahoo.com	f	2025-07-31 13:55:14.244637	2025-07-31 13:55:43.544332	2001:4455:277:7900:ae:e102:b5aa:ed2a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
a8e2d0d7-d04a-41f8-b4da-cdefe0a13a53	admin@yahoo.com	f	2025-07-31 06:00:30.393906	2025-07-31 06:04:16.605641	2001:4455:277:7900:2d23:d8d3:ad4b:9033 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
26852eb5-433b-4754-a3d0-19357e5665b5	admin@mdrrmo.com	t	2025-07-31 06:10:13.176099	2025-07-31 06:10:13.176099	2001:4455:277:7900:2d23:d8d3:ad4b:9033 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
aa03543c-c590-4389-99b4-df70d155bfe4	admin@mdrrmo.com	t	2025-07-31 06:13:45.113834	2025-07-31 06:13:45.113834	2001:4455:277:7900:2d23:d8d3:ad4b:9033 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36	Online
008c95ce-7b2f-4111-9123-e5a1389e2453	admin@mdrrmo.com	t	2025-07-31 06:13:48.084854	2025-07-31 06:13:48.084854	2001:4455:277:7900:2d23:d8d3:ad4b:9033 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36	Online
bb85f2e4-c35d-4ef3-b027-afbd3b3ff982	admin@mdrrmo.com	t	2025-07-31 08:24:50.003893	2025-07-31 08:24:50.003893	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
ce4898f2-be08-445f-8588-c7c7136a9ce5	admin@mdrrmo.com	f	2025-07-31 13:54:43.768802	2025-08-01 02:04:15.94879	2001:4455:277:7900:ae:e102:b5aa:ed2a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
9e3c21fe-7923-4234-b02a-1481185e21b8	admin@mdrrmo.com	t	2025-08-01 02:07:20.406857	2025-08-01 02:07:20.406857	2001:4455:277:7900:b4f6:4976:5981:e782 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
21bc4b0b-a23d-48d6-a142-e4a07f3129c5	admin@yahoo.com	f	2025-08-01 12:01:53.44049	2025-08-01 18:29:46.744981	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
6ccc9da1-9394-4766-88e9-1a2f91784bc5	admin@mdrrmo.com	f	2025-07-31 06:10:15.030357	2025-08-01 03:33:57.551364	2001:4455:277:7900:2d23:d8d3:ad4b:9033 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
20308f1f-1869-48e0-9a9f-ad20b35cb64e	admin@yahoo.com	t	2025-08-01 03:34:19.132586	2025-08-01 03:34:19.132586	175.176.84.99 (Quezon City, Metro Manila, Philippines)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
d259bd5e-66dc-49a6-a724-b532a89528d4	admin@mdrrmo.com	f	2025-08-01 03:28:14.632178	2025-08-01 03:42:35.379269	120.28.214.167 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
cd55fe43-2561-43f2-8783-e40f3e772477	admin@yahoo.com	t	2025-08-01 12:01:52.990257	2025-08-01 12:01:52.990257	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
4548dbc8-e95f-4208-a0a0-f86ce34568eb	admin@yahoo.com	t	2025-08-02 05:44:15.542163	2025-08-02 05:44:15.542163	122.55.186.74 (Makati City, Metro Manila, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
060dd4a7-4676-4fa0-9950-3efe22b12966	admin@mdrrmo.com	f	2025-08-02 06:21:31.925198	2025-08-02 06:22:28.078063	122.55.186.74 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
94d99b0a-2cba-4d4f-9103-56d2f44ea528	admin@yahoo.com	f	2025-08-02 06:29:22.527858	2025-08-02 08:07:56.683831	172.16.102.199 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
048c54a6-705c-46cb-a658-8ac8159efb52	admin@yahoo.com	t	2025-08-02 08:12:43.79491	2025-08-02 08:12:43.79491	172.16.102.199 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
04ecffd0-996b-4157-8af7-030dc4d08124	admin@yahoo.com	f	2025-08-02 05:44:17.507956	2025-08-02 08:13:16.06882	122.55.186.74 (Makati City, Metro Manila, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
82c88377-61f8-4e00-996b-e4baad5feec4	admin@yahoo.com	t	2025-08-04 14:25:27.105608	2025-08-04 14:25:27.105608	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
59f77193-cb87-4871-b41b-bdcdc28b239d	admin@yahoo.com	t	2025-08-02 10:30:58.640575	2025-08-02 10:30:58.640575	2001:4455:277:7900:a1f9:5e60:d6f3:ac80 (Unknown)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
36c1f565-dce0-4d8c-a5b0-d03f47ba950f	admin@yahoo.com	t	2025-08-02 11:09:37.219289	2025-08-02 11:09:37.219289	143.44.192.63 (Cagayan de Oro, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 13; Infinix X6525 Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/138.0.7204.168 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/518.0.0.53.109;]	Online
22777bba-7c00-4070-9f5d-87c6bc80de04	admin@yahoo.com	t	2025-08-02 11:11:11.918173	2025-08-02 11:11:11.918173	143.44.192.63 (Cagayan de Oro, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
0edd52b3-16a0-4443-af4b-476a8efe5906	admin@yahoo.com	t	2025-08-03 02:25:41.277849	2025-08-03 02:25:41.277849	49.145.249.70 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
7bcc247a-c519-489f-a244-2e23ab1c8cc2	admin@yahoo.com	f	2025-08-03 03:48:19.92441	2025-08-03 09:48:50.34675	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
268d60ca-e573-4cda-8c2d-24f5e34d724f	Clyde@gmail.com	f	2025-08-03 09:48:58.384529	2025-08-03 09:59:27.724762	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
f2858553-ca0e-4b54-a76e-7d0ee757e8a6	admin@yahoo.com	t	2025-08-03 10:03:24.187585	2025-08-03 10:03:24.187585	192.168.1.90 (, , )	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
25d93a74-58aa-467a-849a-fc62474df0d3	admin@yahoo.com	t	2025-08-03 12:43:53.373031	2025-08-03 12:43:53.373031	49.145.243.231 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
27250356-52cc-47a5-8a97-99cec477898e	admin@yahoo.com	t	2025-08-03 12:43:55.264254	2025-08-03 12:43:55.264254	49.145.243.231 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
e4e9850a-0e86-4158-929d-85f0a4fd969a	admin@yahoo.com	t	2025-08-03 12:43:57.207029	2025-08-03 12:43:57.207029	49.145.243.231 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
3cf52eb9-0e84-422f-8db1-e3334c2681fd	admin@yahoo.com	f	2025-08-03 12:43:59.108354	2025-08-03 12:46:34.695929	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
08682d58-f863-4211-bf98-05dc11aebde2	admin@yahoo.com	t	2025-08-03 12:47:52.320191	2025-08-03 12:47:52.320191	49.145.243.231 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
4a626a07-cb78-4fb1-a249-982e81c54ce8	admin@yahoo.com	t	2025-08-03 12:47:54.273607	2025-08-03 12:47:54.273607	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
2c01bb8f-f41c-43ec-bf8c-c41130b8ca0b	admin@yahoo.com	t	2025-08-03 16:01:44.775406	2025-08-03 16:01:44.775406	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
15222a93-e58b-41d3-a807-156fefd4527a	admin@yahoo.com	t	2025-08-03 16:01:46.764232	2025-08-03 16:01:46.764232	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
d2673ffe-6653-40ed-a3d5-69a0fd939be3	admin@yahoo.com	t	2025-08-03 16:58:56.465655	2025-08-03 16:58:56.465655	2001:4455:244:3b00:45b8:4082:1ee2:bb25 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36	Online
68b972be-6c90-4dfe-be5a-750038847c49	admin@yahoo.com	t	2025-08-04 01:36:53.29949	2025-08-04 01:36:53.29949	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
a32b60a9-d551-4a8f-b386-8d5098073415	admin@yahoo.com	t	2025-08-04 01:36:55.212258	2025-08-04 01:36:55.212258	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
04f9a896-1c59-4005-aba6-6b20ad190ccf	admin@yahoo.com	t	2025-08-04 01:36:57.065517	2025-08-04 01:36:57.065517	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
0eb64af0-84c9-43e9-8c4d-cb9cc8f45d82	admin@yahoo.com	t	2025-08-04 01:36:57.450977	2025-08-04 01:36:57.450977	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
41a5746f-8e79-4346-8891-be0a4413d1dc	admin@yahoo.com	t	2025-08-04 01:36:58.952507	2025-08-04 01:36:58.952507	49.145.243.231 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
858250f5-185f-4b5f-9cd9-8fd8e5c77645	admin@yahoo.com	t	2025-08-04 03:31:56.252467	2025-08-04 03:31:56.252467	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
67fb1e8b-592e-48eb-93a1-5e6cdbb08b96	admin@yahoo.com	t	2025-08-04 03:31:58.207265	2025-08-04 03:31:58.207265	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
797d0137-83d1-40a2-a754-e87a17dff4c0	admin@yahoo.com	t	2025-08-04 03:32:01.985313	2025-08-04 03:32:01.985313	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
d0525fa6-9195-45cd-8807-191c28ef2e58	admin@yahoo.com	t	2025-08-04 09:35:58.031153	2025-08-04 09:35:58.031153	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
365cc4d4-6add-4572-bb8c-2a362070501a	admin@yahoo.com	t	2025-08-04 09:35:59.941526	2025-08-04 09:35:59.941526	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
4778b748-9baf-4295-98f0-061682a0f78b	admin@yahoo.com	t	2025-08-04 09:36:01.900083	2025-08-04 09:36:01.900083	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
772d83b1-a2b4-4bbf-bb87-3a6d7b2d7cec	admin@yahoo.com	t	2025-08-04 09:36:02.395921	2025-08-04 09:36:02.395921	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
25ec2f99-6a94-4b93-ac2c-30d5ac1196be	admin@yahoo.com	t	2025-08-04 09:36:02.755066	2025-08-04 09:36:02.755066	143.44.192.181 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
7f160b7c-859b-4a65-b33c-af0531698c82	admin@yahoo.com	f	2025-08-04 14:25:30.230466	2025-08-04 14:29:33.279574	192.168.1.90 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
e9ac4c82-b227-48bb-96cf-3de5107a14e3	admin@yahoo.com	f	2025-08-04 14:29:51.647926	2025-08-04 14:34:29.733841	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
1596069c-ebaf-4eb0-8c86-db9fe16c61b9	admin@yahoo.com	f	2025-08-04 14:34:37.646401	2025-08-04 14:36:30.48901	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
4794493d-2577-4cc6-b695-5276d315c723	admin@yahoo.com	f	2025-08-04 14:36:39.523862	2025-08-04 14:54:53.041993	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
7668f96f-aa08-4067-b9db-c98bad689482	Milo@gmail.com	t	2025-08-04 14:55:06.135988	2025-08-04 14:55:06.135988	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
96cb352f-34d7-4a19-9874-232710166d06	admin@yahoo.com	f	2025-08-05 05:03:27.364357	2025-08-05 05:03:55.088061	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0	Online
d0bf2e2e-9c20-4134-be76-f5334c73a851	admin@yahoo.com	t	2025-08-05 15:08:10.036605	2025-08-05 15:08:10.036605	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
76381783-8fdd-4786-9de4-1289e2806607	admin@yahoo.com	f	2025-08-05 15:08:12.523919	2025-08-05 16:09:37.848118	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
1b1ddf7b-6b34-47fc-b277-b5953313b3f1	Milo@gmail.com	t	2025-08-05 16:09:51.511283	2025-08-05 16:09:51.511283	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
c6852d48-0364-4413-92ea-a18080196963	Milo@gmail.com	t	2025-08-06 06:06:26.842652	2025-08-06 06:06:26.842652	2001:4455:277:7900:587e:e67f:dc1:d3e9 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
c1c6384a-73aa-4438-82f7-5c5f7aeccc7d	admin@yahoo.com	f	2025-08-10 05:29:53.443803	2025-08-10 05:30:47.492797	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
4faa9c2b-a068-46f5-a766-97df677565b2	admin@yahoo.com	f	2025-08-07 04:42:29.701564	2025-08-07 07:12:41.600371	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
11939a95-aacb-41fb-bcbf-21158165eeee	Milo@gmail.com	t	2025-08-07 07:21:04.987565	2025-08-07 07:21:04.987565	2001:4455:277:7900:414a:bbe4:a12e:98bd (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
e6a0c180-5b10-4f74-b22b-1e8988f81947	Milo@gmail.com	f	2025-08-07 07:13:18.558416	2025-08-07 08:40:07.599475	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	Online
cdddc581-7805-4bb1-80c5-50ca1f9c0717	admin@yahoo.com	t	2025-08-10 03:59:29.232783	2025-08-10 03:59:29.232783	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
05d25213-7940-4e88-8387-5fb9d26003ee	admin@yahoo.com	f	2025-08-10 03:59:36.45326	2025-08-10 04:04:51.37425	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
a54602fe-aa23-42bb-a45f-3202a64cdbbb	admin@yahoo.com	f	2025-08-10 04:04:59.206188	2025-08-10 04:10:18.494736	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
71770b12-40ba-4950-82a1-1afec444fd41	admin@yahoo.com	f	2025-08-10 04:10:27.128101	2025-08-10 05:12:15.816487	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
6c9ad78b-aefb-40a9-a4f0-598205b06c32	admin@yahoo.com	f	2025-08-10 05:12:24.268257	2025-08-10 05:29:40.555824	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
d7ee14df-4228-443c-80e4-2ba59a13f7b5	admin@yahoo.com	f	2025-08-10 05:30:58.881651	2025-08-10 05:45:15.382027	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
d8cadb69-adf1-49b5-ae0d-602d6b277c7c	admin@yahoo.com	f	2025-08-10 05:45:24.083692	2025-08-10 05:50:34.139386	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
30e92580-84b0-4b26-ba1d-c4be78e71529	admin@yahoo.com	f	2025-08-10 05:50:44.196595	2025-08-10 05:52:48.963955	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
edb24b51-defe-4b5d-a21e-317a804be602	admin@yahoo.com	f	2025-08-10 05:52:59.951713	2025-08-10 12:26:20.487556	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
2792985c-0e92-4029-992c-28ffff7b85d3	Milo@gmail.com	t	2025-08-10 12:26:32.562172	2025-08-10 12:26:32.562172	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
ed2b14ac-03c4-4e53-a59b-6c12afdb35bf	vergil@gmail.com	t	2025-08-10 13:15:04.807464	2025-08-10 13:15:04.807464	180.195.249.107 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
623dcbca-2425-4917-93b6-bfa386857e0c	vergil@gmail.com	t	2025-08-10 13:15:06.68242	2025-08-10 13:15:06.68242	180.195.249.107 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
4a7c8e0a-683d-4284-81e4-f1d205525196	admin@yahoo.com	t	2025-08-13 02:37:49.829381	2025-08-13 02:37:49.829381	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
18f1d9a4-b94a-4a9d-9726-7f3fb9d046e5	Milo@gmail.com	f	2025-08-10 03:53:55.219717	2025-08-10 14:11:32.122837	2001:4455:277:7900:e1a5:92b7:8fe9:3353 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
68d5750a-fe16-449e-af0e-ff46f25df829	admin@yahoo.com	t	2025-08-10 14:12:04.0917	2025-08-10 14:12:04.0917	2001:4455:277:7900:e1a5:92b7:8fe9:3353 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
d55ca6d9-5f41-4e84-9526-1c25ea002534	vergil@gmail.com	t	2025-08-10 14:13:03.018609	2025-08-10 14:13:03.018609	180.195.249.107 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
a9f0377d-23b4-46df-91f9-d1b76d5b686b	vergil@gmail.com	f	2025-08-10 14:13:04.063384	2025-08-10 15:37:34.656434	180.195.249.107 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
0ad90c40-14f7-48d8-800b-56d4b2f96561	vergil@gmail.com	t	2025-08-10 15:37:42.811384	2025-08-10 15:37:42.811384	180.195.249.107 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
bc9984e7-ffa6-4425-b93b-cc655a1e5a75	vergil@gmail.com	t	2025-08-10 15:37:45.321622	2025-08-10 15:37:45.321622	180.195.249.107 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
147d7e59-17b4-4c35-8be8-f451797d51c5	admin@yahoo.com	t	2025-08-16 02:34:20.962729	2025-08-16 02:34:20.962729	122.55.186.74 (Unknown)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	Online
8f6f8373-38ef-4211-a9fd-472d1a2e631c	admin@yahoo.com	t	2025-08-16 02:34:22.034202	2025-08-16 02:34:22.034202	122.55.186.74 (Unknown)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	Online
8edb298a-1c3e-4fad-bb8a-702a924e373e	admin@yahoo.com	t	2025-08-16 02:34:23.061009	2025-08-16 02:34:23.061009	122.55.186.74 (Unknown)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	Online
c4f38966-38ee-4c01-94bc-cbd6c458be49	admin@yahoo.com	t	2025-08-16 02:34:24.091978	2025-08-16 02:34:24.091978	122.55.186.74 (Unknown)	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	Online
c05517e2-7432-4e99-a68a-45470cf86b6c	admin@yahoo.com	t	2025-08-19 06:08:38.712312	2025-08-19 06:08:38.712312	143.44.192.248 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
3098d209-9544-4127-b337-99515bfc0bc6	admin@yahoo.com	t	2025-08-19 06:08:39.81482	2025-08-19 06:08:39.81482	143.44.192.248 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
5832e491-bcb3-4f9a-8df6-aa4a743f78ca	admin@yahoo.com	t	2025-08-19 06:08:40.834093	2025-08-19 06:08:40.834093	143.44.192.248 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
2de6c8c9-440d-4353-9761-a41d75f7e168	admin@yahoo.com	t	2025-08-19 06:08:41.846382	2025-08-19 06:08:41.846382	143.44.192.248 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
63faf25d-772d-4d15-aa01-f7ec5bb03e1b	admin@yahoo.com	t	2025-08-19 06:08:44.752471	2025-08-19 06:08:44.752471	143.44.192.248 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
13663fc3-c0c8-4fb6-896c-e3811d6c692c	admin@yahoo.com	t	2025-08-19 07:01:57.395061	2025-08-19 07:01:57.395061	143.44.192.248 (Cagayan de Oro, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
232280f6-f1c8-45f8-b8dc-89c1951266eb	admin@yahoo.com	t	2025-08-19 10:17:26.116796	2025-08-19 10:17:26.116796	143.44.192.222 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
08ede8d3-8244-4acf-acc8-5e311ad12380	admin@yahoo.com	t	2025-08-19 10:17:27.424059	2025-08-19 10:17:27.424059	143.44.192.222 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c7230216-1097-4643-9d74-94cf235ae554	admin@yahoo.com	t	2025-08-20 01:27:08.107049	2025-08-20 01:27:08.107049	143.44.192.222 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
65fa5a53-ae45-44f1-a70e-854183ac47e8	admin@yahoo.com	t	2025-08-20 01:27:09.194531	2025-08-20 01:27:09.194531	143.44.192.222 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
96427ce6-31f9-4eb5-ace2-1944c79a1c51	admin@yahoo.com	t	2025-08-20 01:27:10.226141	2025-08-20 01:27:10.226141	143.44.192.222 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
453d891c-4632-49a5-9dbf-cd83c83c1fb5	admin@yahoo.com	t	2025-08-20 01:27:13.155264	2025-08-20 01:27:13.155264	143.44.192.222 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
25c3a1d4-1211-4d61-b0a0-fee146f539b5	admin@yahoo.com	t	2025-08-20 09:11:29.727477	2025-08-20 09:11:29.727477	2001:4455:2c9:4c00:9aa5:68eb:9c11:1b86 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c67200a7-48ca-4aae-9dca-0d05fa13958b	admin@yahoo.com	t	2025-08-22 04:57:58.594323	2025-08-22 04:57:58.594323	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
bb5a7bc4-61e1-408a-9c6f-f56ed5568947	admin@yahoo.com	t	2025-08-22 04:57:59.628344	2025-08-22 04:57:59.628344	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
34d9d693-62de-4581-88bd-9b0e93c74317	admin@yahoo.com	t	2025-08-22 04:58:00.687522	2025-08-22 04:58:00.687522	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
e1988006-c217-4ff2-8a9a-0ced571e8a3c	admin@yahoo.com	t	2025-08-22 04:58:03.473189	2025-08-22 04:58:03.473189	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
d038bc56-9e99-4b53-b96f-fc2079a933a6	admin@yahoo.com	t	2025-08-22 04:58:03.512538	2025-08-22 04:58:03.512538	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
f1c1f55a-96ac-485e-bc28-28de44234a86	admin@yahoo.com	t	2025-08-22 04:58:03.533777	2025-08-22 04:58:03.533777	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c98ad250-d579-41a0-92cb-730438f4aff9	admin@yahoo.com	t	2025-08-22 04:58:03.581765	2025-08-22 04:58:03.581765	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
1f332b40-0616-491f-9b74-4162c38f1d05	admin@yahoo.com	t	2025-08-22 04:58:03.773331	2025-08-22 04:58:03.773331	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
80313bf1-e1f5-4027-92ff-bc7c0e7657df	admin@yahoo.com	t	2025-08-22 04:58:04.087571	2025-08-22 04:58:04.087571	143.44.192.182 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
585305ae-bada-433f-8abf-cb378eecd052	admin@yahoo.com	t	2025-08-26 07:36:57.153242	2025-08-26 07:36:57.153242	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
58078393-5bf2-4a02-b39e-2171aee47dad	admin@yahoo.com	t	2025-08-26 07:36:57.341134	2025-08-26 07:36:57.341134	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
121ac6f8-8a91-443d-abe4-ee61fe1b0744	admin@yahoo.com	t	2025-08-26 07:37:00.540636	2025-08-26 07:37:00.540636	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c8c65aff-e74a-41ee-85cd-5f986ede2f3b	admin@yahoo.com	t	2025-08-27 06:55:30.209706	2025-08-27 06:55:30.209706	122.55.186.74 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
dc7043f0-456a-4d15-8b3f-dee169c05bd2	admin@yahoo.com	t	2025-08-27 06:55:32.984403	2025-08-27 06:55:32.984403	122.55.186.74 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
dccf9093-4374-439a-a634-9b7cb498f11b	admin@yahoo.com	t	2025-08-28 07:33:47.166598	2025-08-28 07:33:47.166598	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
2af356e4-e19e-478f-8eb5-e1396736c43e	admin@yahoo.com	t	2025-08-28 07:33:47.447492	2025-08-28 07:33:47.447492	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c3a9b8fe-966e-466e-9729-98df953d611d	admin@yahoo.com	t	2025-08-28 07:33:56.030731	2025-08-28 07:33:56.030731	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
9fc4cf77-a506-4ad5-9019-b223ac5022f5	Razel@gmail.com	t	2025-08-28 12:50:17.24347	2025-08-28 12:50:17.24347	49.145.232.162 (Cagayan de Oro, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
de5189c9-8b2a-46af-bdaa-41620c3ec5df	Razel@gmail.com	f	2025-08-28 12:31:44.015039	2025-08-28 12:55:32.404694	2001:4455:247:9700:b4cb:c7c:724b:b0a1 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
5713097f-42bd-4888-a7e5-7353e3f2b0ce	admin@yahoo.com	t	2025-08-28 12:56:09.823624	2025-08-28 12:56:09.823624	2001:4455:247:9700:b4cb:c7c:724b:b0a1 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
a109f68b-e3b0-4674-97fe-a19c6c29144e	admin@yahoo.com	t	2025-08-31 13:29:57.811045	2025-08-31 13:29:57.811045	2001:4455:251:7c00:e414:917d:a6f9:ed (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
abd933a3-c87c-4a46-8436-a5f1c59ed549	admin@yahoo.com	f	2025-08-28 13:02:47.907833	2025-08-28 13:04:33.826612	2001:4455:247:9700:b4cb:c7c:724b:b0a1 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	Online
f44d6fcc-10d5-4305-980a-c09d81021658	admin@yahoo.com	f	2025-08-28 13:19:33.79646	2025-08-28 13:20:17.576447	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
bd415624-3bf2-4274-ad5a-61edd99a41f7	Razel@gmail.com	t	2025-08-28 13:20:35.215519	2025-08-28 13:20:35.215519	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
2dad4bec-feeb-4c5c-95d2-deab0ba8b170	admin@yahoo.com	t	2025-08-28 13:50:55.7153	2025-08-28 13:50:55.7153	2001:4455:247:9700:6e98:e548:68e5:3566 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	Online
04e3fe69-1ed2-44dd-8aa0-9fa2d2812ad9	admin@yahoo.com	t	2025-08-28 13:50:57.120523	2025-08-28 13:50:57.120523	2001:4455:247:9700:6e98:e548:68e5:3566 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	Online
71e5e89b-f00c-4003-9468-c9ac2e38e001	admin@yahoo.com	t	2025-08-28 13:50:58.388939	2025-08-28 13:50:58.388939	2001:4455:247:9700:6e98:e548:68e5:3566 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	Online
d44de430-7586-42d0-8e7f-6faf621d0ff0	admin@yahoo.com	t	2025-08-29 06:10:12.074053	2025-08-29 06:10:12.074053	2001:4455:247:9700:b4cb:c7c:724b:b0a1 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
ce173332-754d-4e27-9b3d-95ece989f230	admin@yahoo.com	t	2025-08-29 08:47:03.241733	2025-08-29 08:47:03.241733	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
d11644ed-5df4-4a43-9fd7-7424bba1d909	admin@yahoo.com	t	2025-08-29 08:47:03.849616	2025-08-29 08:47:03.849616	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
34882dc5-d32e-4759-9068-1c8c21f68185	admin@yahoo.com	t	2025-08-31 13:29:58.897575	2025-08-31 13:29:58.897575	2001:4455:251:7c00:e414:917d:a6f9:ed (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
7f6e8bf1-a0d1-4853-8459-eaa2cee7ff25	admin@yahoo.com	f	2025-08-28 12:28:16.596534	2025-08-29 08:47:39.085713	49.145.232.162 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
2afa1815-79b3-43e3-a2b1-c241d8d85c25	admin@yahoo.com	t	2025-08-29 08:47:52.552639	2025-08-29 08:47:52.552639	2001:4455:229:5100:31e6:a2a4:95e6:418a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
03ee09fc-c880-4b44-8487-f109f226de40	admin@yahoo.com	t	2025-08-29 08:48:17.672153	2025-08-29 08:48:17.672153	2001:4455:229:5100:31e6:a2a4:95e6:418a (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
1d05f9ab-cfa8-48da-b90f-7fe16d422e27	admin@yahoo.com	t	2025-08-29 10:29:50.234626	2025-08-29 10:29:50.234626	2001:4455:229:5100:31e6:a2a4:95e6:418a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
ec388f37-83fa-477d-80e5-a9cfd514b937	admin@yahoo.com	t	2025-08-29 10:29:51.270065	2025-08-29 10:29:51.270065	2001:4455:229:5100:31e6:a2a4:95e6:418a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
114b3cf8-c62f-4000-80df-800c5867ae35	admin@yahoo.com	t	2025-08-29 10:29:53.106249	2025-08-29 10:29:53.106249	2001:4455:229:5100:31e6:a2a4:95e6:418a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
a0b35c92-5aae-4fc4-ae8e-c4498b0c4f46	admin@yahoo.com	t	2025-08-29 10:29:54.175769	2025-08-29 10:29:54.175769	2001:4455:229:5100:31e6:a2a4:95e6:418a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
241f23ab-1caf-4f11-87ce-6a8e59a6cd6d	admin@yahoo.com	t	2025-08-29 10:29:54.927219	2025-08-29 10:29:54.927219	2001:4455:229:5100:31e6:a2a4:95e6:418a (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
18fa1169-7640-4c3d-97a8-26dc41e3601e	admin@yahoo.com	f	2025-08-31 06:27:31.140028	2025-08-31 06:28:59.566324	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
54a290e2-fb30-48ac-b922-8e69cd78afe4	admin@yahoo.com	t	2025-08-31 07:26:41.742958	2025-08-31 07:26:41.742958	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
852b6183-e3d4-476f-b005-40dc74a8e556	admin@yahoo.com	t	2025-08-31 07:26:42.623073	2025-08-31 07:26:42.623073	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c48d782b-06f6-4164-bf9d-05dd24d014b1	admin@yahoo.com	t	2025-09-01 01:54:58.840672	2025-09-01 01:54:58.840672	210.185.177.78 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
44f40542-a4ba-4425-bcd5-9fb6aa5442f2	admin@yahoo.com	t	2025-09-02 00:35:32.459121	2025-09-02 00:35:32.459121	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
cc49dea7-6d93-40a0-800d-6dbd0f7977d5	LiezelRodrigo@gmail.com	t	2025-09-02 12:51:50.769227	2025-09-02 12:51:50.769227	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c02f0483-8a5e-4b18-b7b7-adcce83d292e	admin@yahoo.com	f	2025-09-02 00:35:40.02529	2025-09-02 05:06:29.69156	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c2443e69-b03b-4899-ab80-45afea25a44f	LiezelRodrigo@gmail.com	f	2025-09-02 05:02:28.215988	2025-09-02 07:01:52.67079	2001:4455:251:7c00:68eb:88a6:f8ac:5a8b (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
56ebe2d0-254a-4e35-963f-f87a1fd69ffc	admin@yahoo.com	f	2025-09-02 05:06:38.640037	2025-09-02 05:06:55.894855	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
bdc705b0-2e22-4c92-b101-58b332039daa	admin@yahoo.com	f	2025-09-02 05:07:08.310892	2025-09-02 05:10:27.8292	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
ae6cb043-6d1f-4971-9c42-de94f0110f7c	admin@yahoo.com	t	2025-09-02 05:10:40.63628	2025-09-02 05:10:40.63628	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
80f4c1b6-e702-4a79-9a83-81bcd63ca288	Razel@gmail.com	t	2025-09-02 05:20:27.149334	2025-09-02 05:20:27.149334	2001:4455:24a:d600:a56d:53aa:98cc:7e17 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
cb2406a4-2464-4ef1-aa3d-f21eb6786e2d	admin@yahoo.com	t	2025-09-02 05:37:49.530346	2025-09-02 05:37:49.530346	2001:4455:24a:d600:a56d:53aa:98cc:7e17 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
9f2bffdf-fe25-4d7c-9d95-dff06c05ffc4	admin@yahoo.com	t	2025-09-02 13:37:50.755284	2025-09-02 13:37:50.755284	2001:4455:24a:d600:a56d:53aa:98cc:7e17 (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
b0c6dfc9-7abf-4092-a7b9-71a9a5937f19	admin@yahoo.com	f	2025-09-02 07:54:56.061858	2025-09-02 08:09:33.311407	2001:4455:251:7c00:68eb:88a6:f8ac:5a8b (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
9d28b319-38fc-44e4-8a5f-715a98ddd7f6	admin@yahoo.com	t	2025-09-02 09:35:42.36757	2025-09-02 09:35:42.36757	2001:4455:251:7c00:68eb:88a6:f8ac:5a8b (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
aabf8153-717e-447a-811f-1969cd6e2477	admin@yahoo.com	f	2025-09-06 04:01:36.696198	2025-09-06 04:25:37.907048	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
8b506087-c65d-49b0-ad12-7e7402b36563	admin@yahoo.com	t	2025-09-06 05:50:16.812462	2025-09-06 05:50:16.812462	175.176.82.113 (Unknown)	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36	Online
8cb10252-4806-4998-9b97-a50046887a1e	admin@yahoo.com	t	2025-09-12 09:26:20.177607	2025-09-12 09:26:20.177607	2001:4455:251:7c00:6cd8:2c06:26e8:6dd (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
2555c016-1db1-4cfb-a24a-d7cee2fc27a2	LiezelRodrigo@gmail.com	t	2025-09-16 10:39:59.327831	2025-09-16 10:39:59.327831	2001:4455:2bb:1100:9177:414d:20c0:191e (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
f8b8864f-5ca7-4253-915b-1e8be2d8224e	admin@yahoo.com	t	2025-09-18 03:57:55.448134	2025-09-18 03:57:55.448134	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
939457fc-123f-4591-9402-84b637be3ae4	LiezelRodrigo@gmail.com	t	2025-09-19 15:52:46.096974	2025-09-19 15:52:46.096974	49.145.232.35 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
91363e41-f800-4c6f-8cf9-da6dcfc45ae6	admin@yahoo.com	f	2025-09-18 05:19:04.080072	2025-09-18 09:19:55.435621	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
827210e5-f1d4-4742-ad79-f7d59c854ac9	admin@yahoo.com	t	2025-09-18 09:20:10.264134	2025-09-18 09:20:10.264134	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
b6f32ed2-726e-4fc8-94e0-f59e8d029d26	admin@yahoo.com	f	2025-09-18 09:31:47.108484	2025-09-18 09:32:40.790872	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
50e1c2d4-e062-4151-a418-535d61dae481	admin@mdrrmo.com	t	2025-09-18 09:33:51.046524	2025-09-18 09:33:51.046524	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
bf568e73-8e67-4b6b-b52c-d3c4faed9cf9	admin@yahoo.com	f	2025-09-18 09:35:57.814885	2025-09-18 09:52:47.074828	2001:4455:251:7c00:fb77:9a00:d54e:1cce (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
49e43b39-2eab-4394-92a2-7b16180ef785	admin@yahoo.com	f	2025-09-18 09:52:58.643447	2025-09-18 12:26:47.895113	2001:4455:251:7c00:fb77:9a00:d54e:1cce (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
4a104eb7-1f8e-4626-bc55-6376f83b4185	admin@yahoo.com	t	2025-09-19 02:04:31.156385	2025-09-19 02:04:31.156385	2001:4455:251:7c00:4d9:d430:5cad:2da (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
74d36c85-ee71-49ec-b706-151aed754316	admin@yahoo.com	t	2025-09-19 09:45:41.856603	2025-09-19 09:45:41.856603	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
6e56f1d2-9a62-4fe0-8868-ec94e86449c1	LiezelRodrigo@gmail.com	t	2025-09-20 01:55:41.033171	2025-09-20 01:55:41.033171	49.145.232.35 (Cagayan de Oro, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
1294d3b4-0ca9-43aa-b91e-21a1a89b090b	admin@yahoo.com	t	2025-09-20 06:29:35.58423	2025-09-20 06:29:35.58423	49.145.232.35 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
946738f9-14c8-4f4a-88ba-cf5b60e3d6c5	admin@yahoo.com	t	2025-09-21 15:14:47.999278	2025-09-21 15:14:47.999278	192.168.1.90 (Local/Private IP)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
039d6bda-b95c-4212-885f-221df83be911	admin@yahoo.com	t	2025-09-22 05:44:27.201205	2025-09-22 05:44:27.201205	175.176.84.215 (Unknown)	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
e2fdca60-7218-4799-93ba-90389e58332a	admin@mdrrmo.com	t	2025-09-22 17:36:56.486551	2025-09-22 17:36:56.486551	2001:4455:251:7c00:3d58:1244:373e:bcc5 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
7d03578a-0040-439d-8d66-647e36aef140	admin@yahoo.com	t	2025-09-24 02:08:17.965599	2025-09-24 02:08:17.965599	122.55.186.74 (Makati City, Metro Manila, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
fee623b1-1b43-4f37-b14b-3986b2e29b6b	admin@yahoo.com	t	2025-09-24 02:16:23.39737	2025-09-24 02:16:23.39737	122.55.186.74 (Makati City, Metro Manila, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	Online
c8b5dd41-4b3c-4e4e-b6b2-7efa7ab2153c	admin@yahoo.com	f	2025-09-24 12:32:58.159418	2025-09-24 14:21:50.104414	2001:4455:251:7c00:591e:69a5:427d:4cdf (Iligan, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
dbddcd1c-8412-4f63-ab03-dffa1ea4a059	vergil@gmail.com	t	2025-09-25 06:31:42.78176	2025-09-25 06:31:42.78176	122.55.186.74 (Marilao, Central Luzon, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
3c5ed63b-b38a-4aab-a01f-916517312912	vergil@gmail.com	t	2025-09-25 06:31:59.30178	2025-09-25 06:31:59.30178	122.55.186.74 (Marilao, Central Luzon, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
6b42b37d-b4c8-48b0-84db-6692b88b9211	admin@yahoo.com	f	2025-09-25 06:32:09.266503	2025-09-25 06:50:16.664402	122.55.186.74 (Marilao, Central Luzon, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
a65fdaa0-eff6-48c8-8a90-496724e5df49	admin@yahoo.com	f	2025-09-25 06:50:44.607228	2025-09-25 06:50:51.834154	122.55.186.74 (Marilao, Central Luzon, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
893e3f03-50a8-41dc-ac0b-acf28a34ce1f	admin@yahoo.com	t	2025-09-25 06:51:05.818607	2025-09-25 06:51:05.818607	122.55.186.74 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
97eeb55b-9487-4498-8054-a946ab1d2e83	admin@yahoo.com	t	2025-09-25 12:21:43.718926	2025-09-25 12:21:43.718926	143.44.192.16 (Cagayan de Oro, Northern Mindanao, Philippines)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
df921aad-107f-425b-838f-9d755066a2cc	admin@yahoo.com	t	2025-09-25 15:09:50.38107	2025-09-25 15:09:50.38107	175.176.84.230 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
c84007d2-59ff-42ae-b616-68528096bcbe	admin@yahoo.com	t	2025-09-26 04:56:06.790006	2025-09-26 04:56:06.790006	122.55.186.74 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
9c93d724-2c41-4321-8b90-46ef8bea8f40	admin@yahoo.com	t	2025-09-30 02:24:53.182098	2025-09-30 02:24:53.182098	2001:4455:251:7c00:6d96:4b17:1eb9:c31b (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
ff77adbf-9b8d-482d-80c3-ab89f683b775	admin@yahoo.com	t	2025-09-30 06:08:19.186558	2025-09-30 06:08:19.186558	64.226.57.61 (Unknown)	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Online
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, email, password, name, profile_image_url, dob, contact, address, created_at) FROM stdin;
1	admin@mdrrmo.com	admin123	Administrator	https://res.cloudinary.com/dtel7ethr/image/upload/v1753852174/admin_profiles/xkq70vsaaordahgejlf8.jpg	1992-07-08	09516569463	789 Emergency Ave, Rescue City	2025-09-02 00:55:15.605283
2	admin@yahoo.com	admin123	Nazef Hawk Lague	https://res.cloudinary.com/dtel7ethr/image/upload/v1756278082/admin_profiles/s9injz7tyqcluzvte9xl.png	1988-03-19	09516569463	789 Emergency Ave, Rescue City	2025-09-02 00:55:15.605283
3	Clyde@gmail.com	admin123	Clyde Justine L. Aquiatan	https://res.cloudinary.com/dtel7ethr/image/upload/v1754214606/admin_profiles/fcana282ckzwlot48v94.png	2011-11-02	09516569463	brgy.1 balingasag misamis oriental	2025-09-02 00:55:15.605283
4	Milo@gmail.com	coadmin123	Milourence C Galendez	\N	2025-08-04	09516569463	Pine Ave, Barangay 3	2025-09-02 00:55:15.605283
5	vergil@gmail.com	admin123	beryl Cabactulan		2025-09-02	09516569463	Lopez Jaena Street, Brgy. Casisang, Balingasag, Misamis Oriental	2025-09-02 00:55:15.605283
6	Razel@gmail.com	admin123	Razel Mae Del puerto	\N	2005-02-01	09516569463	Del Pilar Street, Brgy. Cogon, Balingasag, Misamis Oriental	2025-09-02 00:55:15.605283
7	LiezelRodrigo@gmail.com	admin123	Liezel Rodrigo	https://res.cloudinary.com/dtel7ethr/image/upload/v1756788836/admin_profiles/q1z6os7kbk4sxtojjrl1.jpg	1995-02-01	09516569463	Purok 1, Brgy. Barangay 1, Balingasag, Misamis Oriental	2025-09-02 04:51:23.082289
8	rodeljames@gmail.com	admin123	Rodel James Panes Tamayo	\N	1996-10-14	09516569463	Brgy Talusan, Balingasag, Misamis Oriental	2025-09-16 10:46:20.906459
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.alerts (id, user_id, address, type, status, occurred_at, lat, lng, created_at, responder_id, responded_at, description) FROM stdin;
135fb91d-d2e4-4c15-b15a-26f23f12840a	6	Brgy Poblacion, Valmores Street, Balingasag, Misamis Oriental, 9005, Philippines	rollover	Not Responded	2025-09-30 03:54:48.744367	8.7454099	124.7775851	2025-09-30 03:54:48.744367	\N	\N	Se
91d7dff8-4043-460a-a206-674ab3fd1417	6	Brgy Poblacion, Valmores Street, Balingasag, Misamis Oriental, 9005, Philippines	multi_vehicle	Responded	2025-09-30 04:06:02.010734	8.7454115	124.777617	2025-09-30 04:06:02.010734	1	2025-09-30 06:21:13.374314	\N
46631673-51b0-4239-8bbe-266e94dc20b7	6	Brgy Poblacion, Rizal Street, Balingasag, Misamis Oriental, 9005, Philippines	sideswipe	Not Responded	2025-09-30 06:30:10.378245	8.742519	124.774656	2025-09-30 06:30:10.378245	\N	\N	\N
\.


--
-- Data for Name: barangays; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.barangays (id, name, municipality_id) FROM stdin;
1	Linggangao	1
2	Cogon	1
3	Mambayaan	1
4	San Alonzo	1
5	Casisang	1
6	Barangay 1	2
7	Barangay 2	2
8	Barangay 3	2
9	Barangay 4	2
10	Barangay 5	2
11	Barangay 6	2
12	Barangay 7	2
13	Barangay 8	2
14	Barangay 9	2
15	Barangay 10	2
16	Barangay 11	2
17	Barangay 12	2
18	Barangay 13	2
19	Barangay 14	2
20	Barangay 15	2
21	Barangay 16	2
22	Barangay 17	2
23	Barangay 18	2
24	Barangay 19	2
25	Barangay 20	2
26	Barangay 21	2
27	Barangay 22	2
28	Barangay 23	2
29	Barangay 24	2
30	Barangay 25	2
31	Barangay 26	2
32	Barangay 27	2
33	Barangay 28	2
34	Barangay 29	2
35	Barangay 30	2
36	Barangay 31	2
37	Barangay 32	2
38	Barangay 33	2
39	Barangay 34	2
40	Barangay 35	2
41	Barangay 36	2
42	Barangay 37	2
43	Barangay 38	2
44	Barangay 39	2
45	Barangay 40	2
51	Barangay 6	3
52	Barangay 7	3
53	Barangay 8	3
54	Barangay 9	3
55	Barangay 10	3
56	Barangay 11	3
57	Barangay 12	3
58	Barangay 13	3
59	Barangay 14	3
60	Barangay 15	3
61	Barangay 1	4
62	Barangay 2	4
63	Barangay 3	4
64	Barangay 4	4
65	Barangay 5	4
66	Barangay 6	4
67	Barangay 7	4
68	Barangay 8	4
69	Barangay 9	4
70	Barangay 10	4
71	Barangay 11	4
72	Barangay 12	4
73	Barangay 13	4
74	Barangay 14	4
75	Barangay 15	4
76	Barangay 16	4
77	Barangay 17	4
78	Barangay 18	4
79	Barangay 19	4
80	Barangay 20	4
81	Barangay 21	4
82	Barangay 22	4
83	Barangay 23	4
84	Barangay 24	4
85	Barangay 1	5
86	Barangay 2	5
87	Barangay 3	5
88	Barangay 4	5
89	Barangay 5	5
90	Barangay 6	5
91	Barangay 7	5
92	Barangay 8	5
93	Barangay 9	5
94	Barangay 10	5
95	Barangay 11	5
96	Barangay 12	5
97	Barangay 13	5
98	Barangay 14	5
99	Barangay 15	5
100	Barangay 1	6
101	Barangay 2	6
102	Barangay 3	6
103	Barangay 4	6
104	Barangay 5	6
105	Barangay 6	6
106	Barangay 7	6
107	Barangay 8	6
108	Barangay 9	6
109	Barangay 10	6
110	Barangay 11	6
111	Barangay 12	6
112	Barangay 13	6
113	Barangay 14	6
114	Barangay 15	6
115	Barangay 16	6
116	Barangay 17	6
117	Carmen	2
118	Consolacion	2
119	Kauswagan	2
120	Gusa	2
121	Lapasan	2
122	Nazareth	2
123	Patag	2
124	Bulua	2
125	Iponan	2
126	Balulang	2
127	Lumbia	2
128	Macasandig	2
129	Barangay 1	2
130	Barangay 2	2
131	Barangay 3	2
132	Barangay 4	2
133	Barangay 5	2
134	Barangay 6	2
135	Barangay 7	2
136	Barangay 8	2
137	Barangay 9	2
138	Barangay 10	2
139	Barangay 11	2
140	Barangay 12	2
141	Barangay 13	2
142	Barangay 14	2
143	Barangay 15	2
144	Barangay 16	2
145	Barangay 17	2
146	Barangay 18	2
147	Barangay 19	2
148	Barangay 20	2
149	Barangay 21	2
150	Barangay 22	2
151	Barangay 23	2
152	Barangay 24	2
153	Barangay 25	2
154	Barangay 26	2
155	Barangay 27	2
156	Barangay 28	2
157	Barangay 29	2
158	Barangay 30	2
159	Barangay 31	2
160	Barangay 32	2
161	Barangay 33	2
162	Barangay 34	2
163	Barangay 35	2
164	Barangay 36	2
165	Barangay 37	2
166	Barangay 38	2
167	Barangay 39	2
168	Barangay 40	2
46	Barangay 1	1
50	Barangay 5	1
48	Barangay 3	1
49	Barangay 4	1
47	Barangay 2	1
\.


--
-- Data for Name: chat_history; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chat_history (id, username, message, "timestamp") FROM stdin;
5	bongbong marcos	rally nata	2025-09-21 11:13:28.977+00
7	Nazef	hahaha	2025-09-21 11:14:30.219+00
9	Nazef	nadaot naa koy gi update	2025-09-21 11:14:54.104+00
10	Nazef	XD	2025-09-21 11:15:16.156+00
11	Nazef	rally nag sugod na diay wala ko kabantay hahaa	2025-09-21 11:15:26.203+00
12	FerdiMarcos	wazup	2025-09-21 11:18:13.354+00
13	FerdiMarcos	nicee one	2025-09-21 11:18:20.333+00
14	w	sup	2025-09-21 11:18:20.472+00
15	FerdiMarcos	fix na ata	2025-09-21 11:18:22.624+00
16	w	oo nag update pa ko ganiha sir hahaha	2025-09-21 11:18:31.246+00
17	w	mga 3 seconds ago pa na fix	2025-09-21 11:18:40.613+00
18	FerdiMarcos	naa lang issue naz, since nag ask man ug username.. dapat ma save na sya as sesion para kada reload.. dli na sya mag sige add sa username	2025-09-21 11:19:05.084+00
19	w	i connect pa nako sa db naa kanang wala nanga render mao manang history	2025-09-21 11:19:12.162+00
20	FerdiMarcos	or unless if imo sya buhatan account login para ma save ang session	2025-09-21 11:19:24.81+00
21	FerdiMarcos	pero all good nani.. kuha na nimo logic	2025-09-21 11:19:33.475+00
22	FerdiMarcos	nice nice	2025-09-21 11:19:35.982+00
23	FerdiMarcos	GGWP	2025-09-21 11:19:37.192+00
24	w	oo sir naa man toy payload jwt didto ang info sa session mag kuha rako didto sa iyang id get dayo ang username	2025-09-21 11:19:43.358+00
25	FerdiMarcos	oo para ma resume lang ang session sa chat	2025-09-21 11:20:01.129+00
26	FerdiMarcos	para inig refresh... mu ingon lang sya (user is now active)	2025-09-21 11:20:23.514+00
27	FerdiMarcos	tapos if new joiner, (user has joined the chat)	2025-09-21 11:20:32.749+00
28	w	hehehe naa nakoy ma butang dadto sa online admins and responders	2025-09-21 11:20:34.776+00
29	w	yeah sir i implement lang nako naa	2025-09-21 11:21:08.228+00
31	FerdiMarcos	test	2025-09-21 11:25:04.376+00
32	FerdiMarcos	Hello world	2025-09-21 11:25:22.519+00
33	FerdiMarcos	Test 1	2025-09-21 11:25:28.593+00
34	FerdiMarcos	Hello world	2025-09-21 11:25:44.938+00
35	FerdiMarcos	Test 2	2025-09-21 11:25:51.136+00
36	FerdiMarcos	test 3	2025-09-21 11:25:59.488+00
37	FerdiMarcos	test 4	2025-09-21 11:26:03.587+00
38	FerdiMarcos	Test 5	2025-09-21 11:26:14.68+00
39	FerdiMarcos	test 6	2025-09-21 11:26:23.716+00
40	FerdiMarcos	naz	2025-09-21 11:27:03.975+00
41	FerdiMarcos	check ako comment	2025-09-21 11:27:06.447+00
42	FerdiMarcos	https://www.loom.com/share/82ca4b2825e845edabdbaee395694eec?sid=f1a9065b-7de2-4f7b-85d1-281d25457ca6	2025-09-21 11:27:07.795+00
43	what	what	2025-09-21 11:35:25.311+00
44	system	w has joined.	2025-09-21 11:38:27.76+00
45	w	w	2025-09-21 11:38:40.797+00
46	w	w	2025-09-21 11:39:22.072+00
47	system	w has left.	2025-09-21 11:39:33.711+00
48	system	w has joined.	2025-09-21 11:39:37.063+00
49	system	w has left.	2025-09-21 11:39:45.911+00
50	system	w has joined.	2025-09-21 11:39:50.497+00
51	w	w	2025-09-21 11:39:53.87+00
52	system	w has left.	2025-09-21 11:42:15.612+00
53	system	w has joined.	2025-09-21 11:42:36.772+00
54	system	w has left.	2025-09-21 11:43:13.582+00
55	system	w has joined.	2025-09-21 11:43:18.624+00
56	system	w has left.	2025-09-21 11:43:25.329+00
57	system	w has joined.	2025-09-21 11:43:33.642+00
58	system	w has left.	2025-09-21 11:44:53.517+00
59	system	q has joined.	2025-09-21 11:44:56.647+00
60	system	q has left.	2025-09-21 11:46:05.717+00
61	system	w has joined.	2025-09-21 11:46:07.788+00
62	system	w has left.	2025-09-21 11:46:13.295+00
63	system	w has joined.	2025-09-21 11:48:12.941+00
64	w	hello	2025-09-21 11:48:17.544+00
65	system	w has left.	2025-09-21 11:48:28.179+00
66	system	w has joined.	2025-09-21 11:48:30.472+00
67	w	w	2025-09-21 11:51:02.574+00
68	system	big w has joined.	2025-09-21 11:51:42.005+00
69	big w	hello	2025-09-21 11:51:46.364+00
70	big w	w	2025-09-21 12:01:33.668+00
71	system	big w has left.	2025-09-21 12:07:18.466+00
72	system	w has left.	2025-09-21 12:07:18.467+00
73	system	j has joined.	2025-09-21 12:10:10.683+00
74	j	jh	2025-09-21 12:10:15.349+00
75	system	n has joined.	2025-09-21 12:10:30.878+00
76	system	Jameskun has joined.	2025-09-21 12:23:36.84+00
77	Jameskun	nice	2025-09-21 12:23:45.937+00
78	system	yow has joined.	2025-09-21 12:27:53.157+00
79	yow	woah	2025-09-21 12:27:52.455+00
80	system	nazef has joined.	2025-09-21 12:27:58.851+00
81	nazef	woah	2025-09-21 12:28:04.913+00
82	nazef	grabe oh	2025-09-21 12:28:16.677+00
83	nazef	jameskun	2025-09-21 12:28:20.695+00
84	system	yow has left.	2025-09-21 12:28:21.394+00
85	nazef	boom	2025-09-21 12:32:49.289+00
86	system	nazef has left.	2025-09-21 12:36:03.623+00
87	system	Nazef has joined.	2025-09-21 12:36:29.45+00
88	system	Nazef has left.	2025-09-21 12:37:58.234+00
89	system	Nazef has joined.	2025-09-21 12:38:02.617+00
90	Nazef	hellow	2025-09-21 12:38:16.932+00
91	system	Nazef has left.	2025-09-21 12:40:58.533+00
92	system	Nazef has joined.	2025-09-21 12:43:50.538+00
93	system	Nazef has left.	2025-09-21 12:46:06.732+00
94	system	Nazef has joined.	2025-09-21 12:46:19.246+00
95	system	Nazef has joined.	2025-09-21 12:54:19.048+00
96	Nazef	boom	2025-09-21 12:54:50.02+00
97	system	Nazef has left.	2025-09-21 12:55:47.105+00
98	system	Nazef has joined.	2025-09-21 12:55:48.542+00
99	system	Nazef has joined.	2025-09-21 13:12:33.523+00
100	system	w has joined.	2025-09-21 13:13:06.935+00
101	system	Nazef has left.	2025-09-21 13:13:15.768+00
102	system	w has joined.	2025-09-21 13:23:31.242+00
103	system	w has left.	2025-09-21 13:28:15.032+00
104	system	Nazef has joined.	2025-09-21 13:29:01.282+00
105	system	w has joined.	2025-09-21 13:29:19.769+00
106	system	Nazef has joined.	2025-09-21 13:36:54.325+00
107	system	w has joined.	2025-09-21 13:37:28.475+00
108	system	Nazef has joined.	2025-09-21 13:38:07.662+00
109	system	Nazef has left.	2025-09-21 13:38:16.721+00
110	system	Nazef has joined.	2025-09-21 13:38:20.062+00
111	system	w has joined.	2025-09-21 13:49:35.343+00
112	system	w has left.	2025-09-21 13:49:36.227+00
113	system	w has joined.	2025-09-21 13:50:14.437+00
114	system	w has left.	2025-09-21 13:50:15.302+00
115	system	w has joined.	2025-09-21 13:53:49.219+00
116	system	w has left.	2025-09-21 13:54:05.928+00
117	system	Nazef has joined.	2025-09-21 13:54:09.498+00
118	system	nazef has joined.	2025-09-21 14:18:30.146+00
119	system	nazef has left.	2025-09-21 14:18:29.637+00
120	system	nazef has joined.	2025-09-21 14:18:33.695+00
121	system	Nazef has joined.	2025-09-21 15:17:10.755+00
122	Rezo	Nazyow	2025-09-21 15:17:10.767+00
123	system	Rezo has joined.	2025-09-21 15:17:11.967+00
124	Nazef	yow	2025-09-21 15:17:14.715+00
125	Rezo	Hahah	2025-09-21 15:17:18.955+00
126	Nazef	free mania	2025-09-21 15:17:24.009+00
127	Nazef	hehehe	2025-09-21 15:17:26.767+00
128	Rezo	Hmm	2025-09-21 15:17:53.499+00
129	system	Rezo has left.	2025-09-21 15:19:35.828+00
130	system	Nazef has left.	2025-09-21 15:32:33.007+00
131	system	Nazef has joined.	2025-09-22 05:38:20.254+00
132	system	Boom has joined.	2025-09-22 05:38:20.837+00
133	Nazef	Boom	2025-09-22 05:38:27.821+00
134	Boom	Yow	2025-09-22 05:38:58.744+00
135	Boom	Test1	2025-09-22 05:39:04.358+00
136	system	Nazef has left.	2025-09-22 05:39:29.625+00
137	system	Nazef has joined.	2025-09-22 05:39:52.752+00
138	Nazef	Test 2	2025-09-22 05:40:00.13+00
139	Boom	Test3	2025-09-22 05:40:14.588+00
140	system	Boom has left.	2025-09-22 05:40:35.944+00
141	system	Nazef has left.	2025-09-22 05:41:07.295+00
142	system	Nazef  has joined.	2025-09-22 05:41:30.317+00
143	Nazef 	Boom	2025-09-22 05:42:28.078+00
144	system	Nazef  has left.	2025-09-22 05:42:38.694+00
\.


--
-- Data for Name: login_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.login_logs (id, admin_id, email, ip_address, user_agent, login_time) FROM stdin;
5	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-10 13:52:59.999227+00
6	4	Milo@gmail.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-10 20:26:32.672603+00
7	5	vergil@gmail.com	180.195.249.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-10 13:15:05.059379+00
8	5	vergil@gmail.com	180.195.249.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-10 13:15:06.893715+00
9	2	admin@yahoo.com	2001:4455:277:7900:e1a5:92b7:8fe9:3353	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-10 22:12:04.297964+00
10	5	vergil@gmail.com	180.195.249.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-10 22:13:03.222792+00
11	5	vergil@gmail.com	180.195.249.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-10 22:13:04.267072+00
12	5	vergil@gmail.com	180.195.249.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-10 23:37:43.014875+00
13	5	vergil@gmail.com	180.195.249.107	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-10 23:37:45.535556+00
14	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-13 10:37:49.911429+00
15	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	2025-08-16 10:34:21.182212+00
16	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	2025-08-16 10:34:22.244985+00
17	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	2025-08-16 10:34:23.27186+00
18	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Linux; Android 11; RMX3269 Build/RP1A.201005.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/139.0.7258.94 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/519.0.0.63.109;]	2025-08-16 10:34:24.302516+00
19	2	admin@yahoo.com	143.44.192.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 14:08:38.945813+00
20	2	admin@yahoo.com	143.44.192.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 14:08:40.015737+00
21	2	admin@yahoo.com	143.44.192.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 14:08:41.035371+00
22	2	admin@yahoo.com	143.44.192.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 14:08:42.047109+00
23	2	admin@yahoo.com	143.44.192.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 14:08:44.956181+00
24	2	admin@yahoo.com	143.44.192.248	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 15:01:57.612744+00
25	2	admin@yahoo.com	143.44.192.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 18:17:26.33426+00
26	2	admin@yahoo.com	143.44.192.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-19 18:17:27.626958+00
27	2	admin@yahoo.com	143.44.192.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 09:27:08.332774+00
28	2	admin@yahoo.com	143.44.192.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 09:27:09.410966+00
29	2	admin@yahoo.com	143.44.192.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 09:27:10.442821+00
30	2	admin@yahoo.com	143.44.192.222	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 09:27:13.372256+00
31	2	admin@yahoo.com	2001:4455:2c9:4c00:9aa5:68eb:9c11:1b86	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-20 17:11:29.951707+00
32	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:57:58.809779+00
33	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:57:59.832068+00
34	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:00.891591+00
35	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:03.674465+00
36	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:03.71673+00
37	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:03.739933+00
38	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:03.789439+00
39	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:03.982444+00
40	2	admin@yahoo.com	143.44.192.182	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-22 12:58:04.292884+00
41	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 15:36:57.231746+00
42	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 15:36:57.401661+00
43	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-26 15:37:00.603095+00
44	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-27 14:55:30.443793+00
45	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-27 14:55:33.19584+00
46	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 15:33:47.226096+00
47	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 15:33:47.500274+00
48	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 15:33:56.083436+00
49	2	admin@yahoo.com	49.145.232.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 20:28:16.808133+00
50	6	Razel@gmail.com	2001:4455:247:9700:b4cb:c7c:724b:b0a1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 20:31:44.229056+00
51	6	Razel@gmail.com	49.145.232.162	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 20:50:17.472558+00
52	2	admin@yahoo.com	2001:4455:247:9700:b4cb:c7c:724b:b0a1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 20:56:10.035891+00
53	2	admin@yahoo.com	2001:4455:247:9700:b4cb:c7c:724b:b0a1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0	2025-08-28 21:02:48.108132+00
54	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 21:19:33.895115+00
55	6	Razel@gmail.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-28 21:20:35.284794+00
56	2	admin@yahoo.com	2001:4455:247:9700:6e98:e548:68e5:3566	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-28 21:50:55.919923+00
57	2	admin@yahoo.com	2001:4455:247:9700:6e98:e548:68e5:3566	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-28 21:50:57.325037+00
58	2	admin@yahoo.com	2001:4455:247:9700:6e98:e548:68e5:3566	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36	2025-08-28 21:50:58.593526+00
59	2	admin@yahoo.com	2001:4455:247:9700:b4cb:c7c:724b:b0a1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 14:10:12.294751+00
60	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 16:47:03.322577+00
61	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 16:47:03.974029+00
62	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 16:47:52.756301+00
63	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 16:48:17.880045+00
64	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 18:29:50.446717+00
65	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 18:29:51.472752+00
66	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 18:29:53.309055+00
67	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 18:29:54.378187+00
68	2	admin@yahoo.com	2001:4455:229:5100:31e6:a2a4:95e6:418a	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-29 18:29:55.138922+00
69	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-31 14:27:31.268255+00
70	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-31 15:26:41.831131+00
71	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-31 15:26:42.684379+00
72	2	admin@yahoo.com	2001:4455:251:7c00:e414:917d:a6f9:ed	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-31 21:29:58.029351+00
73	2	admin@yahoo.com	2001:4455:251:7c00:e414:917d:a6f9:ed	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-31 21:29:59.105858+00
74	2	admin@yahoo.com	210.185.177.78	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-01 09:54:59.059088+00
75	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 08:35:32.544345+00
76	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 08:35:40.116067+00
77	7	LiezelRodrigo@gmail.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 04:51:50.831197+00
78	7	LiezelRodrigo@gmail.com	2001:4455:251:7c00:68eb:88a6:f8ac:5a8b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 13:02:28.417132+00
79	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 13:06:38.70901+00
80	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 13:07:08.370891+00
81	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 13:10:40.697237+00
82	6	Razel@gmail.com	2001:4455:24a:d600:a56d:53aa:98cc:7e17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 13:20:27.354205+00
83	2	admin@yahoo.com	2001:4455:24a:d600:a56d:53aa:98cc:7e17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 13:37:49.743191+00
84	2	admin@yahoo.com	2001:4455:24a:d600:a56d:53aa:98cc:7e17	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 05:37:50.956138+00
85	2	admin@yahoo.com	2001:4455:251:7c00:68eb:88a6:f8ac:5a8b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 15:54:56.272459+00
86	2	admin@yahoo.com	2001:4455:251:7c00:68eb:88a6:f8ac:5a8b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-02 17:35:42.577026+00
87	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-06 12:01:36.769144+00
88	2	admin@yahoo.com	175.176.82.113	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36	2025-09-06 13:50:17.033124+00
89	2	admin@yahoo.com	2001:4455:251:7c00:6cd8:2c06:26e8:6dd	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-12 17:26:20.382821+00
90	7	LiezelRodrigo@gmail.com	2001:4455:2bb:1100:9177:414d:20c0:191e	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-16 18:39:59.554327+00
91	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 11:57:55.522947+00
92	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 13:19:04.150575+00
93	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 17:20:10.333662+00
94	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 17:31:47.175472+00
95	1	admin@mdrrmo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 17:33:51.108591+00
96	2	admin@yahoo.com	2001:4455:251:7c00:fb77:9a00:d54e:1cce	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 17:35:58.027148+00
97	2	admin@yahoo.com	2001:4455:251:7c00:fb77:9a00:d54e:1cce	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 17:52:58.854604+00
98	2	admin@yahoo.com	2001:4455:251:7c00:4d9:d430:5cad:2da	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 10:04:31.367432+00
99	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 17:45:41.947619+00
100	7	LiezelRodrigo@gmail.com	49.145.232.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 23:52:46.298346+00
101	7	LiezelRodrigo@gmail.com	49.145.232.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-20 09:55:41.24384+00
102	2	admin@yahoo.com	49.145.232.35	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-20 14:29:35.794196+00
103	2	admin@yahoo.com	192.168.1.90	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-21 23:14:48.065755+00
104	2	admin@yahoo.com	175.176.84.215	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-22 13:44:27.418849+00
105	1	admin@mdrrmo.com	2001:4455:251:7c00:3d58:1244:373e:bcc5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-23 01:36:56.702118+00
106	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 10:08:18.18564+00
107	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-09-24 10:16:23.598204+00
108	2	admin@yahoo.com	2001:4455:251:7c00:591e:69a5:427d:4cdf	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-24 20:32:58.403154+00
109	5	vergil@gmail.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 14:31:43.018972+00
110	5	vergil@gmail.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 14:31:59.527053+00
111	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 14:32:09.489104+00
112	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 14:50:44.830675+00
113	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 14:51:06.045303+00
114	2	admin@yahoo.com	143.44.192.16	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 20:21:43.958303+00
115	2	admin@yahoo.com	175.176.84.230	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-25 23:09:50.61167+00
116	2	admin@yahoo.com	122.55.186.74	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-26 12:56:07.011707+00
117	2	admin@yahoo.com	2001:4455:251:7c00:6d96:4b17:1eb9:c31b	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-30 10:24:53.386904+00
118	2	admin@yahoo.com	64.226.57.61	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-30 14:08:19.393613+00
\.


--
-- Data for Name: municipalities; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.municipalities (id, name, province_id) FROM stdin;
1	Balingasag	1
2	Cagayan de Oro	1
3	El Salvador	1
4	Gingoog	1
5	Initao	1
6	Opol	1
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, account_type, account_id, sender_type, sender_id, sender_name, recipient_name, message, is_read, created_at, updated_at) FROM stdin;
17	admin	1	\N	\N	System	Administrator	Admin Administrator logged in from 192.168.1.90 (Local/Private IP) on Sep 18, 2025, 5:33 PM	t	2025-09-18 17:33:51.1755+00	2025-09-18 09:36:07.778069+00
16	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 192.168.1.90 (Local/Private IP) on Sep 18, 2025, 5:31 PM	t	2025-09-18 17:31:47.238968+00	2025-09-18 09:36:14.942238+00
15	responder	1	admin	1	Admin John Cruz	Responder Liza Fernandez	Hit-and-run incident near Quezon Avenue. Please respond to the scene.	t	2025-09-18 09:31:40.786916+00	2025-09-18 09:51:04.657108+00
13	responder	1	admin	1	Admin John Cruz	Responder Angela Reyes	Major accident along C5 Road involving multiple vehicles. Immediate action needed.	t	2025-09-18 09:31:40.786916+00	2025-09-18 09:51:08.429118+00
11	responder	1	admin	1	Admin John Cruz	Responder Maria Dela Cruz	Urgent: A car accident has been reported at EDSA corner Ortigas. Please respond immediately.	t	2025-09-18 09:31:40.786916+00	2025-09-18 09:51:11.443531+00
14	responder	1	admin	2	Admin Sarah Lim	Responder Carlo Tan	Accident reported at Roxas Boulevard. Verify situation and provide support.	t	2025-09-18 09:31:40.786916+00	2025-09-18 09:51:15.486489+00
12	responder	1	admin	2	Admin Sarah Lim	Responder Juan Dela Torre	Car collision reported near Makati Avenue. Dispatch required for assistance.	t	2025-09-18 09:31:40.786916+00	2025-09-18 09:51:19.136148+00
18	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 2001:4455:251:7c00:fb77:9a00:d54e:1cce (Iligan, Northern Mindanao, Philippines) on Sep 18, 2025, 5:52 PM	t	2025-09-18 17:52:59.104128+00	2025-09-18 09:57:16.515289+00
19	admin	1	admin	1	Administrator	Administrator	Admin Administrator added a PCR form for patient weqweqweqwe on Sep 18, 2025, 6:15 PM	t	2025-09-18 18:15:18.649931+00	2025-09-18 10:16:32.671012+00
20	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated Resident Mekay Abecia on Sep 18, 2025, 7:20 PM	t	2025-09-18 11:20:40.750049+00	2025-09-18 11:21:02.443714+00
21	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated Resident Mekay Abecia on Sep 18, 2025, 7:20 PM	t	2025-09-18 11:20:41.295474+00	2025-09-18 11:21:08.624753+00
22	admin	1	admin	1	Administrator	Administrator	Admin Administrator added a Resident account for Juvy Randez on Sep 18, 2025, 7:26 PM	t	2025-09-18 19:26:07.290122+00	2025-09-18 11:26:17.235522+00
23	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated Resident Juvy Randez on Sep 18, 2025, 7:27 PM	t	2025-09-18 19:27:31.657066+00	2025-09-18 11:27:48.064355+00
24	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 18, 2025, 7:33 PM	t	2025-09-18 19:33:08.579401+00	2025-09-18 11:33:14.882144+00
26	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 18, 2025, 7:46 PM	t	2025-09-18 19:45:59.862694+00	2025-09-18 11:46:46.392704+00
32	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:18 AM	t	2025-09-19 10:18:18.066949+00	2025-09-19 02:18:47.139285+00
31	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:15 AM	t	2025-09-19 10:15:04.155218+00	2025-09-19 02:23:54.770858+00
34	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:25 AM	t	2025-09-19 10:25:33.670589+00	2025-09-19 02:27:32.157663+00
35	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:32 AM	t	2025-09-19 10:32:08.844124+00	2025-09-19 02:32:52.325959+00
36	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient Virgil Cabactulan on Sep 19, 2025, 10:38 AM	t	2025-09-19 10:38:05.277083+00	2025-09-19 02:39:07.525246+00
27	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 2001:4455:251:7c00:4d9:d430:5cad:2da (Iligan, Northern Mindanao, Philippines) on Sep 19, 2025, 10:04 AM	t	2025-09-19 10:04:31.627737+00	2025-09-19 03:51:18.295245+00
28	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:05 AM	t	2025-09-19 10:05:29.434087+00	2025-09-19 03:51:18.295245+00
37	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 11:49 AM	t	2025-09-19 03:49:11.506075+00	2025-09-19 03:51:18.295245+00
38	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient Virgil Cabactulan on Sep 19, 2025, 11:50 AM	t	2025-09-19 11:50:24.260246+00	2025-09-19 03:51:18.295245+00
33	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:25 AM	t	2025-09-19 10:25:13.687941+00	2025-09-19 09:33:15.846817+00
39	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 192.168.1.90 (Local/Private IP) on Sep 19, 2025, 5:45 PM	t	2025-09-19 17:45:42.410391+00	2025-09-19 09:49:44.213226+00
30	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:14 AM	t	2025-09-19 10:14:30.863121+00	2025-09-19 09:53:39.619538+00
29	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 10:14 AM	t	2025-09-19 10:14:10.824012+00	2025-09-19 12:01:56.36681+00
48	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient qwe on Sep 20, 2025, 12:36 AM	t	2025-09-20 00:36:29.738505+00	2025-09-22 06:49:53.984398+00
47	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient 1212 on Sep 20, 2025, 12:24 AM	t	2025-09-20 00:24:17.896341+00	2025-09-22 06:49:56.303621+00
45	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague added a PCR form for patient 1212 on Sep 19, 2025, 8:49 PM	t	2025-09-19 20:49:06.302332+00	2025-09-22 06:49:57.792676+00
44	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient qwe on Sep 19, 2025, 8:43 PM	t	2025-09-19 20:43:02.947517+00	2025-09-22 17:44:28.913413+00
40	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 8:17 PM	t	2025-09-19 20:17:49.551819+00	2025-09-24 14:08:44.915887+00
41	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 8:40 PM	t	2025-09-19 20:40:16.987235+00	2025-09-24 14:08:44.915887+00
42	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague updated a PCR form for patient weqweqweqwe on Sep 19, 2025, 8:40 PM	t	2025-09-19 20:40:26.574467+00	2025-09-24 14:08:44.915887+00
25	admin	1	admin	1	Administrator	Administrator	Admin Administrator updated a PCR form for patient weqweqweqwe on Sep 18, 2025, 7:33 PM	t	2025-09-18 19:33:48.66023+00	2025-09-24 14:09:42.56637+00
50	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 49.145.232.35 (Unknown) on Sep 20, 2025, 2:29 PM	t	2025-09-20 14:29:36.053172+00	2025-09-20 06:30:40.255759+00
52	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 175.176.84.215 (Unknown) on Sep 22, 2025, 1:44 PM	t	2025-09-22 13:44:27.683006+00	2025-09-22 05:46:32.777331+00
53	admin	1	\N	\N	System	Administrator	Admin Administrator logged in from 2001:4455:251:7c00:3d58:1244:373e:bcc5 (Unknown) on Sep 23, 2025, 1:36 AM	t	2025-09-23 01:36:56.964818+00	2025-09-22 17:44:10.843009+00
51	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 192.168.1.90 (Local/Private IP) on Sep 21, 2025, 11:15 PM	t	2025-09-21 23:14:48.47355+00	2025-09-22 17:44:25.228834+00
54	admin	1	admin	1	Administrator	Administrator	Admin Administrator added a PCR form for patient Nazef Hawk Lague on Sep 23, 2025, 1:48 AM	t	2025-09-23 01:48:54.740078+00	2025-09-22 17:50:15.145252+00
56	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 122.55.186.74 (Makati City, Metro Manila, Philippines) on Sep 24, 2025, 10:16 AM	t	2025-09-24 10:16:23.834448+00	2025-09-24 02:29:02.657087+00
58	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague added a PCR form for patient nazef on Sep 24, 2025, 9:22 PM	t	2025-09-24 21:22:49.766707+00	2025-09-24 13:24:08.045152+00
43	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague added a PCR form for patient qwe on Sep 19, 2025, 8:42 PM	t	2025-09-19 20:42:31.724129+00	2025-09-24 14:08:44.915887+00
55	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 122.55.186.74 (Makati City, Metro Manila, Philippines) on Sep 24, 2025, 10:08 AM	t	2025-09-24 10:08:18.456408+00	2025-09-24 14:08:44.915887+00
57	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 2001:4455:251:7c00:591e:69a5:427d:4cdf (Iligan, Northern Mindanao, Philippines) on Sep 24, 2025, 8:32 PM	t	2025-09-24 20:32:58.692027+00	2025-09-24 14:08:44.915887+00
61	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 122.55.186.74 (Marilao, Central Luzon, Philippines) on Sep 25, 2025, 2:32 PM	f	2025-09-25 14:32:09.711919+00	2025-09-25 06:32:09.711919+00
62	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 122.55.186.74 (Marilao, Central Luzon, Philippines) on Sep 25, 2025, 2:50 PM	f	2025-09-25 14:50:45.092317+00	2025-09-25 06:50:45.092317+00
63	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 122.55.186.74 (Unknown) on Sep 25, 2025, 2:51 PM	f	2025-09-25 14:51:06.273232+00	2025-09-25 06:51:06.273232+00
64	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 143.44.192.16 (Cagayan de Oro, Northern Mindanao, Philippines) on Sep 25, 2025, 8:21 PM	f	2025-09-25 20:21:44.244959+00	2025-09-25 12:21:44.244959+00
65	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 175.176.84.230 (Unknown) on Sep 25, 2025, 11:09 PM	f	2025-09-25 23:09:50.888828+00	2025-09-25 15:09:50.888828+00
66	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 122.55.186.74 (Unknown) on Sep 26, 2025, 12:56 PM	f	2025-09-26 12:56:07.307395+00	2025-09-26 04:56:07.307395+00
67	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 2001:4455:251:7c00:6d96:4b17:1eb9:c31b (Unknown) on Sep 30, 2025, 10:24 AM	f	2025-09-30 10:24:53.638323+00	2025-09-30 02:24:53.638323+00
69	admin	2	admin	2	Nazef Hawk Lague	Nazef Hawk Lague	Admin Nazef Hawk Lague added a PCR form for patient razel on Sep 30, 2025, 2:15 PM	f	2025-09-30 14:15:44.952346+00	2025-09-30 06:15:44.952346+00
68	admin	2	\N	\N	System	Nazef Hawk Lague	Admin Nazef Hawk Lague logged in from 64.226.57.61 (Unknown) on Sep 30, 2025, 2:08 PM	t	2025-09-30 14:08:19.635764+00	2025-09-30 16:28:18.23645+00
\.


--
-- Data for Name: pcr_forms; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pcr_forms (id, patient_name, date, location, recorder, full_form, created_at, created_by_type, created_by_id, updated_at) FROM stdin;
f351b013-d06b-4e17-9d25-3aa2ba0e494b	Nazef Hawk Lague	2025-09-23	Linggangao Misamis Oriental	Administrator	{"pr": "", "rr": "", "age": "23", "doi": "", "noi": "", "poi": {"brgy": "", "highway": false, "residence": false, "publicBuilding": false}, "toi": "", "crew": "", "temp": "", "o2sat": "", "driver": "", "events": "", "gender": "Male", "alertId": "35728aa3-676e-4c5a-84a4-24a716ef12ba", "caseType": "Car Crash", "category": "Patient", "timeCall": "", "allergies": "", "narrative": "", "lastIntake": "", "medication": "", "teamLeader": "", "ambulanceNo": "", "bodyDiagram": [], "createdById": 1, "homeAddress": "", "pastHistory": "", "relationship": "", "responseTeam": [], "bloodPressure": "", "contactNumber": "", "contactPerson": "", "createdByType": "admin", "created_by_id": 1, "interventions": "", "receivingName": "", "signsSymptoms": "", "timeLeftScene": "", "evacuationCode": {"red": false, "black": false, "green": false, "yellow": false}, "timeCallPeriod": "AM", "underInfluence": {"none": false, "drugs": false, "alcohol": false, "unknown": false}, "chiefComplaints": "", "created_by_type": "admin", "patientSignature": "https://res.cloudinary.com/dtel7ethr/image/upload/v1758563330/pcr_signatures/q4fc8lqtlb9yieqdiuzp.png", "timeArrivedScene": "", "witnessSignature": "https://res.cloudinary.com/dtel7ethr/image/upload/v1758563331/pcr_signatures/ucnvhcwj3zmrbpuhjxvy.png", "receivingHospital": "", "receivingSignature": "https://res.cloudinary.com/dtel7ethr/image/upload/v1758563332/pcr_signatures/x9v0mxap3admj3fevfrb.png", "hospitalTransported": "", "lossOfConsciousness": "no", "timeArrivedHospital": "", "timeLeftScenePeriod": "AM", "patientSignatureDate": "2025-09-22", "witnessSignatureDate": "2025-09-22", "receivingSignatureDate": "2025-09-22", "timeArrivedScenePeriod": "AM", "timeArrivedHospitalPeriod": "AM", "lossOfConsciousnessMinutes": ""}	2025-09-22 17:48:54.527467	admin	1	2025-09-22 17:48:54.527467
2843231f-875b-4115-8363-3983ff233cc8	razel	2025-09-30	Brgy Poblacion, Valmores Street, Balingasag, Misamis Oriental, 9005, Philippines	Nazef Hawk Lague	{"pr": null, "rr": null, "age": null, "doi": null, "noi": null, "poi": {"brgy": null, "highway": false, "residence": false, "publicBuilding": false}, "toi": null, "crew": null, "temp": null, "o2sat": null, "driver": null, "events": null, "gender": null, "alertId": "91d7dff8-4043-460a-a206-674ab3fd1417", "caseType": "multi_vehicle", "category": "Patient", "timeCall": "", "allergies": null, "narrative": null, "lastIntake": null, "medication": null, "teamLeader": null, "ambulanceNo": null, "bodyDiagram": [{"bodyPart": "right hand", "condition": "injury"}], "case_number": null, "createdById": 2, "homeAddress": null, "pastHistory": null, "relationship": null, "responseTeam": null, "bloodPressure": null, "contactNumber": null, "contactPerson": null, "createdByType": "admin", "created_by_id": 2, "interventions": null, "receivingName": null, "signsSymptoms": null, "timeLeftScene": "", "evacuationCode": {"red": false, "black": false, "green": false, "yellow": false}, "timeCallPeriod": "AM", "underInfluence": {"none": false, "drugs": false, "alcohol": false, "unknown": false}, "chiefComplaints": null, "created_by_type": "admin", "patientSignature": "https://res.cloudinary.com/dtel7ethr/image/upload/v1759212940/pcr_signatures/fanbzffje35cjbwq4y4f.png", "timeArrivedScene": "", "witnessSignature": "https://res.cloudinary.com/dtel7ethr/image/upload/v1759212941/pcr_signatures/s4m9ny3wufqcalqie0v0.png", "receivingHospital": "", "receivingSignature": "https://res.cloudinary.com/dtel7ethr/image/upload/v1759212942/pcr_signatures/ztm5pxyf9onw8qor0cye.png", "hospitalTransported": null, "lossOfConsciousness": "no", "timeArrivedHospital": "", "timeLeftScenePeriod": "AM", "patientSignatureDate": "2025-09-30", "witnessSignatureDate": "2025-09-30", "receivingSignatureDate": "2025-09-30", "timeArrivedScenePeriod": "AM", "timeArrivedHospitalPeriod": "AM", "lossOfConsciousnessMinutes": null}	2025-09-30 06:15:44.693654	admin	2	2025-09-30 06:16:47.25836
6cd1f4e9-cbb9-44c5-976a-b23d543be468	nazef	2025-09-24	Brgy Poblacion, Valmores Street, Balingasag, Misamis Oriental, 9005, Philippines	Nazef Hawk Lague	{"pr": "", "rr": "", "age": "", "doi": "", "noi": "", "poi": {"brgy": "", "highway": false, "residence": false, "publicBuilding": false}, "toi": "", "crew": "", "temp": "", "o2sat": "", "driver": "", "events": "", "gender": "", "alertId": "5c07aeb8-8e78-40a8-b230-76c4e3bdf932", "caseType": "rear_end", "category": "Patient", "timeCall": "", "allergies": "", "narrative": "", "lastIntake": "", "medication": "", "teamLeader": "", "ambulanceNo": "", "bodyDiagram": [], "createdById": 2, "homeAddress": "", "pastHistory": "", "relationship": "", "responseTeam": [], "bloodPressure": "", "contactNumber": "", "contactPerson": "", "createdByType": "admin", "created_by_id": 2, "interventions": "", "receivingName": "", "signsSymptoms": "", "timeLeftScene": "", "evacuationCode": {"red": false, "black": false, "green": false, "yellow": false}, "timeCallPeriod": "AM", "underInfluence": {"none": false, "drugs": false, "alcohol": false, "unknown": false}, "chiefComplaints": "", "created_by_type": "admin", "patientSignature": null, "timeArrivedScene": "", "witnessSignature": null, "receivingHospital": "", "receivingSignature": null, "hospitalTransported": "", "lossOfConsciousness": "no", "timeArrivedHospital": "", "timeLeftScenePeriod": "AM", "patientSignatureDate": "", "witnessSignatureDate": "", "receivingSignatureDate": "", "timeArrivedScenePeriod": "AM", "timeArrivedHospitalPeriod": "AM", "lossOfConsciousnessMinutes": ""}	2025-09-24 13:22:49.498183	admin	2	2025-09-24 13:22:49.498183
\.


--
-- Data for Name: pins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pins (id, user_id, pin, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: provinces; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.provinces (id, name) FROM stdin;
1	Misamis Oriental
\.


--
-- Data for Name: responder_pins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.responder_pins (id, responder_id, pin, created_at) FROM stdin;
1	1	1234	2025-08-19 05:35:55.720223
2	4	1234	2025-08-20 03:19:03.658514
\.


--
-- Data for Name: responder_sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.responder_sessions (id, responder_id, is_active, status, created_at, last_active_at, ip_address, user_agent) FROM stdin;
2c45a801-d056-4c40-88fb-21dd45bb1aa9	3	t	ready to go	2025-08-05 01:23:55.906971	2025-08-05 01:23:55.906971	192.168.1.10	Mozilla/5.0 (Windows NT 10.0; Win64; x64)
\.


--
-- Data for Name: responders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.responders (id, email, password, name, profile_image_url, dob, contact, address, created_at, pin) FROM stdin;
1	qwe@gmail.com	password	qwe Qwe	https://res.cloudinary.com/dtel7ethr/image/upload/v1753852174/admin_profiles/xkq70vsaaordahgejlf8.jpg	2025-08-01	+639516569463	Purok 2, Brgy. Linggangao, Balingasag, Misamis Oriental	2025-08-15 12:35:04.955519	\N
3	responder@example.com	responder123	Juan Dela Cruz	https://res.cloudinary.com/dtel7ethr/image/upload/v1754214606/admin_profiles/fcana282ckzwlot48v94.png	1990-05-14	+639516569463	Rizal Street, Brgy. Cogon, Balingasag, Misamis Oriental	2025-08-15 12:35:04.955519	\N
4	Cyrus@gmail.com	responder123	Cyrus Dagoc	\N	2005-02-28	+639516569463	Burgos Street, Brgy. San Alonzo, Balingasag, Misamis Oriental	2025-08-15 12:35:04.955519	\N
2	qweww@gmail.com	password	qweqq Qwe	\N	2025-08-02	+639516569463	Lopez Jaena Street, Brgy. Casisang, Balingasag, Misamis Oriental	2025-08-15 12:35:04.955519	\N
\.


--
-- Data for Name: streets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.streets (id, name, barangay_id) FROM stdin;
8	Street 1	6
9	Street 2	6
10	Street 3	6
11	Street 4	6
12	Street 5	6
13	Main Street	7
14	Oak Avenue	7
15	Pine Street	7
16	Maple Road	7
17	Cedar Lane	7
1	Purok 1	46
2	Purok 2	46
3	Rizal Street	46
4	Del Pilar Street	46
5	Bonifacio Street	46
6	Burgos Street	46
7	Lopez Jaena Street	46
\.


--
-- Data for Name: token_blacklist; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.token_blacklist (token, responder_id, blacklisted_at, expires_at, created_at, updated_at) FROM stdin;
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTY5MDk2ODYsImV4cCI6MTc1NjkxMzI4Nn0.oY4xkNRgaoXpKvZk2QdXAxQTE7fdopKrn0-ZOR4HeGw	1	2025-09-03 14:30:23.292579+00	2025-09-03 15:28:06+00	2025-09-03 14:30:23.292579+00	2025-09-03 14:30:23.292579+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTY5MDk5OTUsImV4cCI6MTc1NjkxMzU5NX0.NbmJ6HBICMnUoefKTCGrb7lp4ihGqWrzbrlRHKGWFAY	1	2025-09-03 14:33:28.416108+00	2025-09-03 15:33:15+00	2025-09-03 14:33:28.416108+00	2025-09-03 14:33:28.416108+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTY5MTEwMDMsImV4cCI6MTc1NjkxNDYwM30.g47p-V_yx_sMMgO7pn5nFgl8PNfaSiXWW46EwTok4hA	1	2025-09-03 14:50:11.515714+00	2025-09-03 15:50:03+00	2025-09-03 14:50:11.515714+00	2025-09-03 14:50:11.515714+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTY5MTEwNzUsImV4cCI6MTc1NjkxNDY3NX0.911_P7EWQt_GBG08CFXtUnyYgck57uFq2Xycv9Fb8lM	1	2025-09-03 14:51:20.810103+00	2025-09-03 15:51:15+00	2025-09-03 14:51:20.810103+00	2025-09-03 14:51:20.810103+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTcyMjk1MzcsImV4cCI6MTc1NzMxNTkzN30.LTEcdx1AheU0JMeskXhIAPcwpDIppV8A7TrOjZ8Zv3c	1	2025-09-07 07:22:36.111494+00	2025-09-08 07:18:57+00	2025-09-07 07:22:36.111494+00	2025-09-07 07:22:36.111494+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTcyMzk5MTAsImV4cCI6MTc1NzMyNjMxMH0.d7Pm8uHeUIBaQBH8RxPmgTXYx7TMO8SHbrVuUSaLnts	1	2025-09-07 10:15:36.881152+00	2025-09-08 10:11:50+00	2025-09-07 10:15:36.881152+00	2025-09-07 10:15:36.881152+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTc0ODU1MTEsImV4cCI6MTc1NzU3MTkxMX0.b17t6CfXyZHw-3srGtGQX6QmgMOOsBxK51UZ-lQBHq4	1	2025-09-10 11:31:08.472349+00	2025-09-11 06:25:11+00	2025-09-10 11:31:08.472349+00	2025-09-10 11:31:08.472349+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTgxOTY3MzMsImV4cCI6MTc1ODI4MzEzM30.Ah0QhvIEZoM6pdaDvvR9KBr4zLnQALPpijQwIX1DHB0	1	2025-09-18 12:03:02.021841+00	2025-09-19 11:58:53+00	2025-09-18 12:03:02.021841+00	2025-09-18 12:03:02.021841+00
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJxd2VAZ21haWwuY29tIiwibmFtZSI6InF3ZSBRd2UiLCJpYXQiOjE3NTg3MTgyMzAsImV4cCI6MTc1ODgwNDYzMH0.JY3CWXLb8h9IRVeTndb0B38ii0Jc8h9ArMij-xsqvzA	1	2025-09-24 12:56:30.288233+00	2025-09-25 12:50:30+00	2025-09-24 12:56:30.288233+00	2025-09-24 12:56:30.288233+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, name, email, password, dob, contact, address, image_url, created_at, updated_at) FROM stdin;
17	qweqwe qweqwe	asdasds@gmail.com	user123	2025-08-06	+639123123123	Del Pilar Street, Brgy. Cogon, Balingasag, Misamis Oriental	\N	2025-08-07 06:50:27.500053	2025-08-07 06:50:27.500053
13	James Macarulay	James@gmail.com	user123	2007-02-06	+639123123123	Burgos Street, Brgy. San Alonzo, Balingasag, Misamis Oriental	\N	2025-08-07 06:44:54.628723	2025-08-07 06:44:54.628723
14	qweqwe qweqweqwe qwewqewq	qweqw@gmail.com	user123	2022-02-07	+639123213213	Lopez Jaena Street, Brgy. Casisang, Balingasag, Misamis Oriental	\N	2025-08-07 06:49:01.682234	2025-08-07 06:49:01.682234
16	qeqweq qewqqe qweqwewq	qwe12121@gmail.com	user123	2025-08-07	+639123123213	Del Pilar Street, Brgy. Cogon, Balingasag, Misamis Oriental	\N	2025-08-07 06:49:53.546657	2025-08-07 06:49:53.546657
18	qweqw qweqew	asz@gmal.com	user123	1980-06-06	+639121312312	Rizal Street, Brgy. Cogon, Balingasag, Misamis Oriental	\N	2025-08-07 06:54:36.334911	2025-08-07 06:54:36.334911
19	qwe qwe	qsz@gmail.com	user123	2007-02-12	+639167163123	Waterfall	\N	2025-08-07 06:59:52.244495	2025-08-07 06:59:52.244495
21	Carl Gallardo	carlwynegallardo@gmail.com	user123	2003-09-12	+639778376532	Brgy. 5 Balingasag	\N	2025-09-01 02:01:50.360422	2025-09-01 02:01:50.360422
23	Virgil Cabactulan	Virgil@gmail.com	user123	2001-02-02	+639167163666	Purok 1, Brgy. Barangay 1, Balingasag, Misamis Oriental	\N	2025-09-02 09:38:12.705991	2025-09-02 09:38:12.705991
22	Mekay Abecia	mekayabecia@gmail.com	user123	2002-12-11	+639988287273	Del Pilar Street, Barangay 1, Balingasag, Misamis Oriental	\N	2025-09-02 13:22:48.457234	2025-09-18 19:20:41.201981
24	Juvy Randez	Juvy@gmail.com	user123	2003-02-17	+639123123123	Purok 1, Barangay 1, Balingasag, Misamis Oriental	\N	2025-09-18 11:26:07.225064	2025-09-18 11:27:31.601046
25	nazef hawk lague	nasefaquiatan@yahoo.com	user123	\N	+639516569463	\N	\N	2025-09-23 05:31:23.58696	2025-09-23 05:31:23.58696
11	Cyrus Dagoc	Dagoc@gmail.com	user123	2025-08-10	+639111111111	Lopez Jaena Street, Brgy. Casisang, Balingasag, Misamis Oriental	\N	2025-08-07 06:12:06.193467	2025-08-07 06:12:06.193467
10	Pedro Reyes	pedro.reyes@example.com	user123	1995-09-15	+639191234567	Mambayaan, Balingasag, Misamis Oriental	\N	2025-08-05 05:21:36.915511	2025-08-05 05:21:36.915511
8	Juan Dela Cruz	juan.balingasag@example.com	user123	1992-03-10	+639171234567	Poblacion, Balingasag, Misamis Oriental	\N	2025-08-05 05:21:36.915511	2025-08-05 05:21:36.915511
7	juvy Randez	Randez@gmail.com	user123	2025-08-02	+639123213123	Maple St, Barangay 1	\N	2025-08-03 15:37:14.402472	2025-08-03 15:37:14.402472
1	Kennet Quezon	qwe@gmail.com	user123	2025-07-31	+639167163666	Del Pilar Street, Brgy. Cogon, Balingasag, Misamis Oriental	https://res.cloudinary.com/demo/image/upload/v1690000000/profile_default.jpg	2025-07-30 11:21:17.910928	2025-07-30 11:21:17.910928
9	Maria Santos	maria.santos@example.com	user123	1988-06-25	+639181234567	Linggangao, Balingasag, Misamis Oriental	\N	2025-08-05 05:21:36.915511	2025-08-05 05:21:36.915511
6	nazef hawk lague aquiatan	nasefaquiatan@gmail.com	user123	2025-07-20	+639123131231	Barangay 1 Misamis Oriental 1	\N	2025-08-03 10:15:23.854431	2025-08-03 10:15:23.854431
20	asda asda asda	zz@gmail.com	user123	1992-05-07	+639121212121	Burgos Street, Brgy. San Alonzo, Balingasag, Misamis Oriental	\N	2025-08-07 07:05:03.173801	2025-08-07 07:05:03.173801
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admins_id_seq', 8, true);


--
-- Name: barangays_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.barangays_id_seq', 168, true);


--
-- Name: chat_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chat_history_id_seq', 144, true);


--
-- Name: login_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.login_logs_id_seq', 118, true);


--
-- Name: municipalities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.municipalities_id_seq', 7, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 69, true);


--
-- Name: pins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pins_id_seq', 1, false);


--
-- Name: provinces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.provinces_id_seq', 3, true);


--
-- Name: responder_pins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.responder_pins_id_seq', 2, true);


--
-- Name: responders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.responders_id_seq', 4, true);


--
-- Name: streets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.streets_id_seq', 17, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: barangays barangays_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.barangays
    ADD CONSTRAINT barangays_pkey PRIMARY KEY (id);


--
-- Name: chat_history chat_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chat_history
    ADD CONSTRAINT chat_history_pkey PRIMARY KEY (id);


--
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (id);


--
-- Name: municipalities municipalities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.municipalities
    ADD CONSTRAINT municipalities_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pcr_forms pcr_forms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pcr_forms
    ADD CONSTRAINT pcr_forms_pkey PRIMARY KEY (id);


--
-- Name: pins pins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pins
    ADD CONSTRAINT pins_pkey PRIMARY KEY (id);


--
-- Name: provinces provinces_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_name_key UNIQUE (name);


--
-- Name: provinces provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.provinces
    ADD CONSTRAINT provinces_pkey PRIMARY KEY (id);


--
-- Name: responder_pins responder_pins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responder_pins
    ADD CONSTRAINT responder_pins_pkey PRIMARY KEY (id);


--
-- Name: responder_pins responder_pins_responder_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responder_pins
    ADD CONSTRAINT responder_pins_responder_id_key UNIQUE (responder_id);


--
-- Name: responder_sessions responder_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responder_sessions
    ADD CONSTRAINT responder_sessions_pkey PRIMARY KEY (id);


--
-- Name: responders responders_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responders
    ADD CONSTRAINT responders_email_key UNIQUE (email);


--
-- Name: responders responders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responders
    ADD CONSTRAINT responders_pkey PRIMARY KEY (id);


--
-- Name: streets streets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.streets
    ADD CONSTRAINT streets_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist token_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.token_blacklist
    ADD CONSTRAINT token_blacklist_pkey PRIMARY KEY (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_token_blacklist_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_token_blacklist_created_at ON public.token_blacklist USING btree (created_at);


--
-- Name: idx_token_blacklist_expires_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_token_blacklist_expires_at ON public.token_blacklist USING btree (expires_at);


--
-- Name: idx_token_blacklist_responder_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_token_blacklist_responder_id ON public.token_blacklist USING btree (responder_id);


--
-- Name: admin_sessions admin_sessions_admin_email_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_email_fkey FOREIGN KEY (admin_email) REFERENCES public.admins(email) ON DELETE CASCADE;


--
-- Name: alerts alerts_responder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.responders(id) ON DELETE SET NULL;


--
-- Name: alerts alerts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: barangays barangays_municipality_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.barangays
    ADD CONSTRAINT barangays_municipality_id_fkey FOREIGN KEY (municipality_id) REFERENCES public.municipalities(id);


--
-- Name: notifications fk_account_admin; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_account_admin FOREIGN KEY (account_id) REFERENCES public.admins(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: notifications fk_account_responder; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_account_responder FOREIGN KEY (account_id) REFERENCES public.responders(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;


--
-- Name: notifications fk_sender_admin; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_sender_admin FOREIGN KEY (sender_id) REFERENCES public.admins(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- Name: notifications fk_sender_responder; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_sender_responder FOREIGN KEY (sender_id) REFERENCES public.responders(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;


--
-- Name: login_logs login_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: municipalities municipalities_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.municipalities
    ADD CONSTRAINT municipalities_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.provinces(id);


--
-- Name: pins pins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pins
    ADD CONSTRAINT pins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: responder_pins responder_pins_responder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responder_pins
    ADD CONSTRAINT responder_pins_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.responders(id) ON DELETE CASCADE;


--
-- Name: responder_sessions responder_sessions_responder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.responder_sessions
    ADD CONSTRAINT responder_sessions_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.responders(id) ON DELETE CASCADE;


--
-- Name: streets streets_barangay_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.streets
    ADD CONSTRAINT streets_barangay_id_fkey FOREIGN KEY (barangay_id) REFERENCES public.barangays(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

