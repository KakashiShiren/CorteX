create extension if not exists vector;

alter table ai_knowledge_base
add column if not exists embedding vector(1536);

create index if not exists idx_knowledge_base_embedding
on ai_knowledge_base
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create or replace function match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  keywords text[],
  source text,
  category text,
  similarity float
)
language sql
stable
as $$
  select
    ai_knowledge_base.id,
    ai_knowledge_base.title::text,
    ai_knowledge_base.content,
    ai_knowledge_base.keywords,
    ai_knowledge_base.source::text,
    ai_knowledge_base.category::text,
    1 - (ai_knowledge_base.embedding <=> query_embedding) as similarity
  from ai_knowledge_base
  where
    ai_knowledge_base.embedding is not null
    and 1 - (ai_knowledge_base.embedding <=> query_embedding) > match_threshold
  order by ai_knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;
