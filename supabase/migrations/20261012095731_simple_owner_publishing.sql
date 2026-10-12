begin;
-- Additive M1 only. Existing dossiers, editorial RPCs and sourcing are preserved.
alter table public.arvena_providers add column images jsonb not null default '[]'
 check (jsonb_typeof(images) = 'array' and jsonb_array_length(images) <= 6);

create table public.arvena_provider_drafts (
 id uuid primary key default gen_random_uuid(),
 provider_id uuid unique references public.arvena_providers,
 public_copy jsonb not null default '{}' check (jsonb_typeof(public_copy) = 'object'),
 revision integer not null default 1,
 status text not null default 'draft' check (status in ('draft','published')),
 updated_at timestamptz not null default now()
);
alter table public.arvena_provider_drafts enable row level security;
alter table public.arvena_provider_drafts force row level security;
revoke all on public.arvena_provider_drafts from public, anon, authenticated;
grant select on public.arvena_provider_drafts to authenticated;
create policy provider_drafts_editor on public.arvena_provider_drafts
 for select to authenticated using (arvena_private.is_editor());

-- Only rights-cleared public images belong here. Drafts/documents do not.
-- New immutable paths avoid replacing an image referenced by older publications.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('arvena-public-media','arvena-public-media',true,5242880,
 array['image/jpeg','image/png','image/webp']);
create policy arvena_media_editor_insert on storage.objects for insert to authenticated
 with check (bucket_id='arvena-public-media' and arvena_private.is_editor()
 and name ~ '^[a-f0-9-]{36}\.(jpg|png|webp)$');
create policy arvena_media_editor_read on storage.objects for select to authenticated
 using (bucket_id='arvena-public-media' and arvena_private.is_editor());
-- No client overwrite/delete permission; removing a listing image only unlinks it.

create function arvena_private.validate_owner_copy(c jsonb, kind text, complete boolean)
 returns void language plpgsql security invoker set search_path='' as $$
