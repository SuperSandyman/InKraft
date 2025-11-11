import { Input } from '@/components/ui/input';

interface DateFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    format?: string;
    required?: boolean;
    error?: string;
    description?: string;
}

/**
 * 日付文字列からyyyy, MM, ddを抽出
 */
const parseDateParts = (value: string): { year: string; month: string; day: string } | null => {
    const trimmed = value.trim();

    // yyyy-MM-dd or yyyy/MM/dd or yyyy:MM:dd
    let match = trimmed.match(/^(\d{4})[-/:.](\d{2})[-/:.](\d{2})$/);
    if (match) {
        return { year: match[1], month: match[2], day: match[3] };
    }

    // yyyyMMdd
    match = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) {
        return { year: match[1], month: match[2], day: match[3] };
    }

    // MM-dd-yyyy or MM/dd/yyyy
    match = trimmed.match(/^(\d{2})[-/:.](\d{2})[-/:.](\d{4})$/);
    if (match) {
        return { year: match[3], month: match[1], day: match[2] };
    }

    return null;
};

/**
 * フォーマット文字列に従って日付パーツを配置
 */
const formatDateParts = (parts: { year: string; month: string; day: string }, targetFormat: string): string => {
    let result = targetFormat;
    result = result.replace(/yyyy/i, parts.year);
    result = result.replace(/MM/g, parts.month);
    result = result.replace(/mm/g, parts.month);
    result = result.replace(/dd/i, parts.day);
    return result;
};

const DateField = ({
    id,
    label,
    value,
    onChange,
    format = 'yyyy-mm-dd',
    required = false,
    error,
    description
}: DateFieldProps) => {
    const formatDateForInput = (dateString: string): string => {
        if (!dateString) return '';
        const parts = parseDateParts(dateString);
        if (!parts) return dateString;
        // HTML date inputは常にyyyy-MM-dd
        return `${parts.year}-${parts.month}-${parts.day}`;
    };

    const formatDateForOutput = (dateString: string): string => {
        if (!dateString) return '';
        const parts = parseDateParts(dateString);
        if (!parts) return dateString;
        // スキーマ指定のフォーマットに変換
        return formatDateParts(parts, format);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputDate = e.target.value;
        onChange(formatDateForOutput(inputDate));
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium">
                {label} {required && '*'}
            </label>
            <Input
                id={id}
                type="date"
                value={formatDateForInput(value)}
                onChange={handleChange}
                className={error ? 'border-red-500' : ''}
            />
            {description && (
                <p className="text-sm text-muted-foreground">
                    {description} (形式: {format})
                </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default DateField;
