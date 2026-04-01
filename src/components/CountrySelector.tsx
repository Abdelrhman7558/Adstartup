import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ChevronDown } from 'lucide-react';

export interface Country {
    code: string;
    name: string;
    flagKey: string;
    currency: string;
    symbol: string;
}

export const COUNTRIES: Country[] = [
    // Arab Countries
    { code: 'EG', name: 'Egypt', flagKey: 'eg', currency: 'EGP', symbol: 'EGP' },
    { code: 'SA', name: 'Saudi Arabia', flagKey: 'sa', currency: 'SAR', symbol: 'SAR' },
    { code: 'AE', name: 'UAE', flagKey: 'ae', currency: 'AED', symbol: 'AED' },
    { code: 'KW', name: 'Kuwait', flagKey: 'kw', currency: 'KWD', symbol: 'KWD' },
    { code: 'QA', name: 'Qatar', flagKey: 'qa', currency: 'QAR', symbol: 'QAR' },
    { code: 'BH', name: 'Bahrain', flagKey: 'bh', currency: 'BHD', symbol: 'BHD' },
    { code: 'OM', name: 'Oman', flagKey: 'om', currency: 'OMR', symbol: 'OMR' },
    { code: 'JO', name: 'Jordan', flagKey: 'jo', currency: 'JOD', symbol: 'JOD' },
    { code: 'LB', name: 'Lebanon', flagKey: 'lb', currency: 'LBP', symbol: 'LBP' },
    { code: 'IQ', name: 'Iraq', flagKey: 'iq', currency: 'IQD', symbol: 'IQD' },
    { code: 'YE', name: 'Yemen', flagKey: 'ye', currency: 'YER', symbol: 'YER' },
    { code: 'SY', name: 'Syria', flagKey: 'sy', currency: 'SYP', symbol: 'SYP' },
    { code: 'PS', name: 'Palestine', flagKey: 'ps', currency: 'ILS', symbol: '₪' },
    { code: 'LY', name: 'Libya', flagKey: 'ly', currency: 'LYD', symbol: 'LYD' },
    { code: 'TN', name: 'Tunisia', flagKey: 'tn', currency: 'TND', symbol: 'TND' },
    { code: 'DZ', name: 'Algeria', flagKey: 'dz', currency: 'DZD', symbol: 'DZD' },
    { code: 'MA', name: 'Morocco', flagKey: 'ma', currency: 'MAD', symbol: 'MAD' },
    { code: 'SD', name: 'Sudan', flagKey: 'sd', currency: 'SDG', symbol: 'SDG' },
    { code: 'MR', name: 'Mauritania', flagKey: 'mr', currency: 'MRU', symbol: 'MRU' },
    { code: 'SO', name: 'Somalia', flagKey: 'so', currency: 'SOS', symbol: 'SOS' },
    { code: 'DJ', name: 'Djibouti', flagKey: 'dj', currency: 'DJF', symbol: 'DJF' },
    { code: 'KM', name: 'Comoros', flagKey: 'km', currency: 'KMF', symbol: 'KMF' },

    // North America
    { code: 'US', name: 'United States', flagKey: 'us', currency: 'USD', symbol: '$' },
    { code: 'CA', name: 'Canada', flagKey: 'ca', currency: 'CAD', symbol: '$' },
    { code: 'MX', name: 'Mexico', flagKey: 'mx', currency: 'MXN', symbol: '$' },

    // Europe
    { code: 'GB', name: 'United Kingdom', flagKey: 'gb', currency: 'GBP', symbol: '£' },
    { code: 'DE', name: 'Germany', flagKey: 'de', currency: 'EUR', symbol: '€' },
    { code: 'FR', name: 'France', flagKey: 'fr', currency: 'EUR', symbol: '€' },
    { code: 'IT', name: 'Italy', flagKey: 'it', currency: 'EUR', symbol: '€' },
    { code: 'ES', name: 'Spain', flagKey: 'es', currency: 'EUR', symbol: '€' },
    { code: 'NL', name: 'Netherlands', flagKey: 'nl', currency: 'EUR', symbol: '€' },
    { code: 'BE', name: 'Belgium', flagKey: 'be', currency: 'EUR', symbol: '€' },
    { code: 'SE', name: 'Sweden', flagKey: 'se', currency: 'SEK', symbol: 'kr' },
    { code: 'NO', name: 'Norway', flagKey: 'no', currency: 'NOK', symbol: 'kr' },
    { code: 'DK', name: 'Denmark', flagKey: 'dk', currency: 'DKK', symbol: 'kr' },
    { code: 'FI', name: 'Finland', flagKey: 'fi', currency: 'EUR', symbol: '€' },
    { code: 'pt', name: 'Portugal', flagKey: 'pt', currency: 'EUR', symbol: '€' },
    { code: 'IE', name: 'Ireland', flagKey: 'ie', currency: 'EUR', symbol: '€' },
    { code: 'CH', name: 'Switzerland', flagKey: 'ch', currency: 'CHF', symbol: 'CHF' },
    { code: 'AT', name: 'Austria', flagKey: 'at', currency: 'EUR', symbol: '€' },
    { code: 'PL', name: 'Poland', flagKey: 'pl', currency: 'PLN', symbol: 'zł' },
    { code: 'TR', name: 'Turkey', flagKey: 'tr', currency: 'TRY', symbol: '₺' },

    // Asia
    { code: 'CN', name: 'China', flagKey: 'cn', currency: 'CNY', symbol: '¥' },
    { code: 'JP', name: 'Japan', flagKey: 'jp', currency: 'JPY', symbol: '¥' },
    { code: 'KR', name: 'South Korea', flagKey: 'kr', currency: 'KRW', symbol: '₩' },
    { code: 'IN', name: 'India', flagKey: 'in', currency: 'INR', symbol: '₹' },
    { code: 'ID', name: 'Indonesia', flagKey: 'id', currency: 'IDR', symbol: 'Rp' },
    { code: 'MY', name: 'Malaysia', flagKey: 'my', currency: 'MYR', symbol: 'RM' },
    { code: 'SG', name: 'Singapore', flagKey: 'sg', currency: 'SGD', symbol: '$' },
    { code: 'TH', name: 'Thailand', flagKey: 'th', currency: 'THB', symbol: '฿' },
    { code: 'VN', name: 'Vietnam', flagKey: 'vn', currency: 'VND', symbol: '₫' },
    { code: 'PH', name: 'Philippines', flagKey: 'ph', currency: 'PHP', symbol: '₱' },

    // Oceania
    { code: 'AU', name: 'Australia', flagKey: 'au', currency: 'AUD', symbol: '$' },
    { code: 'NZ', name: 'New Zealand', flagKey: 'nz', currency: 'NZD', symbol: '$' },

    // South America
    { code: 'BR', name: 'Brazil', flagKey: 'br', currency: 'BRL', symbol: 'R$' },
    { code: 'AR', name: 'Argentina', flagKey: 'ar', currency: 'ARS', symbol: '$' },
    { code: 'CL', name: 'Chile', flagKey: 'cl', currency: 'CLP', symbol: '$' },
    { code: 'CO', name: 'Colombia', flagKey: 'co', currency: 'COP', symbol: '$' },
    { code: 'PE', name: 'Peru', flagKey: 'pe', currency: 'PEN', symbol: 'S/' },

    // Africa (Non-Arab)
    { code: 'ZA', name: 'South Africa', flagKey: 'za', currency: 'ZAR', symbol: 'R' },
    { code: 'NG', name: 'Nigeria', flagKey: 'ng', currency: 'NGN', symbol: '₦' },
    { code: 'KE', name: 'Kenya', flagKey: 'ke', currency: 'KES', symbol: 'KSh' },
];

