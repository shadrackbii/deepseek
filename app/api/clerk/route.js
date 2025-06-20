import { Webhook } from 'svix';
import connectDB from '@/db';
import User from '@/models/User';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const wh = new Webhook(process.env.SIGNING_SECRET);
  const headerPayLoad = await headers();
  const svixHeaders = {
    'svix-id': headerPayLoad.get('svix-id'),
    'svix-timestamp': headerPayLoad.get('svix-timestamp'),
    'svix-signature': headerPayLoad.get('svix-signature'),
  };

  try {
    // Get and verify payload
    const payload = await req.json();
    const body = JSON.stringify(payload);
    let data, type;
    try {
      ({ data, type } = wh.verify(body, svixHeaders));
      console.log('Webhook payload data:', data);
    } catch (error) {
      console.error('Webhook verification failed:', error);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    // Validate required fields
    if (!data.email_addresses || !Array.isArray(data.email_addresses) || !data.email_addresses[0]) {
      console.error('Invalid payload: missing email_addresses', data);
      return NextResponse.json({ error: 'Invalid payload: missing email_addresses' }, { status: 400 });
    }

    // Prepare user data
    const userData = {
      _id: data.id,
      email: data.email_addresses[0].email_address,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unknown',
      image: data.image_url || '',
    };

    // Connect to MongoDB
    try {
      await connectDB();
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Handle webhook event
    switch (type) {
      case 'user.created':
        await User.create(userData);
        console.log('User created:', userData._id);
        break;
      case 'user.updated':
        await User.findByIdAndUpdate(data.id, userData, { new: true });
        console.log('User updated:', userData._id);
        break;
      case 'user.deleted':
        await User.findByIdAndDelete(data.id);
        console.log('User deleted:', data.id);
        break;
      default:
        console.log('Unhandled event type:', type);
        break;
    }

    return NextResponse.json({ message: 'Event received' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
