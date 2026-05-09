CREATE TYPE public.contact_status AS ENUM ('new', 'lead', 'customer', 'spam', 'archived');

ALTER TABLE public.contacts
ADD COLUMN status public.contact_status NOT NULL DEFAULT 'new';

CREATE INDEX idx_contacts_status ON public.contacts(status);