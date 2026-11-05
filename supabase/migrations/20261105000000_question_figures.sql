-- Figures: up to four pictures per quiz question, stored in the private "images"
-- bucket under quiz-figures/<user id>/ and listed in order on the question.
-- Keep the limits, bucket, folder, and extensions in step with lib/quiz/figureRules.ts.

alter table public.questions
  add column if not exists figure_paths text[] not null default '{}';

alter table public.questions
  add constraint questions_figure_paths_max_4
  check (cardinality(figure_paths) <= 4);

-- Users can read (sign URLs for) and delete only their own Figure files, and upload
-- only PNG, JPEG, or WebP ones. The server uploads Sample Test Figures with the
-- service role, which bypasses these.
create policy "Users read their own quiz figures"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'quiz-figures'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users delete their own quiz figures"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'quiz-figures'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users upload their own quiz figures"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'images'
    and (storage.foldername(name))[1] = 'quiz-figures'
    and (storage.foldername(name))[2] = auth.uid()::text
    and storage.extension(name) in ('png', 'jpg', 'webp')
  );
