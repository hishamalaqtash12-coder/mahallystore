export default function ContactPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-black text-zinc-900 mb-6 uppercase tracking-tighter">Contact Us</h1>
        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
          Have questions about a store or an order? We're here to help.
        </p>
        <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 inline-block text-end">
          <p className="font-black text-zinc-900 mb-2 uppercase tracking-widest text-xs">Email Support</p>
          <p className="text-brand font-bold">support@mahally.jo</p>
        </div>
      </div>
    </div>
  );
}
