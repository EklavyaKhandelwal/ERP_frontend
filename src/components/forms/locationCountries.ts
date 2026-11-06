import { allCountries } from 'country-region-data';

export const countries = [...allCountries].sort(([nameA], [nameB]) => nameA.localeCompare(nameB));

export function findInitialSelection(value: string): { countryCode: string; stateCode: string } {
  const parts = value.split(',').map(part => part.trim()).filter(Boolean);
  const lastPart = parts.at(-1)?.toLocaleLowerCase();
  if (!lastPart) return { countryCode: '', stateCode: '' };

  const country = countries.find(([name, code]) => (
    name.toLocaleLowerCase() === lastPart
    || code.toLocaleLowerCase() === lastPart
  ));
  if (country) {
    const stateName = parts.at(-2)?.toLocaleLowerCase();
    const state = country[2].find(([name, code]) => (
      name.toLocaleLowerCase() === stateName
      || code.toLocaleLowerCase() === stateName
    ));
    return { countryCode: country[1], stateCode: state?.[1] ?? '' };
  }

  const matches = countries.flatMap(([, countryCode, regions]) => (
    regions
      .filter(([name, code]) => (
        name.toLocaleLowerCase() === lastPart
        || code.toLocaleLowerCase() === lastPart
      ))
      .map(([, code]) => ({ countryCode, stateCode: code }))
  ));
  const selection = matches.find(match => match.countryCode === 'US')
    ?? (matches.length === 1 ? matches[0] : undefined);
  return selection ?? { countryCode: '', stateCode: '' };
}

export function getLocationCountryCode(value: string): string {
  return findInitialSelection(value).countryCode;
}
