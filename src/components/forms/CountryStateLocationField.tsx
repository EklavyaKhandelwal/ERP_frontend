import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { countries, findInitialSelection } from './locationCountries';

type Option = { value: string; label: string };
type MenuPosition = { top: number; left: number; width: number; maxHeight: number };

interface SearchableSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  disabled = false,
  required = false,
}) => {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hasTyped, setHasTyped] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const selectedLabel = options.find(option => option.value === value)?.label ?? '';
  const filteredOptions = !hasTyped || !query.trim()
    ? options
    : options.filter(option => option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  const closeMenu = () => {
    setIsOpen(false);
    setQuery('');
    setHasTyped(false);
    setActiveIndex(0);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (wrapperRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const bounds = wrapperRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const below = window.innerHeight - bounds.bottom - 8;
      const above = bounds.top - 8;
      const openAbove = below < 220 && above > below;
      const maxHeight = Math.max(100, Math.min(240, openAbove ? above : below));
      setMenuPosition({
        top: openAbove ? Math.max(8, bounds.top - maxHeight - 4) : bounds.bottom + 4,
        left: Math.max(8, bounds.left),
        width: bounds.width,
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
  }, [isOpen]);

  useEffect(() => {
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const chooseOption = (option: Option) => {
    onChange(option.value);
    closeMenu();
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth: 0 }}>
      <input
        role="combobox"
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={`${id}-options`}
        aria-activedescendant={isOpen && filteredOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        autoComplete="off"
        className="form-control"
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        value={isOpen && hasTyped ? query : selectedLabel}
        onFocus={event => {
          setQuery('');
          setHasTyped(false);
          setActiveIndex(0);
          setIsOpen(true);
          event.currentTarget.select();
        }}
        onChange={event => {
          setQuery(event.target.value);
          setHasTyped(true);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            closeMenu();
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex(index => Math.min(index + 1, filteredOptions.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(index => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
            event.preventDefault();
            chooseOption(filteredOptions[activeIndex]);
          }
        }}
      />
      {isOpen && menuPosition && createPortal(
        <div
          ref={menuRef}
          id={`${id}-options`}
          role="listbox"
          aria-label={ariaLabel}
          onWheel={event => event.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            background: '#FFFFFF',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-modal)',
            zIndex: 2000,
          }}
        >
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matches
            </div>
          ) : filteredOptions.map((option, index) => (
            <button
              ref={element => { optionRefs.current[index] = element; }}
              id={`${id}-option-${index}`}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseDown={event => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => chooseOption(option)}
              style={{
                display: 'block',
                width: '100%',
                padding: '9px 12px',
                border: 0,
                textAlign: 'left',
                fontSize: '13px',
                color: 'var(--text-main)',
                background: index === activeIndex ? 'var(--primary-light)' : '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

interface Props {
  value: string;
  onChange: (location: string) => void;
  label?: string;
  required?: boolean;
}

export const CountryStateLocationField: React.FC<Props> = ({
  value,
  onChange,
  label = 'Location',
  required = false,
}) => {
  const [initialSelection] = useState(() => findInitialSelection(value));
  const [countryCode, setCountryCode] = useState(initialSelection.countryCode);
  const [stateCode, setStateCode] = useState(initialSelection.stateCode);
  const country = countries.find(([, code]) => code === countryCode);
  const regions = country?.[2] ?? [];
  const countryOptions = countries.map(([name, code]) => ({ value: code, label: name }));
  const regionOptions = regions.map(([name, code]) => ({ value: code, label: name }));

  const updateCountry = (code: string) => {
    setCountryCode(code);
    setStateCode('');
    const selectedCountry = countries.find(([, countryCode]) => countryCode === code);
    onChange(selectedCountry && selectedCountry[2].length === 0 ? selectedCountry[0] : '');
  };

  const updateState = (code: string) => {
    setStateCode(code);
    const region = regions.find(([, shortCode]) => shortCode === code);
    onChange(region && country ? `${region[0]}, ${country[0]}` : '');
  };

  return (
    <div className="form-group">
      <span className="form-label">{label}</span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <SearchableSelect
          value={countryCode}
          options={countryOptions}
          onChange={updateCountry}
          placeholder="Search countries"
          ariaLabel={`${label} country`}
          required={required}
        />
        <SearchableSelect
          value={stateCode}
          options={regionOptions}
          onChange={updateState}
          placeholder={countryCode ? 'Search states / regions' : 'Select country first'}
          ariaLabel={`${label} state or region`}
          disabled={!countryCode || regions.length === 0}
          required={regions.length > 0}
        />
      </div>
      {countryCode && regions.length === 0 && (
        <span style={{ display: 'block', marginTop: '5px', color: 'var(--text-muted)', fontSize: '11px' }}>
          No state or region list is available for this country; the country will be saved as the location.
        </span>
      )}
    </div>
  );
};
