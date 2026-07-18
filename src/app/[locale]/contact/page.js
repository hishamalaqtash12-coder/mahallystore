import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export const metadata = {
  title: "Contact Us - Mahally",
  description: "Get in touch with the Mahally team. We're here to help.",
};

export default async function ContactPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const content = {
    ar: {
      heroTitle: "تواصل معنا",
      heroSub: "نحن هنا لمساعدتك في كل ما تحتاجه. تواصل مع فريق محلي.",
      formTitle: "أرسل لنا رسالة",
      labelName: "الاسم الكامل",
      placeholderName: "محمد العلي",
      labelEmail: "البريد الإلكتروني",
      placeholderEmail: "example@email.com",
      labelSubject: "الموضوع",
      placeholderSubject: "كيف يمكننا مساعدتك؟",
      labelMessage: "الرسالة",
      placeholderMessage: "اكتب رسالتك هنا...",
      sendBtn: "إرسال الرسالة",
      detailsTitle: "معلومات التواصل",
      phoneLabel: "الهاتف",
      emailLabel: "البريد الإلكتروني",
      officeLabel: "المكتب",
      officeValue: "عمّان، الأردن",
      hoursLabel: "ساعات العمل",
      hoursValue: "الأحد - الخميس: 9 صباحًا - 6 مساءً",
      chatTitle: "الدعم الفوري",
      chatDesc: "تحتاج مساعدة سريعة؟ فريق الدعم متاح 24/7 لمساعدتك.",
      chatBtn: "ابدأ المحادثة",
    },
    en: {
      heroTitle: "Contact Us",
      heroSub: "We're here to help you with anything you need. Reach out to the Mahally team.",
      formTitle: "Send us a Message",
      labelName: "Full Name",
      placeholderName: "John Doe",
      labelEmail: "Email Address",
      placeholderEmail: "john@example.com",
      labelSubject: "Subject",
      placeholderSubject: "How can we help?",
      labelMessage: "Message",
      placeholderMessage: "Write your message here...",
      sendBtn: "Send Message",
      detailsTitle: "Contact Details",
      phoneLabel: "Phone",
      emailLabel: "Email",
      officeLabel: "Office",
      officeValue: "Amman, Jordan",
      hoursLabel: "Hours",
      hoursValue: "Sun - Thu: 9AM - 6PM",
      chatTitle: "Live Chat Support",
      chatDesc: "Need instant help? Our support agents are online 24/7 to assist you.",
      chatBtn: "Start Chat",
    },
  };

  const t = isAr ? content.ar : content.en;

  return (
    <div className="min-h-screen bg-white pb-20 font-sans" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="bg-zinc-50 border-b border-zinc-200 py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-4">{t.heroTitle}</h1>
          <p className="text-zinc-600 text-sm md:text-base">{t.heroSub}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">{t.formTitle}</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800">{t.labelName}</label>
                  <input
                    type="text"
                    className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                    placeholder={t.placeholderName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-800">{t.labelEmail}</label>
                  <input
                    type="email"
                    className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                    placeholder={t.placeholderEmail}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">{t.labelSubject}</label>
                <input
                  type="text"
                  className="w-full h-11 bg-white border border-zinc-300 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
                  placeholder={t.placeholderSubject}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-800">{t.labelMessage}</label>
                <textarea
                  className="w-full h-32 bg-white border border-zinc-300 rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none"
                  placeholder={t.placeholderMessage}
                />
              </div>
              <button
                type="submit"
                className="h-11 bg-brand hover:bg-brand-dark text-white w-full md:w-auto px-8 rounded-full font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {t.sendBtn}
              </button>
            </form>
          </div>

          {/* Contact Info Cards */}
          <div className="space-y-6">
            <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-200">
              <h3 className="text-lg font-bold text-zinc-900 mb-6">{t.detailsTitle}</h3>
              <div className="space-y-6">

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.phoneLabel}</p>
                    <a
                      href="tel:+96278276o463"
                      className="text-sm text-brand hover:underline mt-1 inline-block"
                      dir="ltr"
                    >
                      +962 7 8276 0463
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.emailLabel}</p>
                    <a
                      href="mailto:info@mahallystore.com"
                      className="text-sm text-brand hover:underline mt-1 inline-block break-all"
                      dir="ltr"
                    >
                      info@mahallystore.com
                    </a>
                  </div>
                </div>

                {/* Office */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.officeLabel}</p>
                    <p className="text-sm text-zinc-600 mt-1">{t.officeValue}</p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-brand shrink-0 shadow-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{t.hoursLabel}</p>
                    <p className="text-sm text-zinc-600 mt-1">{t.hoursValue}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Live Chat Card */}
            <div className="bg-brand-dark rounded-xl p-6 text-white text-center">
              <MessageSquare size={32} className="mb-4 mx-auto text-zinc-300" />
              <h3 className="text-lg font-bold mb-2">{t.chatTitle}</h3>
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">{t.chatDesc}</p>
              <Link
                href="/messages?to=admin"
                className="h-10 px-6 bg-white text-zinc-900 hover:bg-zinc-100 rounded-full text-sm font-bold shadow-sm w-full transition-colors flex items-center justify-center"
              >
                {t.chatBtn}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
