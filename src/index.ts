import fs from 'fs';
import { addDays, addMinutes, subMinutes } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { createEvents, type EventAttributes } from 'ics';
import SunCalc from 'suncalc';
import { dateFromTimeString } from './dateFromTimeString.js';
import { calculateSleepDuration } from './sleepDuration.js';

if (
    !process.env.LATITUDE ||
    !process.env.LONGITUDE ||
    !process.env.TIME_ZONE ||
    !process.env.CURRENT_WAKE_UP_TIME
) {
    console.error(
        'Please set LATITUDE, LONGITUDE, TIME_ZONE, and CURRENT_WAKE_UP_TIME environment variables before running the script.'
    );
    process.exit(1);
}

const latitude = parseFloat(process.env.LATITUDE);
const longitude = parseFloat(process.env.LONGITUDE);
const timeZone = process.env.TIME_ZONE;

const currentWakeupTime = process.env.CURRENT_WAKE_UP_TIME;
const nextWakeupEarliestTime = process.env.NEXT_WAKE_UP_EARLIEST_TIME || null;
const nextWakeupLatestTime = process.env.NEXT_WAKE_UP_LATEST_TIME || null;

const badSleepMinutes = parseInt(process.env.BAD_SLEEP_MINUTES || '30');
const windDownBeforeSleepMinutes = parseInt(process.env.WIND_DOWN_BEFORE_SLEEP_MINUTES || '60');
const breakfastAfterWakeUpMinutes = parseInt(process.env.BREAKFAST_AFTER_WAKE_UP_MINUTES || '45');
const dinnerBeforeSleepMinutes = parseInt(process.env.DINNER_BEFORE_SLEEP_MINUTES || '180');
const workingHours = parseInt(process.env.WORKING_HOURS || '8');

const date = new Date(); // local date and time
const times = SunCalc.getTimes(date, latitude, longitude);
const timesNextDay = SunCalc.getTimes(addDays(date, 1), latitude, longitude);
const fmt = 'yyyy-MM-dd HH:mm';

console.log('Dawn (civil):', formatInTimeZone(times.dawn, timeZone, fmt));
console.log('Sunrise:', formatInTimeZone(times.sunrise, timeZone, fmt));
console.log('Solar noon:', formatInTimeZone(times.solarNoon, timeZone, fmt));
console.log('Sunset:', formatInTimeZone(times.sunset, timeZone, fmt));
console.log('Dusk (civil):', formatInTimeZone(times.dusk, timeZone, fmt));
console.log('\nNext day:');
console.log('Dawn (civil):', formatInTimeZone(timesNextDay.dawn, timeZone, fmt));
console.log('Sunrise:', formatInTimeZone(timesNextDay.sunrise, timeZone, fmt));
console.log('-----------------------------------');

const icsEvents: EventAttributes[] = [];

// sleeping
const requiredSleepHours = calculateSleepDuration({
    date,
    latitude,
    longitude,
    badSleepMinutes,
});
const requiredSleepMinutes = requiredSleepHours * 60;

const wakeUpTime = dateFromTimeString({ date, timeString: currentWakeupTime });
let nextWakeUpTime = timesNextDay.dawn;
let sleepStartTime = subMinutes(nextWakeUpTime, requiredSleepMinutes);

if (sleepStartTime < times.dusk) {
    sleepStartTime = times.dusk;
    nextWakeUpTime = addMinutes(sleepStartTime, requiredSleepMinutes);
}

if (nextWakeupEarliestTime) {
    const earliestNextWakeUpTime = dateFromTimeString({
        date: addDays(date, 1),
        timeString: nextWakeupEarliestTime,
    });

    if (nextWakeUpTime < earliestNextWakeUpTime) {
        nextWakeUpTime = earliestNextWakeUpTime;
        sleepStartTime = subMinutes(nextWakeUpTime, requiredSleepMinutes);
    }
}

if (nextWakeupLatestTime) {
    const latestNextWakeUpTime = dateFromTimeString({
        date: addDays(date, 1),
        timeString: nextWakeupLatestTime,
    });

    if (nextWakeUpTime > latestNextWakeUpTime) {
        nextWakeUpTime = latestNextWakeUpTime;
        sleepStartTime = subMinutes(nextWakeUpTime, requiredSleepMinutes);
    }
}

const windDownTime = subMinutes(sleepStartTime, windDownBeforeSleepMinutes);

