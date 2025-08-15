/*
  # SDR Call-AI Analyzer Database Schema

  1. New Tables
    - `sdr_users`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `manager_id` (uuid, foreign key)
      - `created_at` (timestamp)
    - `sales_manager_users`
      - `id` (uuid, primary key) 
      - `name` (text)
      - `email` (text, unique)
      - `created_at` (timestamp)
    - `call_recordings`
      - `call_id` (uuid, primary key)
      - `sdr_id` (uuid, foreign key)
      - `prospect_name` (text)
      - `call_date` (date)
      - `audio_file_url` (text)
      - `call_duration_seconds` (integer)
      - `status` (text)
      - `created_at` (timestamp)
    - `call_analyses`
      - `analysis_id` (uuid, primary key)
      - `call_id` (uuid, foreign key)
      - `full_transcript` (text)
      - `talk_listen_ratio` (text)
      - `sdr_talk_time_seconds` (integer)
      - `prospect_talk_time_seconds` (integer)
      - `longest_monologue_seconds` (integer)
      - `sentiment` (text)
      - `keywords_detected` (text[])
      - `efficiency_score` (integer)
      - `manager_feedback` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

-- Create sales_manager_users table
CREATE TABLE IF NOT EXISTS sales_manager_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sdr_users table
CREATE TABLE IF NOT EXISTS sdr_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  manager_id uuid REFERENCES sales_manager_users(id),
  created_at timestamptz DEFAULT now()
);

-- Create call_recordings table
CREATE TABLE IF NOT EXISTS call_recordings (
  call_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sdr_id uuid NOT NULL REFERENCES sdr_users(id),
  prospect_name text NOT NULL,
  call_date date NOT NULL DEFAULT CURRENT_DATE,
  audio_file_url text NOT NULL,
  call_duration_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Pending Analysis' CHECK (status IN ('Pending Analysis', 'Processing', 'Analyzed')),
  created_at timestamptz DEFAULT now()
);

-- Create call_analyses table
CREATE TABLE IF NOT EXISTS call_analyses (
  analysis_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES call_recordings(call_id),
  full_transcript text DEFAULT '',
  talk_listen_ratio text DEFAULT '0/100',
  sdr_talk_time_seconds integer DEFAULT 0,
  prospect_talk_time_seconds integer DEFAULT 0,
  longest_monologue_seconds integer DEFAULT 0,
  sentiment text DEFAULT 'Neutral' CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
  keywords_detected text[] DEFAULT ARRAY[]::text[],
  efficiency_score integer DEFAULT 0 CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
  manager_feedback text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sales_manager_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sdr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for sales_manager_users
CREATE POLICY "Sales managers can read all sales manager data"
  ON sales_manager_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for sdr_users
CREATE POLICY "SDRs can read own data"
  ON sdr_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Sales managers can read all SDR data"
  ON sdr_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_manager_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for call_recordings
CREATE POLICY "SDRs can read own call recordings"
  ON call_recordings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sdr_users 
      WHERE id = sdr_id AND email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Sales managers can read all call recordings"
  ON call_recordings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_manager_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Create policies for call_analyses
CREATE POLICY "SDRs can read own call analyses"
  ON call_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM call_recordings cr
      JOIN sdr_users su ON cr.sdr_id = su.id
      WHERE cr.call_id = call_analyses.call_id AND su.email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Sales managers can read all call analyses"
  ON call_analyses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_manager_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Sales managers can update call analyses feedback"
  ON call_analyses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sales_manager_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Insert sample data for development
INSERT INTO sales_manager_users (name, email) VALUES 
  ('Sarah Johnson', 'sarah.johnson@company.com'),
  ('Mike Chen', 'mike.chen@company.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO sdr_users (name, email, manager_id) VALUES 
  ('John Smith', 'john.smith@company.com', (SELECT id FROM sales_manager_users WHERE email = 'sarah.johnson@company.com')),
  ('Emily Davis', 'emily.davis@company.com', (SELECT id FROM sales_manager_users WHERE email = 'sarah.johnson@company.com')),
  ('Alex Rodriguez', 'alex.rodriguez@company.com', (SELECT id FROM sales_manager_users WHERE email = 'mike.chen@company.com')),
  ('Lisa Wang', 'lisa.wang@company.com', (SELECT id FROM sales_manager_users WHERE email = 'mike.chen@company.com'))
ON CONFLICT (email) DO NOTHING;

-- Insert sample call recordings
INSERT INTO call_recordings (sdr_id, prospect_name, call_date, audio_file_url, call_duration_seconds, status) VALUES 
  ((SELECT id FROM sdr_users WHERE email = 'john.smith@company.com'), 'Acme Corp - David Miller', '2024-12-15', 'https://example.com/audio1.mp3', 1240, 'Analyzed'),
  ((SELECT id FROM sdr_users WHERE email = 'emily.davis@company.com'), 'TechStart - Jennifer Brown', '2024-12-14', 'https://example.com/audio2.mp3', 980, 'Analyzed'),
  ((SELECT id FROM sdr_users WHERE email = 'alex.rodriguez@company.com'), 'GlobalTech - Robert Wilson', '2024-12-13', 'https://example.com/audio3.mp3', 1450, 'Processing'),
  ((SELECT id FROM sdr_users WHERE email = 'lisa.wang@company.com'), 'InnovateCo - Sarah Lee', '2024-12-12', 'https://example.com/audio4.mp3', 1120, 'Analyzed')
ON CONFLICT DO NOTHING;

-- Insert sample call analyses
INSERT INTO call_analyses (call_id, full_transcript, talk_listen_ratio, sdr_talk_time_seconds, prospect_talk_time_seconds, longest_monologue_seconds, sentiment, keywords_detected, efficiency_score, manager_feedback)
SELECT 
  cr.call_id,
  'SDR: Hi David, thanks for taking the time today. I wanted to discuss how we can help streamline your sales process...\nProspect: Sure, I have about 15 minutes. What exactly does your platform do?\nSDR: Great question! Our platform helps companies like yours increase conversion rates by 40% through automated lead scoring...',
  '45/55',
  558,
  682,
  45,
  'Positive',
  ARRAY['opening_script', 'qualifying_questions', 'value_prop_A', 'next_step_demo'],
  85,
  'Great job with the opening and qualifying questions. Consider shortening the value prop explanation to keep the prospect more engaged.'
FROM call_recordings cr
WHERE cr.prospect_name = 'Acme Corp - David Miller'
ON CONFLICT DO NOTHING;

INSERT INTO call_analyses (call_id, full_transcript, talk_listen_ratio, sdr_talk_time_seconds, prospect_talk_time_seconds, longest_monologue_seconds, sentiment, keywords_detected, efficiency_score, manager_feedback)
SELECT 
  cr.call_id,
  'SDR: Hello Jennifer, I hope you''re having a great day. I wanted to reach out regarding your recent inquiry...\nProspect: Yes, I filled out the form but I''m not sure if this is the right fit for us...',
  '60/40',
  588,
  392,
  78,
  'Neutral',
  ARRAY['opening_script', 'objection_price', 'objection_handling'],
  72,
  'Good objection handling, but try to ask more qualifying questions early in the call.'
FROM call_recordings cr
WHERE cr.prospect_name = 'TechStart - Jennifer Brown'
ON CONFLICT DO NOTHING;

INSERT INTO call_analyses (call_id, full_transcript, talk_listen_ratio, sdr_talk_time_seconds, prospect_talk_time_seconds, longest_monologue_seconds, sentiment, keywords_detected, efficiency_score, manager_feedback)
SELECT 
  cr.call_id,
  'SDR: Hi Sarah, thanks for connecting with me today. I understand you''re looking to improve your customer engagement...\nProspect: Exactly, we''ve been struggling with retention rates...',
  '42/58',
  470,
  650,
  52,
  'Positive',
  ARRAY['opening_script', 'qualifying_questions', 'value_prop_B', 'next_step_demo', 'closing'],
  92,
  'Excellent call! Perfect talk/listen ratio and great discovery questions. Keep it up!'
FROM call_recordings cr
WHERE cr.prospect_name = 'InnovateCo - Sarah Lee'
ON CONFLICT DO NOTHING;