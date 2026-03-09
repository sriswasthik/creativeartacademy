/**
 * models/migrate.js
 * Run with: node models/migrate.js
 * Creates all tables for Creative Art Academy 2026
 */

require('dotenv').config();
const db = require('./db');

async function migrate() {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // ── Users ──────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255),                    -- null for Google OAuth users
        name        VARCHAR(255) NOT NULL,
        phone       VARCHAR(30),
        role        VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' | 'admin'
        google_id   VARCHAR(255),
        avatar_url  TEXT,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Classes ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price       INTEGER NOT NULL,               -- in paise (INR)
        age_group   VARCHAR(100),
        image_url   TEXT,
        tag         VARCHAR(100),
        max_students INTEGER DEFAULT 10,
        is_active   BOOLEAN DEFAULT TRUE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Enrollments ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        payment_id    VARCHAR(255),                  -- Stripe PaymentIntent ID
        payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending' | 'paid' | 'failed'
        amount_paid   INTEGER,
        enrolled_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes         TEXT,
        UNIQUE (user_id, class_id)
      );
    `);

    // ── Gallery ────────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS gallery (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        image_url   TEXT NOT NULL,
        caption     VARCHAR(255),
        student_name VARCHAR(255),
        class_id    UUID REFERENCES classes(id) ON DELETE SET NULL,
        is_featured BOOLEAN DEFAULT FALSE,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Testimonials ───────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
        author_name VARCHAR(255) NOT NULL,
        author_detail VARCHAR(255),
        body        TEXT NOT NULL,
        rating      INTEGER CHECK (rating BETWEEN 1 AND 5) DEFAULT 5,
        is_approved BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Contact messages ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        email       VARCHAR(255) NOT NULL,
        subject     VARCHAR(255),
        message     TEXT NOT NULL,
        is_read     BOOLEAN DEFAULT FALSE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Artwork uploads (student dashboard) ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        class_id    UUID REFERENCES classes(id) ON DELETE SET NULL,
        image_url   TEXT NOT NULL,
        title       VARCHAR(255),
        description TEXT,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ── Indexes ────────────────────────────────────────────────────────────────
    await client.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery(is_featured);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_testimonials_approved ON testimonials(is_approved);`);

    // ── Seed default classes ───────────────────────────────────────────────────
    await client.query(`
      INSERT INTO classes (title, description, price, age_group, tag, image_url) VALUES
        ('Kids Drawing & Colour', 'Pencil, crayon, and colour exploration for little hands.', 50000, '5–12', 'Ages 5–12', 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=600'),
        ('Adult Watercolour', 'Learn washes, wet-on-wet, and layering. Perfect for beginners.', 80000, 'Adults', 'Adults', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'),
        ('Teen Acrylic Studio', 'Bold colours, expressive compositions. Build your first portfolio piece.', 65000, '13–18', 'Teens 13–18', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600'),
        ('Sketchbook Journaling', 'Combining drawing with writing. Build a personal visual diary.', 55000, 'All ages', 'All ages', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600'),
        ('Mixed Media Exploration', 'Collage, ink, texture paste, and photography.', 90000, 'Adults', 'Adults', 'https://images.unsplash.com/photo-1502781252888-9143ba7f074e?w=600'),
        ('Family Creative Workshop', 'Parents and children paint side-by-side. Themed projects every Saturday.', 120000, 'Family', 'Weekend special', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600')
      ON CONFLICT DO NOTHING;
    `);

    // ── Seed testimonials ──────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO testimonials (author_name, author_detail, body, rating, is_approved) VALUES
        ('Sravani K.', 'Adult Watercolour student, 2025', 'I hadn''t touched a paintbrush since school. Priya made me feel like I''d been painting my whole life by the second class.', 5, TRUE),
        ('Ravi Teja P.', 'Parent, Kids Drawing class', 'My daughter looks forward to Saturdays more than anything now. She''s seven and talks about colour theory at dinner.', 5, TRUE),
        ('Deepika M.', 'Mixed Media student, 2025', 'The workshop broke every rule I thought I knew about good art. Now my house looks like a very intentional fever dream.', 5, TRUE),
        ('Farrukh A.', 'Sketchbook Journaling, 2026', 'Arjun''s class changed how I see the city. I notice light differently now.', 4, TRUE)
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅  Database migration complete. All tables created and seeded.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
