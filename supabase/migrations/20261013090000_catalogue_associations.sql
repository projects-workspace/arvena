begin;
-- M2: explicit public catalogue placements in the existing approved publication.
-- Owner checks, revisions, journal, RLS and the protected sourcing path are unchanged.
create or replace function arvena_private.validate_owner_copy(c jsonb, kind text, complete boolean)
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
   'media','media_rights','images','sources','domain_slugs','context_ids')) then raise exception 'Unrecognized public field'; end if;
  required_keys:=array['slug','title','provider_id','offer_type','domain_slug','need','commercial_disclosure'];
 else
  if exists(select 1 from jsonb_object_keys(c) x where x not in
   ('slug','name','summary','website','relationship','images')) then raise exception 'Unrecognized provider field'; end if;
  required_keys:=array['slug','name','summary','relationship'];
 end if;
 for k in select jsonb_object_keys(c) loop
  if k not in ('images','sources','claims','domain_slugs','context_ids') and
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
 if kind='offer' then
  foreach k in array array['domain_slugs','context_ids'] loop
   if c ? k then
    if jsonb_typeof(c->k)<>'array' then raise exception 'Catalogue associations must be arrays'; end if;
    if jsonb_array_length(c->k)>10 then raise exception 'Use at most ten catalogue associations'; end if;
    if exists(select 1 from jsonb_array_elements(c->k) x where jsonb_typeof(x)<>'string') then raise exception 'Catalogue associations must be identifiers'; end if;
    if (select count(*) from jsonb_array_elements_text(c->k))<>(select count(distinct x) from jsonb_array_elements_text(c->k) x) then raise exception 'Duplicate catalogue association'; end if;
    if k='domain_slugs' and exists(select 1 from jsonb_array_elements_text(c->k) x where not exists(select 1 from public.arvena_domains d where d.slug=x)) then raise exception 'Choose an existing solution area'; end if;
    if k='context_ids' and exists(select 1 from jsonb_array_elements_text(c->k) x where x not in
     ('home-as-a-system','clothing-footwear-textiles','kitchen-and-storage','sleep-and-rest','electronics-fields-measurement','craft-local','traditional-knowledge-new-developments','start-without-buying')) then raise exception 'Choose an existing everyday context'; end if;
   end if;
  end loop;
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

commit;
