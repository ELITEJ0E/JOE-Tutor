import React, { memo, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

export type SettingsOption = { value: string; label: string };
type Props = {
  id?: string;
  value: string;
  options: readonly (SettingsOption | string)[];
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
};

/**
 * One reliable, accessible control for font and language preferences.
 * A real HTML select uses the system picker on phones and keyboard navigation
 * on desktop. It keeps the custom-dropdown appearance without a floating
 * option menu being clipped by the Settings sheet's scroll container.
 */
const SettingsDropdown = memo(function SettingsDropdown({
  id, value, options, onChange, label, placeholder,
}: Props) {
  const normalized = useMemo(() =>
    options.map(item => typeof item === 'string'
      ? { value: item, label: item }
      : item
    ), [options]);

  return (
    <div className="custom-dropdown-container joe-native-dropdown">
      <select
        id={id}
        aria-label={label}
        className="custom-dropdown-trigger joe-native-dropdown-select"
        value={value}
        onChange={event => onChange(event.currentTarget.value)}
      >
        {placeholder && !normalized.some(option => option.value === value) && (
          <option value="" disabled>{placeholder}</option>
        )}
        {normalized.map(option =>
          <option key={option.value} value={option.value}>{option.label}</option>
        )}
      </select>
      <ChevronDown className="joe-native-dropdown-chevron" size={16} aria-hidden="true" />
    </div>
  );
});
export default SettingsDropdown;
