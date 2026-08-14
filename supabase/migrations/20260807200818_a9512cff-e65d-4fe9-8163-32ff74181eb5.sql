-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('farmer','driver','fleet','admin');
CREATE TYPE public.kyc_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.shipment_status AS ENUM ('PENDING_POOL','POOLED','SOLO_CONFIRMED','ASSIGNED','IN_TRANSIT','DELIVERED','CANCELLED');
CREATE TYPE public.trip_status AS ENUM ('PLANNED','ACTIVE','COMPLETED','CANCELLED');

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.haversine_km(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT 6371.0 * 2 * asin(sqrt(
    power(sin(radians(lat2-lat1)/2),2) +
    cos(radians(lat1))*cos(radians(lat2))*power(sin(radians(lon2-lon1)/2),2)
  ));
$$;

-- ============ PROFILES / ROLES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  language text NOT NULL DEFAULT 'mr',
  village text,
  dpdp_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, language, village)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'language','mr'),
    NEW.raw_user_meta_data->>'village')
  ON CONFLICT (id) DO NOTHING;
  BEGIN
    r := COALESCE(NEW.raw_user_meta_data->>'role','farmer')::public.app_role;
  EXCEPTION WHEN others THEN r := 'farmer'; END;
  IF r = 'admin' THEN r := 'farmer'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REFERENCE DATA ============
CREATE TABLE public.villages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  taluka text NOT NULL,
  district text NOT NULL DEFAULT 'Ahmednagar',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  unpaved_access boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.villages TO anon, authenticated;
GRANT ALL ON public.villages TO service_role;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "villages_public_read" ON public.villages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "villages_admin_write" ON public.villages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.mandis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  taluka text NOT NULL,
  district text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  avg_gate_queue_minutes integer NOT NULL DEFAULT 45,
  peak_hours text NOT NULL DEFAULT '09:00-12:00',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mandis TO anon, authenticated;
GRANT ALL ON public.mandis TO service_role;
ALTER TABLE public.mandis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mandis_public_read" ON public.mandis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mandis_admin_write" ON public.mandis FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.crops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_mr text NOT NULL,
  name_hi text NOT NULL,
  spoilage_hours integer NOT NULL DEFAULT 72,
  crate_kg numeric NOT NULL DEFAULT 25,
  perishable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crops TO anon, authenticated;
GRANT ALL ON public.crops TO service_role;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crops_public_read" ON public.crops FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "crops_admin_write" ON public.crops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.mandi_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandi_id uuid NOT NULL REFERENCES public.mandis(id) ON DELETE CASCADE,
  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  price_per_kg numeric NOT NULL,
  source text NOT NULL DEFAULT 'agmarknet',
  overridden_by uuid,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mandi_id, crop_id)
);
GRANT SELECT ON public.mandi_prices TO anon, authenticated;
GRANT ALL ON public.mandi_prices TO service_role;
ALTER TABLE public.mandi_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mandi_prices_public_read" ON public.mandi_prices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mandi_prices_admin_write" ON public.mandi_prices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_mandi_prices_updated BEFORE UPDATE ON public.mandi_prices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.vehicle_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  payload_kg numeric NOT NULL,
  mileage_kmpl numeric NOT NULL,
  base_cost_per_km numeric NOT NULL,
  toll_allowance_per_km numeric NOT NULL DEFAULT 1.2,
  fuel text NOT NULL DEFAULT 'diesel',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_types TO anon, authenticated;
GRANT ALL ON public.vehicle_types TO service_role;
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicle_types_public_read" ON public.vehicle_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vehicle_types_admin_write" ON public.vehicle_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.commission_config (
  id integer PRIMARY KEY DEFAULT 1,
  rate_percent numeric NOT NULL DEFAULT 3.0,
  diesel_price numeric NOT NULL DEFAULT 99.07,
  petrol_price numeric NOT NULL DEFAULT 112.44,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commission_singleton CHECK (id = 1),
  CONSTRAINT commission_range CHECK (rate_percent >= 3.0 AND rate_percent <= 5.0)
);
GRANT SELECT ON public.commission_config TO anon, authenticated;
GRANT ALL ON public.commission_config TO service_role;
ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_public_read" ON public.commission_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "commission_admin_write" ON public.commission_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ FLEET COMPANIES ============
CREATE TABLE public.fleet_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  tax_id text NOT NULL,
  contact_phone text,
  base_taluka text,
  geofence_radius_km numeric NOT NULL DEFAULT 60,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.fleet_companies TO authenticated;
