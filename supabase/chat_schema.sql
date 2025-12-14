-- Create chat_messages table
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  attachments text[],
  created_at timestamptz default now()
);

-- Enable RLS
alter table chat_messages enable row level security;

-- Policies
create policy "Users can view their own messages"
  on chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert their own messages"
  on chat_messages for insert
  with check (auth.uid() = user_id);
