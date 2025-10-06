// Real-time activity tracker middleware
import { recordStatistic } from '../database/config.js';

export function trackActivity(activityType, serviceId = null) {
  return async (req, res, next) => {
    // Store original res.json to capture successful responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Record activity if response is successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setImmediate(async () => {
          try {
            await recordStatistic(activityType, {
              userId: req.userId || 'anonymous',
              endpoint: req.originalUrl,
              method: req.method,
              timestamp: new Date().toISOString(),
              userAgent: req.get('User-Agent'),
              ip: req.ip
            }, serviceId);
          } catch (error) {
            console.error('Error recording activity:', error);
          }
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

export function trackPageView(pageName) {
  return async (req, res, next) => {
    try {
      await recordStatistic('page_view', {
        page: pageName,
        userId: req.userId || 'anonymous',
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        referrer: req.get('Referrer')
      });
    } catch (error) {
      console.error('Error recording page view:', error);
    }
    next();
  };
}

export function trackUserLogin() {
  return async (req, res, next) => {
    try {
      await recordStatistic('user_login', {
        userId: req.userId,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (error) {
      console.error('Error recording user login:', error);
    }
    next();
  };
}