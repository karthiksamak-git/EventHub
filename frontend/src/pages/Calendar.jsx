import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, addMonths, subMonths, getDay } from 'date-fns';
import { eventsAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Calendar.css';

const CATEGORY_COLORS = {
    conference: '#6C63FF', workshop: '#4ECDC4', concert: '#FF6B6B',
    sports: '#FFE66D', networking: '#A8FF78', festival: '#FF9F43',
    exhibition: '#48dbfb', other: '#a29bfe'
};

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await eventsAPI.getCalendar({
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear()
            });
            setEvents(res.data.events || []);
        } catch { setEvents([]); }
        setLoading(false);
    }, [currentDate]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    const startDay = getDay(startOfMonth(currentDate));
    const selectedEvents = selectedDay ? events.filter(e => isSameDay(new Date(e.startDate), selectedDay)) : [];

    return (
        <div className="calendar-page">
            <div className="container">
                <div className="page-header">
                    <h1>Event <span className="gradient-text">Calendar</span></h1>
                    <p>Browse upcoming events by date</p>
                </div>
                <div className="calendar-layout">
                    <div className="calendar-main glass">
                        {}
                        <div className="cal-header">
                            <button className="cal-nav-btn" onClick={() => setCurrentDate(d => subMonths(d, 1))}><FiChevronLeft size={20} /></button>
                            <h2 className="cal-month">{format(currentDate, 'MMMM yyyy')}</h2>
                            <button className="cal-nav-btn" onClick={() => setCurrentDate(d => addMonths(d, 1))}><FiChevronRight size={20} /></button>
                        </div>

                        {}
                        <div className="cal-weekdays">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="cal-weekday">{d}</div>
                            ))}
                        </div>

                        {}
                        {loading ? (
                            <div className="loading-screen" style={{ minHeight: '300px' }}><div className="spinner"></div></div>
                        ) : (
                            <div className="cal-grid">
                                {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="cal-day empty"></div>)}
                                {days.map(day => {
                                    const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), day));
                                    const isSelected = selectedDay && isSameDay(day, selectedDay);
                                    return (
                                        <div key={day.toString()} className={`cal-day ${isToday(day) ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length ? 'has-events' : ''}`}
                                            onClick={() => setSelectedDay(isSelected ? null : day)}>
                                            <span className="cal-day-num">{format(day, 'd')}</span>
                                            <div className="cal-dots">
                                                {dayEvents.slice(0, 3).map((e, i) => (
                                                    <span key={i} className="cal-dot" style={{ background: CATEGORY_COLORS[e.category] || '#6C63FF' }} />
                                                ))}
                                                {dayEvents.length > 3 && <span className="cal-dot-more">+{dayEvents.length - 3}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {}
                        <div className="cal-legend">
                            {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                                <div key={cat} className="legend-item">
                                    <span className="legend-dot" style={{ background: color }}></span>
                                    <span>{cat}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="calendar-side">
                        <div className="glass side-panel">
                            <h3>{selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'Select a Date'}</h3>
                            {selectedDay ? (
                                selectedEvents.length > 0 ? (
                                    <div className="side-events">
                                        {selectedEvents.map(e => (
                                            <Link key={e._id} to={`/events/${e._id}`} className="side-event-card">
                                                <div className="side-event-dot" style={{ background: CATEGORY_COLORS[e.category] }}></div>
                                                <div>
                                                    <div className="side-event-title">{e.title}</div>
                                                    <div className="side-event-category badge badge-primary" style={{ marginTop: '0.3rem', display: 'inline-flex' }}>{e.category}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-day-events">
                                        <span>😴</span>
                                        <p>No events on this day</p>
                                        <Link to="/events/create" className="btn btn-primary btn-sm">Create Event</Link>
                                    </div>
                                )
                            ) : (
                                <div className="no-day-events">
                                    <span>👆</span>
                                    <p>Click a day to see events</p>
                                </div>
                            )}
                        </div>

                        {}
                        <div className="glass side-panel">
                            <h3>Upcoming This Month</h3>
                            {events.slice(0, 5).map(e => (
                                <Link key={e._id} to={`/events/${e._id}`} className="side-event-card">
                                    <div className="side-event-dot" style={{ background: CATEGORY_COLORS[e.category] }}></div>
                                    <div>
                                        <div className="side-event-title">{e.title}</div>
                                        <div className="side-event-date">{format(new Date(e.startDate), 'MMM d')}</div>
                                    </div>
                                </Link>
                            ))}
                            {events.length === 0 && <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>No events this month</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Calendar;