export const getFlagUrl = (countryCode: string) => `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

export const getCountryByCode = (code: string) => COUNTRIES.find(c => c.code.toUpperCase() === code.toUpperCase()) || COUNTRIES[0];

interface CountrySelectorProps {
    value?: string;
    onChange?: (code: string) => void;
    className?: string;
}

export default function CountrySelector({ value, onChange, className = '' }: CountrySelectorProps) {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Default to first country if no value provided, but don't force change unless interacting
    const selectedCountry = value ? getCountryByCode(value) : COUNTRIES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (country: Country) => {
        if (onChange) {
            onChange(country.code);
        }
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-3 w-full px-4 py-3 rounded-lg border transition-all ${theme === 'dark'
                    ? 'bg-black border-gray-800 hover:border-gray-700 text-white'
                    : 'bg-white border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                title="Select Country"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <img
                        src={getFlagUrl(selectedCountry.flagKey)}
                        alt={selectedCountry.name}
                        className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
                    />
                    <span className="text-sm font-medium truncate">{selectedCountry.name}</span>
                </div>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>

            {isOpen && (
                <div
                    className={`absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl shadow-lg border z-50 ${theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                        }`}
                >
                    {COUNTRIES.map((country) => (
                        <button
                            type="button"
                            key={country.code}
                            onClick={() => handleSelect(country)}
                            className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${selectedCountry.code === country.code
                                ? theme === 'dark'
                                    ? 'bg-blue-900/30 text-blue-400'
                                    : 'bg-blue-50 text-blue-700'
                                : theme === 'dark'
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <img
                                    src={getFlagUrl(country.flagKey)}
                                    alt={country.name}
                                    className="w-6 h-4 object-cover rounded-sm flex-shrink-0"
                                />
                                <span className="text-sm font-medium truncate">{country.name}</span>
                            </div>
                            <span className={`text-xs flex-shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                {country.currency}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
