export const RESET = '\x1b[0m';
export function dim(text) {
    return `\x1b[2m${text}${RESET}`;
}
export function bold(text) {
    return `\x1b[1m${text}${RESET}`;
}
export function red(text) {
    return `\x1b[31m${text}${RESET}`;
}
export function green(text) {
    return `\x1b[32m${text}${RESET}`;
}
export function yellow(text) {
    return `\x1b[33m${text}${RESET}`;
}
export function cyan(text) {
    return `\x1b[36m${text}${RESET}`;
}
export function magenta(text) {
    return `\x1b[35m${text}${RESET}`;
}
export function blue(text) {
    return `\x1b[34m${text}${RESET}`;
}
export function white(text) {
    return `\x1b[37m${text}${RESET}`;
}
export function brightGreen(text) {
    return `\x1b[92m${text}${RESET}`;
}
export function brightYellow(text) {
    return `\x1b[93m${text}${RESET}`;
}
export function brightBlue(text) {
    return `\x1b[94m${text}${RESET}`;
}
export function brightCyan(text) {
    return `\x1b[96m${text}${RESET}`;
}
export function brightMagenta(text) {
    return `\x1b[95m${text}${RESET}`;
}
export function brightWhite(text) {
    return `\x1b[97m${text}${RESET}`;
}
export function getContextColor(percent, scheme) {
    if (scheme === 'mono-green')
        return '\x1b[32m';
    if (scheme === 'mono-blue')
        return '\x1b[34m';
    // vibrant and muted use the same thresholds for context
    if (percent < 20)
        return '\x1b[32m'; // green
    if (percent < 40)
        return '\x1b[92m'; // brightGreen
    if (percent < 60)
        return '\x1b[33m'; // yellow
    if (percent < 80)
        return '\x1b[93m'; // brightYellow
    return '\x1b[31m'; // red
}
export function getQuotaColor(percent, scheme) {
    if (scheme === 'mono-green')
        return '\x1b[32m';
    if (scheme === 'mono-blue')
        return '\x1b[34m';
    if (scheme === 'vibrant') {
        if (percent < 75)
            return '\x1b[94m'; // brightBlue
        if (percent < 90)
            return '\x1b[95m'; // brightMagenta
        return '\x1b[31m'; // red
    }
    // muted
    if (percent < 75)
        return '\x1b[34m'; // blue
    if (percent < 90)
        return '\x1b[35m'; // magenta
    return '\x1b[31m'; // red
}
export function getModelColor(model, scheme) {
    if (scheme === 'mono-green')
        return '\x1b[32m';
    if (scheme === 'mono-blue')
        return '\x1b[34m';
    if (scheme === 'vibrant') {
        if (model === 'O')
            return '\x1b[96m'; // brightCyan
        if (model === 'S')
            return '\x1b[92m'; // brightGreen
        return '\x1b[93m'; // brightYellow (H)
    }
    // muted
    if (model === 'O')
        return '\x1b[36m'; // cyan
    if (model === 'S')
        return '\x1b[32m'; // green
    return '\x1b[33m'; // yellow (H)
}
//# sourceMappingURL=colors.js.map