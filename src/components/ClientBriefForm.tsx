import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { createBriefVersion } from '../lib/briefService';

interface BriefFormData {
  business_name: string;
  website_url: string;
  business_type: string;
  business_type_other: string;
  industry_niche: string;
  operating_countries: string;
  selling_languages: string;
  business_model: string;
  business_age: string;
  usp: string;
  brand_tone: string[];
  brand_tone_other: string;
  restricted_content: string;
  advertising_what: string;
  product_description: string;
  currency: string;
  aov: string;
  gross_margin: string;
  has_discount: string;
  discount_details: string;
  offer_type: string;
  payment_methods: string[];
  shipping_info: string;
  refund_policy: string;
  social_proof: string[];
  primary_goal: string;
  secondary_goal: string;
  funnel_stage: string;
  campaign_type: string;
  has_run_meta_ads: string;
  monthly_ad_spend: string;
  best_campaign_type: string;
  best_creatives: string;
  best_audience_type: string;
  average_cpa: string;
  average_roas: string;
  past_issues: string;
  target_locations: string;
  age_range: string;
  gender: string;
  ideal_customer: string;
  interests_behaviors: string;
  preferred_angles: string[];
  competitors_to_avoid: string;
  brand_guidelines: string;
  ad_copy_tone: string;
  daily_budget: string;
  risk_tolerance: string;
  campaign_launch: string;
}

const initialFormData: BriefFormData = {
  business_name: '',
  website_url: '',
  business_type: '',
  business_type_other: '',
  industry_niche: '',
  operating_countries: '',
  selling_languages: '',
  business_model: '',
  business_age: '',
  usp: '',
  brand_tone: [],
  brand_tone_other: '',
  restricted_content: '',
  advertising_what: '',
  product_description: '',
  currency: 'USD',
  aov: '',
  gross_margin: '',
  has_discount: 'no',
  discount_details: '',
  offer_type: '',
  payment_methods: [],
  shipping_info: '',
  refund_policy: '',
  social_proof: [],
  primary_goal: '',
  secondary_goal: '',
  funnel_stage: '',
  campaign_type: '',
  has_run_meta_ads: 'no',
  monthly_ad_spend: '',
  best_campaign_type: '',
  best_creatives: '',
  best_audience_type: '',
  average_cpa: '',
  average_roas: '',
  past_issues: '',
  target_locations: '',
  age_range: '',
  gender: '',
  ideal_customer: '',
  interests_behaviors: '',
  preferred_angles: [],
  competitors_to_avoid: '',
  brand_guidelines: '',
  ad_copy_tone: '',
  daily_budget: '',
  risk_tolerance: '',
  campaign_launch: ''
};

interface ClientBriefFormProps {
  onComplete: (briefId: string) => void;
}

