import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
}

// Enhanced diagnostics for MongoDB URI
function validateMongoUri(): string {
  const rawUri = process.env.MONGODB_URI;
  
  console.log('=== MongoDB URI Diagnostics ===');
  console.log('Raw URI exists:', !!rawUri);
  console.log('Raw URI length:', rawUri?.length || 0);
  console.log('Has whitespace:', rawUri ? /\s/.test(rawUri) : false);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Process CWD:', process.cwd());
  
  if (!rawUri) {
    console.error('❌ MONGODB_URI is not defined');
    console.log('Available environment variables starting with MONGO:');
    Object.keys(process.env)
      .filter(key => key.toLowerCase().includes('mongo'))
      .forEach(key => console.log(`  ${key}: ${process.env[key] ? '[SET]' : '[EMPTY]'}`));
    
    throw new Error(`
🔴 MONGODB_URI environment variable is missing!

✅ Solutions:
1. Create .env.local file in project root (${process.cwd()})
2. Add this line: MONGODB_URI=your_mongodb_connection_string
3. Restart your development server
4. Make sure no spaces around the = sign
5. Don't use quotes around the URI

📝 Example .env.local content:
MONGODB_URI=mongodb://localhost:27017/qrmenumanager
`);
  }
  
  const trimmedUri = rawUri.trim();
  
  if (trimmedUri !== rawUri) {
    console.warn('⚠️ MONGODB_URI had whitespace that was trimmed');
  }
  
  if (!trimmedUri.startsWith('mongodb')) {
    throw new Error(`❌ Invalid MONGODB_URI format. Must start with 'mongodb://' or 'mongodb+srv://'\nReceived: ${trimmedUri.substring(0, 20)}...`);
  }
  
  console.log('✅ MONGODB_URI validated successfully');
  console.log('================================');
  
  return trimmedUri;
}

const MONGODB_URI = validateMongoUri();

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof import('mongoose')> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
