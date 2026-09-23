begin;
-- Additive marketplace infrastructure. Does not touch sourcing requests.
-- Internal dossiers never share a public row with approved publication copy.
create schema if not exists arvena_private;
revoke all on schema arvena_private from public;
grant usage on schema arvena_private to authenticated, anon;

create table public.arvena_editors (
 user_id uuid primary key references auth.users(id) on delete cascade,
 granted_at timestamptz not null default now()
);
alter table public.arvena_editors enable row level security;
alter table public.arvena_editors force row level security;
revoke all on public.arvena_editors from anon, authenticated;
grant select on public.arvena_editors to authenticated;
create policy editor_self on public.arvena_editors for select to authenticated using (user_id = (select auth.uid()));
-- Initial editors are assigned by a trusted database operator, never registration.
create function arvena_private.is_editor() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.arvena_editors where user_id=auth.uid());
$$;
revoke all on function arvena_private.is_editor() from public;
grant execute on function arvena_private.is_editor() to authenticated;

create table public.arvena_domains (slug text primary key, title text not null);
create table public.arvena_solution_classes (
 slug text primary key check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 domain_slug text not null references public.arvena_domains, title text not null, need text not null
);
create table public.arvena_providers (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name text not null check(length(name) between 1 and 180), summary text not null default '',
 website text check(website is null or website ~ '^https://[^[:space:]]+$'),
 relationship text not null default 'Independent listing; no commercial relationship declared.',
 status text not null default 'draft' check(status in ('draft','published','hidden'))
);
create table public.arvena_offers (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text not null, domain_slug text not null references public.arvena_domains,
 solution_class_slug text references public.arvena_solution_classes,
 offer_type text not null, provider_id uuid not null references public.arvena_providers,
 publication jsonb not null check(jsonb_typeof(publication)='object'),
 status text not null default 'hidden' check(status in ('published','hidden')),
 published_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.arvena_research_packages (
 id uuid primary key default gen_random_uuid(), offer_id uuid references public.arvena_offers,
 title text not null check(length(title) between 1 and 180),
 dossier text not null default '' check(length(dossier)<=100000),
 public_copy jsonb not null default '{}' check(jsonb_typeof(public_copy)='object'),
 status text not null default 'draft' check(status in ('draft','under_review','approved','published','rejected')),
 revision integer not null default 1, reviewed_by uuid references auth.users, reviewed_at timestamptz,
 review_note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.arvena_profiles (
 user_id uuid primary key default auth.uid() references auth.users on delete cascade,
 region text not null default '' check(length(region)<=100), updated_at timestamptz not null default now()
);
create table public.arvena_interests (
 user_id uuid not null default auth.uid() references auth.users on delete cascade,
 domain_slug text not null references public.arvena_domains, primary key(user_id,domain_slug)
);
create table public.arvena_saved_offers (
 user_id uuid not null default auth.uid() references auth.users on delete cascade,
 offer_id uuid not null references public.arvena_offers on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,offer_id)
);
create table public.arvena_provider_members (
 user_id uuid not null references auth.users on delete cascade,
 provider_id uuid not null references public.arvena_providers on delete cascade,
 primary key(user_id,provider_id)
);
create table public.arvena_contribution_permissions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 offer_id uuid references public.arvena_offers on delete cascade,
 domain_slug text references public.arvena_domains,
 capability text not null check(capability in ('contributor','specialist')),
 check(num_nonnulls(offer_id,domain_slug)=1),
 unique nulls not distinct(user_id,offer_id,domain_slug,capability)
);
create table public.arvena_contributions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 offer_id uuid not null references public.arvena_offers,
 kind text not null check(kind in ('question','practical_observation','provider_statement','specialist_explanation','editorial_response','user_experience')),
 body text not null check(length(body) between 10 and 5000),
 status text not null default 'submitted' check(status in ('submitted','under_review','published','rejected','hidden')),
 public_body text, created_at timestamptz not null default now(), moderated_at timestamptz
);
-- Public discussion is a separate projection: no account IDs or private submissions.
create table public.arvena_public_contributions (
 id uuid primary key references public.arvena_contributions on delete cascade,
 offer_id uuid not null references public.arvena_offers, kind text not null, body text not null,
 published_at timestamptz not null default now()
);
create table public.arvena_corrections (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 offer_id uuid not null references public.arvena_offers,
 body text not null check(length(body) between 10 and 10000),
 documentation_url text check(documentation_url is null or documentation_url ~ '^https://[^[:space:]]+$'),
 status text not null default 'submitted' check(status in ('submitted','under_review','resolved','rejected')),
 editorial_note text not null default '', created_at timestamptz not null default now()
);
create table public.arvena_listing_metrics (
 offer_id uuid not null references public.arvena_offers on delete cascade,
 day date not null default current_date, views bigint not null default 0, outbound_clicks bigint not null default 0,
 primary key(offer_id,day)
);
create table arvena_private.event_windows (
 offer_id uuid not null references public.arvena_offers on delete cascade,
 event_kind text not null, fingerprint text not null, bucket bigint not null,
 primary key(offer_id,event_kind,fingerprint,bucket)
);
alter table arvena_private.event_windows enable row level security;
revoke all on arvena_private.event_windows from public,anon,authenticated;
create index on public.arvena_offers(provider_id);
create index on public.arvena_offers(domain_slug);
create index on public.arvena_offers(solution_class_slug);
create index on public.arvena_provider_members(provider_id);
create index on public.arvena_saved_offers(offer_id);
create index on public.arvena_contribution_permissions(user_id);
create index on public.arvena_contributions(offer_id);
create index on public.arvena_contributions(user_id);
create index on public.arvena_corrections(offer_id);
create index on public.arvena_corrections(user_id);

