import { subMinutes, addDays, addMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import SunCalc from 'suncalc';
import { calculateSleepDuration } from './sleepDuration.js';

// Vienna coordinates – replace with your own
const latitude = 48.23489831873396;
const longitude = 16.32402058462267;
const timeZone = 'Europe/Vienna';

const date = new Date(); // local date and time
const times = SunCalc.getTimes(date, latitude, longitude);
const fmt = 'yyyy-MM-dd HH:mm';

console.log('Dawn (civil):', formatInTimeZone(times.dawn, timeZone, fmt));
console.log('Sunrise:', formatInTimeZone(times.sunrise, timeZone, fmt));
console.log('Solar noon:', formatInTimeZone(times.solarNoon, timeZone, fmt));
console.log('Sunset:', formatInTimeZone(times.sunset, timeZone, fmt));
console.log('Dusk (civil):', formatInTimeZone(times.dusk, timeZone, fmt));
console.log('-----------------------------------');

// sleeping

const requiredSleepHours = calculateSleepDuration({
    date,
    latitude,
    longitude,
});
const wakeUpTime = times.dawn;
const badSleepMinutes = 0; // extra time for bad sleep quality
const requiredSleepMinutes = requiredSleepHours * 60 + badSleepMinutes;
const sleepStartTime = addDays(subMinutes(wakeUpTime, requiredSleepMinutes), 1);
const windDownBeforeSleepMinutes = 60;
const windDownTime = subMinutes(sleepStartTime, windDownBeforeSleepMinutes);

const hours = Math.floor(requiredSleepHours);
const minutes = Math.round((requiredSleepHours - hours) * 60);

console.log(`Required sleep today: ${hours} hours ${minutes} minutes`);
console.log('Recommended wake-up time:', formatInTimeZone(wakeUpTime, timeZone, fmt));
console.log('Winding down time before sleep:', formatInTimeZone(windDownTime, timeZone, fmt));
console.log('Recommended sleep start time:', formatInTimeZone(sleepStartTime, timeZone, fmt));
console.log('-----------------------------------');

// eating
const breakfastAfterWakeUpMinutes = 45;
const breakfastTime = addMinutes(wakeUpTime, breakfastAfterWakeUpMinutes);
const dinnerBeforeSleepMinutes = 3 * 60;
const dinnerTime = subMinutes(sleepStartTime, dinnerBeforeSleepMinutes);
const halfwayBetweenMeals = new Date((breakfastTime.getTime() + dinnerTime.getTime()) / 2);
const lunchTime = new Date((times.solarNoon.getTime() + halfwayBetweenMeals.getTime()) / 2);
const midMorningSnackTime = new Date((breakfastTime.getTime() + lunchTime.getTime()) / 2);
const afternoonSnackTime = new Date((lunchTime.getTime() + dinnerTime.getTime()) / 2);

console.log('Recommended breakfast time:', formatInTimeZone(breakfastTime, timeZone, fmt));
console.log(
    'Recommended mid-morning snack time:',
    formatInTimeZone(midMorningSnackTime, timeZone, fmt)
);
console.log('Recommended lunch time:', formatInTimeZone(lunchTime, timeZone, fmt));
console.log(
    'Recommended afternoon snack time:',
    formatInTimeZone(afternoonSnackTime, timeZone, fmt)
);
console.log('Recommended dinner time:', formatInTimeZone(dinnerTime, timeZone, fmt));
console.log('-----------------------------------');

// peak times
const powerNapTime = addMinutes(lunchTime, 30);
const morningPeak = new Date((wakeUpTime.getTime() + powerNapTime.getTime()) / 2);
const afternoonPeak = new Date((powerNapTime.getTime() + windDownTime.getTime()) / 2);

console.log('Morning peak time:', formatInTimeZone(morningPeak, timeZone, fmt));
console.log('Power nap time:', formatInTimeZone(powerNapTime, timeZone, fmt));
console.log('Afternoon peak time:', formatInTimeZone(afternoonPeak, timeZone, fmt));
console.log('-----------------------------------');

// most efficient work windows
const workingHours = 8;
const morningHours = powerNapTime.getTime() - wakeUpTime.getTime();
const afternoonHours = windDownTime.getTime() - powerNapTime.getTime();
const workingMorningHours = 8 * (morningHours / (morningHours + afternoonHours));
const workingAfternoonHours = workingHours - workingMorningHours;
const morningWorkStart = subMinutes(morningPeak, (workingMorningHours / 2) * 60);
const morningWorkEnd = addMinutes(morningPeak, (workingMorningHours / 2) * 60);
const afternoonWorkStart = subMinutes(afternoonPeak, (workingAfternoonHours / 2) * 60);
const afternoonWorkEnd = addMinutes(afternoonPeak, (workingAfternoonHours / 2) * 60);

console.log('Working hours:', workingHours);
console.log(
    'Most efficient morning work window:',
    formatInTimeZone(morningWorkStart, timeZone, fmt),
    '-',
    formatInTimeZone(morningWorkEnd, timeZone, fmt)
);
console.log(
    'Most efficient afternoon work window:',
    formatInTimeZone(afternoonWorkStart, timeZone, fmt),
    '-',
    formatInTimeZone(afternoonWorkEnd, timeZone, fmt)
);
