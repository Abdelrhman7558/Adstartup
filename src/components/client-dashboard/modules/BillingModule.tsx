import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, CardContent } from '../../ui/Card';

export default function BillingModule() {
    const { subscription } = useAuth();
    const navigate = useNavigate();

    const isActive = subscription?.status === 'active';
    const planName = subscription?.plan_name || 'No Active Plan';
    const planPrice = subscription?.plan_price ?? 0;
    const periodEnd = subscription?.current_period_end
        ? format(new Date(subscription.current_period_end), 'd MMMM yyyy')
        : null;
    const renewalDate = subscription?.renewal_date
        ? format(new Date(subscription.renewal_date), 'd MMMM yyyy')
        : null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="border-b border-gray-100 pb-6">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Billing</h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">Manage your subscription and billing details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Plan Card */}
                <Card className="border-gray-100 rounded-2xl">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-red-600" />
                            </div>
                            {isActive ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Active
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {subscription?.status || 'Inactive'}
                                </span>
                            )}
                        </div>

                        <h2 className="text-lg font-bold text-gray-900">{planName}</h2>
                        {planPrice > 0 && (
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                ${planPrice}
                                <span className="text-sm font-medium text-gray-500">/mo</span>
                            </p>
                        )}

                        {(periodEnd || renewalDate) && (
                            <p className="text-sm text-gray-500 mt-3">
                                {renewalDate ? `Renews ${renewalDate}` : `Expires ${periodEnd}`}
                            </p>
                        )}

                        {!subscription && (
                            <p className="text-sm text-gray-500 mt-2">You don't have an active subscription.</p>
                        )}

                        <button
                            onClick={() => navigate('/payment')}
                            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-red-200"
                        >
                            {subscription ? 'Manage Plan' : 'Upgrade Now'}
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </CardContent>
                </Card>

                {/* Billing Info Card */}
                <Card className="border-gray-100 rounded-2xl">
                    <CardContent className="p-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Subscription Details</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Plan', value: planName },
                                { label: 'Status', value: subscription?.status || '—' },
                                { label: 'Payment Method', value: subscription?.payment_method || '—' },
                                {
                                    label: 'Start Date',
                                    value: subscription?.current_period_start
                                        ? format(new Date(subscription.current_period_start), 'd MMM yyyy')
                                        : '—',
                                },
                                {
                                    label: renewalDate ? 'Renewal Date' : 'End Date',
                                    value: renewalDate || periodEnd || '—',
                                },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-sm text-gray-500">{label}</span>
                                    <span className="text-sm font-semibold text-gray-900 capitalize">{value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
