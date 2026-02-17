import { useGlobalContext } from '../context/GlobalContext';

const Footer = () => {
    const { t } = useGlobalContext();
    return (
        <footer className="bg-white border-t border-gray-200 py-12 my-container">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
                <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                        <div className="w-8 h-8 bg-accent-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                            M
                        </div>
                        <span className="font-bold text-xl text-gray-900">{t('welcomeTitle')}</span>
                    </div>
                    <p className="text-sm text-secondary-gray">
                        {t('footerTagline')}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        {t('footerLocation')}
                    </p>
                </div>

                <div className="flex space-x-8 text-sm text-secondary-gray font-medium">
                    <a href="#" className="hover:text-accent-orange transition-colors">{t('about')}</a>
                    <a href="#" className="hover:text-accent-orange transition-colors">{t('contact')}</a>
                    <a href="#" className="hover:text-accent-orange transition-colors">{t('privacy')}</a>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400 border-t border-gray-100 pt-8">
                © 2026 MetroMate. {t('rightsReserved')}
            </div>
        </footer>
    );
};

export default Footer;
