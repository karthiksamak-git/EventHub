import { format } from 'date-fns';

/**
 * Events store a calendar date (midnight UTC) plus separate start/end time strings.
 * Formatting those values with local time shifts the day backwards for viewers west
 * of UTC, so always render the UTC calendar day the organizer actually picked.
 */
export const eventDay = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

export const formatEventDate = (value, pattern = 'MMM d, yyyy') => {
    const day = eventDay(value);
    return day ? format(day, pattern) : '';
};

/** Local midnight of today, used for calendar-day comparisons. */
export const todayCalendar = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/** True when the event's calendar date is today or later (local calendar day). */
export const isTodayOrLater = (value) => {
    const day = eventDay(value);
    return day ? day.getTime() >= todayCalendar().getTime() : false;
};

export const pluralize = (count, singular, plural = `${singular}s`) =>
    `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
