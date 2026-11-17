import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/secureJwt';
import { sendWelcomeEmail } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { verifyFirebaseToken } from '@/lib/firebaseAdmin';
import jwt from 'jsonwebtoken';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or Key');
  }
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  try {
    const { idToken, uid, email, name, photoURL } = await request.json();
    
    // Validate email
    if (!email || !idToken) {
      return NextResponse.json(
        { 
          error: 'Email and idToken are required',
          code: 'INVALID_INPUT'
        }, 
        { status: 400 }
      );
    }

    // Firebase token verification (with fallback for missing credentials)
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(idToken);
    } catch (tokenError) {
      console.error('[Google Login] Token verification error:', tokenError.message);
      // Return specific error message for debugging
      return NextResponse.json(
        { 
          error: `Token verification failed: ${tokenError.message}`,
          code: 'TOKEN_VERIFICATION_FAILED',
          details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
        },
        { status: 401 }
      );
    }

    // Validate token data
    if (!decodedToken) {
      return NextResponse.json(
        { 
          error: 'Failed to decode token',
          code: 'INVALID_TOKEN'
        }, 
        { status: 401 }
      );
    }

    // Get email from token (Firebase uses 'email' claim)
    const tokenEmail = decodedToken.email || decodedToken.preferred_username;
    
    if (!tokenEmail) {
      return NextResponse.json(
        { 
          error: 'Token does not contain email information',
          code: 'NO_EMAIL_IN_TOKEN'
        }, 
        { status: 401 }
      );
    }

    // Check that email matches (case-insensitive)
    if (tokenEmail.toLowerCase() !== email.toLowerCase()) {
      console.warn('[Google Login] Email mismatch:', { tokenEmail, loginEmail: email });
      return NextResponse.json(
        { 
          error: 'Token email does not match login email',
          code: 'EMAIL_MISMATCH'
        }, 
        { status: 401 }
      );
    }

    // Check if user exists
    const supabase = getSupabaseClient();
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
      
    let user = existingUser;
    let isNewUser = false;

    if (!user) {
      // Create new user from Google data
      isNewUser = true;
      const insertData = {
        name: name || 'Google User',
        email: email.toLowerCase(),
        password: crypto.randomBytes(32).toString('hex'), // Dummy password for OAuth users
        avatar: photoURL || null,
        status: 'active',
        role: 'customer',
        last_login: new Date().toISOString()
      };
      
      const { data: newUser, error: insertError } = await supabase.from('users').insert([insertData]).select().single();
      if (insertError) throw insertError;
      user = newUser;

      // Send welcome email to new Google users
      try {
        await sendWelcomeEmail(email, user.name);
      } catch (emailError) {
        console.error('Welcome email failed:', emailError);
      }
    } else {
      // Update user info if needed
      const updateData = { last_login: new Date().toISOString() };
      if (photoURL && !user.avatar) updateData.avatar = photoURL;
      
      const { data: updatedUser, error: updateError } = await supabase.from('users').update(updateData).eq('id', user.id).select().single();
      if (updateError) throw updateError;
      user = updatedUser;
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || '67ece564ef6430be1fe35a05e49d050a0978d05f26db5240c5ef328f69c99811';
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          _id: user.id, // For frontend compatibility
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          address: user.address,
          dateOfBirth: user.date_of_birth || user.dateOfBirth,
          gender: user.gender,
          createdAt: user.created_at,
          lastLogin: user.last_login,
        },
        isNewUser,
        token
      },
      { status: 200 }
    );

    // Set cookie
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'lax',
      secure: isProduction,
    });

    return response;
  } catch (error) {
    console.error('[Google Login] Unexpected error:', {
      message: 'An error occurred',
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Provide user-friendly error message
    let errorMessage = 'An error occurred during login. Please try again.';
    if (error?.message?.includes('Supabase')) {
      errorMessage = 'Database error. Please try again later.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}