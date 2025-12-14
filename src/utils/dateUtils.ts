export function getWeekEnding(dateString: string) {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";

    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    const diff = 6 - day; // Days until Saturday
    const saturday = new Date(date);
    saturday.setDate(date.getDate() + diff);

    return saturday.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