create function arvena_private.represents(p_provider uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.arvena_provider_members where user_id=auth.uid() and provider_id=p_provider);
$$;
create function arvena_private.can_contribute(p_offer uuid,p_kind text) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.arvena_offers o where o.id=p_offer and o.status='published' and (
 arvena_private.is_editor() or
 (arvena_private.represents(o.provider_id) and p_kind in ('question','provider_statement')) or
 exists(select 1 from public.arvena_contribution_permissions p where p.user_id=auth.uid()
 and (p.offer_id=o.id or p.domain_slug=o.domain_slug)
 and (p_kind in ('question','practical_observation','user_experience') or (p.capability='specialist' and p_kind='specialist_explanation')))));
$$;
revoke all on function arvena_private.represents(uuid), arvena_private.can_contribute(uuid,text) from public;
grant execute on function arvena_private.represents(uuid), arvena_private.can_contribute(uuid,text) to authenticated;

-- Explicit grants: default platform grants are not an authorization model.
do $$ declare t text; begin
 foreach t in array array['domains','solution_classes','providers','offers','research_packages','profiles','interests','saved_offers','provider_members','contribution_permissions','contributions','public_contributions','corrections','listing_metrics'] loop
 execute format('alter table public.arvena_%I enable row level security',t);
 execute format('alter table public.arvena_%I force row level security',t);
 execute format('revoke all on public.arvena_%I from anon, authenticated',t);
 end loop;
end $$;
grant select on public.arvena_domains,public.arvena_solution_classes,public.arvena_providers,public.arvena_offers,public.arvena_public_contributions to anon,authenticated;
grant select,insert,update,delete on public.arvena_profiles,public.arvena_interests,public.arvena_saved_offers to authenticated;
grant select on public.arvena_research_packages,public.arvena_contributions,public.arvena_corrections,public.arvena_listing_metrics to authenticated;
grant insert on public.arvena_contributions,public.arvena_corrections to authenticated;
grant select,insert,update,delete on public.arvena_provider_members,public.arvena_contribution_permissions,public.arvena_providers,public.arvena_solution_classes to authenticated;
create policy domains_read on public.arvena_domains for select to anon,authenticated using(true);
create policy classes_read on public.arvena_solution_classes for select to anon,authenticated using(true);
create policy classes_editor on public.arvena_solution_classes for all to authenticated using(arvena_private.is_editor()) with check(arvena_private.is_editor());
create policy provider_public on public.arvena_providers for select to anon using(status='published');
create policy provider_read on public.arvena_providers for select to authenticated using(status='published' or arvena_private.is_editor() or arvena_private.represents(id));
create policy provider_editor on public.arvena_providers for all to authenticated using(arvena_private.is_editor()) with check(arvena_private.is_editor());
create policy offers_public on public.arvena_offers for select to anon using(status='published');
create policy offers_read on public.arvena_offers for select to authenticated using(status='published' or arvena_private.is_editor());
create policy packages_editor on public.arvena_research_packages for select to authenticated using(arvena_private.is_editor());
create policy profiles_owner on public.arvena_profiles for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy interests_owner on public.arvena_interests for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy saves_read on public.arvena_saved_offers for select to authenticated using(user_id=(select auth.uid()));
create policy saves_delete on public.arvena_saved_offers for delete to authenticated using(user_id=(select auth.uid()));
create policy saves_insert on public.arvena_saved_offers for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.arvena_offers where id=offer_id and status='published'));
create policy members_read on public.arvena_provider_members for select to authenticated using(user_id=(select auth.uid()) or arvena_private.is_editor());
create policy members_editor on public.arvena_provider_members for all to authenticated using(arvena_private.is_editor()) with check(arvena_private.is_editor());
create policy permissions_read on public.arvena_contribution_permissions for select to authenticated using(user_id=(select auth.uid()) or arvena_private.is_editor());
create policy permissions_editor on public.arvena_contribution_permissions for all to authenticated using(arvena_private.is_editor()) with check(arvena_private.is_editor());
create policy contributions_read on public.arvena_contributions for select to authenticated using(user_id=(select auth.uid()) or arvena_private.is_editor());
create policy contributions_insert on public.arvena_contributions for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and public_body is null and moderated_at is null and arvena_private.can_contribute(offer_id,kind));
create policy discussion_read on public.arvena_public_contributions for select to anon,authenticated using(exists(select 1 from public.arvena_offers where id=offer_id and status='published'));
create policy corrections_read on public.arvena_corrections for select to authenticated using(arvena_private.is_editor() or (user_id=(select auth.uid()) and exists(select 1 from public.arvena_offers o where o.id=offer_id and arvena_private.represents(o.provider_id))));
create policy corrections_insert on public.arvena_corrections for insert to authenticated with check(user_id=(select auth.uid()) and status='submitted' and editorial_note='' and exists(select 1 from public.arvena_offers o where o.id=offer_id and o.status='published' and arvena_private.represents(o.provider_id)));
create policy metrics_read on public.arvena_listing_metrics for select to authenticated using(arvena_private.is_editor() or exists(select 1 from public.arvena_offers o where o.id=offer_id and arvena_private.represents(o.provider_id)));

