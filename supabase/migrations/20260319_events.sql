-- ─── Events System ────────────────────────────────────────────────────────────
-- Step 1 of the events feature build.
-- Two tables: events + event_bookings
-- Designed for: per-venue events, virtual events, future exhibitions
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── events ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id                    UUID          DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Ownership — explicit, not inferred
  venue_id              UUID          REFERENCES public.listings(id)          ON DELETE SET NULL,
  managed_account_id    UUID          REFERENCES public.managed_accounts(id)  ON DELETE CASCADE,
  owner_id              UUID,         -- user_id of the venue owner / portal user
  created_by            UUID,         -- admin user who created this record (nullable for owner-created)

  -- Identity
  slug                  TEXT          NOT NULL UNIQUE,
  title                 TEXT          NOT NULL,
  subtitle              TEXT,
  event_type            TEXT          NOT NULL DEFAULT 'open_day',
                        -- open_day | private_viewing | wedding_fair | masterclass
                        -- experience | showcase | virtual_tour | exhibition

  -- Status
  status                TEXT          NOT NULL DEFAULT 'draft',
                        -- draft | published | cancelled | past

  -- Dates — kept separate for multi-day events, timezone handling, iCal export
  start_date            DATE          NOT NULL,
  start_time            TIME,
  end_date              DATE,
  end_time              TIME,
  timezone              TEXT          NOT NULL DEFAULT 'Europe/London',

  -- Location
  location_name         TEXT,
  location_address      TEXT,

  -- Booking mode
  booking_mode          TEXT          NOT NULL DEFAULT 'internal',
                        -- internal | external | enquiry_only
  external_booking_url  TEXT,         -- used when booking_mode = 'external'

  -- Capacity
  capacity              INTEGER,      -- NULL = unlimited
  waitlist_enabled      BOOLEAN       DEFAULT FALSE,

  -- Virtual event fields
  is_virtual            BOOLEAN       DEFAULT FALSE,
  virtual_platform      TEXT,         -- youtube_live | zoom | streamyard | custom
  stream_url            TEXT,         -- live embed URL
  replay_url            TEXT,         -- post-event recording URL

  -- Future: exhibitions
  is_exhibition         BOOLEAN       DEFAULT FALSE,
  exhibition_id         UUID,         -- FK to future exhibitions table

  -- Content
  description           TEXT,
  cover_image_url       TEXT,
  gallery_urls          JSONB         DEFAULT '[]',
  tags_json             JSONB         DEFAULT '[]',
  meta_json             JSONB         DEFAULT '{}', -- catch-all for extensions

  -- Timestamps
  created_at            TIMESTAMPTZ   DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS events_venue_id_idx            ON public.events (venue_id);
CREATE INDEX IF NOT EXISTS events_managed_account_id_idx  ON public.events (managed_account_id);
CREATE INDEX IF NOT EXISTS events_owner_id_idx            ON public.events (owner_id);
CREATE INDEX IF NOT EXISTS events_status_idx              ON public.events (status);
CREATE INDEX IF NOT EXISTS events_start_date_idx          ON public.events (start_date);
CREATE INDEX IF NOT EXISTS events_slug_idx                ON public.events (slug);
CREATE INDEX IF NOT EXISTS events_event_type_idx          ON public.events (event_type);

-- ─── event_bookings ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_bookings (
  id                      UUID          DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relationships — explicit for reporting
  event_id                UUID          NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  venue_id                UUID          REFERENCES public.listings(id)        ON DELETE SET NULL,
  lead_id                 UUID          REFERENCES public.leads(id)           ON DELETE SET NULL,

  -- Attendee details
  first_name              TEXT          NOT NULL,
  last_name               TEXT          NOT NULL,
  email                   TEXT          NOT NULL,
  phone                   TEXT,
  guest_count             INTEGER       NOT NULL DEFAULT 1,
  message                 TEXT,

  -- Booking state
  status                  TEXT          NOT NULL DEFAULT 'pending',
                          -- pending | confirmed | cancelled | waitlist
  booking_ref             TEXT          UNIQUE,   -- auto-generated short code e.g. EVT-4829

  -- Lifecycle timestamps — clean reporting, not inferred from status
  confirmed_at            TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  confirmation_sent_at    TIMESTAMPTZ,

  -- Consent
  consent_marketing       BOOLEAN       DEFAULT FALSE,
  consent_data_processing BOOLEAN       DEFAULT TRUE,

  -- Timestamps
  created_at              TIMESTAMPTZ   DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS event_bookings_event_id_idx    ON public.event_bookings (event_id);
CREATE INDEX IF NOT EXISTS event_bookings_venue_id_idx    ON public.event_bookings (venue_id);
CREATE INDEX IF NOT EXISTS event_bookings_lead_id_idx     ON public.event_bookings (lead_id);
CREATE INDEX IF NOT EXISTS event_bookings_email_idx       ON public.event_bookings (email);
CREATE INDEX IF NOT EXISTS event_bookings_status_idx      ON public.event_bookings (status);
CREATE INDEX IF NOT EXISTS event_bookings_created_at_idx  ON public.event_bookings (created_at DESC);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_updated_at       ON public.events;
DROP TRIGGER IF EXISTS event_bookings_updated_at ON public.event_bookings;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER event_bookings_updated_at
  BEFORE UPDATE ON public.event_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

-- events: anon can SELECT published events only
--         all writes go through admin edge function (service_role bypasses RLS)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_anon_select_published" ON public.events;
CREATE POLICY "events_anon_select_published"
  ON public.events
  FOR SELECT TO anon
  USING (status = 'published');

-- event_bookings: anon can INSERT (booking form)
--                reads go through admin-events edge function (service_role)
ALTER TABLE public.event_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_bookings_anon_insert" ON public.event_bookings;
CREATE POLICY "event_bookings_anon_insert"
  ON public.event_bookings
  FOR INSERT TO anon
  WITH CHECK (true);

-- ─── booking_ref generator ───────────────────────────────────────────────────
-- Auto-generates a short human-readable booking reference on INSERT
-- Format: EVT-XXXX (4 uppercase alphanumeric chars)

CREATE OR REPLACE FUNCTION public.generate_booking_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  ref TEXT;
  attempts INT := 0;
BEGIN
  IF NEW.booking_ref IS NULL THEN
    LOOP
      ref := 'EVT-' || upper(substring(md5(random()::text) FROM 1 FOR 4));
      BEGIN
        NEW.booking_ref := ref;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        attempts := attempts + 1;
        IF attempts > 10 THEN
          NEW.booking_ref := 'EVT-' || upper(substring(md5(gen_random_uuid()::text) FROM 1 FOR 6));
          EXIT;
        END IF;
      END;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS event_bookings_booking_ref ON public.event_bookings;
CREATE TRIGGER event_bookings_booking_ref
  BEFORE INSERT ON public.event_bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_booking_ref();
