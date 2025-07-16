import { Input } from '@/components/ui/input';

interface StringFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    error?: string;
    description?: string;
}

const StringField = ({
    id,
    label,
    value,
    onChange,
    placeholder,
    required = false,
    error,
    description
}: StringFieldProps) => {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium">
                {label} {required && '*'}
            </label>
            <Input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={error ? 'border-red-500' : ''}
            />
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default StringField;
