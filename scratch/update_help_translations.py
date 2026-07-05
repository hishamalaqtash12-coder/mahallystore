import json

def update_json(filepath, lang):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if lang == 'en':
        data["Help"] = {
            "topics": {
                "recommended": "Recommended Topics",
                "order-issues": "Order Issues",
                "buying": "Shopping on Mahally",
                "shipping": "Shipping & Delivery",
                "account": "Account & Security",
                "promotions": "Promotions & Credit",
                "technical": "Technical Issues"
            },
            "faqData": {
                "recommended": [
                    { "q": "How do I track my order?", "a": "You can track your order in the 'My Orders' section. Click the 'Track' button next to the order for real-time shipping status. We also send email notifications for every update." },
                    { "q": "Where is the order number?", "a": "The order number is a 12-digit number usually starting with 'MAH'. You can find it in the order confirmation email and in the 'My Orders' section inside your account." },
                    { "q": "How do I cancel my order?", "a": "An order can be cancelled within 30 minutes of creation. Go to 'My Orders', find the order, and click 'Cancel Order'. If the order status becomes 'Processing' or 'Shipped', you will have to wait until delivery." }
                ],
                "order-issues": [
                    { "q": "Can I cancel part of my order?", "a": "Yes, you can cancel specific items from the order before they are processed for shipping. Open the order details and choose 'Cancel Item' for the desired product." },
                    { "q": "How do I ask for help with an order?", "a": "Select the order from the 'My Orders' section and click 'Get Help'. You will be connected directly with the seller or the official support team via messaging." },
                    { "q": "I ordered several products together, why do I only see some of them?", "a": "Mahally is a multi-vendor marketplace. Orders are managed by different sellers separately, so you might receive multiple packages and tracking numbers for one order." }
                ],
                "buying": [
                    { "q": "How do I use a discount code?", "a": "You can enter the discount code on the checkout page under the 'Payment' section. Click 'Apply Coupon' before completing the purchase." },
                    { "q": "Is shopping on Mahally safe?", "a": "Absolutely. We use SSL encryption for all transactions and provide Mahally Buyer Protection to guarantee your funds until the order is delivered safely." }
                ],
                "shipping": [
                    { "q": "How long does shipping take?", "a": "Standard shipping within Jordan usually takes 2 to 5 business days. The duration may vary depending on the seller's location." },
                    { "q": "Is there express shipping?", "a": "Express shipping options are available for some products. Look for the 'Express' shipping speed during checkout." }
                ],
                "account": [
                    { "q": "How do I secure my account?", "a": "We recommend using a strong, unique password and enabling any additional verification options available in account settings." }
                ],
                "promotions": [
                    { "q": "How do promo credits work?", "a": "Promo credits are automatically applied to your cart at checkout for eligible products. You can view your available credits in your profile." }
                ],
                "technical": [
                    { "q": "The website is slow or not working.", "a": "Try clearing your browser cache and cookies or using another device. If the problem persists, contact the support team." }
                ]
            },
            "searchSuggestions": [
                "How do I track my order?",
                "Where is the order number?",
                "How do I cancel my order?",
                "Can I cancel part of my order?"
            ],
            "breadcrumbs": {
                "home": "Home",
                "helpCenter": "Help Center",
                "searchResults": "Search Results"
            },
            "greeting": "Hello, how can we help you?",
            "searchPlaceholder": "Ask a question...",
            "searchButton": "Search",
            "commonSearches": "Common Searches",
            "supportLog": "Support Log",
            "chatWithSupport": "Chat with Customer Service",
            "allHelpTopics": "All Help Topics",
            "resultsFound": "Found {count} result(s)",
            "noResultsTitle": "No results",
            "noResultsDesc": "We couldn't find any articles matching \"{query}\". Try different keywords.",
            "clearSearch": "Clear search and show all topics",
            "stillNeedHelp": "Still need help?",
            "supportReady": "The support team is ready to help you with any inquiry.",
            "chatWithUs": "Chat with us"
        }
    else:
        data["Help"] = {
            "topics": {
                "recommended": "المواضيع المقترحة",
                "order-issues": "مشاكل الطلب",
                "buying": "التسوق في محلي",
                "shipping": "الشحن والتوصيل",
                "account": "الحساب والأمان",
                "promotions": "العروض والرصيد",
                "technical": "المشاكل التقنية"
            },
            "faqData": {
                "recommended": [
                    { "q": "كيف أتابع طلبي؟", "a": "يمكنك متابعة طلبك في قسم 'طلباتي'. اضغط على زر 'تتبع' بجانب الطلب للاطلاع على حالة الشحن الفورية. نرسل أيضًا إشعارات عبر البريد الإلكتروني لكل تحديث." },
                    { "q": "أين أجد رقم الطلب؟", "a": "رقم الطلب هو رقم مكون من 12 رقماً ويبدأ عادةً بـ 'MAH'. يمكنك العثور عليه في رسالة تأكيد الطلب وفي قسم 'طلباتي' داخل حسابك." },
                    { "q": "كيف ألغي طلبي؟", "a": "يمكن إلغاء الطلب خلال 30 دقيقة من إنشائه. اذهب إلى 'طلباتي' وابحث عن الطلب ثم اضغط على 'إلغاء الطلب'. إذا أصبح الطلب في حالة 'قيد المعالجة' أو 'تم الشحن'، سيتوجب الانتظار حتى يتم التوصيل." }
                ],
                "order-issues": [
                    { "q": "هل يمكنني إلغاء جزء من طلبي؟", "a": "نعم، يمكنك إلغاء عناصر محددة من الطلب قبل أن تتم معالجتها للشحن. افتح تفاصيل الطلب واختر 'إلغاء العنصر' للمنتج المطلوب." },
                    { "q": "كيف أطلب مساعدة بشأن الطلب؟", "a": "اختر الطلب من قسم 'طلباتي' واضغط على 'الحصول على مساعدة'. سيتم ربطك بالبائع مباشرةً أو بفريق الدعم الرسمي عبر المراسلة." },
                    { "q": "طلبت عدة منتجات معاً، لماذا أرى بعضها فقط؟", "a": "محلي هو سوق متعدد البائعين. تُدار الطلبات من بائعين مختلفين بشكل منفصل، لذا قد تستلم عدة طرود وأرقام تتبع لطلب واحد." }
                ],
                "buying": [
                    { "q": "كيف أستخدم رمز الخصم؟", "a": "يمكنك إدخال رمز الخصم في صفحة الدفع ضمن قسم 'الدفع'. اضغط على 'تطبيق الكوبون' قبل إتمام الشراء." },
                    { "q": "هل التسوق على محلي آمن؟", "a": "بالتأكيد. نستخدم تشفير SSL لجميع المعاملات ونقدّم حماية شراء محلي لضمان أموالك حتى يتم تسليم الطلب بصورة سليمة." }
                ],
                "shipping": [
                    { "q": "كم يستغرق الشحن؟", "a": "عادةً يستغرق الشحن القياسي داخل الأردن من 2 إلى 5 أيام عمل. قد تختلف المدة حسب موقع البائع." },
                    { "q": "هل يوجد شحن سريع؟", "a": "تتوفر خيارات الشحن السريع لبعض المنتجات. ابحث عن سرعة الشحن 'سريع' أثناء صفحة الدفع." }
                ],
                "account": [
                    { "q": "كيف أؤمّن حسابي؟", "a": "نوصي باستخدام كلمة مرور قوية وفريدة وتمكين أي خيارات تحقق إضافية متاحة في إعدادات الحساب." }
                ],
                "promotions": [
                    { "q": "كيف تعمل أرصدة العروض؟", "a": "تُطبَّق أرصدة العروض تلقائياً على السلة عند الدفع للمنتجات المؤهلة. يمكنك مشاهدة الأرصدة المتاحة في ملفك الشخصي." }
                ],
                "technical": [
                    { "q": "الموقع يعمل ببطء أو لا يعمل.", "a": "جرّب مسح ذاكرة المتصفح وملفات تعريف الارتباط أو استخدام جهاز آخر. إذا استمر المشكلة، اتصل بفريق الدعم." }
                ]
            },
            "searchSuggestions": [
                "كيف أتابع طلبي؟",
                "أين رقم الطلب؟",
                "كيف ألغي طلبي؟",
                "هل يمكنني إلغاء جزء من طلبي؟"
            ],
            "breadcrumbs": {
                "home": "الرئيسية",
                "helpCenter": "مركز المساعدة",
                "searchResults": "نتائج البحث"
            },
            "greeting": "مرحباً، كيف يمكننا مساعدتك؟",
            "searchPlaceholder": "اسأل سؤالاً...",
            "searchButton": "بحث",
            "commonSearches": "عمليات البحث الشائعة",
            "supportLog": "سجل الدعم",
            "chatWithSupport": "تحدث مع خدمة العملاء",
            "allHelpTopics": "جميع مواضيع المساعدة",
            "resultsFound": "تم العثور على {count} نتيجة",
            "noResultsTitle": "لا توجد نتائج",
            "noResultsDesc": "لم نجد أي مقالات تطابق \"{query}\". جرّب كلمات مختلفة.",
            "clearSearch": "مسح البحث وعرض جميع المواضيع",
            "stillNeedHelp": "هل ما زلت بحاجة للمساعدة؟",
            "supportReady": "فريق الدعم جاهز لمساعدتك في أي استفسار.",
            "chatWithUs": "تحدث معنا"
        }

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_json('c:\\Users\\ASUS\\Desktop\\FE\\messages\\en.json', 'en')
update_json('c:\\Users\\ASUS\\Desktop\\FE\\messages\\ar.json', 'ar')
