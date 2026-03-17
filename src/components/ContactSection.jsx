import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { BACKEND_BASE_URL } from '../config/apiConfig';

const ContactSection = () => {
    const { t } = useGlobalContext();
    const [formData, setFormData] = useState({
        fullName: '',
        emailAddress: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            const response = await fetch(`${BACKEND_BASE_URL}/contact/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            body: JSON.stringify({
                name: formData.fullName,        // map fullName → name
                email: formData.emailAddress,   // map emailAddress → email
                message: formData.message,
                fullName: formData.fullName,
                emailAddress: formData.emailAddress
            })
                    });

            if (response.ok) {
                setSubmitStatus('success');
                setFormData({ fullName: '', emailAddress: '', message: '' });

                // Reset success message after 5 seconds
                setTimeout(() => {
                    setSubmitStatus(null);
                }, 5000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-20 bg-gray-50 my-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div>
                    <h2 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-6">
                        {t('getInTouch')}
                    </h2>
                    <p className="text-secondary-gray text-lg mb-10 max-w-md leading-relaxed">
                        {t('contactDesc')}
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent-orange shadow-sm border border-gray-100">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{t('emailUs')}</h3>
                                <p className="text-secondary-gray">metromate.isbrwp@gmail.com</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent-orange shadow-sm border border-gray-100">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{t('callUs')}</h3>
                                <p className="text-secondary-gray">+92 51 123 4567</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent-orange shadow-sm border border-gray-100">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{t('visitHq')}</h3>
                                <p className="text-secondary-gray">{t('hqAddress')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-bl-full z-0"></div>

                    {submitStatus === 'success' && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-green-800 text-sm font-medium">
                                {t('messageSent') || 'Message sent successfully! We\'ll get back to you soon.'}
                            </p>
                        </div>
                    )}

                    {submitStatus === 'error' && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-red-800 text-sm font-medium">
                                {t('messageError') || 'Failed to send message. Please try again.'}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('fullName')}</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailAddress')}</label>
                            <input
                                type="email"
                                name="emailAddress"
                                value={formData.emailAddress}
                                onChange={handleChange}
                                required
                                placeholder="john@example.com"
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('message')}</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows="4"
                                placeholder={t('howCanWeHelp')}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins disabled:opacity-50 disabled:cursor-not-allowed"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span>{isSubmitting ? (t('sending') || 'Sending...') : t('sendMessage')}</span>
                            <Send className={`w-5 h-5 ${isSubmitting ? 'animate-pulse' : ''}`} />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
