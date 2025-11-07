import SunCalc from 'suncalc';

type InputParams = {
    date: Date;
    latitude: number;
    longitude: number;
};

type OutputParams = number; // required sleep duration in hours

const sleepLength = 8;
const sleepSeasonalAdjustment = 0.5;

function calculateSleepDuration(params: InputParams): OutputParams {
    const { date, latitude, longitude } = params;

    // Summer solstice (around June 21)
    const summerSolstice = new Date(date.getFullYear(), 5, 21);
    const summerTimes = SunCalc.getTimes(summerSolstice, latitude, longitude);
    const maxDayLength =
        (summerTimes.sunset.getTime() - summerTimes.sunrise.getTime()) / (1000 * 60 * 60);

    // Winter solstice (around December 21)
    const winterSolstice = new Date(date.getFullYear(), 11, 21);
    const winterTimes = SunCalc.getTimes(winterSolstice, latitude, longitude);
    const minDayLength =
        (winterTimes.sunset.getTime() - winterTimes.sunrise.getTime()) / (1000 * 60 * 60);

    // Current day length
    const currentTimes = SunCalc.getTimes(date, latitude, longitude);
    const currentDayLength =
        (currentTimes.sunset.getTime() - currentTimes.sunrise.getTime()) / (1000 * 60 * 60);

    // Linear interpolation
    // Longer day -> less sleep, shorter day -> more sleep
    const dayLengthRange = maxDayLength - minDayLength;
    const normalizedDayLength = (currentDayLength - minDayLength) / dayLengthRange; // 0 (winter) to 1 (summer)

    const minSleep = sleepLength - sleepSeasonalAdjustment; // summer minimum
    const maxSleep = sleepLength + sleepSeasonalAdjustment; // winter maximum

    // Inverse ratio: longer day = less sleep
    const sleepDuration = maxSleep - normalizedDayLength * (maxSleep - minSleep);

    return sleepDuration;
}

export { calculateSleepDuration };
