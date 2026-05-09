ALTER TABLE public.companies
ADD COLUMN status public.contact_status NOT NULL DEFAULT 'new';

CREATE INDEX idx_companies_status ON public.companies(status);