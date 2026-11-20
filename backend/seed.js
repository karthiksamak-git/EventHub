/**
 * EventHub database seeder.
 *
 * Usage:
 *   npm run seed          # wipes and repopulates the database
 *
 * Requires MONGO_URI to be set (see .env.example).
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');
const Venue = require('./models/Venue');
const Ticket = require('./models/Ticket');

const daysFromNow = (days) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
};

const seed = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set. Create backend/.env (see .env.example).');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
        Ticket.deleteMany(),
        Event.deleteMany(),
        Venue.deleteMany(),
        User.deleteMany(),
    ]);
    console.log('Cleared existing collections');

    // ── Users ──────────────────────────────────────────────────────────────
    const [admin, organizer, attendee, secondAttendee] = await User.create([
        {
            name: 'Admin User', email: 'admin@eventhub.com', password: 'password123',
            role: 'admin', bio: 'EventHub platform administrator.',
            location: 'Bengaluru, India', interests: ['technology', 'networking'],
        },
        {
            name: 'Alice Verma', email: 'alice@eventhub.com', password: 'password123',
            role: 'organizer', accountType: 'organization',
            organizationName: 'Skyline Events', organizationType: 'company',
            upiId: 'skyline.events@okaxis', upiVerified: true,
            bio: 'Full-service event production company running tech and music experiences.',
            location: 'Mumbai, India', interests: ['music', 'technology', 'networking'],
            website: 'https://example.com/skyline',
        },
        {
            name: 'Bob Mehta', email: 'bob@eventhub.com', password: 'password123',
            role: 'user', bio: 'Full-stack developer and conference regular.',
            location: 'Pune, India', interests: ['technology', 'startups'],
        },
        {
            name: 'Carol Dsouza', email: 'carol@eventhub.com', password: 'password123',
            role: 'user', bio: 'Musician and live-event photographer.',
            location: 'Goa, India', interests: ['music', 'art'],
        },
    ]);

    // ── Venues ─────────────────────────────────────────────────────────────
    const [conventionCentre, techHub, amphitheatre] = await Venue.create([
        {
            name: 'Grand Convention Centre',
            description: 'A premier 5,000-seat venue in the heart of the city with full AV production, breakout rooms and on-site catering.',
            address: {
                line1: '100 Convention Boulevard', city: 'Mumbai', state: 'Maharashtra',
                country: 'India', postalCode: '400001',
                mapLink: 'https://maps.google.com/?q=100+Convention+Boulevard+Mumbai',
            },
            capacity: 5000,
            amenities: ['WiFi', 'Parking', 'Catering', 'AV Equipment', 'Stage'],
            contactEmail: 'bookings@grandconvention.example',
            contactPhone: '+91 22 4000 1000',
            pricePerDay: 250000,
            managedBy: admin._id,
        },
        {
            name: 'Innovation Tech Hub',
            description: 'A modern co-working and event space built for meetups, hackathons and product launches.',
            address: {
                line1: '200 Innovation Drive', city: 'Bengaluru', state: 'Karnataka',
                country: 'India', postalCode: '560001',
            },
            capacity: 300,
            amenities: ['WiFi', 'Projector', 'Whiteboards', 'Coffee Bar'],
            contactEmail: 'events@innovationhub.example',
            contactPhone: '+91 80 4000 2000',
            pricePerDay: 75000,
            managedBy: organizer._id,
        },
        {
            name: 'Sunset Amphitheatre',
            description: 'An open-air amphitheatre with panoramic views, purpose-built for concerts and festivals.',
            address: {
                line1: '350 Sunset Avenue', city: 'Goa', state: 'Goa',
                country: 'India', postalCode: '403001',
            },
            capacity: 10000,
            amenities: ['Sound System', 'Lighting', 'VIP Sections', 'Food Vendors'],
            contactEmail: 'book@sunsetamp.example',
            contactPhone: '+91 832 4000 3000',
            pricePerDay: 400000,
            managedBy: admin._id,
        },
    ]);

    // ── Events ─────────────────────────────────────────────────────────────
    const events = await Event.create([
        {
            title: 'TechConf 2026 — The Future of AI',
            description: 'Two days with leading AI researchers and practitioners covering foundation models, applied machine learning and the future of human-AI collaboration.',
            category: 'conference',
            organizer: organizer._id,
            venueRef: conventionCentre._id,
            physicalLocation: {
                addressLine1: conventionCentre.address.line1,
                city: conventionCentre.address.city,
                state: conventionCentre.address.state,
                country: conventionCentre.address.country,
                postalCode: conventionCentre.address.postalCode,
                mapLink: conventionCentre.address.mapLink,
            },
            startDate: daysFromNow(10),
            endDate: daysFromNow(11),
            startTime: '09:00', endTime: '18:00',
            ticketTypes: [
                { name: 'General Admission', price: 2999, quantity: 500, sold: 120, description: 'Full conference access', benefits: ['All sessions', 'Lunch included'] },
                { name: 'VIP Pass', price: 7999, quantity: 50, sold: 20, description: 'Premium access', benefits: ['All sessions', 'Networking dinner', 'Speaker meet & greet'] },
            ],
            maxAttendees: 550,
            currentAttendees: 140,
            tags: ['ai', 'machine learning', 'technology'],
            status: 'published',
            isFeatured: true,
            organizerUpiId: 'skyline.events@okaxis',
            requirements: 'Bring a laptop for the hands-on labs.',
            refundPolicy: 'Full refund up to 7 days before the event.',
            language: 'English',
        },
        {
            title: 'Summer Music Festival 2026',
            description: 'Three days of live music across five stages, from indie rock to electronic dance, under the open sky.',
            category: 'festival',
            organizer: organizer._id,
            venueRef: amphitheatre._id,
            physicalLocation: {
                addressLine1: amphitheatre.address.line1,
                city: amphitheatre.address.city,
                state: amphitheatre.address.state,
                country: amphitheatre.address.country,
                mapLink: amphitheatre.address.mapLink,
            },
            startDate: daysFromNow(20),
            endDate: daysFromNow(22),
            startTime: '12:00', endTime: '23:00',
            ticketTypes: [
                { name: '1-Day Pass', price: 899, quantity: 2000, sold: 850, description: 'Single day access', benefits: ['All stages', 'Food vendors'] },
                { name: '3-Day Festival Pass', price: 1999, quantity: 1000, sold: 430, description: 'Full festival experience', benefits: ['All stages', 'Camping', 'Priority entry'] },
            ],
            maxAttendees: 3000,
            currentAttendees: 1280,
            tags: ['music', 'festival', 'live music'],
            status: 'published',
            isFeatured: true,
            organizerUpiId: 'skyline.events@okaxis',
            refundPolicy: 'Tickets are non-refundable but transferable.',
        },
        {
            title: 'Startup Networking Night',
            description: 'Meet founders, investors and operators shaping the ecosystem. Pitch your idea, find a co-founder and discover funding opportunities.',
            category: 'networking',
            organizer: organizer._id,
            venueRef: techHub._id,
            physicalLocation: {
                addressLine1: techHub.address.line1,
                city: techHub.address.city,
                state: techHub.address.state,
                country: techHub.address.country,
            },
            startDate: daysFromNow(5),
            endDate: daysFromNow(5),
            startTime: '18:00', endTime: '22:00',
            ticketTypes: [
                { name: 'Standard', price: 0, quantity: 200, sold: 87, description: 'Free admission', benefits: ['Networking session', 'Drinks included'] },
                { name: 'Premium Networker', price: 499, quantity: 50, sold: 18, description: 'Enhanced networking', benefits: ['Priority seating', 'Investor access'] },
            ],
            maxAttendees: 250,
            currentAttendees: 105,
            tags: ['networking', 'startup', 'founders'],
            status: 'published',
            organizerUpiId: 'skyline.events@okaxis',
        },
        {
            title: 'Full-Stack Web Development Workshop',
            description: 'A hands-on eight-hour workshop building a complete application with React, Node.js and MongoDB. Ideal for intermediate developers.',
            category: 'workshop',
            organizer: organizer._id,
            venueRef: techHub._id,
            physicalLocation: {
                addressLine1: techHub.address.line1,
                city: techHub.address.city,
                state: techHub.address.state,
                country: techHub.address.country,
            },
            startDate: daysFromNow(3),
            endDate: daysFromNow(3),
            startTime: '10:00', endTime: '18:00',
            ticketTypes: [
                { name: 'Workshop Seat', price: 1499, quantity: 30, sold: 22, description: 'Full workshop access', benefits: ['Hands-on project', 'Course materials', 'Certificate'] },
            ],
            maxAttendees: 30,
            currentAttendees: 22,
            tags: ['react', 'node.js', 'mongodb', 'workshop'],
            status: 'published',
            organizerUpiId: 'skyline.events@okaxis',
            requirements: 'Bring a laptop with Node.js installed.',
        },
        {
            title: 'Community Yoga in the Park',
            description: 'A free, all-levels sunrise yoga session. Mats provided — arrive ten minutes early to settle in.',
            category: 'sports',
            organizer: organizer._id,
            physicalLocation: {
                addressLine1: 'Central Park, Gate 2', city: 'Pune', state: 'Maharashtra', country: 'India',
            },
            startDate: daysFromNow(7),
            endDate: daysFromNow(7),
            startTime: '06:30', endTime: '07:30',
            ticketTypes: [
                { name: 'Free Entry', price: 0, quantity: 60, sold: 12, description: 'Complimentary session' },
            ],
            maxAttendees: 60,
            currentAttendees: 12,
            tags: ['yoga', 'wellness', 'fitness'],
            status: 'published',
        },
    ]);

    // ── Tickets ────────────────────────────────────────────────────────────
    const makeTicket = async ({ event, attendeeUser, typeName, price, paymentStatus }) => {
        const ticketId = uuidv4();
        const ticketType = event.ticketTypes.find(t => t.name === typeName);
        const qrCode = await QRCode.toDataURL(
            `Event: ${event.title}\nAttendee: ${attendeeUser.name}\nTicket: ${typeName} (Qty: 1)\nID: ${ticketId}\n\nPlease present this QR code at the event entrance for scanning.`
        );
        return {
            ticketId,
            event: event._id,
            attendee: attendeeUser._id,
            ticketType: { name: typeName, price, description: ticketType?.description || '' },
            quantity: 1,
            totalAmount: price,
            paymentStatus,
            status: 'active',
            organizerUpiId: event.organizerUpiId || '',
            upiTransactionRef: price > 0 ? 'UTR' + ticketId.replace(/-/g, '').slice(0, 10).toUpperCase() : '',
            paymentConfirmedAt: new Date(),
            paymentConfirmedBy: event.organizer,
            qrCode,
            attendeeDetails: { name: attendeeUser.name, email: attendeeUser.email, phone: attendeeUser.phone || '' },
        };
    };

    await Ticket.create([
        await makeTicket({ event: events[0], attendeeUser: attendee, typeName: 'General Admission', price: 2999, paymentStatus: 'confirmed' }),
        await makeTicket({ event: events[2], attendeeUser: attendee, typeName: 'Standard', price: 0, paymentStatus: 'confirmed' }),
        await makeTicket({ event: events[1], attendeeUser: secondAttendee, typeName: '1-Day Pass', price: 899, paymentStatus: 'confirmed' }),
    ]);

    // ── Connections ────────────────────────────────────────────────────────
    attendee.connections = [secondAttendee._id];
    secondAttendee.connections = [attendee._id];
    secondAttendee.connectionRequests = [organizer._id];
    await Promise.all([attendee.save(), secondAttendee.save()]);

    console.log('\nSeed data created successfully.');
    console.log('\nDemo accounts (password: password123)');
    console.log('  Admin      admin@eventhub.com');
    console.log('  Organizer  alice@eventhub.com');
    console.log('  Attendee   bob@eventhub.com');
    console.log('  Attendee   carol@eventhub.com');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch(async (err) => {
    console.error('Seeding failed:', err.message);
    await mongoose.disconnect().catch(() => { });
    process.exit(1);
});
