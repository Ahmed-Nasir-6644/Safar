import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle, Send, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';

const HelpPage = () => {
    const { t } = useGlobalContext();
    return (
        <div className="pt-24 pb-12 px-4 min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto space-y-12">

                {/* Help Section */}
                <section className="space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900">{t('howCanWeHelp')}</h1>
                        <p className="text-gray-500">{t('faqSubtitle')}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <FAQItem
                            question={t('q1')}
                            answer={t('a1')}
                        />
                        <FAQItem
                            question={t('q2')}
                            answer={t('a2')}
                        />
                        <FAQItem
                            question={t('q3')}
                            answer={t('a3')}
                        />
                        <FAQItem
                            question={t('q4')}
                            answer={t('a4')}
                        />
                    </div>
                </section>

                {/* Contribute Section */}
                <section className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900">{t('contribute')}</h2>
                        <p className="text-gray-500">{t('contributeSubtitle')}</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Lightbulb className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">{t('suggestFeature')}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Have an idea to make MetroMate better? We'd love to hear from you. Your feedback drives our roadmap.
                            </p>
                        </div>

                        <FeedbackForm />
                    </div>
                </section>
            </div>
        </div>
    );
};

const FeedbackForm = () => {
    const { t } = useGlobalContext();
    const [form, setForm] = useState({ 
        fullName: '', 
        emailAddress: '', 
        message: '' 
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: form.fullName,
                    emailAddress: form.emailAddress,
                    message: form.message
                })
            });

            if (response.ok) {
                setSubmitStatus('success');
                setForm({ fullName: '', emailAddress: '', message: '' });
                
                // Reset success message after 5 seconds
                setTimeout(() => {
                    setSubmitStatus(null);
                }, 5000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitStatus === 'success') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded-xl border border-green-100 animate-in fade-in">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t('thankYou')}</h3>
                <p className="text-gray-600 mt-2">{t('feedbackReceived')}</p>
            </div>
        );
    }

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm font-medium">
                        {t('messageError') || 'Failed to submit feedback. Please try again.'}
                    </p>
                </div>
            )}
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input
                    type="text"
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={t('name')}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                    type="email"
                    name="emailAddress"
                    required
                    value={form.emailAddress}
                    onChange={e => setForm({ ...form, emailAddress: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="your@email.com"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('message')}</label>
                <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange h-32 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={t('yourSuggestion')}
                ></textarea>
            </div>
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                <span>{isSubmitting ? (t('sending') || 'Sending...') : t('submitFeedback')}</span>
            </button>
        </form>
    );
};


const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900">{question}</span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 text-gray-600 text-sm leading-relaxed animate-in fade-in slide-in-from-top-1">
                    {answer}
                </div>
            )}
        </div>
    );
};

export default HelpPage;
