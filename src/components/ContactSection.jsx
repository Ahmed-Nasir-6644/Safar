import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactSection = () => {
    return (
        <section id="contact" className="py-20 bg-gray-50 my-container">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div>
                    <h2 className="text-[2rem] md:text-[2.5vw] font-bold text-gray-900 mb-6">
                        Get in Touch
                    </h2>
                    <p className="text-secondary-gray text-lg mb-10 max-w-md leading-relaxed">
                        Have questions about routes, fares, or looking to partner with MetroMate? We're here to help.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent-orange shadow-sm border border-gray-100">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Email Us</h3>
                                <p className="text-secondary-gray">support@metromate.com</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent-orange shadow-sm border border-gray-100">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Call Us</h3>
                                <p className="text-secondary-gray">+92 51 123 4567</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-accent-orange shadow-sm border border-gray-100">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Visit HQ</h3>
                                <p className="text-secondary-gray">Metro Bus Command Center,<br />Jinnah Avenue, Islamabad</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 rounded-bl-full z-0"></div>
                    <form className="relative z-10 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea
                                rows="4"
                                placeholder="How can we help you?"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-accent-orange transition-all font-poppins"
                            ></textarea>
                        </div>

                        <button type="submit" className="w-full py-4 bg-accent-orange text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 transition-all duration-300 flex items-center justify-center space-x-2">
                            <span>Send Message</span>
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
