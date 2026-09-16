import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
    exiting: boolean;
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

const ToastIcon = ({ type }: { type: ToastType }) => {
    if (type === "success") return <CheckCircle2 size={18} />;
    if (type === "error") return <XCircle size={18} />;
    return <Info size={18} />;
};

const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = nextToastId++;
        setToasts((current) => [...current, { id, message, type, exiting: false }]);

        window.setTimeout(() => {
            setToasts((current) =>
                current.map((toast) =>
                    toast.id === id ? { ...toast, exiting: true } : toast,
                ),
            );
        }, 2700);
        window.setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3000);
    }, []);

    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="pointer-events-none fixed left-1/2 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto flex items-center gap-3 rounded-md border px-4 py-3 text-sm shadow-lg ${
                            toast.exiting ? "animate-toast-out" : "animate-toast-in"
                        } ${
                            toast.type === "success"
                                ? "border-emerald-500/40 bg-emerald-950 text-emerald-100"
                                : toast.type === "error"
                                  ? "border-red-500/40 bg-red-950 text-red-100"
                                  : "border-blue-500/40 bg-blue-950 text-blue-100"
                        }`}>
                        <ToastIcon type={toast.type} />
                        <span className="flex-1">{toast.message}</span>
                        <button
                            type="button"
                            aria-label="Dismiss notification"
                            onClick={() =>
                                setToasts((current) =>
                                    current.filter((item) => item.id !== toast.id),
                                )
                            }
                            className="text-current/60 transition-colors hover:text-current">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
};

export default ToastProvider;