import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

let globalShowToast: ((message: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = 'info') {
    globalShowToast?.(message, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counterRef = useRef(0);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++counterRef.current;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    }, []);

    useEffect(() => {
        globalShowToast = showToast;
        return () => { globalShowToast = null; };
    }, [showToast]);

    const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const icons: Record<ToastType, React.ReactNode> = {
        success: <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />,
        error:   <XCircle    className="w-5 h-5 text-red-500   flex-shrink-0" />,
        info:    <Info       className="w-5 h-5 text-blue-500  flex-shrink-0" />,
    };

    const borders: Record<ToastType, string> = {
        success: 'border-green-100',
        error:   'border-red-100',
        info:    'border-blue-100',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`flex items-center gap-3 bg-white border ${borders[t.type]} rounded-xl shadow-lg px-4 py-3 max-w-sm w-full pointer-events-auto animate-slide-up`}
                    >
                        {icons[t.type]}
                        <span className="text-sm font-medium text-gray-800 flex-1">{t.message}</span>
                        <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 ml-1">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
