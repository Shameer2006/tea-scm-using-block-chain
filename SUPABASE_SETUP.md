# Supabase Integration Setup

## 1. Install Supabase Client

```bash
cd frontend
npm install @supabase/supabase-js
```

## 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

## 3. Configure Environment Variables

Create `.env` file in frontend directory:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Setup Database Schema

Run the SQL from `schema.sql` in your Supabase SQL editor:

```sql
-- Copy and paste the contents of schema.sql
```

## 5. Features Implemented

### Stakeholder Profiles
- **Table**: `stakeholder_profiles`
- **Data**: email, phone, established, description
- **Storage**: Non-blockchain profile data

### Chat System
- **Tables**: `chat_conversations`, `chat_messages`
- **Features**: Real-time messaging, conversation history
- **Storage**: All chat data persisted in Supabase

### Authentication
- **Method**: Anonymous auth with wallet address
- **Security**: Row Level Security (RLS) policies
- **Access**: Users can only access their own data

## 6. Usage

The integration is automatic once configured:

- **Profile Page**: Saves email, phone, etc. to Supabase
- **Chat Widget**: Uses Supabase for real-time messaging
- **Data Sync**: Blockchain + Supabase data combined

## 7. Data Architecture

```
Blockchain (Immutable):
├── Name, Type, Location
├── Certifications
├── Reputation
└── Product/Transaction data

Supabase (Mutable):
├── Email, Phone, Description
├── Chat messages
└── User preferences
```