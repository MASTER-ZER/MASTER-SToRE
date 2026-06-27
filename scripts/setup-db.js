const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get DATABASE_URL
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    // Remove quotes if present
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[key] = value.trim();
  }
});

const databaseUrl = envVars.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL not found in .env.local!');
  process.exit(1);
}

console.log('Connecting to PostgreSQL database...');
const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

const ddl = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  whatsapp text,
  role text DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  details text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_whatsapp text NOT NULL,
  payment_method text NOT NULL,
  screenshot_url text NOT NULL,
  sender_number text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Inbox Messages Table
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message_content text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

-- Automatic profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, whatsapp, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'عميل جديد'),
    COALESCE(new.raw_user_meta_data->>'whatsapp', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create storage buckets for products and screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('store-images', 'store-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']),
  ('screenshots', 'screenshots', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies Setup (Safe rerun)
-- Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can do everything on products" ON public.products;

DROP POLICY IF EXISTS "Payment methods are viewable by authenticated users" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can do everything on payment methods" ON public.payment_methods;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can do everything on orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view own inbox messages" ON public.inbox_messages;
DROP POLICY IF EXISTS "Users can update own inbox read status" ON public.inbox_messages;
DROP POLICY IF EXISTS "Admins can do everything on inbox messages" ON public.inbox_messages;

-- Create Policies
-- Profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do everything on profiles" ON public.profiles
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Products
CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Admins can do everything on products" ON public.products
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Payment Methods
CREATE POLICY "Payment methods are viewable by authenticated users" ON public.payment_methods
  FOR SELECT USING (true);
CREATE POLICY "Admins can do everything on payment methods" ON public.payment_methods
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can do everything on orders" ON public.orders
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Inbox Messages
CREATE POLICY "Users can view own inbox messages" ON public.inbox_messages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own inbox read status" ON public.inbox_messages
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can do everything on inbox messages" ON public.inbox_messages
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage bucket access policies for public download
DROP POLICY IF EXISTS "Public Access images" ON storage.objects;
CREATE POLICY "Public Access images" ON storage.objects
  FOR SELECT USING (bucket_id IN ('store-images', 'screenshots'));

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id IN ('store-images', 'screenshots'));

DROP POLICY IF EXISTS "Allow admin delete" ON storage.objects;
CREATE POLICY "Allow admin delete" ON storage.objects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
`;

async function main() {
  try {
    await client.connect();
    console.log('Connected to Postgres! Running migration script...');
    await client.query(ddl);
    console.log('Database tables, triggers, buckets, and policies created successfully!');
    
    // Seed default payment methods if they do not exist
    const checkPay = await client.query('SELECT COUNT(*) FROM public.payment_methods');
    if (parseInt(checkPay.rows[0].count) === 0) {
      console.log('Seeding default payment methods...');
      await client.query(`
        INSERT INTO public.payment_methods (name, details) VALUES
        ('فودافون كاش (Vodafone Cash)', '01012345678'),
        ('انستا باي (InstaPay)', 'masterstore@instapay')
      `);
      console.log('Default payment methods seeded.');
    }

  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await client.end();
  }
}

main();
