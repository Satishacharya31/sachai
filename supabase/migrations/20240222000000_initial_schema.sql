-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create profile policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user profiles
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create content table for storing generated content
create table public.content (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  type text not null check (type in ('blog', 'facebook', 'script')),
  model text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on content table
alter table public.content enable row level security;

-- Create content policies
create policy "Content is viewable by content owner."
  on content for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own content."
  on content for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own content."
  on content for update
  using ( auth.uid() = user_id );

-- Create indexes for faster queries
create index content_user_id_idx on content(user_id);
create index content_type_idx on content(type);

-- Set up realtime for both tables
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table content;