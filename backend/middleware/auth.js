import { clerkClient } from '@clerk/clerk-sdk-node';
import { recordStatistic } from '../database/config.js';

export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      // Verify the session token with Clerk
      const sessionClaims = await clerkClient.verifyToken(token);
      
      if (!sessionClaims || !sessionClaims.sub) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      // Add user ID to request object
      req.userId = sessionClaims.sub;
      
      // Record user activity (async, don't wait for it)
      setImmediate(async () => {
        try {
          await recordStatistic('api_access', {
            userId: sessionClaims.sub,
            endpoint: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (error) {
          // Silently fail - don't interrupt the main request
          console.error('Error recording user activity:', error);
        }
      });
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}