import fs from 'fs';
import path from 'path';
import pool from './config.js';

async function runSongEnhancementsMigration() {
  const connection = await pool.getConnection();

  try {
    console.log('Running song enhancements migration...');

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'database', 'song_enhancements_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('Executed statement successfully');
        } catch (error) {
          // Ignore "already exists" errors for idempotent operations
          if (!error.message.includes('already exists') &&
              !error.message.includes('Duplicate entry') &&
              !error.message.includes('Duplicate key')) {
            console.error('Error executing statement:', statement.substring(0, 100) + '...');
            throw error;
          } else {
            console.log('Statement already executed (table/column exists)');
          }
        }
      }
    }

    console.log('Song enhancements migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runSongEnhancementsMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runSongEnhancementsMigration };