const hours = Math.floor(requiredSleepHours);
const minutes = Math.round((requiredSleepHours - hours) * 60);

console.log('Current wake-up time:', formatInTimeZone(wakeUpTime, timeZone, fmt));
if (badSleepMinutes) console.log('Bad sleep minutes compensation:', badSleepMinutes);
console.log(`Required sleep today: ${hours} hours ${minutes} minutes`);
console.log('Winding down time before sleep:', formatInTimeZone(windDownTime, timeZone, fmt));
console.log('Recommended sleep start time:', formatInTimeZone(sleepStartTime, timeZone, fmt));
console.log('Recommended wake-up time:', formatInTimeZone(nextWakeUpTime, timeZone, fmt));
console.log('-----------------------------------');

// eating
const breakfastTime = addMinutes(wakeUpTime, breakfastAfterWakeUpMinutes);
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

console.log('Morning peak:', formatInTimeZone(morningPeak, timeZone, fmt));
console.log('Power nap time:', formatInTimeZone(powerNapTime, timeZone, fmt));
console.log('Afternoon peak:', formatInTimeZone(afternoonPeak, timeZone, fmt));
console.log('-----------------------------------');

// most efficient work windows
const morningHours = powerNapTime.getTime() - wakeUpTime.getTime();
const afternoonHours = windDownTime.getTime() - powerNapTime.getTime();
const workingMorningHours = workingHours * (morningHours / (morningHours + afternoonHours));
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
console.log('-----------------------------------');

const morningPeakHourStart = subMinutes(morningPeak, 30);
const afternoonPeakHourStart = subMinutes(afternoonPeak, 30);

createEvents(
    [
        {
            start: [
                breakfastTime.getFullYear(),
                breakfastTime.getMonth() + 1,
                breakfastTime.getDate(),
                breakfastTime.getHours(),
                breakfastTime.getMinutes(),
            ],
            duration: { minutes: 30 },
            title: 'Breakfast',
        },
        {
            start: [
                lunchTime.getFullYear(),
                lunchTime.getMonth() + 1,
                lunchTime.getDate(),
                lunchTime.getHours(),
                lunchTime.getMinutes(),
            ],
            duration: { minutes: 60 },
            title: 'Lunch',
            alarms: [
                {
                    action: 'display',
                    trigger: { minutes: 30, before: true },
                },
            ],
        },
        {
            start: [
                dinnerTime.getFullYear(),
                dinnerTime.getMonth() + 1,
                dinnerTime.getDate(),
                dinnerTime.getHours(),
                dinnerTime.getMinutes(),
            ],
            duration: { minutes: 30 },
            title: 'Dinner',
            alarms: [
                {
                    action: 'display',
                    trigger: { minutes: 30, before: true },
                    description: 'Stop the work and relax!',
                },
            ],
        },
        {
            start: [
                windDownTime.getFullYear(),
                windDownTime.getMonth() + 1,
                windDownTime.getDate(),
                windDownTime.getHours(),
                windDownTime.getMinutes(),
            ],
            end: [
                sleepStartTime.getFullYear(),
                sleepStartTime.getMonth() + 1,
                sleepStartTime.getDate(),
                sleepStartTime.getHours(),
                sleepStartTime.getMinutes(),
            ],
            title: 'Wind Down',
        },
        {
            start: [
                morningPeakHourStart.getFullYear(),
                morningPeakHourStart.getMonth() + 1,
                morningPeakHourStart.getDate(),
                morningPeakHourStart.getHours(),
                morningPeakHourStart.getMinutes(),
            ],
            duration: { minutes: 60 },
            title: 'Morning peak hour',
        },
        {
            start: [
                afternoonPeakHourStart.getFullYear(),
                afternoonPeakHourStart.getMonth() + 1,
                afternoonPeakHourStart.getDate(),
                afternoonPeakHourStart.getHours(),
                afternoonPeakHourStart.getMinutes(),
            ],
            duration: { minutes: 60 },
            title: 'Afternoon peak hour',
        },
    ],
    (error, value) => {
        if (error) {
            console.error(error);

            return;
        }
        const fileName = `exports/schedule-${formatInTimeZone(date, timeZone, 'yyyy-MM-dd')}.ics`;

        fs.writeFileSync(fileName, value);
        console.log(`✅ ${fileName} saved with`, icsEvents.length, 'events');
    }
);
