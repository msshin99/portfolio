-- 썸네일/히어로/본문 이미지를 올려두는 public 버킷.
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;

create policy "portfolio-images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio-images');

create policy "authenticated users can upload portfolio-images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio-images');

create policy "authenticated users can update portfolio-images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'portfolio-images')
  with check (bucket_id = 'portfolio-images');

create policy "authenticated users can delete portfolio-images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio-images');
