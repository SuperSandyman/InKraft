interface BooleanFieldProps {
    id: string;
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    required?: boolean;
    error?: string;
    description?: string;
}

const BooleanField = ({ id, label, value, onChange, required = false, error, description }: BooleanFieldProps) => {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                {label} {required && '*'}
            </label>
            <div className="flex gap-4">
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name={id}
                        checked={value === true}
                        onChange={() => onChange(true)}
                        className="w-4 h-4"
                    />
                    はい
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        name={id}
                        checked={value === false}
                        onChange={() => onChange(false)}
                        className="w-4 h-4"
                    />
                    いいえ
                </label>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default BooleanField;