declare k text; item jsonb; required_keys text[];
begin
 if jsonb_typeof(c) is distinct from 'object' or octet_length(c::text)>150000 then
  raise exception 'Publication must be a bounded public object';
 end if;
 if kind='offer' then
  if exists(select 1 from jsonb_object_keys(c) x where x not in
   ('slug','title','provider_id','offer_type','domain_slug','solution_class_slug','need',
   'suitability','selection_rationale','mechanism','specifications','claims',
   'manufacturer_claims','editorial_conclusion','unknowns','strengths','limitations',
   'safety','materials','environment','lifetime','maintenance','alternatives','geography',
   'price','access_url','implementation','commercial_disclosure','last_review_date',
   'media','media_rights','images','sources')) then raise exception 'Unrecognized public field'; end if;
  required_keys:=array['slug','title','provider_id','offer_type','domain_slug','need','commercial_disclosure'];
 else
  if exists(select 1 from jsonb_object_keys(c) x where x not in
   ('slug','name','summary','website','relationship','images')) then raise exception 'Unrecognized provider field'; end if;
  required_keys:=array['slug','name','summary','relationship'];
 end if;
 for k in select jsonb_object_keys(c) loop
  if k not in ('images','sources','claims') and
   (jsonb_typeof(c->k)<>'string' or length(c->>k)>10000) then
   raise exception 'Public text fields must be text of at most 10000 characters';
  end if;
 end loop;
 if complete and exists(select 1 from unnest(required_keys) x where coalesce(trim(c->>x),'')='') then
  raise exception 'Complete the required identity, description and relationship fields before publishing';
 end if;
 if coalesce(c->>'slug','')<>'' and c->>'slug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Use a lowercase URL slug with hyphens'; end if;
 if length(coalesce(c->>'slug',''))>160 or length(coalesce(c->>'title',c->>'name',''))>180 then raise exception 'Name or URL slug is too long'; end if;
 foreach k in array array['website','access_url'] loop
  if coalesce(c->>k,'')<>'' and c->>k !~ '^https://[^[:space:]@]+$' then raise exception 'External links must use HTTPS without embedded credentials'; end if;
 end loop;
 if coalesce(c->>'last_review_date','')<>'' and (c->>'last_review_date')::date>current_date then raise exception 'Review date is in the future'; end if;
 if coalesce(c->>'media','')<>'' and
  (c->>'media' !~ '^/assets/[a-zA-Z0-9._-]+$' or coalesce(trim(c->>'media_rights'),'')='') then
  raise exception 'Legacy local media requires an approved path and rights information';
 end if;
 if c ? 'images' then
  if jsonb_typeof(c->'images')<>'array' then raise exception 'Images must be an array'; end if;
  if jsonb_array_length(c->'images')>6 then raise exception 'Use at most six images'; end if;
  for item in select value from jsonb_array_elements(c->'images') loop
   if jsonb_typeof(item)<>'object' then raise exception 'Invalid image record'; end if;
   if exists(select 1 from jsonb_object_keys(item) x where x not in ('path','alt','rights')) or
    exists(select 1 from unnest(array['path','alt','rights']) x where jsonb_typeof(item->x) is distinct from 'string' or coalesce(trim(item->>x),'')='') or
    length(item->>'alt')>300 or length(item->>'rights')>1000 or
    item->>'path' !~ '^[a-f0-9-]{36}\.(jpg|png|webp)$' then raise exception 'Image path, alternative text and rights are required'; end if;
   if not exists(select 1 from storage.objects where bucket_id='arvena-public-media' and name=item->>'path') then raise exception 'Upload the image before adding it to the listing'; end if;
  end loop;
 end if;
 if c ? 'sources' then
  if jsonb_typeof(c->'sources')<>'array' then raise exception 'Sources must be an array'; end if;
  if jsonb_array_length(c->'sources')>20 then raise exception 'Use at most twenty source links'; end if;
  for item in select value from jsonb_array_elements(c->'sources') loop
   if jsonb_typeof(item)<>'object' then raise exception 'Invalid source link'; end if;
   if exists(select 1 from jsonb_object_keys(item) x where x not in ('title','url')) or
    jsonb_typeof(item->'title') is distinct from 'string' or coalesce(trim(item->>'title'),'')='' or length(item->>'title')>300 or
    jsonb_typeof(item->'url') is distinct from 'string' or coalesce(item->>'url','') !~ '^https://[^[:space:]@]+$' then raise exception 'Each source needs a title and an HTTPS link'; end if;
  end loop;
 end if;
 -- Keep legacy claim records intact and validate them if supplied, without
 -- requiring new listings to use the old claim-ledger format.
 if c ? 'claims' then
  if jsonb_typeof(c->'claims')<>'array' then raise exception 'Invalid legacy claims'; end if;
  for item in select value from jsonb_array_elements(c->'claims') loop
   if jsonb_typeof(item)<>'object' then raise exception 'Invalid legacy claim'; end if;
   if exists(select 1 from jsonb_object_keys(item) x where x not in
    ('claim','source','source_type','conditions','checked_on','limitations','editorial_conclusion')) or
    exists(select 1 from unnest(array['claim','source','source_type','conditions','checked_on','limitations','editorial_conclusion']) x
     where jsonb_typeof(item->x) is distinct from 'string' or coalesce(trim(item->>x),'')='') or
    item->>'source' !~ '^https://[^[:space:]@]+$' then raise exception 'Invalid legacy claim source'; end if;
   if (item->>'checked_on')::date>current_date then raise exception 'Claim check date is in the future'; end if;
  end loop;
 end if;
end $$;
revoke all on function arvena_private.validate_owner_copy(jsonb,text,boolean) from public,anon,authenticated;

create function arvena_private.owner_command(action text, payload jsonb)
 returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.arvena_research_packages; d public.arvena_provider_drafts;
 c jsonb; rid uuid; entity uuid; rev integer; kind text; published_slug text;
