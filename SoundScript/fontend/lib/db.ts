import sqlite3 from 'better-sqlite3';
import path from 'path';
import { promises as fs } from 'fs';

const dbDir = path.resolve('database');  // Database directory
const dbPath = path.join(dbDir, 'mydb.sqlite');  // Full path to the SQLite file

let dbInstance: sqlite3.Database | null = null;

async function initializeDatabase() {
  try {
    await fs.mkdir(dbDir, { recursive: true });

    const db = sqlite3(dbPath, {
      verbose: console.log,
      fileMustExist: false,
    });

  
    // Create transcriptions table
    const createTranscriptionsTable = `
      CREATE TABLE IF NOT EXISTS transcriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        transcript TEXT NOT NULL,
        date TEXT DEFAULT (DATE('now')),
        time TEXT DEFAULT (TIME('now'))
      )
    `;
    db.exec(createTranscriptionsTable);

    // Create summarization table with foreign key to transcriptions table
    const createSummarizationTable = `
      CREATE TABLE IF NOT EXISTS summarization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transcription_id INTEGER NOT NULL,
        summary TEXT,
        keywords TEXT,
        FOREIGN KEY (transcription_id) REFERENCES transcriptions(id) ON DELETE CASCADE
      )
    `;
    db.exec(createSummarizationTable);

    dbInstance = db;

  } catch (err) {
    console.error("Error creating database or table:", err);
    throw err;
  }
}

initializeDatabase().catch((error) => {
  console.error("Error initializing the database:", error);
});

// Function to delete an entry by id from transcriptions and cascade to summarization
function deleteTranscription(id: number): boolean {
  if (!dbInstance) {
    console.error("Database instance not initialized");
    return false;
  }
  
  try {
    const deleteQuery = `DELETE FROM transcriptions WHERE id = ?`;
    const statement = dbInstance.prepare(deleteQuery);
    const result = statement.run(id);

    return result.changes > 0;  // Returns true if a row was deleted, otherwise false
  } catch (error) {
    console.error("Error deleting transcription:", error);
    return false;
  }
}

// Function to save transcription with separate date and time
function saveTranscription(file_name: string, transcript: string): boolean {
  if (!dbInstance) {
    console.error("Database instance not initialized");
    return false;
  }

  try {
    const insertQuery = `
      INSERT INTO transcriptions (file_name, transcript, date, time)
      VALUES (?, ?, DATE('now'), TIME('now'))
    `;
    const statement = dbInstance.prepare(insertQuery);
    statement.run(file_name, transcript);

    return true;
  } catch (error) {
    console.error("Error saving transcription:", error);
    return false;
  }
}

// Function to save summary and keywords for a transcription
function saveSummary(transcription_id: number, summary: string, keywords: string): boolean {
  if (!dbInstance) {
    console.error("Database instance not initialized");
    return false;
  }

  try {
    const insertQuery = `
      INSERT INTO summarization (transcription_id, summary, keywords)
      VALUES (?, ?, ?)
    `;
    const statement = dbInstance.prepare(insertQuery);
    statement.run(transcription_id, summary, keywords);

    return true;
  } catch (error) {
    console.error("Error saving summary:", error);
    return false;
  }
}

// Function to get summary and keywords by transcription id
function getSummary(transcription_id: number): { summary: string; keywords: string } | null {
  if (!dbInstance) {
    console.error("Database instance not initialized");
    return null;
  }

  try {
    const selectQuery = `SELECT summary, keywords FROM summarization WHERE transcription_id = ?`;
    const statement = dbInstance.prepare(selectQuery);
    const result = statement.get(transcription_id);

    return result || null;  // Returns the summary and keywords, or null if not found
  } catch (error) {
    console.error("Error getting summary:", error);
    return null;
  }
}

// Exported functions
export { dbInstance, deleteTranscription, saveTranscription, saveSummary, getSummary };
