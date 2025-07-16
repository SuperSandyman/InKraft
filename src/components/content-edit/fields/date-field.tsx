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
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';

        // yyyy/MM/dd形式からyyyy-mm-dd形式に変換
        if (format === 'yyyy/MM/dd') {
            return dateString.replace(/\//g, '-');
        }
        return dateString;
    };

    const formatDateForOutput = (dateString: string) => {
        if (!dateString) return '';

        // yyyy-mm-dd形式からyyyy/MM/dd形式に変換
        if (format === 'yyyy/MM/dd') {
            return dateString.replace(/-/g, '/');
        }
        return dateString;
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