begin
 if not arvena_private.is_editor() then raise exception 'Owner publishing permission required' using errcode='42501'; end if;
 if action not in ('save_offer','publish_offer','unpublish_offer','open_provider','save_provider','publish_provider','unpublish_provider') then raise exception 'Unknown publishing action'; end if;
 kind:=case when action like '%provider' then 'provider' else 'offer' end;
 if action='open_provider' then
  entity:=(payload->>'provider_id')::uuid;
  perform 1 from public.arvena_providers where id=entity for update;
  if not found then raise exception 'Provider not found'; end if;
  select id into rid from public.arvena_provider_drafts where provider_id=entity;
  if rid is null then
   select jsonb_build_object('name',name,'slug',slug,'summary',summary,'relationship',relationship,'images',images) ||
    case when website is null then '{}'::jsonb else jsonb_build_object('website',website) end into c from public.arvena_providers where id=entity;
   insert into public.arvena_provider_drafts(provider_id,public_copy) values(entity,c) returning id into rid;
  end if;
  return jsonb_build_object('id',rid);
 end if;
 if action in ('save_offer','save_provider') then
  c:=payload->'public_copy';
  perform arvena_private.validate_owner_copy(c,kind,false);
  if coalesce(trim(case when kind='offer' then c->>'title' else c->>'name' end),'')='' then raise exception 'A name is required to save a draft'; end if;
  if kind='offer' then
   if nullif(payload->>'id','') is null then
    insert into public.arvena_research_packages(title,public_copy) values(c->>'title',c) returning * into p;
   else
    select * into strict p from public.arvena_research_packages where id=(payload->>'id')::uuid for update;
    if p.revision is distinct from (payload->>'revision')::integer then raise exception 'This draft changed. Reload it before saving'; end if;
    -- Deliberately never update the private dossier from the simple form.
    update public.arvena_research_packages set title=c->>'title',public_copy=c,status='draft',revision=revision+1,
     reviewed_by=null,reviewed_at=null,review_note='',updated_at=now() where id=p.id returning * into p;
   end if;
   rid:=p.id; rev:=p.revision;
  else
   if nullif(payload->>'id','') is null then
    insert into public.arvena_provider_drafts(public_copy) values(c) returning * into d;
   else
    select * into strict d from public.arvena_provider_drafts where id=(payload->>'id')::uuid for update;
    if d.revision is distinct from (payload->>'revision')::integer then raise exception 'This draft changed. Reload it before saving'; end if;
    update public.arvena_provider_drafts set public_copy=c,status='draft',revision=revision+1,updated_at=now() where id=d.id returning * into d;
   end if;
   rid:=d.id; rev:=d.revision;
  end if;
 else
  if kind='offer' then
   select * into strict p from public.arvena_research_packages where id=(payload->>'id')::uuid for update;
   if p.revision is distinct from (payload->>'revision')::integer then raise exception 'This draft changed. Reload and preview the current revision'; end if;
   c:=p.public_copy; rid:=p.id; rev:=p.revision; entity:=p.offer_id;
  else
   select * into strict d from public.arvena_provider_drafts where id=(payload->>'id')::uuid for update;
   if d.revision is distinct from (payload->>'revision')::integer then raise exception 'This draft changed. Reload and preview the current revision'; end if;
   c:=d.public_copy; rid:=d.id; rev:=d.revision; entity:=d.provider_id;
  end if;
  if action like 'publish_%' then
   if payload->'confirmed' is distinct from 'true'::jsonb then raise exception 'Confirm publication of this saved preview'; end if;
   perform arvena_private.validate_owner_copy(c,kind,true);
   if kind='offer' then
    if p.status='published' then raise exception 'This revision is already published'; end if;
    if c->>'offer_type' not in ('product','handmade','technology','service','installed-product','building','integrated-system','turnkey') then raise exception 'Select an offer type'; end if;
    -- Lock the provider so a concurrent withdrawal cannot invalidate publication.
    perform 1 from public.arvena_providers where id=(c->>'provider_id')::uuid and status='published' for share;
    if not found then raise exception 'Publish the provider before publishing this offer'; end if;
    if nullif(c->>'solution_class_slug','') is not null and not exists(select 1 from public.arvena_solution_classes where slug=c->>'solution_class_slug' and domain_slug=c->>'domain_slug') then raise exception 'Choose a solution class from the selected domain'; end if;
    if entity is null then
     insert into public.arvena_offers(slug,title,domain_slug,solution_class_slug,offer_type,provider_id,publication,status)
      values(c->>'slug',c->>'title',c->>'domain_slug',nullif(c->>'solution_class_slug',''),c->>'offer_type',(c->>'provider_id')::uuid,c,'published') returning id into entity;
    else
     select slug into published_slug from public.arvena_offers where id=entity for update;
     if published_slug<>c->>'slug' then raise exception 'Keep the existing public URL slug'; end if;
     update public.arvena_offers set title=c->>'title',domain_slug=c->>'domain_slug',solution_class_slug=nullif(c->>'solution_class_slug',''),
      offer_type=c->>'offer_type',provider_id=(c->>'provider_id')::uuid,publication=c,status='published',updated_at=now() where id=entity;
    end if;
    update public.arvena_research_packages set offer_id=entity,status='published',reviewed_by=auth.uid(),reviewed_at=now(),
     review_note='',updated_at=now() where id=rid;
   else
    if d.status='published' then raise exception 'This revision is already published'; end if;
    if entity is null then
     insert into public.arvena_providers(slug,name,summary,website,relationship,images,status)
      values(c->>'slug',c->>'name',c->>'summary',nullif(c->>'website',''),c->>'relationship',coalesce(c->'images','[]'),'published') returning id into entity;
    else
     select slug into published_slug from public.arvena_providers where id=entity for update;
     if published_slug<>c->>'slug' then raise exception 'Keep the existing public URL slug'; end if;
     update public.arvena_providers set name=c->>'name',summary=c->>'summary',website=nullif(c->>'website',''),
      relationship=c->>'relationship',images=coalesce(c->'images','[]'),status='published' where id=entity;
    end if;
    update public.arvena_provider_drafts set provider_id=entity,status='published',updated_at=now() where id=rid;
   end if;
  else
   if entity is null then raise exception 'This draft has not been published'; end if;
   if kind='offer' then
    update public.arvena_offers set status='hidden',updated_at=now() where id=entity;
    update public.arvena_research_packages set status='draft',revision=revision+1,reviewed_by=null,reviewed_at=null,review_note='',updated_at=now() where id=rid returning revision into rev;
   else
    perform 1 from public.arvena_providers where id=entity for update;
    if exists(select 1 from public.arvena_offers where provider_id=entity and status='published') then raise exception 'Unpublish this provider''s offers first'; end if;
    update public.arvena_providers set status='hidden' where id=entity;
    update public.arvena_provider_drafts set status='draft',revision=revision+1,updated_at=now() where id=rid returning revision into rev;
   end if;
  end if;
 end if;
 insert into public.arvena_editorial_events(actor_id,action,entity_id,revision,public_snapshot)
 values(auth.uid(),'owner_'||action,rid,rev,case when action like 'publish_%' then c else null end);
 return jsonb_build_object('id',rid,'revision',rev,'entity_id',entity);
end $$;
revoke all on function arvena_private.owner_command(text,jsonb) from public,anon;
grant execute on function arvena_private.owner_command(text,jsonb) to authenticated;
create function public.arvena_owner_command(action text,payload jsonb) returns jsonb
 language sql security invoker set search_path='' as $$ select arvena_private.owner_command(action,payload); $$;
revoke all on function public.arvena_owner_command(text,jsonb) from public,anon;
grant execute on function public.arvena_owner_command(text,jsonb) to authenticated;
commit;
