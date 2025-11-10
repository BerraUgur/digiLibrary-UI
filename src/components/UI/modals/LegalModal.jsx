import { createPortal } from 'react-dom';
import Button from '../buttons/Button';
import { AlertTriangle } from 'lucide-react';
import { CONTACT_INFO } from '../../../constants/contactConstants';
import { useLanguage } from '../../../context/useLanguage';
import './LegalModal.css';

function LegalModal({ isOpen, onClose, onAccept, type = 'register' }) {
    const { language } = useLanguage();
    
    if (!isOpen) return null;

    const content = {
        register: {
            tr: {
                title: 'Üyelik Sözleşmesi ve Gizlilik Politikası',
                icon: <AlertTriangle size={48} />,
                sections: [
                    {
                        title: 'Kişisel Verilerin Korunması (KVKK)',
                        content: `TC Kimlik numaranız dahil tüm kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında güvenle saklanmakta ve üçüncü şahıslarla paylaşılmamaktadır. Verileriniz yalnızca kimlik doğrulama ve hizmet sağlama amacıyla kullanılır.`
                    },
                    {
                        title: 'Platform Kullanım Şartları',
                        content: `• Bu platform eğitim ve kültürel gelişim amacıyla hizmet vermektedir.
• Kitaplar tanıtım amaçlıdır, ticari kullanım yasaktır.
• Hesabınızı başkalarıyla paylaşamazsınız.
• Yanıltıcı bilgi vermek hesabınızın kapatılmasına neden olur.`
                    },
                    {
                        title: 'Hak İhlali Bildirimi',
                        content: `Telif hakkı ihlali iddialarında bulunmak için ${CONTACT_INFO.EMAIL} adresine e-posta gönderebilirsiniz. Başvurular 3 iş günü içinde değerlendirilir ve gerekli önlemler alınır.`
                    },
                    {
                        title: 'Kabul ve Onay',
                        content: `Kayıt olarak yukarıdaki tüm şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz. Platform yönetimi, bu şartları önceden haber vermeksizin değiştirme hakkını saklı tutar.`
                    }
                ],
                notice: 'Bu bildirimi okuyarak ve kabul ederek, yukarıda belirtilen tüm şartları anladığınızı ve uyacağınızı taahhüt edersiniz.',
                reject: 'Reddet',
                accept: 'Okudum, Kabul Ediyorum'
            },
            en: {
                title: 'Membership Agreement and Privacy Policy',
                icon: <AlertTriangle size={48} />,
                sections: [
                    {
                        title: 'Personal Data Protection (GDPR)',
                        content: `All your personal data, including your ID number, is securely stored in accordance with the Personal Data Protection Law No. 6698 and is not shared with third parties. Your data is only used for identity verification and service provision.`
                    },
                    {
                        title: 'Platform Terms of Use',
                        content: `• This platform serves for educational and cultural development purposes.
• Books are for promotional purposes only, commercial use is prohibited.
• You may not share your account with others.
• Providing misleading information will result in account closure.`
                    },
                    {
                        title: 'Copyright Infringement Report',
                        content: `To report copyright infringement, you can send an email to ${CONTACT_INFO.EMAIL} Applications are evaluated within 3 business days and necessary measures are taken.`
                    },
                    {
                        title: 'Acceptance and Confirmation',
                        content: `By registering, you declare that you have read, understood and accepted all the above terms. Platform management reserves the right to change these terms without prior notice.`
                    }
                ],
                notice: 'By reading and accepting this notice, you acknowledge that you understand and will comply with all the terms stated above.',
                reject: 'Reject',
                accept: 'I Have Read and Accept'
            }
        }
    };

    const currentContent = content[type][language];

    const modalContent = (
        <div className="legal-modal-overlay" onClick={onClose}>
            <div className="legal-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="legal-modal-header">
                    <div className="legal-icon">{currentContent.icon}</div>
                    <h2>{currentContent.title}</h2>
                </div>

                <div className="legal-modal-body">
                    {currentContent.sections.map((section, index) => (
                        <div key={index} className="legal-section">
                            <h3>{section.title}</h3>
                            <p>{section.content}</p>
                        </div>
                    ))}
                </div>

                <div className="legal-modal-footer">
                    <p className="legal-notice">
                        {currentContent.notice}
                    </p>
                    <div className="legal-actions">
                        <Button color="secondary" onClick={onClose}>
                            {currentContent.reject}
                        </Button>
                        <Button color="primary" onClick={onAccept}>
                            {currentContent.accept}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}

export default LegalModal;
