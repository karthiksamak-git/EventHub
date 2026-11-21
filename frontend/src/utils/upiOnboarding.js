// The "set up your UPI ID first" prompt is shown only once per account, right
// after sign up. The flag is kept per user id so switching accounts on the same
// browser never suppresses another account's first prompt.
const keyFor = (userId) => `eventhub:upi-prompt-seen:${userId}`;

export const hasSeenUpiPrompt = (userId) => {
    if (!userId) return true;
    try {
        return localStorage.getItem(keyFor(userId)) === '1';
    } catch {
        return false;
    }
};

export const markUpiPromptSeen = (userId) => {
    if (!userId) return;
    try {
        localStorage.setItem(keyFor(userId), '1');
    } catch {
        // Storage can be unavailable (private mode); the prompt then simply shows again later.
    }
};
