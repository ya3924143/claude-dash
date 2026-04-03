import { dim, brightWhite, red, yellow, RESET } from './colors.js';
import { renderBar } from './bars.js';
import { getQuotaColor } from './colors.js';
export function renderUsageLine(ctx) {
    const { usageData, config } = ctx;
    if (!usageData || !usageData.planName)
        return null;
    const { layout } = config;
    if (layout === 'dashboard') {
        return renderDashboardUsage(ctx);
    }
    return renderStandardUsage(ctx);
}
function renderStandardUsage(ctx) {
    const { usageData, config } = ctx;
    if (!usageData)
        return '';
    const { barStyle, barWidth, colorScheme, timeFormat, showResetTime } = config;
    const effectiveTimeFormat = showResetTime ? timeFormat : null;
    const fiveHourPart = renderQuotaSegment('5h', usageData.fiveHour, usageData.fiveHourResetAt, barWidth, barStyle, colorScheme, effectiveTimeFormat, usageData.apiUnavailable ?? false);
    const sevenDayPart = renderQuotaSegment('7d', usageData.sevenDay, usageData.sevenDayResetAt, barWidth, barStyle, colorScheme, effectiveTimeFormat, usageData.apiUnavailable ?? false);
    return `${fiveHourPart}  ${dim('│')}  ${sevenDayPart}`;
}
function renderDashboardUsage(ctx) {
    const { usageData, config } = ctx;
    if (!usageData)
        return '';
    const { barStyle, barWidth, colorScheme, timeFormat, showResetTime } = config;
    const apiUnavailable = usageData.apiUnavailable ?? false;
    const effectiveTimeFormat = showResetTime ? timeFormat : null;
    const fiveHourLine = renderDashboardQuotaLine('5h', usageData.fiveHour, usageData.fiveHourResetAt, barWidth, barStyle, colorScheme, effectiveTimeFormat, apiUnavailable);
    const sevenDayLine = renderDashboardQuotaLine('7d', usageData.sevenDay, usageData.sevenDayResetAt, barWidth, barStyle, colorScheme, effectiveTimeFormat, apiUnavailable);
    return `${fiveHourLine}\n${sevenDayLine}`;
}
function renderQuotaSegment(label, percent, resetAt, barWidth, barStyle, colorScheme, timeFormat, apiUnavailable) {
    const labelStr = dim(label);
    if (apiUnavailable) {
        return `${labelStr} ${yellow('⚠')}`;
    }
    if (percent === null) {
        return `${labelStr} ${dim('--')}`;
    }
    if (percent >= 100) {
        return `${labelStr} ${red('⚠ 已达上限')}`;
    }
    const colorCode = getQuotaColor(percent, colorScheme);
    const colorFn = (s) => `${colorCode}${s}${RESET}`;
    const bar = renderBar(percent, barWidth, barStyle, colorFn);
    const percentStr = `${colorCode}${percent}%${RESET}`;
    const timePart = (resetAt && timeFormat) ? ` ${formatResetTime(resetAt, timeFormat)}` : '';
    return `${labelStr} ${bar} ${percentStr}${timePart}`;
}
function renderDashboardQuotaLine(label, percent, resetAt, barWidth, barStyle, colorScheme, timeFormat, apiUnavailable) {
    const paddedLabel = label.padStart(2);
    const labelStr = dim(paddedLabel);
    if (apiUnavailable) {
        return `     ${labelStr}  ${yellow('⚠')}`;
    }
    if (percent === null) {
        return `     ${labelStr}  ${dim('--')}`;
    }
    if (percent >= 100) {
        return `     ${labelStr}  ${red('⚠ 已达上限')}`;
    }
    const colorCode = getQuotaColor(percent, colorScheme);
    const colorFn = (s) => `${colorCode}${s}${RESET}`;
    const bar = renderBar(percent, barWidth, barStyle, colorFn);
    const percentStr = `${colorCode}${percent}%${RESET}`;
    const timePart = (resetAt && timeFormat) ? ` ${formatResetTime(resetAt, timeFormat)}` : '';
    return `     ${labelStr}  ${bar} ${percentStr}${timePart}`;
}
function formatResetTime(resetAt, timeFormat) {
    const now = new Date();
    const timeLabel = dim('刷新时间:');
    switch (timeFormat) {
        case 'relative': {
            const relStr = formatRelative(now, resetAt);
            return `(${relStr})`;
        }
        case 'both': {
            const absStr = formatAbsoluteTime(now, resetAt);
            const relStr = formatRelative(now, resetAt);
            return `(${timeLabel} ${brightWhite(absStr)} / ${relStr})`;
        }
        default: {
            // absolute
            const absStr = formatAbsoluteTime(now, resetAt);
            return `(${timeLabel} ${brightWhite(absStr)})`;
        }
    }
}
function formatAbsoluteTime(now, resetAt) {
    const hh = resetAt.getHours().toString().padStart(2, '0');
    const mm = resetAt.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    const nowDay = now.toDateString();
    const resetDay = resetAt.toDateString();
    if (resetDay === nowDay) {
        return timeStr;
    }
    // Check if it's tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (resetAt.toDateString() === tomorrow.toDateString()) {
        return `明天 ${timeStr}`;
    }
    const month = (resetAt.getMonth() + 1).toString().padStart(2, '0');
    const day = resetAt.getDate().toString().padStart(2, '0');
    return `${month}/${day} ${timeStr}`;
}
function formatRelative(now, resetAt) {
    const diffMs = resetAt.getTime() - now.getTime();
    if (diffMs <= 0)
        return '0m';
    const totalMinutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}
//# sourceMappingURL=usage.js.map