GRANT ALL ON public.fleet_companies TO service_role;
ALTER TABLE public.fleet_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fleet_companies_read" ON public.fleet_companies FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR status = 'approved');
CREATE POLICY "fleet_companies_insert" ON public.fleet_companies FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "fleet_companies_update" ON public.fleet_companies FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_fleet_companies_updated BEFORE UPDATE ON public.fleet_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DRIVERS ============
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.fleet_companies(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  license_number text,
  home_lat double precision NOT NULL DEFAULT 19.8833,
  home_lng double precision NOT NULL DEFAULT 74.4778,
  radius_km integer NOT NULL DEFAULT 15,
  night_mode boolean NOT NULL DEFAULT false,
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  hours_today numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers_read" ON public.drivers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()));
CREATE POLICY "drivers_insert" ON public.drivers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()));
CREATE POLICY "drivers_update" ON public.drivers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()));
CREATE TRIGGER trg_drivers_updated BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.driver_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  storage_path text NOT NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.driver_kyc TO authenticated;
GRANT ALL ON public.driver_kyc TO service_role;
ALTER TABLE public.driver_kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "driver_kyc_read" ON public.driver_kyc FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "driver_kyc_insert" ON public.driver_kyc FOR INSERT TO authenticated
  WITH CHECK (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "driver_kyc_update" ON public.driver_kyc FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ VEHICLES ============
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.fleet_companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_type_id uuid NOT NULL REFERENCES public.vehicle_types(id),
  registration text NOT NULL,
  odometer_km numeric NOT NULL DEFAULT 0,
  observed_kmpl numeric,
  axle_health text NOT NULL DEFAULT 'good',
  last_service_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_read" ON public.vehicles FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "vehicles_write" ON public.vehicles FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()));
CREATE TRIGGER trg_vehicles_updated BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.maintenance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  note text NOT NULL,
  odometer_km numeric,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.maintenance_logs TO authenticated;
GRANT ALL ON public.maintenance_logs TO service_role;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maintenance_read" ON public.maintenance_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR vehicle_id IN (
    SELECT v.id FROM public.vehicles v LEFT JOIN public.fleet_companies c ON c.id = v.company_id
    WHERE v.owner_id = auth.uid() OR c.owner_id = auth.uid()));
CREATE POLICY "maintenance_insert" ON public.maintenance_logs FOR INSERT TO authenticated
  WITH CHECK (vehicle_id IN (
    SELECT v.id FROM public.vehicles v LEFT JOIN public.fleet_companies c ON c.id = v.company_id
    WHERE v.owner_id = auth.uid() OR c.owner_id = auth.uid()));

-- ============ POOLS / SHIPMENTS / TRIPS ============
CREATE TABLE public.pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id uuid REFERENCES public.crops(id),
  mandi_id uuid REFERENCES public.mandis(id),
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  total_weight_kg numeric NOT NULL DEFAULT 0,
  total_freight numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN',
  closes_at timestamptz NOT NULL DEFAULT now() + interval '6 hours',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pools TO authenticated;
GRANT ALL ON public.pools TO service_role;
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pools_read" ON public.pools FOR SELECT TO authenticated USING (true);
CREATE POLICY "pools_write" ON public.pools FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.shipment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id uuid NOT NULL REFERENCES public.crops(id),
  mandi_id uuid NOT NULL REFERENCES public.mandis(id),
  pool_id uuid REFERENCES public.pools(id) ON DELETE SET NULL,
  village_name text NOT NULL,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0),
  distance_km numeric NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'POOLED',
  gross_payout numeric NOT NULL DEFAULT 0,
  freight_share numeric NOT NULL DEFAULT 0,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_payout numeric NOT NULL DEFAULT 0,
  emergency boolean NOT NULL DEFAULT false,
  status public.shipment_status NOT NULL DEFAULT 'PENDING_POOL',
  spoilage_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shipment_geo ON public.shipment_requests (pickup_lat, pickup_lng);
