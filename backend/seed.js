const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');
const Venue = require('./models/Venue');
const Ticket = require('./models/Ticket');

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany();
    await Event.deleteMany();
    await Venue.deleteMany();
    await Ticket.deleteMany();

    const u1 = new User({ name: 'Admin User', email: 'admin@eventhub.com', password: 'password123', role: 'admin', bio: 'EventHub Administrator', location: 'New York', interests: ['technology', 'networking'] });
    const u2 = new User({ name: 'Alice Organizer', email: 'alice@eventhub.com', password: 'password123', role: 'organizer', bio: 'Event organizer with 10 years of experience', location: 'San Francisco', interests: ['music', 'technology', 'networking'] });
    const u3 = new User({ name: 'Bob Attendee', email: 'bob@eventhub.com', password: 'password123', role: 'user', bio: 'Tech enthusiast and event lover', location: 'Austin', interests: ['technology', 'sports'] });
    const u4 = new User({ name: 'Carol Smith', email: 'carol@eventhub.com', password: 'password123', role: 'user', bio: 'Musician and art lover', location: 'Chicago', interests: ['music', 'art'] });
    await u1.save(); await u2.save(); await u3.save(); await u4.save();
    const users = [u1, u2, u3, u4];

    const venues = await Venue.create([
        {
            name: 'Grand Convention Center',
            description: 'A premier event venue in the heart of the city with state-of-the-art facilities.',
            address: { street: '100 Convention Blvd', city: 'New York', state: 'NY', country: 'USA', zipCode: '10001' },
            capacity: 5000, amenities: ['WiFi', 'Parking', 'Catering', 'AV Equipment', 'Stage'],
            contactEmail: 'info@grandconvention.com', contactPhone: '+1-555-0100',
            pricePerDay: 5000, rating: 4.8, isAvailable: true, managedBy: users[0]._id
        },
        {
            name: 'Silicon Valley Tech Hub',
            description: 'Modern co-working space perfect for tech meetups and hackathons.',
            address: { street: '200 Innovation Dr', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94105' },
            capacity: 300, amenities: ['High-Speed WiFi', 'Projector', 'Whiteboards', 'Coffee Bar'],
            contactEmail: 'events@svtechhub.com', contactPhone: '+1-555-0200',
            pricePerDay: 1500, rating: 4.6, isAvailable: true, managedBy: users[1]._id
        },
        {
            name: 'Sunset Amphitheater',
            description: 'Outdoor amphitheater with breathtaking views, ideal for concerts and festivals.',
            address: { street: '350 Sunset Ave', city: 'Los Angeles', state: 'CA', country: 'USA', zipCode: '90001' },
            capacity: 10000, amenities: ['Sound System', 'Lighting', 'VIP Sections', 'Food Vendors'],
            contactEmail: 'book@sunsetamp.com', contactPhone: '+1-555-0300',
            pricePerDay: 8000, rating: 4.9, isAvailable: true, managedBy: users[0]._id
        }
    ]);

    const now = new Date();
    const events = await Event.create([
        {
            title: 'TechConf 2026 – Future of AI',
            description: 'Join the world\'s leading AI researchers and practitioners for a 2-day deep dive into cutting-edge artificial intelligence technologies, machine learning advancements, and the future of human-AI collaboration.',
            category: 'conference',
            organizer: users[1]._id,
            venue: venues[0]._id,
            venueDetails: { name: venues[0].name, address: '100 Convention Blvd, New York, NY' },
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 11),
            startTime: '09:00', endTime: '18:00',
            ticketTypes: [
                { name: 'General Admission', price: 299, quantity: 500, sold: 120, description: 'Full conference access', benefits: ['All sessions', 'Lunch included'] },
                { name: 'VIP Pass', price: 799, quantity: 50, sold: 20, description: 'Premium access with extras', benefits: ['All sessions', 'Networking dinner', 'Speaker meet & greet', 'Exclusive swag bag'] }
            ],
            maxAttendees: 550, currentAttendees: 140,
            tags: ['AI', 'Machine Learning', 'Technology', 'Innovation'],
            status: 'published', isFeatured: true,
            checkInCode: uuidv4()
        },
        {
            title: 'Summer Music Festival 2026',
            description: 'Three days of non-stop music featuring 50+ artists across 5 stages. From indie rock to electronic dance music, experience the best in live performances under the open sky.',
            category: 'festival',
            organizer: users[1]._id,
            venue: venues[2]._id,
            venueDetails: { name: venues[2].name, address: '350 Sunset Ave, Los Angeles, CA' },
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 20),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 22),
            startTime: '12:00', endTime: '23:00',
            ticketTypes: [
                { name: '1-Day Pass', price: 89, quantity: 2000, sold: 850, description: 'Single day access', benefits: ['All stages', 'Food vendors'] },
                { name: '3-Day Festival Pass', price: 199, quantity: 1000, sold: 430, description: 'Full festival experience', benefits: ['All stages', 'Camping', 'Priority entry', 'Artist meet & greet'] }
            ],
            maxAttendees: 3000, currentAttendees: 1280,
            tags: ['Music', 'Festival', 'Live Music', 'Entertainment'],
            status: 'published', isFeatured: true,
            checkInCode: uuidv4()
        },
        {
            title: 'Startup Networking Night',
            description: 'Connect with hundreds of founders, investors, and tech enthusiasts at the most vibrant startup networking event of the year. Pitch your idea, find co-founders, and discover investment opportunities.',
            category: 'networking',
            organizer: users[1]._id,
            venue: venues[1]._id,
            venueDetails: { name: venues[1].name, address: '200 Innovation Dr, San Francisco, CA' },
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
            startTime: '18:00', endTime: '22:00',
            ticketTypes: [
                { name: 'Standard', price: 0, quantity: 200, sold: 87, description: 'Free admission', benefits: ['Networking session', 'Drinks included'] },
                { name: 'Premium Networker', price: 49, quantity: 50, sold: 18, description: 'Enhanced networking', benefits: ['Priority seating', 'Investor access', 'Profile featured'] }
            ],
            maxAttendees: 250, currentAttendees: 105,
            tags: ['Networking', 'Startup', 'Entrepreneurs', 'Investors'],
            status: 'published', isFeatured: false,
            checkInCode: uuidv4()
        },
        {
            title: 'Full-Stack Web Dev Workshop',
            description: 'A hands-on 8-hour workshop where you will build a complete web application using React, Node.js, and MongoDB. Perfect for intermediate developers looking to level up their skills.',
            category: 'workshop',
            organizer: users[0]._id,
            venue: venues[1]._id,
            venueDetails: { name: venues[1].name, address: '200 Innovation Dr, San Francisco, CA' },
            startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
            endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
            startTime: '10:00', endTime: '18:00',
            ticketTypes: [
                { name: 'Workshop Seat', price: 149, quantity: 30, sold: 22, description: 'Full workshop access', benefits: ['Hands-on project', 'Course materials', 'Certificate', 'Lunch included'] }
            ],
            maxAttendees: 30, currentAttendees: 22,
            tags: ['React', 'Node.js', 'MongoDB', 'Workshop', 'Web Dev'],
            status: 'published', isFeatured: false,
            checkInCode: uuidv4()
        }
    ]);

    const ticketId1 = uuidv4();
    const qr1 = await QRCode.toDataURL(JSON.stringify({ ticketId: ticketId1, eventId: events[0]._id.toString(), attendeeName: users[2].name, ticketType: 'General Admission' }));
    const ticketId2 = uuidv4();
    const qr2 = await QRCode.toDataURL(JSON.stringify({ ticketId: ticketId2, eventId: events[2]._id.toString(), attendeeName: users[2].name, ticketType: 'Standard' }));

    await Ticket.create([
        {
            ticketId: ticketId1,
            event: events[0]._id,
            attendee: users[2]._id,
            ticketType: { name: 'General Admission', price: 299 },
            quantity: 1, totalAmount: 299, paymentStatus: 'paid', status: 'active',
            qrCode: qr1,
            attendeeDetails: { name: users[2].name, email: users[2].email }
        },
        {
            ticketId: ticketId2,
            event: events[2]._id,
            attendee: users[2]._id,
            ticketType: { name: 'Standard', price: 0 },
            quantity: 1, totalAmount: 0, paymentStatus: 'paid', status: 'active',
            qrCode: qr2,
            attendeeDetails: { name: users[2].name, email: users[2].email }
        }
    ]);

    console.log('✅ Seed data created successfully!');
    console.log('\n📧 Demo Accounts:');
    console.log('   Admin:     admin@eventhub.com    / password123');
    console.log('   Organizer: alice@eventhub.com    / password123');
    console.log('   User:      bob@eventhub.com      / password123');
    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
