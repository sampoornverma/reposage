const { supabase } = require('../config/supabase');

/**
 * Authentication Middleware
 * 1. Extracts the Bearer token from the request headers
 * 2. Validates the JWT with Supabase
 * 3. Checks the `profiles` table to ensure the user is approved by an admin
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing or invalid authorization token' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Check if the user is approved in the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_approved, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ success: false, error: 'User profile not found' });
    }

    if (!profile.is_approved) {
      return res.status(403).json({ success: false, error: 'Access denied. Account pending admin approval.' });
    }

    // Attach user and profile to the request object for downstream routes to use
    req.user = user;
    req.profile = profile;
    
    next();
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Error:", error);
    return res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
}

module.exports = { requireAuth };
