-- 1. Create custom enum for company type
CREATE TYPE company_type_enum AS ENUM ('vc', 'corporate', 'other');

-- 2. client_companies table
CREATE TABLE client_companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name text NOT NULL UNIQUE,
    company_type company_type_enum NOT NULL
);

-- 3. tags table
CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);

-- 4. customer_conversations table
CREATE TABLE customer_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name text NOT NULL,
    innovera_person text NOT NULL,
    company_id uuid REFERENCES client_companies(id) ON DELETE CASCADE,
    date date NOT NULL,
    tag_id uuid[] -- Array of tag UUIDs (enforce in app logic)
);

-- 5. customer_transcripts table
CREATE TABLE customer_transcripts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content text NOT NULL,
    customer_conversation_id uuid UNIQUE REFERENCES customer_conversations(id) ON DELETE CASCADE,
    uploaded_at timestamptz NOT NULL DEFAULT now()
); 