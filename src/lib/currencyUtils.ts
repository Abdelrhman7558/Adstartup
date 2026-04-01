import { getCountryByCode } from '../components/CountrySelector';

/**
 * Formats a number as a currency string based on the provided currency code or country code.
 * Defaults to USD if no matching currency found.
 */
export const formatCurrency = (amount: number | string | undefined, countryCode?: string): string => {
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return '--';

    const country = countryCode ? getCountryByCode(countryCode) : null;
    const currency = country ? country.currency : 'USD';
    const symbol = country ? country.symbol : '$';

    // Format with symbol before or after depending on the currency style
    // For simplicity, we'll put symbol + space + amount for custom symbols, 
    // or use Intl.NumberFormat for standard ones if needed.
    // Using explicit symbol from our config seems requested by user "any symbol converts to country currency"

    return `${symbol} ${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
