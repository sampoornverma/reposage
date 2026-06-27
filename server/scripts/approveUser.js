const { supabase } = require('../src/config/supabase');

/**
 * Admin CLI tool to approve a waitlisted user.
 * Run this via: node scripts/approveUser.js <email>
 */
async function approveUser() {
  const emailToApprove = process.argv[2];

  if (!emailToApprove) {
    console.error("❌ Please provide an email address.");
    console.log("Usage: node scripts/approveUser.js user@example.com");
    process.exit(1);
  }

  console.log(`🔍 Looking for user profile: ${emailToApprove}...`);

  try {
    // 1. Update the profile's is_approved flag to true
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ is_approved: true })
      .eq('email', emailToApprove)
      .select()
      .single();

    if (error || !profile) {
      console.error("❌ Failed to find or update profile. Does this user exist?");
      if (error) console.error(error.message);
      process.exit(1);
    }

    console.log(`✅ Success! User ${emailToApprove} has been approved and granted access.`);
    console.log(`\n📧 [MOCK EMAIL SENT]`);
    console.log(`To: ${emailToApprove}`);
    console.log(`Subject: You're off the waitlist!`);
    console.log(`Body: Your RepoSage account has been approved by an admin. You can now log in and chat with your repositories!`);
    
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
}

approveUser();
