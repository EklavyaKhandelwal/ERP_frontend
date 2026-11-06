import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js/min';
import { allCountries } from 'country-region-data';

type PhoneCountry = {
  code: CountryCode;
  name: string;
  callingCode: string;
};

const countryNames = new Map<string, string>(
  allCountries.map(([name, code]) => [code, name]),
);
const phoneCountries: PhoneCountry[] = getCountries()
  .flatMap(code => {
    const name = countryNames.get(code);
    if (!name) return [];
    return [{ code, name, callingCode: getCountryCallingCode(code) }];
  })
  .sort((a, b) => a.name.localeCompare(b.name));

function getCountryForPhone(phone: string): PhoneCountry | undefined {
  if (!phone.startsWith('+')) return undefined;
  return [...phoneCountries]
    .sort((a, b) => b.callingCode.length - a.callingCode.length)
    .find(country => phone.startsWith(`+${country.callingCode}`));
}

interface Props {
  value: string;
  onChange: (phone: string) => void;
  label: string;
  defaultCountryCode?: string;
  required?: boolean;
}

export const PhoneNumberField: React.FC<Props> = ({
  value,
  onChange,
  label,
  defaultCountryCode,
  required = false,
}) => {
  const [manuallySelectedCountry, setManuallySelectedCountry] = useState<CountryCode | null>(null);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const countryFromValue = getCountryForPhone(value);
  const defaultCountry = phoneCountries.find(country => country.code === defaultCountryCode);
  const manualCountry = phoneCountries.find(option => option.code === manuallySelectedCountry);
  const country = (manualCountry && value.startsWith(`+${manualCountry.callingCode}`) ? manualCountry : undefined)
    ?? countryFromValue
    ?? (manualCountry ?? defaultCountry)
    ?? phoneCountries.find(option => option.code === 'US')
    ?? phoneCountries[0];
  const localNumber = countryFromValue
    ? value.slice(`+${countryFromValue.callingCode}`.length).trim()
    : value.replace(/^\+\d+\s*/, '');
  const filteredCountries = phoneCountries.filter(option => (
    `${option.name} +${option.callingCode}`.toLocaleLowerCase().includes(countryQuery.trim().toLocaleLowerCase())
  ));
  const selectedIndex = filteredCountries.findIndex(option => option.code === country.code);

  const updateCountry = (code: CountryCode) => {
    const nextCountry = phoneCountries.find(option => option.code === code);
    if (!nextCountry) return;
    setManuallySelectedCountry(code);
    onChange(localNumber ? `+${nextCountry.callingCode} ${localNumber}` : '');
    setIsCountryMenuOpen(false);
    setCountryQuery('');
  };

  useEffect(() => {
    if (!isCountryMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (countryButtonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setIsCountryMenuOpen(false);
      setCountryQuery('');
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isCountryMenuOpen]);

  useLayoutEffect(() => {
    if (!isCountryMenuOpen) return;
    const updatePosition = () => {
      const bounds = countryButtonRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const below = window.innerHeight - bounds.bottom - 8;
      const above = bounds.top - 8;
      const openAbove = below < 240 && above > below;
      const maxHeight = Math.max(100, Math.min(300, openAbove ? above : below));
      setMenuPosition({
        top: openAbove ? Math.max(8, bounds.top - maxHeight - 4) : bounds.bottom + 4,
        left: Math.max(8, bounds.left),
        width: Math.max(bounds.width, 240),
        maxHeight,
      });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isCountryMenuOpen]);

  useEffect(() => {
    if (selectedIndex >= 0) optionRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, isCountryMenuOpen]);

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(145px, 0.9fr) minmax(0, 1.5fr)', gap: '8px' }}>
        <button
          ref={countryButtonRef}
          type="button"
          className="form-control"
          aria-label={`${label} country calling code`}
          aria-haspopup="listbox"
          aria-expanded={isCountryMenuOpen}
          aria-controls={listId}
          onClick={() => {
            setIsCountryMenuOpen(open => !open);
            setCountryQuery('');
          }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', textAlign: 'left', overflow: 'hidden', whiteSpace: 'nowrap' }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{country.name} (+{country.callingCode})</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <input
          type="tel"
          className="form-control"
          aria-label={label}
          autoComplete="tel-national"
          required={required}
          maxLength={30}
          placeholder="Phone number"
          value={localNumber}
          onChange={event => onChange(event.target.value ? `+${country.callingCode} ${event.target.value}` : '')}
          onBlur={() => {
            if (localNumber && !value.startsWith(`+${country.callingCode}`)) {
              onChange(`+${country.callingCode} ${localNumber}`);
            }
          }}
        />
      </div>
      {isCountryMenuOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          aria-label={`${label} country calling code`}
          onWheel={event => event.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#FFFFFF',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-modal)',
            zIndex: 2200,
          }}
        >
          <input
            type="search"
            autoFocus
            aria-label="Search countries and calling codes"
            placeholder="Search country or code"
            className="form-control"
            value={countryQuery}
            onChange={event => setCountryQuery(event.target.value)}
            style={{ flex: '0 0 auto', margin: '8px', width: 'calc(100% - 16px)' }}
          />
          <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            {filteredCountries.length === 0 ? (
              <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>No matches</div>
            ) : filteredCountries.map((option, index) => (
              <button
                ref={element => { optionRefs.current[index] = element; }}
                key={option.code}
                type="button"
                role="option"
                aria-selected={option.code === country.code}
                onClick={() => updateCountry(option.code)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '9px 12px',
                  border: 0,
                  textAlign: 'left',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                  background: option.code === country.code ? 'var(--primary-light)' : '#FFFFFF',
                  cursor: 'pointer',
                }}
              >
                {option.name} (+{option.callingCode})
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
