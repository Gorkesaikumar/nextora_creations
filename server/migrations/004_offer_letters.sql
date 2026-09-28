CREATE TABLE nc.offer_letters (
 id uuid PRIMARY KEY,
 offer_number text NOT NULL UNIQUE,
 internship_id uuid NOT NULL UNIQUE REFERENCES nc.internships(id),
 snapshot jsonb NOT NULL,
 verification_url text NOT NULL,
 issued_at timestamptz NOT NULL,
 issued_by uuid NOT NULL REFERENCES nc.users(id),
 pdf bytea NOT NULL,
 sha256 text NOT NULL,
 status text NOT NULL DEFAULT 'VALID' CHECK(status IN ('VALID','REVOKED')),
 revoked_at timestamptz,
 revoked_by uuid REFERENCES nc.users(id),
 revocation_reason text,
 CHECK((status='VALID' AND revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
 OR (status='REVOKED' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND length(revocation_reason)>0))
);
CREATE FUNCTION nc.guard_offer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Offers cannot be deleted'; END IF;
 IF OLD.status='REVOKED' OR (to_jsonb(NEW)-ARRAY['status','revoked_at','revoked_by','revocation_reason'])
 IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','revoked_at','revoked_by','revocation_reason'])
 THEN RAISE EXCEPTION 'Offer history is immutable'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER offer_history BEFORE UPDATE OR DELETE ON nc.offer_letters FOR EACH ROW EXECUTE FUNCTION nc.guard_offer();
