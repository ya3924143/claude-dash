export interface StdinData {
    transcript_path?: string;
    cwd?: string;
    model?: {
        id?: string;
        display_name?: string;
    };
    context_window?: {
        context_window_size?: number;
        current_usage?: {
            input_tokens?: number;
            output_tokens?: number;
            cache_creation_input_tokens?: number;
            cache_read_input_tokens?: number;
        } | null;
        used_percentage?: number | null;
        remaining_percentage?: number | null;
    };
    rate_limits?: {
        five_hour?: {
            used_percentage?: number;
            resets_at?: number;
        };
        seven_day?: {
            used_percentage?: number;
            resets_at?: number;
        };
        seven_day_sonnet?: {
            used_percentage?: number;
            resets_at?: number;
        };
    };
}
export interface UsageData {
    planName: string | null;
    fiveHour: number | null;
    sevenDay: number | null;
    sevenDaySonnet: number | null;
    fiveHourResetAt: Date | null;
    sevenDayResetAt: Date | null;
    sevenDaySonnetResetAt: Date | null;
    apiUnavailable?: boolean;
    apiError?: string;
}
export declare function isLimitReached(data: UsageData): boolean;
export interface ModelCount {
    O: number;
    S: number;
    H: number;
    tokens: number;
}
export interface TurnStats {
    models: ModelCount;
    totalTokens: number;
}
export interface SessionStats {
    lastTurn: TurnStats;
    currentTurn: TurnStats;
    session: TurnStats;
}
export type BarStyle = 'block' | 'half' | 'gradient' | 'dot' | 'circle' | 'ascii';
export type ContextIndicator = 'bar' | 'circle';
export type TimeFormat = 'absolute' | 'relative' | 'both';
export type Layout = 'compact' | 'standard' | 'dashboard';
export type ColorScheme = 'vibrant' | 'muted' | 'mono-green' | 'mono-blue';
export interface DashConfig {
    preset: string;
    layout: Layout;
    barStyle: BarStyle;
    contextIndicator: ContextIndicator;
    timeFormat: TimeFormat;
    colorScheme: ColorScheme;
    showLastTurn: boolean;
    showCurrentTurn: boolean;
    showSessionStats: boolean;
    showPlanName: boolean;
    showResetTime: boolean;
    barWidth: number;
}
export interface RenderContext {
    stdin: StdinData;
    config: DashConfig;
    usageData: UsageData | null;
    sessionStats: SessionStats;
    contextPercent: number;
}
//# sourceMappingURL=types.d.ts.map