-- Immutable editorial decisions retain who approved which public revision.
create table public.arvena_editorial_events (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users on delete set null,
 action text not null, entity_id uuid, revision integer,
 public_snapshot jsonb, note text not null default '', recorded_at timestamptz not null default now()
);
alter table public.arvena_editorial_events enable row level security;
alter table public.arvena_editorial_events force row level security;
revoke all on public.arvena_editorial_events from anon,authenticated;
grant select on public.arvena_editorial_events to authenticated;
create policy events_editor_read on public.arvena_editorial_events for select to authenticated using(arvena_private.is_editor());

-- One bounded editorial command endpoint. Every command checks current membership.
create function arvena_private.editor_command(command text, payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.arvena_research_packages; c jsonb; oid uuid; rid uuid; st text; item public.arvena_contributions;
begin
 if not arvena_private.is_editor() then raise exception 'Editorial permission required' using errcode='42501'; end if;
 if command='save_package' then
  if coalesce(payload->>'title','')='' then raise exception 'Package title required'; end if;
  if nullif(payload->>'id','') is null then
   insert into public.arvena_research_packages(title,dossier,public_copy) values(payload->>'title',coalesce(payload->>'dossier',''),coalesce(payload->'public_copy','{}')) returning id into rid;
  else
   select * into strict p from public.arvena_research_packages where id=(payload->>'id')::uuid for update;
   if p.revision is distinct from (payload->>'revision')::integer then raise exception 'Package changed. Reload before saving.'; end if;
   update public.arvena_research_packages set title=payload->>'title',dossier=coalesce(payload->>'dossier',''),public_copy=payload->'public_copy',status='draft',revision=revision+1,reviewed_by=null,reviewed_at=null,review_note='',updated_at=now() where id=p.id returning id into rid;
  end if;
 elsif command='review_package' then
  select * into strict p from public.arvena_research_packages where id=(payload->>'id')::uuid for update;
  if p.revision is distinct from (payload->>'revision')::integer then raise exception 'Package changed. Reload before review.'; end if;
  st=payload->>'status';
  if not ((p.status in ('draft','rejected') and st='under_review') or (p.status='under_review' and st in ('approved','rejected'))) then raise exception 'Invalid review transition'; end if;
  if st='approved' and length(trim(coalesce(payload->>'note','')))<10 then raise exception 'Record the human editorial approval rationale'; end if;
  update public.arvena_research_packages set status=st,reviewed_by=auth.uid(),reviewed_at=now(),review_note=coalesce(payload->>'note',''),updated_at=now() where id=p.id;
  rid=p.id;
 elsif command='publish_package' then
  select * into strict p from public.arvena_research_packages where id=(payload->>'id')::uuid for update;
  if p.status<>'approved' or p.reviewed_by is null or p.revision is distinct from (payload->>'revision')::integer then raise exception 'Current human-approved revision required'; end if;
  c=p.public_copy;
  -- Only named public fields are accepted; private dossier keys cannot leak through.
  if exists(select 1 from jsonb_object_keys(c) k where k not in ('slug','title','provider_id','offer_type','domain_slug','solution_class_slug','need','suitability','selection_rationale','mechanism','specifications','claims','manufacturer_claims','editorial_conclusion','unknowns','strengths','limitations','safety','materials','environment','lifetime','maintenance','alternatives','geography','price','access_url','implementation','commercial_disclosure','last_review_date','media','media_rights')) then raise exception 'Unrecognized public field'; end if;
  if exists(select 1 from unnest(array['slug','title','provider_id','offer_type','domain_slug','need','selection_rationale','editorial_conclusion','unknowns','limitations','safety','price','commercial_disclosure','last_review_date']) k where coalesce(trim(c->>k),'')='') then raise exception 'Required publication information missing (use explicit unknowns where appropriate)'; end if;
  if c->>'offer_type' not in ('product','handmade','technology','service','installed-product','building','integrated-system','turnkey') then raise exception 'Invalid offer type'; end if;
  if (c->>'last_review_date')::date>current_date then raise exception 'Review date is in the future'; end if;
  if nullif(c->>'access_url','') is not null and c->>'access_url' !~ '^https://[^[:space:]]+$' then raise exception 'Access URL must use HTTPS'; end if;
  if not exists(select 1 from public.arvena_providers where id=(c->>'provider_id')::uuid and status='published') then raise exception 'Published provider required'; end if;
  if nullif(c->>'solution_class_slug','') is not null and not exists(select 1 from public.arvena_solution_classes where slug=c->>'solution_class_slug' and domain_slug=c->>'domain_slug') then raise exception 'Solution class/domain mismatch'; end if;
  if coalesce(jsonb_typeof(c->'claims'),'null') <> 'array' then raise exception 'Claims must be an array; use an empty array when no claims are made'; end if;
  if exists(select 1 from jsonb_array_elements(c->'claims') a where jsonb_typeof(a)<>'object' or exists(select 1 from unnest(array['claim','source','source_type','conditions','checked_on','limitations','editorial_conclusion']) k where coalesce(trim(a->>k),'')='') or a->>'source' !~ '^https://[^[:space:]]+$') then raise exception 'Claim-level source, type, conditions, checked date, limits and conclusion required'; end if;
  if exists(select 1 from jsonb_array_elements(c->'claims') a where (a->>'checked_on')::date>current_date) then raise exception 'Claim check date is in the future'; end if;
  if nullif(c->>'media','') is not null and (coalesce(c->>'media_rights','')='' or c->>'media' !~ '^/assets/[a-zA-Z0-9._-]+$') then raise exception 'Local approved media and rights basis required'; end if;
  if p.offer_id is null then
   insert into public.arvena_offers(slug,title,domain_slug,solution_class_slug,offer_type,provider_id,publication,status) values(c->>'slug',c->>'title',c->>'domain_slug',nullif(c->>'solution_class_slug',''),c->>'offer_type',(c->>'provider_id')::uuid,c,'published') returning id into oid;
  else
   oid=p.offer_id;
   update public.arvena_offers set slug=c->>'slug',title=c->>'title',domain_slug=c->>'domain_slug',solution_class_slug=nullif(c->>'solution_class_slug',''),offer_type=c->>'offer_type',provider_id=(c->>'provider_id')::uuid,publication=c,status='published',updated_at=now() where id=oid;
  end if;
  update public.arvena_research_packages set offer_id=oid,status='published',updated_at=now() where id=p.id;
  rid=oid;
 elsif command='hide_offer' then
  update public.arvena_offers set status='hidden',updated_at=now() where id=(payload->>'id')::uuid returning id into rid;
 elsif command='moderate' then
  select * into strict item from public.arvena_contributions where id=(payload->>'id')::uuid for update;
  st=payload->>'status';
  if not ((item.status='submitted' and st in ('under_review','rejected')) or (item.status='under_review' and st in ('published','rejected')) or (item.status='published' and st='hidden') or (item.status='hidden' and st='under_review')) then raise exception 'Invalid moderation transition'; end if;
  if st='published' and length(trim(coalesce(payload->>'body',item.body))) not between 10 and 5000 then raise exception 'Invalid public text'; end if;
  update public.arvena_contributions set status=st,public_body=case when st='published' then coalesce(payload->>'body',body) else public_body end,moderated_at=now() where id=item.id;
  if st='published' then
   insert into public.arvena_public_contributions(id,offer_id,kind,body) values(item.id,item.offer_id,item.kind,coalesce(payload->>'body',item.body)) on conflict(id) do update set body=excluded.body,published_at=now();
  else delete from public.arvena_public_contributions where id=item.id; end if;
  rid=item.id;
 elsif command='review_correction' then
  st=payload->>'status';
  if st not in ('under_review','resolved','rejected') then raise exception 'Invalid correction status'; end if;
  update public.arvena_corrections set status=st,editorial_note=coalesce(payload->>'note','') where id=(payload->>'id')::uuid returning id into rid;
 else raise exception 'Unknown editorial command'; end if;
 insert into public.arvena_editorial_events(actor_id,action,entity_id,revision,public_snapshot,note) values(auth.uid(),command,rid,case when command='save_package' then coalesce(p.revision,0)+1 else p.revision end,case when command='publish_package' then c else null end,coalesce(payload->>'note',''));
 return jsonb_build_object('id',rid);
end $$;
revoke all on function arvena_private.editor_command(text,jsonb) from public;
grant execute on function arvena_private.editor_command(text,jsonb) to authenticated;
create function public.arvena_editor_command(command text,payload jsonb) returns jsonb language sql security invoker set search_path='' as $$ select arvena_private.editor_command(command,payload); $$;
revoke all on function public.arvena_editor_command(text,jsonb) from public,anon;
grant execute on function public.arvena_editor_command(text,jsonb) to authenticated;

create function arvena_private.record_event(p_offer uuid,p_kind text,p_session uuid) returns void language plpgsql security definer set search_path='' as $$
declare added integer;
begin
 if p_kind not in ('view','outbound') or p_session is null then raise exception 'Invalid event'; end if;
 if not exists(select 1 from public.arvena_offers where id=p_offer and status='published' and (p_kind='view' or nullif(publication->>'access_url','') is not null)) then return; end if;
 if auth.uid() is not null and (arvena_private.is_editor() or exists(select 1 from public.arvena_offers where id=p_offer and arvena_private.represents(provider_id))) then return; end if;
 insert into arvena_private.event_windows values(p_offer,p_kind,md5(p_session::text || current_date::text),floor(extract(epoch from now())/1800)) on conflict do nothing;
 get diagnostics added=row_count;
 if added=1 then
  insert into public.arvena_listing_metrics(offer_id,views,outbound_clicks) values(p_offer,(p_kind='view')::integer,(p_kind='outbound')::integer) on conflict(offer_id,day) do update set views=arvena_listing_metrics.views+excluded.views,outbound_clicks=arvena_listing_metrics.outbound_clicks+excluded.outbound_clicks;
 end if;
 delete from arvena_private.event_windows where bucket < floor(extract(epoch from now())/1800)-48;
end $$;
revoke all on function arvena_private.record_event(uuid,text,uuid) from public;
grant execute on function arvena_private.record_event(uuid,text,uuid) to anon,authenticated;
create function public.arvena_record_event(p_offer uuid,p_kind text,p_session uuid) returns void language sql security invoker set search_path='' as $$ select arvena_private.record_event(p_offer,p_kind,p_session); $$;
revoke all on function public.arvena_record_event(uuid,text,uuid) from public;
grant execute on function public.arvena_record_event(uuid,text,uuid) to anon,authenticated;

insert into public.arvena_domains values
('water','Water'),('air-and-indoor-environment','Air and indoor environment'),('food-kitchen-and-preservation','Food, kitchen and preservation'),('household-materials','Household materials'),('cleaning-and-household-products','Cleaning and household products'),('personal-everyday-products','Personal everyday products'),('energy-and-resource-efficiency','Energy and resource efficiency'),('environmental-monitoring','Environmental monitoring'),('gardens-soil-and-growing','Gardens, soil and growing'),('homes-buildings-and-land-systems','Homes, buildings and land systems');
insert into public.arvena_solution_classes values ('point-of-use-filtration','water','Point-of-use filtration','Match water treatment to identified local conditions');
-- Atomic preference replacement: failures cannot discard the previous selection.
create function public.arvena_save_preferences(p_region text,p_domains text[]) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 if cardinality(p_domains)>10 then raise exception 'Too many interests'; end if;
 insert into public.arvena_profiles(user_id,region) values(auth.uid(),p_region) on conflict(user_id) do update set region=excluded.region,updated_at=now();
 delete from public.arvena_interests where user_id=auth.uid();
 insert into public.arvena_interests(user_id,domain_slug) select auth.uid(),unnest(p_domains) on conflict do nothing;
end $$;
revoke all on function public.arvena_save_preferences(text,text[]) from public,anon;
grant execute on function public.arvena_save_preferences(text,text[]) to authenticated;

commit;