export default function ClientBriefForm({ onComplete }: ClientBriefFormProps) {
  const { user } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<BriefFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sections = [
    'Business & Brand Context',
    'Offer & Product Details',
    'Marketing Objective',
    'Historical Data',
    'Target Audience',
    'Creative Direction',
    'Budget & Timeline'
  ];

  const handleInputChange = (field: keyof BriefFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof BriefFormData, value: string, checked: boolean) => {
    const currentValues = formData[field] as string[];
    if (checked) {
      handleInputChange(field, [...currentValues, value]);
    } else {
      handleInputChange(field, currentValues.filter(v => v !== value));
    }
  };

  const validateSection = (section: number): boolean => {
    switch (section) {
      case 0:
        return !!(formData.business_name && formData.business_type && formData.industry_niche &&
                  formData.operating_countries && formData.selling_languages && formData.business_model &&
                  formData.business_age && formData.usp && formData.brand_tone.length > 0 && formData.restricted_content);
      case 1:
        return !!(formData.advertising_what && formData.product_description && formData.currency &&
                  formData.aov && formData.offer_type && formData.payment_methods.length > 0 &&
                  formData.shipping_info && formData.refund_policy && formData.social_proof.length > 0);
      case 2:
        return !!(formData.primary_goal && formData.funnel_stage && formData.campaign_type);
      case 3:
        return true;
      case 4:
        return !!(formData.target_locations && formData.age_range && formData.gender &&
                  formData.ideal_customer && formData.interests_behaviors);
      case 5:
        return !!(formData.preferred_angles.length > 0 && formData.ad_copy_tone);
      case 6:
        return !!(formData.daily_budget && formData.risk_tolerance && formData.campaign_launch);
      default:
        return false;
    }
  };

  const nextSection = () => {
    if (validateSection(currentSection)) {
      setError('');
      setCurrentSection(prev => Math.min(prev + 1, sections.length - 1));
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevSection = () => {
    setError('');
    setCurrentSection(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!validateSection(currentSection)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const finalBusinessType = formData.business_type === 'Other' ? formData.business_type_other : formData.business_type;
      const finalBrandTone = formData.brand_tone.includes('Other')
        ? [...formData.brand_tone.filter(t => t !== 'Other'), formData.brand_tone_other]
        : formData.brand_tone;

      const briefDataToSave = {
        business_name: formData.business_name,
        website_url: formData.website_url || null,
        business_type: finalBusinessType,
        industry_niche: formData.industry_niche,
        operating_countries: formData.operating_countries,
        selling_languages: formData.selling_languages,
        business_model: formData.business_model,
        business_age: formData.business_age,
        usp: formData.usp,
        brand_tone: finalBrandTone,
        restricted_content: formData.restricted_content,
        advertising_what: formData.advertising_what,
        product_description: formData.product_description,
        currency: formData.currency,
        aov: parseFloat(formData.aov),
        gross_margin: formData.gross_margin ? parseFloat(formData.gross_margin) : null,
        has_discount: formData.has_discount === 'yes',
        discount_details: formData.discount_details || null,
        offer_type: formData.offer_type,
        payment_methods: formData.payment_methods,
        shipping_info: formData.shipping_info,
        refund_policy: formData.refund_policy,
        social_proof: formData.social_proof,
        primary_goal: formData.primary_goal,
        secondary_goal: formData.secondary_goal || null,
        funnel_stage: formData.funnel_stage,
        campaign_type: formData.campaign_type,
        has_run_meta_ads: formData.has_run_meta_ads === 'yes',
        monthly_ad_spend: formData.monthly_ad_spend || null,
        best_campaign_type: formData.best_campaign_type || null,
        best_creatives: formData.best_creatives || null,
        best_audience_type: formData.best_audience_type || null,
        average_cpa: formData.average_cpa ? parseFloat(formData.average_cpa) : null,
        average_roas: formData.average_roas ? parseFloat(formData.average_roas) : null,
        past_issues: formData.past_issues || null,
        target_locations: formData.target_locations,
        age_range: formData.age_range,
        gender: formData.gender,
        ideal_customer: formData.ideal_customer,
        interests_behaviors: formData.interests_behaviors,
        preferred_angles: formData.preferred_angles,
        competitors_to_avoid: formData.competitors_to_avoid || null,
        brand_guidelines: formData.brand_guidelines || null,
        ad_copy_tone: formData.ad_copy_tone,
        daily_budget: parseFloat(formData.daily_budget),
        risk_tolerance: formData.risk_tolerance,
        campaign_launch: formData.campaign_launch
      };

      const { brief, error: saveError } = await createBriefVersion(user.id, briefDataToSave);

      if (saveError || !brief) {
        throw saveError || new Error('Failed to save brief');
      }

      onComplete(brief.id);
    } catch (err: any) {
      console.error('Error submitting brief:', err);
      setError(err.message || 'Failed to submit brief');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0:
        return <Section1 formData={formData} onChange={handleInputChange} onCheckboxChange={handleCheckboxChange} />;
      case 1:
        return <Section2 formData={formData} onChange={handleInputChange} onCheckboxChange={handleCheckboxChange} />;
      case 2:
        return <Section3 formData={formData} onChange={handleInputChange} />;
      case 3:
        return <Section4 formData={formData} onChange={handleInputChange} />;
      case 4:
        return <Section5 formData={formData} onChange={handleInputChange} />;
      case 5:
        return <Section6 formData={formData} onChange={handleInputChange} onCheckboxChange={handleCheckboxChange} />;
      case 6:
        return <Section7 formData={formData} onChange={handleInputChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Client Brief
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Section {currentSection + 1} of {sections.length}: {sections[currentSection]}
            </p>
          </div>

          <div className="flex gap-2 mb-8">
            {sections.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentSection
                    ? 'bg-blue-600'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderSection()}
          </motion.div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={prevSection}
              disabled={currentSection === 0}
              className="flex items-center gap-2 px-6 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {currentSection < sections.length - 1 ? (
              <button
                onClick={nextSection}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Brief'
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Section1({ formData, onChange, onCheckboxChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Business Name *
        </label>
        <input
          type="text"
          value={formData.business_name}
          onChange={(e) => onChange('business_name', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Website URL or Instagram/Facebook Page
        </label>
        <input
          type="text"
          value={formData.website_url}
          onChange={(e) => onChange('website_url', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="https://"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Business Type *
        </label>
        <select
          value={formData.business_type}
          onChange={(e) => onChange('business_type', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="E-commerce (physical products)">E-commerce (physical products)</option>
          <option value="Digital product">Digital product</option>
          <option value="Local service">Local service</option>
          <option value="Clinic / medical / beauty">Clinic / medical / beauty</option>
          <option value="Coaching / education">Coaching / education</option>
          <option value="Real estate">Real estate</option>
          <option value="Other">Other</option>
        </select>
        {formData.business_type === 'Other' && (
          <input
            type="text"
            value={formData.business_type_other}
            onChange={(e) => onChange('business_type_other', e.target.value)}
            className="w-full px-4 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="Please specify..."
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Industry / Niche *
        </label>
        <input
          type="text"
          value={formData.industry_niche}
          onChange={(e) => onChange('industry_niche', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Operating Country/Countries *
        </label>
        <input
          type="text"
          value={formData.operating_countries}
          onChange={(e) => onChange('operating_countries', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="e.g., USA, UK, Canada"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Primary Selling Language(s) *
        </label>
        <input
          type="text"
          value={formData.selling_languages}
          onChange={(e) => onChange('selling_languages', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="e.g., English, Spanish"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Business Model *
        </label>
        <select
          value={formData.business_model}
          onChange={(e) => onChange('business_model', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Own brand">Own brand</option>
          <option value="Reseller / distributor">Reseller / distributor</option>
          <option value="Dropshipping">Dropshipping</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Business Age *
        </label>
        <select
          value={formData.business_age}
          onChange={(e) => onChange('business_age', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Just starting">Just starting</option>
          <option value="Less than 1 year">Less than 1 year</option>
          <option value="1-3 years">1-3 years</option>
          <option value="3-5 years">3-5 years</option>
          <option value="5+ years">5+ years</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Unique Selling Proposition (USP) *
        </label>
        <textarea
          value={formData.usp}
          onChange={(e) => onChange('usp', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={3}
          placeholder="What makes your business unique?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Brand Tone * (Select all that apply)
        </label>
        <div className="space-y-2">
          {['Luxury', 'Friendly', 'Aggressive sales', 'Educational', 'Emotional', 'Minimal', 'Other'].map((tone) => (
            <label key={tone} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.brand_tone.includes(tone)}
                onChange={(e) => onCheckboxChange('brand_tone', tone, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">{tone}</span>
            </label>
          ))}
        </div>
        {formData.brand_tone.includes('Other') && (
          <input
            type="text"
            value={formData.brand_tone_other}
            onChange={(e) => onChange('brand_tone_other', e.target.value)}
            className="w-full px-4 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="Please specify..."
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Restricted Words, Claims, or Styles *
        </label>
        <textarea
          value={formData.restricted_content}
          onChange={(e) => onChange('restricted_content', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={3}
          placeholder="List any restricted content, words, or claims to avoid..."
          required
        />
      </div>
    </div>
  );
}

function Section2({ formData, onChange, onCheckboxChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          What are you advertising? *
        </label>
        <select
          value={formData.advertising_what}
          onChange={(e) => onChange('advertising_what', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Single product">Single product</option>
          <option value="Collection">Collection</option>
          <option value="Service">Service</option>
          <option value="Offer / bundle">Offer / bundle</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Short Product Description (Benefits-focused) *
        </label>
        <textarea
          value={formData.product_description}
          onChange={(e) => onChange('product_description', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={4}
          placeholder="Focus on benefits and outcomes..."
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Currency *
          </label>
          <select
            value={formData.currency}
            onChange={(e) => onChange('currency', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            required
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="AED">AED</option>
            <option value="SAR">SAR</option>
            <option value="EGP">EGP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Average Order Value (AOV) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.aov}
            onChange={(e) => onChange('aov', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Gross Margin % or Cost Per Unit
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.gross_margin}
          onChange={(e) => onChange('gross_margin', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="Optional"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Discount or Promotion? *
        </label>
        <select
          value={formData.has_discount}
          onChange={(e) => onChange('has_discount', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
        {formData.has_discount === 'yes' && (
          <textarea
            value={formData.discount_details}
            onChange={(e) => onChange('discount_details', e.target.value)}
            className="w-full px-4 py-2 mt-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            rows={2}
            placeholder="Describe the discount or promotion..."
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Offer Type *
        </label>
        <select
          value={formData.offer_type}
          onChange={(e) => onChange('offer_type', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Evergreen">Evergreen</option>
          <option value="Limited time">Limited time</option>
          <option value="Limited quantity">Limited quantity</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Payment Methods * (Select all that apply)
        </label>
        <div className="space-y-2">
          {['Cash on Delivery', 'Online payment'].map((method) => (
            <label key={method} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.payment_methods.includes(method)}
                onChange={(e) => onCheckboxChange('payment_methods', method, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">{method}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Shipping Locations & Delivery Time *
        </label>
        <textarea
          value={formData.shipping_info}
          onChange={(e) => onChange('shipping_info', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={2}
          placeholder="e.g., Nationwide delivery in 3-5 days"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Refund / Return Policy Summary *
        </label>
        <textarea
          value={formData.refund_policy}
          onChange={(e) => onChange('refund_policy', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={2}
          placeholder="e.g., 30-day money-back guarantee"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Social Proof Available * (Select all that apply)
        </label>
        <div className="space-y-2">
          {['Reviews', 'Testimonials', 'Influencers'].map((proof) => (
            <label key={proof} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.social_proof.includes(proof)}
                onChange={(e) => onCheckboxChange('social_proof', proof, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">{proof}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section3({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Primary Goal *
        </label>
        <select
          value={formData.primary_goal}
          onChange={(e) => onChange('primary_goal', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Sales">Sales</option>
          <option value="Leads">Leads</option>
          <option value="Messages">Messages</option>
          <option value="Traffic">Traffic</option>
          <option value="Awareness">Awareness</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Secondary Goal
        </label>
        <select
          value={formData.secondary_goal}
          onChange={(e) => onChange('secondary_goal', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="">None</option>
          <option value="Sales">Sales</option>
          <option value="Leads">Leads</option>
          <option value="Messages">Messages</option>
          <option value="Traffic">Traffic</option>
          <option value="Awareness">Awareness</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Funnel Stage *
        </label>
        <select
          value={formData.funnel_stage}
          onChange={(e) => onChange('funnel_stage', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Cold prospecting">Cold prospecting</option>
          <option value="Retargeting">Retargeting</option>
          <option value="Full funnel">Full funnel</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Campaign Type *
        </label>
        <select
          value={formData.campaign_type}
          onChange={(e) => onChange('campaign_type', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="New test">New test</option>
          <option value="Scaling">Scaling</option>
          <option value="Relaunch">Relaunch</option>
        </select>
      </div>
    </div>
  );
}

function Section4({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          This section is optional but helps us optimize your campaigns based on past performance.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Have Meta Ads Run Before?
        </label>
        <select
          value={formData.has_run_meta_ads}
          onChange={(e) => onChange('has_run_meta_ads', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {formData.has_run_meta_ads === 'yes' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Monthly Ad Spend Range
            </label>
            <select
              value={formData.monthly_ad_spend}
              onChange={(e) => onChange('monthly_ad_spend', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select...</option>
              <option value="Less than $1,000">Less than $1,000</option>
              <option value="$1,000 - $5,000">$1,000 - $5,000</option>
              <option value="$5,000 - $10,000">$5,000 - $10,000</option>
              <option value="$10,000 - $25,000">$10,000 - $25,000</option>
              <option value="$25,000+">$25,000+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Best Campaign Type
            </label>
            <input
              type="text"
              value={formData.best_campaign_type}
              onChange={(e) => onChange('best_campaign_type', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Advantage+ Shopping"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Best Creatives
            </label>
            <textarea
              value={formData.best_creatives}
              onChange={(e) => onChange('best_creatives', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              rows={2}
              placeholder="Describe what worked best..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Best Audience Type
            </label>
            <input
              type="text"
              value={formData.best_audience_type}
              onChange={(e) => onChange('best_audience_type', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              placeholder="e.g., Broad, Lookalike, Interest-based"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Average CPA / CPL
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.average_cpa}
                onChange={(e) => onChange('average_cpa', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Average ROAS
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.average_roas}
                onChange={(e) => onChange('average_roas', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Past Issues (Rejections, CPM, Quality)
            </label>
            <textarea
              value={formData.past_issues}
              onChange={(e) => onChange('past_issues', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              rows={3}
              placeholder="Describe any past issues or challenges..."
            />
          </div>
        </>
      )}
    </div>
  );
}

function Section5({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Target Countries / Cities *
        </label>
        <input
          type="text"
          value={formData.target_locations}
          onChange={(e) => onChange('target_locations', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="e.g., United States, New York, Los Angeles"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Age Range *
        </label>
        <input
          type="text"
          value={formData.age_range}
          onChange={(e) => onChange('age_range', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="e.g., 25-45"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Gender *
        </label>
        <select
          value={formData.gender}
          onChange={(e) => onChange('gender', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="All">All</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ideal Customer Description *
        </label>
        <textarea
          value={formData.ideal_customer}
          onChange={(e) => onChange('ideal_customer', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={4}
          placeholder="Describe your ideal customer: demographics, pain points, motivations..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Interests / Behaviors *
        </label>
        <textarea
          value={formData.interests_behaviors}
          onChange={(e) => onChange('interests_behaviors', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={3}
          placeholder="e.g., Fitness enthusiasts, online shoppers, tech-savvy"
          required
        />
      </div>
    </div>
  );
}

function Section6({ formData, onChange, onCheckboxChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Preferred Angles * (Select all that apply)
        </label>
        <div className="space-y-2">
          {['Problem–solution', 'Lifestyle', 'Testimonial', 'Offer-driven', 'Educational', 'Test all'].map((angle) => (
            <label key={angle} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.preferred_angles.includes(angle)}
                onChange={(e) => onCheckboxChange('preferred_angles', angle, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-300">{angle}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Competitors to Avoid
        </label>
        <textarea
          value={formData.competitors_to_avoid}
          onChange={(e) => onChange('competitors_to_avoid', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={2}
          placeholder="List competitors we should avoid referencing..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Brand Guidelines
        </label>
        <textarea
          value={formData.brand_guidelines}
          onChange={(e) => onChange('brand_guidelines', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          rows={3}
          placeholder="Any specific brand guidelines or requirements..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Ad Copy Tone *
        </label>
        <select
          value={formData.ad_copy_tone}
          onChange={(e) => onChange('ad_copy_tone', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Direct">Direct</option>
          <option value="Soft">Soft</option>
          <option value="Emotional">Emotional</option>
          <option value="Educational">Educational</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>
    </div>
  );
}

function Section7({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Daily Budget *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.daily_budget}
          onChange={(e) => onChange('daily_budget', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          placeholder="Enter daily budget amount"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Risk Tolerance *
        </label>
        <select
          value={formData.risk_tolerance}
          onChange={(e) => onChange('risk_tolerance', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Conservative">Conservative</option>
          <option value="Balanced">Balanced</option>
          <option value="Aggressive">Aggressive</option>
        </select>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Conservative: Slow scaling, lower risk | Balanced: Moderate scaling | Aggressive: Fast scaling, higher risk
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Campaign Launch *
        </label>
        <select
          value={formData.campaign_launch}
          onChange={(e) => onChange('campaign_launch', e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          required
        >
          <option value="">Select...</option>
          <option value="Paused for review">Paused for review</option>
          <option value="Live immediately">Live immediately</option>
        </select>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-300">
          You're almost done! Review your information and click "Submit Brief" to continue to Meta account selection.
        </p>
      </div>
    </div>
  );
}