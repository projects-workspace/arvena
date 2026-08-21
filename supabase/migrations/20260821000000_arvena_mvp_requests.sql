-- Arvena MVP: public Clean Water sourcing requests.
-- Apply only to the dedicated Arvena Supabase project.

create table if not exists public.arvena_mvp_requests (
    id uuid primary key default gen_random_uuid(),
    client_request_id uuid not null unique,
    request_type text not null
        check (request_type = 'water_filter_match'),
    email text not null
        check (
            char_length(email) <= 254
            and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
        ),
    country text not null
        check (char_length(btrim(country)) between 2 and 80),
    concern text not null
        check (
            concern in (
                'taste-odor',
                'lead-metals',
                'microorganisms',
                'broad-unknown',
                'plastic-contact',
                'other'
            )
        ),
    notes text
        check (notes is null or char_length(notes) <= 1000),
    consent boolean not null
        check (consent is true),
    solution_slug text not null
        check (solution_slug = 'clean-water-at-home'),
    product_slug text not null
        check (product_slug = 'certified-point-of-use-filter'),
    source_path text not null
        check (source_path = '#/request'),
    status text not null default 'new'
        check (status in ('new', 'reviewing', 'matched', 'closed')),
    created_at timestamptz not null default now()
);

comment on table public.arvena_mvp_requests is
    'Private requests submitted through the public Arvena Clean Water MVP.';
comment on column public.arvena_mvp_requests.email is
    'Contact address supplied with consent for this request only.';

create index if not exists arvena_mvp_requests_status_created_at_idx
    on public.arvena_mvp_requests (status, created_at desc);

alter table public.arvena_mvp_requests enable row level security;
alter table public.arvena_mvp_requests force row level security;

revoke all on table public.arvena_mvp_requests from anon, authenticated;

-- Explicit column-level INSERT is required. Public users receive no SELECT,
-- UPDATE, or DELETE privilege and no policy for those operations.
grant insert (
    client_request_id,
    request_type,
    email,
    country,
    concern,
    notes,
    consent,
    solution_slug,
    product_slug,
    source_path
) on table public.arvena_mvp_requests to anon;

grant all on table public.arvena_mvp_requests to service_role;

drop policy if exists "anon_can_submit_clean_water_request"
    on public.arvena_mvp_requests;

create policy "anon_can_submit_clean_water_request"
    on public.arvena_mvp_requests
    for insert
    to anon
    with check (
        request_type = 'water_filter_match'
        and char_length(email) <= 254
        and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
        and char_length(btrim(country)) between 2 and 80
        and concern in (
            'taste-odor',
            'lead-metals',
            'microorganisms',
            'broad-unknown',
            'plastic-contact',
            'other'
        )
        and (notes is null or char_length(notes) <= 1000)
        and consent is true
        and solution_slug = 'clean-water-at-home'
        and product_slug = 'certified-point-of-use-filter'
        and source_path = '#/request'
        and status = 'new'
    );