CREATE INDEX idx_shipment_status ON public.shipment_requests (status);
GRANT SELECT, INSERT, UPDATE ON public.shipment_requests TO authenticated;
GRANT ALL ON public.shipment_requests TO service_role;
ALTER TABLE public.shipment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipments_read" ON public.shipment_requests FOR SELECT TO authenticated
  USING (farmer_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet'));
CREATE POLICY "shipments_insert_own" ON public.shipment_requests FOR INSERT TO authenticated
  WITH CHECK (farmer_id = auth.uid());
CREATE POLICY "shipments_update" ON public.shipment_requests FOR UPDATE TO authenticated
  USING (farmer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet'))
  WITH CHECK (farmer_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet'));
CREATE TRIGGER trg_shipments_updated BEFORE UPDATE ON public.shipment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.fleet_companies(id) ON DELETE SET NULL,
  pool_id uuid REFERENCES public.pools(id) ON DELETE SET NULL,
  mandi_id uuid REFERENCES public.mandis(id),
  status public.trip_status NOT NULL DEFAULT 'PLANNED',
  total_distance_km numeric NOT NULL DEFAULT 0,
  total_weight_kg numeric NOT NULL DEFAULT 0,
  gross_freight numeric NOT NULL DEFAULT 0,
  diesel_cost numeric NOT NULL DEFAULT 0,
  toll_cost numeric NOT NULL DEFAULT 0,
  driver_net numeric NOT NULL DEFAULT 0,
  router_tier text NOT NULL DEFAULT 'haversine',
  proof_photo_path text,
  proof_lat double precision,
  proof_lng double precision,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trips_read" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "trips_insert" ON public.trips FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "trips_update" ON public.trips FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet') OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_trips_updated BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.trip_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  shipment_id uuid REFERENCES public.shipment_requests(id) ON DELETE SET NULL,
  sequence integer NOT NULL,
  label text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  leg_km numeric NOT NULL DEFAULT 0,
  unpaved boolean NOT NULL DEFAULT false,
  arrived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_stops TO authenticated;
GRANT ALL ON public.trip_stops TO service_role;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trip_stops_read" ON public.trip_stops FOR SELECT TO authenticated USING (true);
CREATE POLICY "trip_stops_write" ON public.trip_stops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'fleet') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.handover_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipment_requests(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  scanned_at timestamptz,
  scanned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.handover_tokens TO authenticated;
GRANT ALL ON public.handover_tokens TO service_role;
ALTER TABLE public.handover_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "handover_read" ON public.handover_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'driver')
    OR shipment_id IN (SELECT id FROM public.shipment_requests WHERE farmer_id = auth.uid()));
CREATE POLICY "handover_insert" ON public.handover_tokens FOR INSERT TO authenticated
  WITH CHECK (shipment_id IN (SELECT id FROM public.shipment_requests WHERE farmer_id = auth.uid()));
CREATE POLICY "handover_update" ON public.handover_tokens FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'driver') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.fleet_companies(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  gross_amount numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_read" ON public.payouts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin')
    OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "payouts_write" ON public.payouts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR company_id IN (SELECT id FROM public.fleet_companies WHERE owner_id = auth.uid()));

CREATE TABLE public.consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consents TO authenticated;
GRANT ALL ON public.consents TO service_role;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consents_own" ON public.consents FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_read_admin" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR actor_id = auth.uid());
CREATE POLICY "audit_insert" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE TABLE public.api_fallback_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier text NOT NULL,
  outcome text NOT NULL,
  latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.api_fallback_stats TO authenticated;
GRANT ALL ON public.api_fallback_stats TO service_role;
ALTER TABLE public.api_fallback_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fallback_read" ON public.api_fallback_stats FOR SELECT TO authenticated USING (true);
CREATE POLICY "fallback_insert" ON public.api_fallback_stats FOR INSERT TO authenticated WITH CHECK (true);