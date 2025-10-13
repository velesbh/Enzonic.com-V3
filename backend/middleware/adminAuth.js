import { clerkClient } from '@clerk/clerk-sdk-node';

export async function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    const sessionClaims = await clerkClient.verifyToken(token);
    
    if (!sessionClaims || !sessionClaims.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Check if user ID is in the admin list from environment variables
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    
    if (!adminUserIds.includes(sessionClaims.sub)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get user from Clerk for additional info
    const user = await clerkClient.users.getUser(sessionClaims.sub);
    
    req.userId = sessionClaims.sub;
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    const sessionClaims = await clerkClient.verifyToken(token);
    
    if (!sessionClaims || !sessionClaims.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.userId = sessionClaims.sub;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

// Export adminAuth as an alias for authenticateAdmin for backward compatibility
export const adminAuth = authenticateAdmin;