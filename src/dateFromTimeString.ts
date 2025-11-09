type InputParams = {
    date: Date;
    timeString: string;
};

type OutputParams = Date;

function dateFromTimeString({ date, timeString }: InputParams): OutputParams {
    const parts = timeString.split(':').map(Number);
    const hours = parts[0]!;
    const minutes = parts[1]!;
    const seconds = parts[2] ?? 0;
    const dateTime = new Date(date);

    dateTime.setHours(hours, minutes, seconds, 0);

    return dateTime;
}

export { dateFromTimeString };
