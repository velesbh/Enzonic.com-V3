import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addTranslationTypeColumns() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'enzonic'
    });

    console.log('Connected to MySQL database');

    // Check if columns already exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'translation_history' 
      AND COLUMN_NAME IN ('type', 'file_name')
    `, [process.env.DB_NAME || 'enzonic']);

    if (columns.length === 2) {
      console.log('Columns already exist, no migration needed');
      return;
    }

    console.log('Adding new columns to translation_history table...');

    // Add type column if it doesn't exist
    if (!columns.some(col => col.COLUMN_NAME === 'type')) {
      await connection.execute(`
        ALTER TABLE translation_history 
        ADD COLUMN type ENUM('text', 'file') DEFAULT 'text' NOT NULL AFTER target_language
      `);
      console.log('✓ Added type column');
    }

    // Add file_name column if it doesn't exist
    if (!columns.some(col => col.COLUMN_NAME === 'file_name')) {
      await connection.execute(`
        ALTER TABLE translation_history 
        ADD COLUMN file_name VARCHAR(255) NULL AFTER type
      `);
      console.log('✓ Added file_name column');
    }

    console.log('\n✓ Migration completed successfully!');

  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
addTranslationTypeColumns()
  .then(() => {
    console.log('\nAll done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
